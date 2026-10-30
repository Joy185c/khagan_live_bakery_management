export type SpreadsheetSyncEntityType =
  | 'production_batch'
  | 'raw_material'
  | 'product'
  | 'sale'
  | 'recipe'
  | 'waste'
  | 'purchase'
  | 'expense'
  | 'payroll'
  | 'summary'
  | 'audit_log';

export type SpreadsheetSyncAction =
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'RECONCILE'
  | 'CANCEL'
  | 'APPROVE';

export type SpreadsheetSyncStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface SpreadsheetSyncOutboxItem {
  id: string;
  branchId?: string;
  entityType: SpreadsheetSyncEntityType;
  action: SpreadsheetSyncAction;
  entityId: string;
  payload: Record<string, any>;
  status: SpreadsheetSyncStatus;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  createdAt: string;
  processedAt?: string;
}

export interface SpreadsheetSyncConfig {
  spreadsheetId?: string;
  serviceAccountEmail?: string;
  privateKey?: string;
  autoSyncEnabled: boolean;
  lastSyncedAt?: string;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error' | 'not_configured';
  errorMessage?: string;
}

export interface SpreadsheetSheetDef {
  title: string;
  titleBn: string;
  headers: string[];
  headersBn: string[];
  keyColumn: string; // The column that holds the stable unique ID
}

export interface SpreadsheetSyncStats {
  connectedSheetId?: string;
  connectedSheetTitle?: string;
  connectionStatus: 'connected' | 'not_configured' | 'error';
  lastSyncedAt?: string;
  pendingCount: number;
  failedCount: number;
  completedCount: number;
  sheets: {
    title: string;
    titleBn: string;
    rowCount: number;
    lastUpdated?: string;
  }[];
}

export interface SpreadsheetSyncResult {
  success: boolean;
  message: string;
  processedCount: number;
  failedCount: number;
  errors?: string[];
  timestamp: string;
}

