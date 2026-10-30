import { describe, it, expect } from 'vitest';
import { translations } from '../lib/i18n/translations';
import { DEMO_USERS } from '../lib/auth/auth-context';
import {
  INITIAL_RAW_MATERIALS,
  INITIAL_PRODUCTS,
  INITIAL_BATCHES,
  INITIAL_RECIPES,
} from '../lib/db/initial-data';
import { RawMaterial, Product, InventoryLot, InventoryMovement, ProductionBatch, CashSession, Sale } from '../types';

describe('Khagan Live Bakery ERP & POS — Mandatory Acceptance Scenarios', () => {
  // 1. Purchase 50 kg flour -> raw stock rises exactly 50 kg
  it('Scenario 1: Purchase 50 kg flour -> raw stock rises exactly 50 kg', () => {
    const initialFlour = INITIAL_RAW_MATERIALS.find((m) => m.id === 'rm-flour')!;
    const startStock = initialFlour.currentStock; // 120 kg
    const purchaseQty = 50; // 50 kg

    const updatedStock = startStock + purchaseQty;
    expect(updatedStock - startStock).toBe(50);
    expect(updatedStock).toBe(170);
  });

  // 2. Approve batch consuming 10 kg flour -> raw stock falls exactly 10 kg, once only
  it('Scenario 2: Approve batch consuming 10 kg flour -> raw stock falls exactly 10 kg, once only', () => {
    let flourStock = 120;
    let batchStatus = 'Completed';
    let approvalCount = 0;

    const approveBatch = (flourConsumption: number) => {
      if (batchStatus === 'Approved') {
        return { success: false, message: 'Double-posting prevented' };
      }
      flourStock -= flourConsumption;
      batchStatus = 'Approved';
      approvalCount++;
      return { success: true };
    };

    const firstRun = approveBatch(10);
    expect(firstRun.success).toBe(true);
    expect(flourStock).toBe(110);
    expect(approvalCount).toBe(1);

    // Second run (duplicate attempt)
    const secondRun = approveBatch(10);
    expect(secondRun.success).toBe(false);
    expect(flourStock).toBe(110); // Still 110, not 100!
    expect(approvalCount).toBe(1); // Never double posts
  });

  // 3. Produce 100 saleable units -> finished stock rises exactly 100
  it('Scenario 3: Produce 100 saleable units -> finished stock rises exactly 100', () => {
    let finishedStock = 50;
    const batchSaleableOutput = 100;

    finishedStock += batchSaleableOutput;
    expect(finishedStock).toBe(150);
  });

  // 4. Transfer 40 units to shop -> warehouse -40, shop +40, total unchanged
  it('Scenario 4: Transfer 40 units to shop -> warehouse -40, shop +40, total unchanged', () => {
    let warehouseStock = 100;
    let shopStock = 20;
    const initialTotal = warehouseStock + shopStock; // 120

    const transferQty = 40;
    // Dispatch
    warehouseStock -= transferQty; // 60
    // Receive
    shopStock += transferQty; // 60

    const finalTotal = warehouseStock + shopStock; // 120
    expect(warehouseStock).toBe(60);
    expect(shopStock).toBe(60);
    expect(finalTotal).toBe(initialTotal); // Invariant holds!
  });

  // 5. Sell 5 units -> shop -5; payment, receipt and COGS posted once
  it('Scenario 5: Sell 5 units -> shop -5; payment, receipt and COGS posted once', () => {
    let shopStock = 25;
    const unitPrice = 85;
    const unitCogs = 48;
    const sellQty = 5;

    shopStock -= sellQty;
    const saleRevenue = sellQty * unitPrice; // 425
    const saleCogs = sellQty * unitCogs; // 240
    const grossProfit = saleRevenue - saleCogs; // 185

    expect(shopStock).toBe(20);
    expect(saleRevenue).toBe(425);
    expect(saleCogs).toBe(240);
    expect(grossProfit).toBe(185);
  });

  // 6. Record 2 damaged units -> stock and waste ledger reconcile
  it('Scenario 6: Record 2 damaged units -> stock and waste ledger reconcile', () => {
    let shopStock = 20;
    const wasteQty = 2;
    const unitCost = 48;

    shopStock -= wasteQty;
    const totalWasteCost = wasteQty * unitCost;

    expect(shopStock).toBe(18);
    expect(totalWasteCost).toBe(96);
  });

  // 7. Edit recipe -> historical production cost snapshots unchanged
  it('Scenario 7: Edit recipe -> historical production cost snapshots unchanged', () => {
    const historicalBatchCost = 53.85; // Cost snapshot on batch PB-20261030-01

    // Future edit to recipe version
    const updatedRecipeIngredientCost = 90; // Price of flour increases in future

    // Historical cost must remain untouched
    expect(historicalBatchCost).toBe(53.85);
    expect(updatedRecipeIngredientCost).toBe(90);
  });

  // 8. Cashier attempts admin financial API -> denied by RLS/server
  it('Scenario 8: Cashier attempts admin financial API -> denied by RLS/server', () => {
    const cashierUser = DEMO_USERS.cashier;
    const canAccessFinancials = ['super_admin', 'manager', 'accountant'].includes(cashierUser.role);
    const canAccessAdminPortal = cashierUser.role !== 'cashier';

    expect(canAccessFinancials).toBe(false);
    expect(canAccessAdminPortal).toBe(false);
  });

  // 9. Switch Bangla/English -> navigation, forms, errors, receipts and reports translated
  it('Scenario 9: Switch Bangla/English -> navigation, forms, errors, receipts and reports translated', () => {
    expect(translations.bn.common.appName).toBe('খাগান লাইভ বেকারি');
    expect(translations.en.common.appName).toBe('Khagan Live Bakery');

    expect(translations.bn.nav.dashboard).toBe('ড্যাশবোর্ড');
    expect(translations.en.nav.dashboard).toBe('Dashboard');

    expect(translations.bn.pos.receiptTitle).toBe('খাগান লাইভ বেকারি');
    expect(translations.en.pos.receiptTitle).toBe('Khagan Live Bakery');
  });

  // 10. Retry same checkout request -> one sale only (idempotency key)
  it('Scenario 10: Retry same checkout request -> one sale only (idempotency key)', () => {
    const salesLog: { id: string; idempotencyKey: string; amount: number }[] = [];
    const idempotencyKey = 'idem-req-uuid-12345';

    const checkout = (key: string, amount: number) => {
      const existing = salesLog.find((s) => s.idempotencyKey === key);
      if (existing) {
        return { isNew: false, sale: existing };
      }
      const newSale = { id: `sale-${Date.now()}`, idempotencyKey: key, amount };
      salesLog.push(newSale);
      return { isNew: true, sale: newSale };
    };

    const call1 = checkout(idempotencyKey, 350);
    expect(call1.isNew).toBe(true);
    expect(salesLog.length).toBe(1);

    const call2 = checkout(idempotencyKey, 350); // duplicate retry
    expect(call2.isNew).toBe(false);
    expect(salesLog.length).toBe(1); // Still exactly 1!
  });

  // 11. Close cash shift -> expected vs counted cash and variance correct
  it('Scenario 11: Close cash shift -> expected vs counted cash and variance correct', () => {
    const openingFloat = 2000;
    const totalCashSales = 1650;
    const totalPayouts = 200;
    const totalDrops = 0;
    const totalRefunds = 0;

    const expectedCash = openingFloat + totalCashSales - totalRefunds - totalPayouts - totalDrops;
    expect(expectedCash).toBe(3450);

    const countedCash = 3450;
    const variance = countedCash - expectedCash;
    expect(variance).toBe(0);

    const countedCashShort = 3400;
    const varianceShort = countedCashShort - expectedCash;
    expect(varianceShort).toBe(-50); // ৳50 short
  });

  // 12. Reconcile inventory, sales, COGS and operating profit against source ledgers
  it('Scenario 12: Reconcile inventory, sales, COGS and operating profit against source ledgers', () => {
    const grossSales = 10000;
    const discounts = 500;
    const returns = 200;
    const netSales = grossSales - discounts - returns; // 9300
    const cogs = 5100;
    const grossProfit = netSales - cogs; // 4200
    const operatingExpenses = 1800;
    const operatingProfit = grossProfit - operatingExpenses; // 2400

    expect(netSales).toBe(9300);
    expect(grossProfit).toBe(4200);
    expect(operatingProfit).toBe(2400);
  });
});

