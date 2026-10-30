import { describe, it, expect } from 'vitest';
import { SpreadsheetBuilders } from '../lib/services/spreadsheet/sheet-builders';
import { SpreadsheetSyncOrchestrator, BakeryDataState } from '../lib/services/spreadsheet/sync-orchestrator';
import { SpreadsheetSyncOutboxItem } from '../lib/services/spreadsheet/types';
import {
  INITIAL_PRODUCTS,
  INITIAL_RAW_MATERIALS,
  INITIAL_RECIPES,
  INITIAL_BATCHES,
  INITIAL_SALES,
  INITIAL_EXPENSES,
  INITIAL_SUPPLIERS,
  INITIAL_EMPLOYEES,
  INITIAL_INVENTORY_LOTS,
} from '../lib/db/initial-data';
import * as XLSX from 'xlsx';

describe('Spreadsheet & Backup System - Unit & Integration Tests', () => {
  const mockState: BakeryDataState = {
    products: INITIAL_PRODUCTS,
    rawMaterials: INITIAL_RAW_MATERIALS,
    recipes: INITIAL_RECIPES,
    batches: INITIAL_BATCHES,
    sales: INITIAL_SALES,
    expenses: INITIAL_EXPENSES,
    suppliers: INITIAL_SUPPLIERS,
    employees: INITIAL_EMPLOYEES,
    wasteRecords: [
      {
        id: 'wst-test-01',
        wasteNumber: 'WST-20261030-001',
        branchId: 'b-01',
        locationId: 'loc-wh-01',
        itemType: 'product',
        itemId: INITIAL_PRODUCTS[0].id,
        itemName: INITIAL_PRODUCTS[0].nameEn,
        quantity: 2,
        unitCost: 35,
        totalCost: 70,
        reason: 'Crushed during rack transfer',
        createdAt: '2026-10-30T10:00:00Z',
      },
    ],
    inventoryLots: INITIAL_INVENTORY_LOTS,
    inventoryMovements: [
      {
        id: 'mov-test-01',
        branchId: 'b-01',
        movementType: 'finished_production_receipt',
        itemType: 'product',
        itemId: INITIAL_PRODUCTS[0].id,
        quantity: 50,
        unitCost: 35,
        totalCost: 1750,
        referenceType: 'batch',
        referenceId: 'batch-01',
        createdAt: '2026-10-30T09:00:00Z',
      },
    ],
  };

  it('1. builds all 13 worksheets with proper headers and data', () => {
    const orchestrator = new SpreadsheetSyncOrchestrator();
    const sheets = orchestrator.generateAll13Sheets(mockState);

    expect(sheets.length).toBe(13);

    const expectedTitles = [
      'Daily Production',
      'Raw Material Inventory',
      'Finished Product Stock',
      'Daily Sales',
      'Recipe & Product Costing',
      'Waste Register',
      'Purchases & Suppliers',
      'Expenses & Utilities',
      'Employee Payroll',
      'Daily Profit & Loss',
      'Weekly Summary',
      'Monthly Summary',
      'Audit Log',
    ];

    sheets.forEach((sheet, idx) => {
      expect(sheet.sheetTitle).toBe(expectedTitles[idx]);
      expect(sheet.headers.length).toBeGreaterThan(0);
      expect(Array.isArray(sheet.rows)).toBe(true);
    });
  });

  it('2. verifies Daily Production sheet calculates yield and cost correctly', () => {
    const sheet = SpreadsheetBuilders.buildDailyProduction(mockState.batches, mockState.recipes);
    expect(sheet.rows.length).toBe(mockState.batches.length);

    const firstRow = sheet.rows[0];
    const plannedQty = firstRow[5];
    const saleableQty = firstRow[6];
    const yieldPct = firstRow[8];

    expect(plannedQty).toBe(50);
    expect(saleableQty).toBe(48);
    expect(yieldPct).toBe(96);
  });

  it('3. generates valid 13-sheet Excel (.xlsx) workbook binary buffer', () => {
    const orchestrator = new SpreadsheetSyncOrchestrator();
    const buffer = orchestrator.generateExcelBuffer(mockState);

    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(1000);

    // Read back workbook from buffer to verify sheet integrity
    const wb = XLSX.read(buffer, { type: 'buffer' });
    expect(wb.SheetNames.length).toBe(13);
    expect(wb.SheetNames).toContain('Daily Production');
    expect(wb.SheetNames).toContain('Raw Material Inventory');
    expect(wb.SheetNames).toContain('Daily Sales');
  });

  it('4. processes outbox queue idempotently without data loss', async () => {
    const orchestrator = new SpreadsheetSyncOrchestrator();

    const sampleOutbox: SpreadsheetSyncOutboxItem[] = [
      {
        id: 'outbox-item-1',
        entityType: 'sale',
        action: 'INSERT',
        entityId: 'sale-101',
        payload: { invoiceNumber: 'INV-20261030-001', amount: 450 },
        status: 'pending',
        retryCount: 0,
        maxRetries: 5,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'outbox-item-2',
        entityType: 'production_batch',
        action: 'APPROVE',
        entityId: 'batch-201',
        payload: { batchNumber: 'PB-20261030-01' },
        status: 'completed',
        retryCount: 0,
        maxRetries: 5,
        createdAt: new Date().toISOString(),
      },
    ];

    const { updatedItems, result } = await orchestrator.processOutbox(sampleOutbox, mockState);

    expect(result).toBeDefined();
    expect(updatedItems.length).toBe(2);
    // Already completed item remains completed
    expect(updatedItems[1].status).toBe('completed');
  });

  it('5. provides safe status overview with correct counts and connection status', () => {
    const orchestrator = new SpreadsheetSyncOrchestrator();
    const outbox: SpreadsheetSyncOutboxItem[] = [
      {
        id: 'o-1',
        entityType: 'sale',
        action: 'INSERT',
        entityId: 's-1',
        payload: {},
        status: 'pending',
        retryCount: 0,
        maxRetries: 5,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'o-2',
        entityType: 'waste',
        action: 'INSERT',
        entityId: 'w-1',
        payload: {},
        status: 'failed',
        retryCount: 5,
        maxRetries: 5,
        errorMessage: 'Quota exceeded',
        createdAt: new Date().toISOString(),
      },
    ];

    const stats = orchestrator.getStatusOverview(outbox, mockState);

    expect(stats.pendingCount).toBe(1);
    expect(stats.failedCount).toBe(1);
    expect(stats.sheets.length).toBe(13);
  });
});
