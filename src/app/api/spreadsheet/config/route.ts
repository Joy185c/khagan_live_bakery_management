import { NextResponse } from 'next/server';
import { SpreadsheetConfigManager, SpreadsheetRuntimeConfig } from '@/lib/services/spreadsheet/config-manager';

export async function GET() {
  try {
    const config = SpreadsheetConfigManager.getConfig();
    return NextResponse.json(config);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: SpreadsheetRuntimeConfig = await req.json();

    if (!body.spreadsheetId || !body.serviceAccountEmail || !body.privateKey) {
      return NextResponse.json(
        {
          success: false,
          message: 'Spreadsheet ID, Service Account Email এবং Private Key সবগুলো আবশ্যক।',
        },
        { status: 400 }
      );
    }

    // 1. Test connection live first
    const testResult = await SpreadsheetConfigManager.testConnection(body);

    // 2. Save configuration to active memory and .env.local
    SpreadsheetConfigManager.saveConfig(body);

    return NextResponse.json({
      success: testResult.success,
      message: testResult.success
        ? 'গুগল স্প্রেডশিট কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে এবং টেস্ট সফল হয়েছে!'
        : `কনফিগারেশন সেভ হয়েছে, কিন্তু সংযোগ পরীক্ষায় সমস্যা: ${testResult.message}`,
      testResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'কনফিগারেশন সংরক্ষণ ব্যর্থ হয়েছে',
      },
      { status: 500 }
    );
  }
}
