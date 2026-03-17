import { z } from 'zod';
import type { Tool } from '@agentswarm/core';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

export const sheetsTool: Tool = {
  name: 'google_sheets',
  description: 'Read and write Google Sheets via Sheets API v4. Requires GOOGLE_SERVICE_ACCOUNT_KEY env var (JSON).',
  schema: z.object({
    action: z.enum(['read', 'append', 'create']),
    spreadsheet_id: z.string().optional(),
    range: z.string().optional(),
    values: z.array(z.array(z.string())).optional(),
    title: z.string().optional(),
  }),
  async execute(input: any) {
    const saKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!saKey) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not configured');

    // In production, use google-auth-library for JWT auth
    // This is a simplified implementation
    let accessToken: string;
    try {
      const key = JSON.parse(saKey);
      // Placeholder: JWT token generation would go here
      accessToken = key.access_token || '';
      if (!accessToken) throw new Error('Could not generate access token. Configure service account properly.');
    } catch {
      throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_KEY JSON');
    }

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    switch (input.action) {
      case 'read': {
        if (!input.spreadsheet_id || !input.range) throw new Error('spreadsheet_id and range required');
        const res = await fetch(`${SHEETS_API}/${input.spreadsheet_id}/values/${input.range}`, { headers });
        if (!res.ok) throw new Error(`Sheets API error: ${await res.text()}`);
        return res.json();
      }

      case 'append': {
        if (!input.spreadsheet_id || !input.range || !input.values) {
          throw new Error('spreadsheet_id, range, and values required');
        }
        const res = await fetch(
          `${SHEETS_API}/${input.spreadsheet_id}/values/${input.range}:append?valueInputOption=USER_ENTERED`,
          { method: 'POST', headers, body: JSON.stringify({ values: input.values }) }
        );
        if (!res.ok) throw new Error(`Sheets API error: ${await res.text()}`);
        return res.json();
      }

      case 'create': {
        const body: any = { properties: { title: input.title || 'Untitled' } };
        const res = await fetch(SHEETS_API, { method: 'POST', headers, body: JSON.stringify(body) });
        if (!res.ok) throw new Error(`Sheets API error: ${await res.text()}`);
        return res.json();
      }

      default:
        throw new Error(`Unknown Sheets action: ${input.action}`);
    }
  },
};
