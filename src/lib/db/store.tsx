'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  ProductCategory,
  RawMaterial,
  Unit,
  Recipe,
  Location,
  Supplier,
  Employee,
  ProductionBatch,
  StockTransfer,
  CashSession,
  Sale,
  Expense,
  ExpenseCategory,
  InventoryMovement,
  InventoryLot,
  CartItem,
  WasteRecord,
  AttendanceRecord,
  PayrollPeriod,
} from '@/types';
import {
  SpreadsheetSyncOutboxItem,
  SpreadsheetSyncEntityType,
  SpreadsheetSyncAction,
} from '@/lib/services/spreadsheet/types';
import { supabase } from '../supabase/client';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_RAW_MATERIALS,
  INITIAL_RECIPES,
  INITIAL_LOCATIONS,
  INITIAL_UNITS,
  INITIAL_SUPPLIERS,
  INITIAL_EMPLOYEES,
  INITIAL_EXPENSE_CATEGORIES,
  INITIAL_EXPENSES,
  INITIAL_BATCHES,
  INITIAL_INVENTORY_LOTS,
  INITIAL_CASH_SESSION,
  INITIAL_SALES,
} from './initial-data';

interface DatabaseContextType {
  products: Product[];
  categories: ProductCategory[];
  rawMaterials: RawMaterial[];
  recipes: Recipe[];
  locations: Location[];
  units: Unit[];
  suppliers: Supplier[];
  employees: Employee[];
  expenseCategories: ExpenseCategory[];
  expenses: Expense[];
  batches: ProductionBatch[];
  inventoryLots: InventoryLot[];
  inventoryMovements: InventoryMovement[];
  transfers: StockTransfer[];
  sales: Sale[];
  activeCashSession: CashSession | null;
  pastCashSessions: CashSession[];
  wasteRecords: WasteRecord[];
  attendanceRecords: AttendanceRecord[];
  payrollPeriods: PayrollPeriod[];

  // Master Data CRUD
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  addRawMaterial: (material: Omit<RawMaterial, 'id'>) => void;
  updateRawMaterial: (id: string, updates: Partial<RawMaterial>) => void;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;

  // Business Transactions
  createProductionBatch: (batch: Partial<ProductionBatch>) => ProductionBatch;
  approveProductionBatch: (batchId: string, approverId: string) => { success: boolean; message: string };
  dispatchStockTransfer: (fromLocId: string, toLocId: string, items: { productId: string; quantity: number }[], actorId: string) => string;
  receiveStockTransfer: (transferId: string, actorId: string) => boolean;
  processPOSSale: (params: {
    cart: CartItem[];
    paymentMethod: 'cash' | 'bkash' | 'nagad' | 'card' | 'split';
    paidAmount: number;
    discountAmount: number;
    customerName?: string;
    customerPhone?: string;
    cashierId: string;
    cashierName: string;
    idempotencyKey?: string;
  }) => { success: boolean; sale?: Sale; message?: string };
  openCashShift: (openingFloat: number, cashierId: string, cashierName: string) => CashSession;
  closeCashShift: (sessionId: string, countedCash: number, notes?: string) => CashSession;
  recordWaste: (params: {
    locationId: string;
    itemType: 'raw_material' | 'product';
    itemId: string;
    quantity: number;
    reason: string;
    actorId?: string;
  }) => boolean;
  recordPurchase: (params: {
    supplierId: string;
    rawMaterialId: string;
    quantity: number;
    unitPrice: number;
    destinationLocationId: string;
    actorId?: string;
  }) => boolean;

  // Stock helpers
  getShopAvailableStock: (productId: string) => number;
  getWarehouseAvailableStock: (productId: string) => number;

  // Automated Spreadsheet Sync & Backup
  spreadsheetOutbox: SpreadsheetSyncOutboxItem[];
  lastSyncedAt?: string;
  syncSpreadsheetNow: () => Promise<{ success: boolean; message: string }>;
  reconcileSpreadsheet: () => Promise<{ success: boolean; message: string }>;
  retryFailedSync: () => Promise<{ success: boolean; message: string }>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<ProductCategory[]>(INITIAL_CATEGORIES);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(INITIAL_RAW_MATERIALS);
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES);
  const [locations] = useState<Location[]>(INITIAL_LOCATIONS);
  const [units] = useState<Unit[]>(INITIAL_UNITS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [expenseCategories] = useState<ExpenseCategory[]>(INITIAL_EXPENSE_CATEGORIES);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [batches, setBatches] = useState<ProductionBatch[]>(INITIAL_BATCHES);
  const [inventoryLots, setInventoryLots] = useState<InventoryLot[]>(INITIAL_INVENTORY_LOTS);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [activeCashSession, setActiveCashSession] = useState<CashSession | null>(INITIAL_CASH_SESSION);
  const [pastCashSessions, setPastCashSessions] = useState<CashSession[]>([]);
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [spreadsheetOutbox, setSpreadsheetOutbox] = useState<SpreadsheetSyncOutboxItem[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | undefined>();

  // Load authoritative data from Supabase & purge stale mock localStorage
  useEffect(() => {
    // 1. Purge legacy mock storage
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('khagan_db_state_v1');
      }
    } catch {
      // Safe
    }

    // 2. Fetch real data from Supabase
    async function fetchFromSupabase() {
      try {
        const [
          { data: pData },
          { data: cData },
          { data: rmData },
          { data: sData },
          { data: eData },
          { data: bData },
          { data: saleData },
        ] = await Promise.all([
          supabase.from('products').select('*').order('created_at', { ascending: false }),
          supabase.from('product_categories').select('*').order('sort_order', { ascending: true }),
          supabase.from('raw_materials').select('*').order('created_at', { ascending: false }),
          supabase.from('suppliers').select('*').order('created_at', { ascending: false }),
          supabase.from('expenses').select('*').order('created_at', { ascending: false }),
          supabase.from('production_batches').select('*').order('created_at', { ascending: false }),
          supabase.from('sales').select('*').order('created_at', { ascending: false }),
        ]);

        if (pData && pData.length > 0) {
          setProducts(
            pData.map((d: any) => ({
              id: d.id,
              branchId: d.branch_id || 'branch-khagan-01',
              sku: d.sku,
              barcode: d.barcode || '',
              nameEn: d.name_en,
              nameBn: d.name_bn,
              categoryId: d.category_id || 'cat-bread',
              unitId: d.unit_id || 'u-pcs',
              standardPieceWeightG: Number(d.standard_piece_weight_g || 0),
              sellingPrice: Number(d.selling_price || 0),
              costPrice: Number(d.cost_price || 0),
              shelfLifeDays: Number(d.shelf_life_days || 1),
              imageUrl: d.image_url,
              isActive: d.is_active ?? true,
            }))
          );
        } else {
          // If 0 products in DB, check local state v2 or remain empty []
          const saved = localStorage.getItem('khagan_db_state_v2');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.products) setProducts(parsed.products);
          }
        }

        if (cData && cData.length > 0) {
          setCategories(
            cData.map((c: any) => ({
              id: c.id,
              nameEn: c.name_en,
              nameBn: c.name_bn,
              slug: c.slug,
              sortOrder: c.sort_order || 0,
              isActive: c.is_active ?? true,
            }))
          );
        }

        if (rmData && rmData.length > 0) {
          setRawMaterials(
            rmData.map((r: any) => ({
              id: r.id,
              branchId: r.branch_id || 'branch-khagan-01',
              code: r.code,
              nameEn: r.name_en,
              nameBn: r.name_bn,
              category: r.category || 'Flour & Grains',
              baseUnitId: r.base_unit_id || 'u-kg',
              purchaseUnitId: r.purchase_unit_id || 'u-kg',
              conversionRatio: Number(r.conversion_ratio || 1),
              currentStock: Number(r.current_stock || 0),
              avgCostPerUnit: Number(r.avg_cost_per_unit || 0),
              reorderPoint: Number(r.reorder_point || 0),
              shelfLifeDays: Number(r.shelf_life_days || 30),
              storageLocation: r.storage_location || 'Warehouse',
              isActive: r.is_active ?? true,
            }))
          );
        }

        if (sData && sData.length > 0) {
          setSuppliers(
            sData.map((s: any) => ({
              id: s.id,
              branchId: s.branch_id || 'branch-khagan-01',
              name: s.name,
              contactPerson: s.contact_person || '',
              phone: s.phone || '',
              email: s.email || '',
              address: s.address || '',
              openingBalance: Number(s.opening_balance || 0),
              currentBalance: Number(s.current_balance || 0),
              isActive: s.is_active ?? true,
            }))
          );
        }

        if (eData && eData.length > 0) {
          setExpenses(
            eData.map((e: any) => ({
              id: e.id,
              branchId: e.branch_id || 'branch-khagan-01',
              voucherNumber: e.voucher_number || '',
              categoryId: e.category_id || 'exp-cat-rent',
              amount: Number(e.amount || 0),
              paymentMethod: e.payment_method || 'cash',
              paidTo: e.paid_to || '',
              expenseDate: e.expense_date || new Date().toISOString().slice(0, 10),
              notes: e.notes || '',
            }))
          );
        }
      } catch (err) {
        console.warn('Supabase initial fetch safe fallback:', err);
      }
    }

    fetchFromSupabase();
  }, []);

  const persistState = () => {
    try {
      const state = {
        products,
        rawMaterials,
        batches,
        inventoryLots,
        inventoryMovements,
        transfers,
        sales,
        activeCashSession,
        expenses,
        wasteRecords,
        suppliers,
        spreadsheetOutbox,
        lastSyncedAt,
      };
      localStorage.setItem('khagan_db_state_v2', JSON.stringify(state));
    } catch {
      // Storage quota or error safe
    }
  };

  useEffect(() => {
    persistState();
  }, [products, rawMaterials, batches, inventoryLots, inventoryMovements, transfers, sales, activeCashSession, expenses, wasteRecords, suppliers, spreadsheetOutbox, lastSyncedAt]);

  // Stock helpers
  const getShopAvailableStock = (productId: string): number => {
    return inventoryLots
      .filter((lot) => lot.itemId === productId && lot.locationId === 'loc-shop-01')
      .reduce((sum, lot) => sum + lot.currentQuantity, 0);
  };

  const getWarehouseAvailableStock = (productId: string): number => {
    return inventoryLots
      .filter((lot) => lot.itemId === productId && lot.locationId === 'loc-wh-01')
      .reduce((sum, lot) => sum + lot.currentQuantity, 0);
  };

  // State snapshot for Spreadsheet Sync & Outbox
  const getStateSnapshot = () => ({
    products,
    rawMaterials,
    recipes,
    batches,
    sales,
    expenses,
    suppliers,
    employees,
    wasteRecords,
    inventoryLots,
    inventoryMovements,
  });

  const enqueueSyncEvent = (
    entityType: SpreadsheetSyncEntityType,
    action: SpreadsheetSyncAction,
    entityId: string,
    payload: Record<string, any> = {}
  ) => {
    const newItem: SpreadsheetSyncOutboxItem = {
      id: `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      entityType,
      action,
      entityId,
      payload,
      status: 'pending',
      retryCount: 0,
      maxRetries: 5,
      createdAt: new Date().toISOString(),
    };

    setSpreadsheetOutbox((prev) => [newItem, ...prev]);

    // Asynchronously notify sync endpoint without blocking or failing local operations
    if (typeof window !== 'undefined') {
      setTimeout(async () => {
        try {
          const res = await fetch('/api/spreadsheet/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              outbox: [newItem],
              state: getStateSnapshot(),
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.updatedOutbox) {
              setSpreadsheetOutbox((prev) =>
                prev.map((item) => {
                  const updated = data.updatedOutbox.find((u: SpreadsheetSyncOutboxItem) => u.id === item.id);
                  return updated || item;
                })
              );
              setLastSyncedAt(new Date().toISOString());
            }
          }
        } catch {
          // Outbox item safely preserved in local storage for retry
        }
      }, 500);
    }
  };

  const syncSpreadsheetNow = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/spreadsheet/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outbox: spreadsheetOutbox,
          state: getStateSnapshot(),
        }),
      });
      const data = await res.json();
      if (data.updatedOutbox) {
        setSpreadsheetOutbox(data.updatedOutbox);
        setLastSyncedAt(new Date().toISOString());
      }
      return { success: data.success, message: data.result?.message || 'Sync completed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error during sync' };
    }
  };

  const reconcileSpreadsheet = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/spreadsheet/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: getStateSnapshot(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSpreadsheetOutbox((prev) =>
          prev.map((i) => ({ ...i, status: 'completed' as const, processedAt: new Date().toISOString() }))
        );
        setLastSyncedAt(new Date().toISOString());
      }
      return { success: data.success, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Reconciliation request failed' };
    }
  };

  const retryFailedSync = async (): Promise<{ success: boolean; message: string }> => {
    const resetOutbox = spreadsheetOutbox.map((i) =>
      i.status === 'failed' ? { ...i, status: 'pending' as const, retryCount: 0 } : i
    );
    setSpreadsheetOutbox(resetOutbox);

    try {
      const res = await fetch('/api/spreadsheet/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outbox: resetOutbox,
          state: getStateSnapshot(),
        }),
      });
      const data = await res.json();
      if (data.updatedOutbox) {
        setSpreadsheetOutbox(data.updatedOutbox);
        setLastSyncedAt(new Date().toISOString());
      }
      return { success: data.success, message: data.result?.message || 'Retry processed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error during retry' };
    }
  };

  // 1. Production Batch Creation & Atomic Approval
  const createProductionBatch = (batchData: Partial<ProductionBatch>): ProductionBatch => {
    const newBatchNumber = `PB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(batches.length + 1).padStart(2, '0')}`;
    const newBatch: ProductionBatch = {
      id: `batch-${Date.now()}`,
      branchId: 'branch-khagan-01',
      batchNumber: newBatchNumber,
      recipeVersionId: batchData.recipeVersionId || 'rec-ver-mb-01',
      recipeName: batchData.recipeName || 'Special Milk Bread Recipe',
      productNameEn: batchData.productNameEn || 'Special Milk Bread 400g',
      productNameBn: batchData.productNameBn || 'স্পেশাল মিল্ক ব্রেড ৪০০ গ্রাম',
      productionDate: batchData.productionDate || new Date().toISOString().slice(0, 10),
      shift: batchData.shift || 'Morning',
      operatorId: batchData.operatorId || 'emp-01',
      status: 'Completed',
      plannedQuantity: batchData.plannedQuantity || 50,
      actualSaleableOutput: batchData.actualSaleableOutput || 48,
      rejectedQuantity: batchData.rejectedQuantity || 2,
      actualOutputWeightKg: batchData.actualOutputWeightKg || 19.2,
      rawMaterialCost: batchData.rawMaterialCost || 2185.0,
      laborCost: batchData.laborCost || 250.0,
      utilityCost: batchData.utilityCost || 150.0,
      totalCost: (batchData.rawMaterialCost || 2185.0) + (batchData.laborCost || 250.0) + (batchData.utilityCost || 150.0),
      costPerPiece: Number((((batchData.rawMaterialCost || 2185.0) + (batchData.laborCost || 250.0) + (batchData.utilityCost || 150.0)) / (batchData.actualSaleableOutput || 48)).toFixed(2)),
      yieldPercentage: Number((((batchData.actualSaleableOutput || 48) / (batchData.plannedQuantity || 50)) * 100).toFixed(2)),
      weightVariancePct: -4.0,
      remarks: batchData.remarks || 'Standard production batch.',
      inputs: batchData.inputs || [],
    };

    setBatches((prev) => [newBatch, ...prev]);
    enqueueSyncEvent('production_batch', 'INSERT', newBatch.id, { batchNumber: newBatch.batchNumber });
    return newBatch;
  };

  const approveProductionBatch = (batchId: string, approverId: string): { success: boolean; message: string } => {
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) {
      return { success: false, message: 'Batch not found' };
    }

    // Idempotency: Prevent double approval
    if (batch.status === 'Approved') {
      return { success: false, message: 'Batch is already approved. Double-posting prevented.' };
    }

    const timestamp = new Date().toISOString();
    const movementsToAdd: InventoryMovement[] = [];

    // 1. Deduct raw materials used
    if (batch.inputs && batch.inputs.length > 0) {
      setRawMaterials((prev) =>
        prev.map((rm) => {
          const input = batch.inputs?.find((i) => i.rawMaterialId === rm.id);
          if (input) {
            movementsToAdd.push({
              id: `mov-${Date.now()}-${rm.id}`,
              branchId: 'branch-khagan-01',
              movementType: 'production_issue',
              itemType: 'raw_material',
              itemId: rm.id,
              itemName: rm.nameEn,
              fromLocationId: 'loc-wh-01',
              quantity: input.actualQuantity,
              unitCost: input.unitCost,
              totalCost: input.totalCost,
              referenceType: 'batch',
              referenceId: batch.id,
              actorId: approverId,
              notes: `Consumed in batch ${batch.batchNumber}`,
              createdAt: timestamp,
            });
            return {
              ...rm,
              currentStock: Math.max(0, rm.currentStock - input.actualQuantity),
            };
          }
          return rm;
        })
      );
    }

    // 2. Add finished goods to warehouse inventory lots
    const targetProduct = products.find((p) => p.nameEn.includes('Bread') || p.id === 'prod-bread-01') || products[0];
    const newLot: InventoryLot = {
      id: `lot-${Date.now()}`,
      branchId: 'branch-khagan-01',
      locationId: 'loc-wh-01', // Kitchen/Warehouse
      itemType: 'product',
      itemId: targetProduct.id,
      lotNumber: `LOT-${batch.batchNumber}`,
      batchId: batch.id,
      initialQuantity: batch.actualSaleableOutput,
      currentQuantity: batch.actualSaleableOutput,
      unitCost: batch.costPerPiece,
      expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      receivedDate: new Date().toISOString().slice(0, 10),
    };

    setInventoryLots((prev) => [newLot, ...prev]);

    movementsToAdd.push({
      id: `mov-${Date.now()}-fg`,
      branchId: 'branch-khagan-01',
      movementType: 'finished_production_receipt',
      itemType: 'product',
      itemId: targetProduct.id,
      itemName: targetProduct.nameEn,
      lotId: newLot.id,
      toLocationId: 'loc-wh-01',
      quantity: batch.actualSaleableOutput,
      unitCost: batch.costPerPiece,
      totalCost: batch.totalCost,
      referenceType: 'batch',
      referenceId: batch.id,
      actorId: approverId,
      notes: `Finished goods received from approved batch ${batch.batchNumber}`,
      createdAt: timestamp,
    });

    setInventoryMovements((prev) => [...movementsToAdd, ...prev]);

    // Update batch status to Approved
    setBatches((prev) =>
      prev.map((b) =>
        b.id === batchId
          ? {
              ...b,
              status: 'Approved',
              approvedBy: approverId,
              approvedAt: timestamp,
            }
          : b
      )
    );

    // Enqueue live spreadsheet sync events
    enqueueSyncEvent('production_batch', 'APPROVE', batchId, { batchNumber: batch.batchNumber, yield: batch.yieldPercentage });
    enqueueSyncEvent('raw_material', 'UPDATE', 'all', {});
    enqueueSyncEvent('product', 'UPDATE', targetProduct.id, {});

    return { success: true, message: 'Batch approved and posted atomically to inventory.' };
  };

  // 2. Inter-Location Stock Transfer
  const dispatchStockTransfer = (
    fromLocId: string,
    toLocId: string,
    items: { productId: string; quantity: number }[],
    actorId: string
  ): string => {
    const transferId = `trf-${Date.now()}`;
    const transferNumber = `TRF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(transfers.length + 1).padStart(3, '0')}`;
    const timestamp = new Date().toISOString();

    // Deduct stock from source location
    setInventoryLots((prev) => {
      const nextLots = [...prev];
      items.forEach((item) => {
        let remainingToDeduct = item.quantity;
        for (const lot of nextLots) {
          if (lot.itemId === item.productId && lot.locationId === fromLocId && lot.currentQuantity > 0) {
            const deduction = Math.min(lot.currentQuantity, remainingToDeduct);
            lot.currentQuantity -= deduction;
            remainingToDeduct -= deduction;
            if (remainingToDeduct <= 0) break;
          }
        }
      });
      return nextLots;
    });

    const newTransfer: StockTransfer = {
      id: transferId,
      branchId: 'branch-khagan-01',
      transferNumber,
      fromLocationId: fromLocId,
      fromLocationName: locations.find((l) => l.id === fromLocId)?.name,
      toLocationId: toLocId,
      toLocationName: locations.find((l) => l.id === toLocId)?.name,
      status: 'Dispatched',
      requestedBy: actorId,
      dispatchedAt: timestamp,
      items: items.map((i) => ({
        id: `ti-${Date.now()}-${i.productId}`,
        transferId,
        itemType: 'product',
        itemId: i.productId,
        itemName: products.find((p) => p.id === i.productId)?.nameEn,
        quantityRequested: i.quantity,
        quantityDispatched: i.quantity,
        quantityReceived: 0,
      })),
      createdAt: timestamp,
    };

    setTransfers((prev) => [newTransfer, ...prev]);

    // Record movement
    items.forEach((item) => {
      setInventoryMovements((prev) => [
        {
          id: `mov-${Date.now()}-${item.productId}`,
          branchId: 'branch-khagan-01',
          movementType: 'transfer_dispatch',
          itemType: 'product',
          itemId: item.productId,
          itemName: products.find((p) => p.id === item.productId)?.nameEn,
          fromLocationId: fromLocId,
          quantity: item.quantity,
          unitCost: products.find((p) => p.id === item.productId)?.costPrice || 0,
          totalCost: (products.find((p) => p.id === item.productId)?.costPrice || 0) * item.quantity,
          referenceType: 'transfer',
          referenceId: transferId,
          actorId,
          notes: `Transfer dispatched: ${transferNumber}`,
          createdAt: timestamp,
        },
        ...prev,
      ]);
    });

    return transferId;
  };

  const receiveStockTransfer = (transferId: string, actorId: string): boolean => {
    const transfer = transfers.find((t) => t.id === transferId);
    if (!transfer || transfer.status !== 'Dispatched') return false;

    const timestamp = new Date().toISOString();

    // Add stock to destination location lots
    const newLots: InventoryLot[] = transfer.items.map((item) => ({
      id: `lot-trf-${Date.now()}-${item.itemId}`,
      branchId: 'branch-khagan-01',
      locationId: transfer.toLocationId,
      itemType: 'product',
      itemId: item.itemId,
      lotNumber: `TRF-${transfer.transferNumber}`,
      initialQuantity: item.quantityDispatched,
      currentQuantity: item.quantityDispatched,
      unitCost: products.find((p) => p.id === item.itemId)?.costPrice || 0,
      expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      receivedDate: new Date().toISOString().slice(0, 10),
    }));

    setInventoryLots((prev) => [...newLots, ...prev]);

    // Mark transfer as Received
    setTransfers((prev) =>
      prev.map((t) =>
        t.id === transferId
          ? {
              ...t,
              status: 'Received',
              receivedAt: timestamp,
              items: t.items.map((i) => ({ ...i, quantityReceived: i.quantityDispatched })),
            }
          : t
      )
    );

    // Record movement
    transfer.items.forEach((item) => {
      setInventoryMovements((prev) => [
        {
          id: `mov-${Date.now()}-${item.itemId}`,
          branchId: 'branch-khagan-01',
          movementType: 'transfer_receive',
          itemType: 'product',
          itemId: item.itemId,
          itemName: item.itemName,
          toLocationId: transfer.toLocationId,
          quantity: item.quantityDispatched,
          unitCost: products.find((p) => p.id === item.itemId)?.costPrice || 0,
          totalCost: (products.find((p) => p.id === item.itemId)?.costPrice || 0) * item.quantityDispatched,
          referenceType: 'transfer',
          referenceId: transferId,
          actorId,
          notes: `Transfer received: ${transfer.transferNumber}`,
          createdAt: timestamp,
        },
        ...prev,
      ]);
    });

    return true;
  };

  // 3. POS Sale Processing (Atomic, Stock Validation, Idempotent)
  const processPOSSale = ({
    cart,
    paymentMethod,
    paidAmount,
    discountAmount,
    customerName = 'Walking Customer',
    customerPhone = '',
    cashierId,
    cashierName,
    idempotencyKey,
  }: {
    cart: CartItem[];
    paymentMethod: 'cash' | 'bkash' | 'nagad' | 'card' | 'split';
    paidAmount: number;
    discountAmount: number;
    customerName?: string;
    customerPhone?: string;
    cashierId: string;
    cashierName: string;
    idempotencyKey?: string;
  }): { success: boolean; sale?: Sale; message?: string } => {
    // 1. Idempotency Check: if key exists, return previous sale without duplicate debit
    if (idempotencyKey) {
      const existing = sales.find((s) => s.idempotencyKey === idempotencyKey);
      if (existing) {
        return { success: true, sale: existing, message: 'Existing sale returned via idempotency key.' };
      }
    }

    if (cart.length === 0) {
      return { success: false, message: 'Cart is empty.' };
    }

    // 2. Check available shop stock
    for (const item of cart) {
      const available = getShopAvailableStock(item.product.id);
      if (available < item.quantity) {
        return {
          success: false,
          message: `Insufficient counter stock for "${item.product.nameBn}". Available: ${available}, Requested: ${item.quantity}`,
        };
      }
    }

    // 3. Calculate financial totals
    const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
    const grandTotal = Math.max(0, subtotal - discountAmount);
    const changeAmount = Math.max(0, paidAmount - grandTotal);
    const totalCogs = cart.reduce((sum, item) => sum + item.product.costPrice * item.quantity, 0);

    const timestamp = new Date().toISOString();
    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(sales.length + 1).padStart(3, '0')}`;
    const saleId = `sale-${Date.now()}`;

    // 4. Atomically deduct shop lots
    setInventoryLots((prev) => {
      const nextLots = [...prev];
      cart.forEach((item) => {
        let remaining = item.quantity;
        for (const lot of nextLots) {
          if (lot.itemId === item.product.id && lot.locationId === 'loc-shop-01' && lot.currentQuantity > 0) {
            const deduction = Math.min(lot.currentQuantity, remaining);
            lot.currentQuantity -= deduction;
            remaining -= deduction;
            if (remaining <= 0) break;
          }
        }
      });
      return nextLots;
    });

    // 5. Construct sale and sale items
    const newSale: Sale = {
      id: saleId,
      branchId: 'branch-khagan-01',
      locationId: 'loc-shop-01',
      sessionId: activeCashSession?.id,
      invoiceNumber,
      cashierId,
      cashierName,
      customerName,
      customerPhone,
      subtotal,
      discountAmount,
      taxAmount: 0,
      grandTotal,
      paidAmount,
      changeAmount,
      totalCogs,
      paymentStatus: 'paid',
      status: 'completed',
      idempotencyKey,
      items: cart.map((item) => ({
        id: `si-${Date.now()}-${item.product.id}`,
        saleId,
        productId: item.product.id,
        productNameEn: item.product.nameEn,
        productNameBn: item.product.nameBn,
        quantity: item.quantity,
        unitPrice: item.product.sellingPrice,
        unitCogs: item.product.costPrice,
        discountAmount: 0,
        totalPrice: item.product.sellingPrice * item.quantity,
      })),
      payments: [
        {
          paymentMethod,
          amount: grandTotal,
        },
      ],
      createdAt: timestamp,
    };

    setSales((prev) => [newSale, ...prev]);

    // 6. Record inventory movement entries
    cart.forEach((item) => {
      setInventoryMovements((prev) => [
        {
          id: `mov-${Date.now()}-${item.product.id}`,
          branchId: 'branch-khagan-01',
          movementType: 'sale',
          itemType: 'product',
          itemId: item.product.id,
          itemName: item.product.nameEn,
          fromLocationId: 'loc-shop-01',
          quantity: item.quantity,
          unitCost: item.product.costPrice,
          totalCost: item.product.costPrice * item.quantity,
          referenceType: 'sale',
          referenceId: saleId,
          actorId: cashierId,
          notes: `POS Sale: ${invoiceNumber}`,
          createdAt: timestamp,
        },
        ...prev,
      ]);
    });

    // 7. Update active cash shift session
    if (activeCashSession) {
      setActiveCashSession((prev) => {
        if (!prev) return null;
        const isCash = paymentMethod === 'cash';
        const isMobile = ['bkash', 'nagad'].includes(paymentMethod);
        const isCard = paymentMethod === 'card';

        const nextCashSales = isCash ? prev.totalCashSales + grandTotal : prev.totalCashSales;
        const nextMobileSales = isMobile ? prev.totalMobileSales + grandTotal : prev.totalMobileSales;
        const nextCardSales = isCard ? prev.totalCardSales + grandTotal : prev.totalCardSales;
        const expectedCash = prev.openingFloat + nextCashSales - prev.totalRefunds - prev.totalPayouts - prev.totalDrops;

        return {
          ...prev,
          totalCashSales: nextCashSales,
          totalMobileSales: nextMobileSales,
          totalCardSales: nextCardSales,
          expectedClosingCash: expectedCash,
        };
      });
    }

    // Enqueue live spreadsheet sync event
    enqueueSyncEvent('sale', 'INSERT', saleId, { invoiceNumber, finalAmount: grandTotal, cashierName });
    enqueueSyncEvent('product', 'UPDATE', 'pos_sale', {});

    return { success: true, sale: newSale };
  };

  // 4. Cash Shift Management
  const openCashShift = (openingFloat: number, cashierId: string, cashierName: string): CashSession => {
    const sessionNumber = `CS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(pastCashSessions.length + 1).padStart(2, '0')}`;
    const newSession: CashSession = {
      id: `sess-${Date.now()}`,
      branchId: 'branch-khagan-01',
      locationId: 'loc-shop-01',
      sessionNumber,
      cashierId,
      cashierName,
      status: 'open',
      openedAt: new Date().toISOString(),
      openingFloat,
      totalCashSales: 0,
      totalMobileSales: 0,
      totalCardSales: 0,
      totalRefunds: 0,
      totalPayouts: 0,
      totalDrops: 0,
      expectedClosingCash: openingFloat,
      cashVariance: 0,
    };

    setActiveCashSession(newSession);
    return newSession;
  };

  const closeCashShift = (sessionId: string, countedCash: number, notes?: string): CashSession => {
    if (!activeCashSession || activeCashSession.id !== sessionId) {
      throw new Error('Active shift session mismatch');
    }

    const variance = countedCash - activeCashSession.expectedClosingCash;
    const closedSession: CashSession = {
      ...activeCashSession,
      status: 'closed',
      closedAt: new Date().toISOString(),
      countedClosingCash: countedCash,
      cashVariance: variance,
      closingNotes: notes,
    };

    setPastCashSessions((prev) => [closedSession, ...prev]);
    setActiveCashSession(null);
    return closedSession;
  };

  // 5. Spoilage & Damaged Goods Logging
  const recordWaste = ({
    locationId,
    itemType,
    itemId,
    quantity,
    reason,
    actorId,
  }: {
    locationId: string;
    itemType: 'raw_material' | 'product';
    itemId: string;
    quantity: number;
    reason: string;
    actorId?: string;
  }): boolean => {
    const timestamp = new Date().toISOString();
    const wasteNumber = `WST-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(wasteRecords.length + 1).padStart(3, '0')}`;

    let unitCost = 0;
    let itemName = '';

    if (itemType === 'product') {
      const prod = products.find((p) => p.id === itemId);
      unitCost = prod?.costPrice || 0;
      itemName = prod?.nameEn || '';
      // Deduct from lots at that location
      setInventoryLots((prev) => {
        const nextLots = [...prev];
        let remaining = quantity;
        for (const lot of nextLots) {
          if (lot.itemId === itemId && lot.locationId === locationId && lot.currentQuantity > 0) {
            const deduction = Math.min(lot.currentQuantity, remaining);
            lot.currentQuantity -= deduction;
            remaining -= deduction;
            if (remaining <= 0) break;
          }
        }
        return nextLots;
      });
    } else {
      const mat = rawMaterials.find((m) => m.id === itemId);
      unitCost = mat?.avgCostPerUnit || 0;
      itemName = mat?.nameEn || '';
      setRawMaterials((prev) =>
        prev.map((m) => (m.id === itemId ? { ...m, currentStock: Math.max(0, m.currentStock - quantity) } : m))
      );
    }

    const totalCost = unitCost * quantity;

    const newWaste: WasteRecord = {
      id: `wst-${Date.now()}`,
      branchId: 'branch-khagan-01',
      locationId,
      locationName: locations.find((l) => l.id === locationId)?.name,
      wasteNumber,
      itemType,
      itemId,
      itemName,
      quantity,
      unitCost,
      totalCost,
      reason,
      authorizedBy: actorId,
      createdAt: timestamp,
    };

    setWasteRecords((prev) => [newWaste, ...prev]);

    setInventoryMovements((prev) => [
      {
        id: `mov-${Date.now()}-wst`,
        branchId: 'branch-khagan-01',
        movementType: 'waste',
        itemType,
        itemId,
        itemName,
        fromLocationId: locationId,
        quantity,
        unitCost,
        totalCost,
        referenceType: 'waste',
        referenceId: newWaste.id,
        actorId,
        notes: `Damaged/Waste recorded: ${reason}`,
        createdAt: timestamp,
      },
      ...prev,
    ]);

    enqueueSyncEvent('waste', 'INSERT', newWaste.id, { reason, quantity, itemType });
    return true;
  };

  // 6. Procurement & Goods Receipt
  const recordPurchase = ({
    supplierId,
    rawMaterialId,
    quantity,
    unitPrice,
    destinationLocationId,
    actorId,
  }: {
    supplierId: string;
    rawMaterialId: string;
    quantity: number;
    unitPrice: number;
    destinationLocationId: string;
    actorId?: string;
  }): boolean => {
    const timestamp = new Date().toISOString();
    const purchaseAmount = quantity * unitPrice;

    // Atomically increase raw material stock
    setRawMaterials((prev) =>
      prev.map((rm) => {
        if (rm.id === rawMaterialId) {
          const newStock = rm.currentStock + quantity;
          return {
            ...rm,
            currentStock: newStock,
            avgCostPerUnit: unitPrice,
          };
        }
        return rm;
      })
    );

    // Update supplier balance
    setSuppliers((prev) =>
      prev.map((s) => (s.id === supplierId ? { ...s, currentBalance: s.currentBalance + purchaseAmount } : s))
    );

    // Write movement ledger
    setInventoryMovements((prev) => [
      {
        id: `mov-${Date.now()}-po`,
        branchId: 'branch-khagan-01',
        movementType: 'purchase_receipt',
        itemType: 'raw_material',
        itemId: rawMaterialId,
        itemName: rawMaterials.find((m) => m.id === rawMaterialId)?.nameEn,
        toLocationId: destinationLocationId,
        quantity,
        unitCost: unitPrice,
        totalCost: purchaseAmount,
        referenceType: 'purchase',
        actorId,
        notes: `Received purchase of ${quantity} units from ${suppliers.find((s) => s.id === supplierId)?.name}`,
        createdAt: timestamp,
      },
      ...prev,
    ]);

    enqueueSyncEvent('purchase', 'INSERT', `po-${Date.now()}`, { supplierId, rawMaterialId, quantity, unitPrice });
    enqueueSyncEvent('raw_material', 'UPDATE', rawMaterialId, {});
    return true;
  };

  // 7. General Master Data CRUD
  const addProduct = (p: Omit<Product, 'id'>) => {
    const newProd: Product = { ...p, id: `prod-${Date.now()}` };
    setProducts((prev) => [newProd, ...prev]);
    enqueueSyncEvent('product', 'INSERT', newProd.id, { sku: newProd.sku, nameEn: newProd.nameEn });
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    enqueueSyncEvent('product', 'UPDATE', id, updates);
  };

  const addRawMaterial = (m: Omit<RawMaterial, 'id'>) => {
    const newMat: RawMaterial = { ...m, id: `rm-${Date.now()}` };
    setRawMaterials((prev) => [newMat, ...prev]);
    enqueueSyncEvent('raw_material', 'INSERT', newMat.id, { code: newMat.code, nameEn: newMat.nameEn });
  };

  const updateRawMaterial = (id: string, updates: Partial<RawMaterial>) => {
    setRawMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    enqueueSyncEvent('raw_material', 'UPDATE', id, updates);
  };

  const addSupplier = (s: Omit<Supplier, 'id'>) => {
    const newSup: Supplier = { ...s, id: `sup-${Date.now()}` };
    setSuppliers((prev) => [newSup, ...prev]);
    enqueueSyncEvent('purchase', 'INSERT', newSup.id, { name: newSup.name });
  };

  const addEmployee = (e: Omit<Employee, 'id'>) => {
    const newEmp: Employee = { ...e, id: `emp-${Date.now()}` };
    setEmployees((prev) => [newEmp, ...prev]);
    enqueueSyncEvent('payroll', 'INSERT', newEmp.id, { name: newEmp.fullNameEn });
  };

  const addExpense = (exp: Omit<Expense, 'id'>) => {
    const voucherNumber = `VCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(expenses.length + 1).padStart(3, '0')}`;
    const newExp: Expense = { ...exp, id: `exp-${Date.now()}`, voucherNumber };
    setExpenses((prev) => [newExp, ...prev]);
    enqueueSyncEvent('expense', 'INSERT', newExp.id, { voucherNumber, amount: newExp.amount });
  };

  return (
    <DatabaseContext.Provider
      value={{
        products,
        categories,
        rawMaterials,
        recipes,
        locations,
        units,
        suppliers,
        employees,
        expenseCategories,
        expenses,
        batches,
        inventoryLots,
        inventoryMovements,
        transfers,
        sales,
        activeCashSession,
        pastCashSessions,
        wasteRecords,
        attendanceRecords,
        payrollPeriods,
        addProduct,
        updateProduct,
        addRawMaterial,
        updateRawMaterial,
        addSupplier,
        addEmployee,
        addExpense,
        createProductionBatch,
        approveProductionBatch,
        dispatchStockTransfer,
        receiveStockTransfer,
        processPOSSale,
        openCashShift,
        closeCashShift,
        recordWaste,
        recordPurchase,
        getShopAvailableStock,
        getWarehouseAvailableStock,
        spreadsheetOutbox,
        lastSyncedAt,
        syncSpreadsheetNow,
        reconcileSpreadsheet,
        retryFailedSync,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
