import fs from 'fs';
import path from 'path';
import { GoogleSheetsClient } from './google-sheets-client';

export interface SpreadsheetRuntimeConfig {
  spreadsheetId: string;
  serviceAccountEmail: string;
  privateKey: string;
}

export class SpreadsheetConfigManager {
  private static envFilePath = path.join(process.cwd(), '.env.local');

  /**
   * Extracts clean Spreadsheet ID from either raw ID or full Google Sheets URL
   */
  public static extractSpreadsheetId(input: string): string {
    const trimmed = input.trim();
    const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
    return trimmed;
  }

  /**
   * Returns current active configuration (with masked private key for security)
   */
  public static getConfig(): {
    spreadsheetId: string;
    serviceAccountEmail: string;
    hasPrivateKey: boolean;
    isConfigured: boolean;
  } {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
    const key = process.env.GOOGLE_PRIVATE_KEY || '';
    const id = process.env.GOOGLE_SPREADSHEET_ID || '';

    const isConfigured = Boolean(
      email &&
      key &&
      key.includes('BEGIN PRIVATE KEY') &&
      id
    );

    return {
      spreadsheetId: id,
      serviceAccountEmail: email,
      hasPrivateKey: Boolean(key && key.includes('BEGIN PRIVATE KEY')),
      isConfigured,
    };
  }

  /**
   * Saves credentials directly to process.env and persists into .env.local
   */
  public static saveConfig(config: SpreadsheetRuntimeConfig): void {
    const cleanId = this.extractSpreadsheetId(config.spreadsheetId);
    let cleanKey = config.privateKey.trim();

    // Ensure double-quote escaping or multiline formatting is clean
    if (!cleanKey.includes('\n') && cleanKey.includes('\\n')) {
      cleanKey = cleanKey.replace(/\\n/g, '\n');
    }

    // 1. Immediately update active runtime environment in memory
    process.env.GOOGLE_SPREADSHEET_ID = cleanId;
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = config.serviceAccountEmail.trim();
    process.env.GOOGLE_PRIVATE_KEY = cleanKey;

    // 2. Persist to .env.local file
    try {
      let content = '';
      if (fs.existsSync(this.envFilePath)) {
        content = fs.readFileSync(this.envFilePath, 'utf8');
      }

      const updateOrAppend = (key: string, val: string) => {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        const formattedVal = val.includes('\n') ? `"${val.replace(/\n/g, '\\n')}"` : val;
        if (regex.test(content)) {
          content = content.replace(regex, `${key}=${formattedVal}`);
        } else {
          content += `\n${key}=${formattedVal}`;
        }
      };

      updateOrAppend('GOOGLE_SERVICE_ACCOUNT_EMAIL', config.serviceAccountEmail.trim());
      updateOrAppend('GOOGLE_PRIVATE_KEY', cleanKey);
      updateOrAppend('GOOGLE_SPREADSHEET_ID', cleanId);

      fs.writeFileSync(this.envFilePath, content.trim() + '\n', 'utf8');
    } catch {
      // If filesystem write fails on edge runtime, in-memory process.env remains active
    }
  }

  /**
   * Tests connection to Google Sheets live
   */
  public static async testConnection(config?: SpreadsheetRuntimeConfig): Promise<{
    success: boolean;
    title?: string;
    sheets?: string[];
    message: string;
  }> {
    const client = new GoogleSheetsClient({
      spreadsheetId: config?.spreadsheetId ? this.extractSpreadsheetId(config.spreadsheetId) : process.env.GOOGLE_SPREADSHEET_ID,
      serviceAccountEmail: config?.serviceAccountEmail || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: config?.privateKey || process.env.GOOGLE_PRIVATE_KEY,
    });

    if (!client.isConfigured()) {
      return {
        success: false,
        message: 'সকল ফিল্ড (Service Account Email, Private Key এবং Spreadsheet ID) পূরণ করুন।',
      };
    }

    try {
      const meta = await client.getSpreadsheetMeta();
      return {
        success: true,
        title: meta.title,
        sheets: meta.sheets,
        message: `গুগল স্প্রেডশিটের সাথে সফলভাবে সংযোগ স্থাপিত হয়েছে! (Spreadsheet: "${meta.title}")`,
      };
    } catch (err: any) {
      let msg = err.message || 'Connection failed';
      if (msg.includes('The caller does not have permission') || msg.includes('403')) {
        msg = `অনুমতি নেই (Permission Denied)! অনুগ্রহ করে আপনার Google Sheet এর Share অপশনে গিয়ে "${client['serviceAccountEmail']}" ইমেইলটিকে Editor হিসেবে পারমিশন দিন।`;
      } else if (msg.includes('Requested entity was not found') || msg.includes('404')) {
        msg = 'স্প্রেডশিটটি খুঁজে পাওয়া যায়নি (404)! সঠিক Spreadsheet ID বা URL দিয়েছেন কিনা যাচাই করুন।';
      }
      return {
        success: false,
        message: msg,
      };
    }
  }
}
