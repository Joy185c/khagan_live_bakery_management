import { NextResponse } from 'next/server';
import { SpreadsheetConfigManager, SpreadsheetRuntimeConfig } from '@/lib/services/spreadsheet/config-manager';

export async function POST(req: Request) {
  try {
    const body: SpreadsheetRuntimeConfig = await req.json();
    const result = await SpreadsheetConfigManager.testConnection(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Connection test failed',
      },
      { status: 500 }
    );
  }
}
