import { NextResponse } from 'next/server';
import { SpreadsheetSyncOrchestrator, BakeryDataState } from '@/lib/services/spreadsheet/sync-orchestrator';
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
} from '@/lib/db/initial-data';

export async function POST(req: Request) {
  try {
    let state: BakeryDataState;
    try {
      const body = await req.json();
      state = body.state;
    } catch {
      // Fallback to default state if none passed
      state = {
        products: INITIAL_PRODUCTS,
        rawMaterials: INITIAL_RAW_MATERIALS,
        recipes: INITIAL_RECIPES,
        batches: INITIAL_BATCHES,
        sales: INITIAL_SALES,
        expenses: INITIAL_EXPENSES,
        suppliers: INITIAL_SUPPLIERS,
        employees: INITIAL_EMPLOYEES,
        wasteRecords: [],
        inventoryLots: INITIAL_INVENTORY_LOTS,
        inventoryMovements: [],
      };
    }

    const orchestrator = new SpreadsheetSyncOrchestrator();
    const buffer = orchestrator.generateExcelBuffer(state);

    const filename = `Khagan_Bakery_ERP_Master_Backup_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Export failed' }, { status: 500 });
  }
}
