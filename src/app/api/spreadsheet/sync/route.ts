import { NextResponse } from 'next/server';
import { SpreadsheetSyncOrchestrator, BakeryDataState } from '@/lib/services/spreadsheet/sync-orchestrator';
import { SpreadsheetSyncOutboxItem } from '@/lib/services/spreadsheet/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const outbox: SpreadsheetSyncOutboxItem[] = body.outbox || [];
    const state: BakeryDataState = body.state;

    if (!state) {
      return NextResponse.json({ success: false, message: 'Bakery state is required' }, { status: 400 });
    }

    const orchestrator = new SpreadsheetSyncOrchestrator();
    const { updatedItems, result } = await orchestrator.processOutbox(outbox, state);

    return NextResponse.json({
      success: result.success,
      result,
      updatedOutbox: updatedItems,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Sync failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

