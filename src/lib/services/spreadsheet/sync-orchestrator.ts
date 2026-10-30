import * as XLSX from 'xlsx';
import { SpreadsheetBuilders, SheetData } from './sheet-builders';
import { GoogleSheetsClient } from './google-sheets-client';
import {
  SpreadsheetSyncOutboxItem,
  SpreadsheetSyncResult,
  SpreadsheetSyncStats,
} from './types';
import {
  Product,
  RawMaterial,
  Recipe,
  ProductionBatch,
  Sale,
  Expense,
  Supplier,
  Employee,
  WasteRecord,
  InventoryLot,
  InventoryMovement,
} from '@/types';

export interface BakeryDataState {
  products: Product[];
  rawMaterials: RawMaterial[];
  recipes: Recipe[];
  batches: ProductionBatch[];
  sales: Sale[];
  expenses: Expense[];
  suppliers: Supplier[];
  employees: Employee[];
  wasteRecords: WasteRecord[];
  inventoryLots: InventoryLot[];
  inventoryMovements: InventoryMovement[];
}

export class SpreadsheetSyncOrchestrator {
  private sheetsClient: GoogleSheetsClient;

  constructor(client?: GoogleSheetsClient) {
    this.sheetsClient = client || new GoogleSheetsClient();
  }

  /**
   * Generates all 13 Authoritative Sheets from current state
   */
  public generateAll13Sheets(state: BakeryDataState): SheetData[] {
    return [
      SpreadsheetBuilders.buildDailyProduction(state.batches, state.recipes),
      SpreadsheetBuilders.buildRawMaterialInventory(state.rawMaterials),
      SpreadsheetBuilders.buildFinishedProductStock(state.products, state.inventoryLots),
      SpreadsheetBuilders.buildDailySales(state.sales),
      SpreadsheetBuilders.buildRecipeCosting(state.recipes, state.products, state.rawMaterials),
      SpreadsheetBuilders.buildWasteRegister(state.wasteRecords, state.products, state.rawMaterials),
      SpreadsheetBuilders.buildPurchasesAndSuppliers(state.suppliers),
      SpreadsheetBuilders.buildExpenses(state.expenses),
      SpreadsheetBuilders.buildEmployeePayroll(state.employees),
      SpreadsheetBuilders.buildDailyProfitAndLoss(state.sales, state.batches, state.expenses, state.wasteRecords),
      SpreadsheetBuilders.buildWeeklySummary(state.sales, state.batches, state.expenses),
      SpreadsheetBuilders.buildMonthlySummary(state.sales, state.batches, state.expenses, state.employees),
      SpreadsheetBuilders.buildAuditLog(state.inventoryMovements),
    ];
  }

  /**
   * Safe Full Reconciliation & Rebuild of all 13 worksheets
   */
  public async reconcileAll(state: BakeryDataState): Promise<SpreadsheetSyncResult> {
    const timestamp = new Date().toISOString();
    const sheets = this.generateAll13Sheets(state);

    if (!this.sheetsClient.isConfigured()) {
      return {
        success: true,
        message: 'Google Sheets credentials not set in .env.local. State compiled into 13 worksheets for offline backup/export.',
        processedCount: sheets.length,
        failedCount: 0,
        timestamp,
      };
    }

    try {
      const titles = sheets.map((s) => s.sheetTitle);
      await this.sheetsClient.ensureSheetsExist(titles);

      // Sequentially or in batch replace all sheets
      for (const sheet of sheets) {
        await this.sheetsClient.clearAndReplaceSheet(sheet);
      }

      return {
        success: true,
        message: 'All 13 Google Spreadsheet worksheets reconciled and rebuilt successfully.',
        processedCount: sheets.length,
        failedCount: 0,
        timestamp,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Google Sheets Reconciliation Failed: ${err.message || 'Unknown error'}`,
        processedCount: 0,
        failedCount: sheets.length,
        errors: [err.message || String(err)],
        timestamp,
      };
    }
  }

  /**
   * Process pending outbox queue items
   */
  public async processOutbox(
    outboxItems: SpreadsheetSyncOutboxItem[],
    state: BakeryDataState
  ): Promise<{ updatedItems: SpreadsheetSyncOutboxItem[]; result: SpreadsheetSyncResult }> {
    const timestamp = new Date().toISOString();
    const pending = outboxItems.filter((i) => i.status === 'pending');

    if (pending.length === 0) {
      return {
        updatedItems: outboxItems,
        result: {
          success: true,
          message: 'No pending items in outbox.',
          processedCount: 0,
          failedCount: 0,
          timestamp,
        },
      };
    }

    // If Google Sheets is configured, apply batched sync
    if (this.sheetsClient.isConfigured()) {
      try {
        const sheets = this.generateAll13Sheets(state);
        await this.sheetsClient.ensureSheetsExist(sheets.map((s) => s.sheetTitle));
        await this.sheetsClient.batchUpdateValues(sheets);

        const updatedItems = outboxItems.map((item) =>
          item.status === 'pending'
            ? { ...item, status: 'completed' as const, processedAt: timestamp }
            : item
        );

        return {
          updatedItems,
          result: {
            success: true,
            message: `Successfully synchronized ${pending.length} transactions to Google Sheets.`,
            processedCount: pending.length,
            failedCount: 0,
            timestamp,
          },
        };
      } catch (err: any) {
        const updatedItems = outboxItems.map((item) => {
          if (item.status === 'pending') {
            const nextRetry = item.retryCount + 1;
            return {
              ...item,
              retryCount: nextRetry,
              status: nextRetry >= item.maxRetries ? ('failed' as const) : ('pending' as const),
              errorMessage: err.message || 'Google Sheets API error',
            };
          }
          return item;
        });

        return {
          updatedItems,
          result: {
            success: false,
            message: `Synchronization failed: ${err.message}`,
            processedCount: 0,
            failedCount: pending.length,
            errors: [err.message],
            timestamp,
          },
        };
      }
    }

    // If not configured, keep in pending or mark offline-ready
    const updatedItems = outboxItems.map((item) =>
      item.status === 'pending'
        ? {
            ...item,
            errorMessage: 'Google Sheets credentials pending. Queued in local outbox.',
          }
        : item
    );

    return {
      updatedItems,
      result: {
        success: true,
        message: 'Google Sheets credentials not set. Items preserved in outbox queue.',
        processedCount: 0,
        failedCount: 0,
        timestamp,
      },
    };
  }

  /**
   * Generates a 13-sheet Excel (.xlsx) file buffer using xlsx
   */
  public generateExcelBuffer(state: BakeryDataState): Buffer {
    const wb = XLSX.utils.book_new();
    const sheets = this.generateAll13Sheets(state);

    for (const s of sheets) {
      const data = [s.headers, ...s.rows];
      const ws = XLSX.utils.aoa_to_sheet(data);

      // Auto-size columns approx
      const colWidths = s.headers.map((h, colIndex) => {
        let maxLen = h.length;
        for (const row of s.rows) {
          const valStr = String(row[colIndex] ?? '');
          if (valStr.length > maxLen) maxLen = valStr.length;
        }
        return { wch: Math.min(Math.max(maxLen + 2, 12), 45) };
      });
      ws['!cols'] = colWidths;

      // Clean sheet title (max 31 chars for Excel)
      const cleanTitle = s.sheetTitle.slice(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, cleanTitle);
    }

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Generates CSV string for a specific sheet
   */
  public generateCsv(state: BakeryDataState, sheetIndex = 0): string {
    const sheets = this.generateAll13Sheets(state);
    const target = sheets[sheetIndex] || sheets[0];
    const data = [target.headers, ...target.rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    return XLSX.utils.sheet_to_csv(ws);
  }

  /**
   * Get sync status overview
   */
  public getStatusOverview(
    outbox: SpreadsheetSyncOutboxItem[],
    state: BakeryDataState,
    lastSyncedAt?: string
  ): SpreadsheetSyncStats {
    const sheets = this.generateAll13Sheets(state);
    const pendingCount = outbox.filter((i) => i.status === 'pending').length;
    const failedCount = outbox.filter((i) => i.status === 'failed').length;
    const completedCount = outbox.filter((i) => i.status === 'completed').length;

    const isConfigured = this.sheetsClient.isConfigured();

    return {
      connectedSheetId: this.sheetsClient.getSpreadsheetId() || 'Not Configured',
      connectedSheetTitle: isConfigured ? 'Khagan Live Bakery - Live ERP Data' : 'Not Connected (Local Mode)',
      connectionStatus: isConfigured ? 'connected' : 'not_configured',
      lastSyncedAt: lastSyncedAt || (completedCount > 0 ? new Date().toISOString() : undefined),
      pendingCount,
      failedCount,
      completedCount,
      sheets: sheets.map((s) => ({
        title: s.sheetTitle,
        titleBn: s.sheetTitleBn,
        rowCount: s.rows.length,
        lastUpdated: lastSyncedAt,
      })),
    };
  }
}

