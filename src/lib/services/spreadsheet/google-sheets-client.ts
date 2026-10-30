import crypto from 'crypto';
import { SheetData } from './sheet-builders';

export interface GoogleSheetsClientConfig {
  serviceAccountEmail?: string;
  privateKey?: string;
  spreadsheetId?: string;
}

export class GoogleSheetsClient {
  private serviceAccountEmail: string | undefined;
  private privateKey: string | undefined;
  private spreadsheetId: string | undefined;
  private cachedAccessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(config?: GoogleSheetsClientConfig) {
    this.serviceAccountEmail = config?.serviceAccountEmail || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    this.privateKey = config?.privateKey || process.env.GOOGLE_PRIVATE_KEY;
    this.spreadsheetId = config?.spreadsheetId || process.env.GOOGLE_SPREADSHEET_ID;

    // Handle escaped newlines in private keys
    if (this.privateKey) {
      this.privateKey = this.privateKey.replace(/\\n/g, '\n');
    }
  }

  public isConfigured(): boolean {
    return Boolean(
      this.serviceAccountEmail &&
      this.privateKey &&
      this.privateKey.includes('BEGIN PRIVATE KEY') &&
      this.spreadsheetId
    );
  }

  public getSpreadsheetId(): string | undefined {
    return this.spreadsheetId;
  }

  /**
   * Generates a Google OAuth2 JWT token assertion and fetches an access token
   */
  private async getAccessToken(): Promise<string> {
    if (this.cachedAccessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.cachedAccessToken;
    }

    if (!this.isConfigured()) {
      throw new Error('Google Sheets Service Account credentials are not configured or invalid in environment variables.');
    }

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const claim = {
      iss: this.serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const base64UrlEncode = (obj: Record<string, any>) =>
      Buffer.from(JSON.stringify(obj))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(claim)}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(unsignedToken);
    signer.end();

    const signature = signer
      .sign(this.privateKey!)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const jwt = `${unsignedToken}.${signature}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Failed to authenticate with Google OAuth2: ${errText}`);
    }

    const tokenData = await tokenRes.json();
    this.cachedAccessToken = tokenData.access_token;
    this.tokenExpiresAt = Date.now() + (tokenData.expires_in || 3600) * 1000;

    return this.cachedAccessToken!;
  }

  /**
   * Verify spreadsheet connection and metadata
   */
  public async getSpreadsheetMeta(): Promise<{ title: string; sheets: string[] }> {
    if (!this.isConfigured()) {
      return {
        title: 'Khagan Live Bakery - Not Configured',
        sheets: [],
      };
    }

    const token = await this.getAccessToken();
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Google Sheets API error: ${errorText}`);
    }

    const data = await res.json();
    return {
      title: data.properties?.title || 'Bakery ERP Master Sheet',
      sheets: (data.sheets || []).map((s: any) => s.properties?.title),
    };
  }

  /**
   * Ensures that all 13 worksheets exist, creates any missing sheets
   */
  public async ensureSheetsExist(requiredTitles: string[]): Promise<void> {
    if (!this.isConfigured()) return;

    const token = await this.getAccessToken();
    const meta = await this.getSpreadsheetMeta();
    const existing = new Set(meta.sheets);
    const missing = requiredTitles.filter((t) => !existing.has(t));

    if (missing.length === 0) return;

    const requests = missing.map((title) => ({
      addSheet: {
        properties: {
          title,
          gridProperties: { rowCount: 1000, columnCount: 26 },
        },
      },
    }));

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to create missing sheets in Google Spreadsheet: ${err}`);
    }
  }

  /**
   * Batch update values across all worksheets
   */
  public async batchUpdateValues(sheetDataList: SheetData[]): Promise<{ updatedCells: number }> {
    if (!this.isConfigured()) {
      return { updatedCells: 0 };
    }

    const token = await this.getAccessToken();

    // Prepare batch update value ranges
    const data = sheetDataList.map((sheet) => {
      const values = [sheet.headers, ...sheet.rows];
      return {
        range: `'${sheet.sheetTitle}'!A1`,
        values,
      };
    });

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to batch update Google Sheets: ${err}`);
    }

    const result = await res.json();
    return {
      updatedCells: result.totalUpdatedCells || 0,
    };
  }

  /**
   * Clears and replaces a single worksheet
   */
  public async clearAndReplaceSheet(sheet: SheetData): Promise<void> {
    if (!this.isConfigured()) return;

    const token = await this.getAccessToken();

    // 1. Clear existing contents
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/'${sheet.sheetTitle}'!A1:Z5000:clear`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // 2. Put new headers + rows
    const values = [sheet.headers, ...sheet.rows];
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/'${sheet.sheetTitle}'!A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      }
    );
  }
}
