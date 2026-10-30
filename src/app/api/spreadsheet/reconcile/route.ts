import { NextResponse } from 'next/server';
import { SpreadsheetSyncOrchestrator, BakeryDataState } from '@/lib/services/spreadsheet/sync-orchestrator';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const state: BakeryDataState = body.state;

    if (!state) {
      return NextResponse.json({ success: false, message: 'Bakery state is required for reconciliation' }, { status: 400 });
    }

    const orchestrator = new SpreadsheetSyncOrchestrator();
    const result = await orchestrator.reconcileAll(state);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Reconciliation failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
