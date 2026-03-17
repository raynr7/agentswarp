import { z } from 'zod';
import type { Tool } from '@agentswarm/core';

const AIRTABLE_API = 'https://api.airtable.com/v0';

export const airtableTool: Tool = {
  name: 'airtable',
  description: 'Read and write Airtable bases. Actions: list_records, create_record, update_record, delete_record. Requires AIRTABLE_API_KEY env var.',
  schema: z.object({
    action: z.enum(['list_records', 'create_record', 'update_record', 'delete_record']),
    base_id: z.string(),
    table_name: z.string(),
    record_id: z.string().optional(),
    fields: z.record(z.unknown()).optional(),
    max_records: z.number().default(100),
  }),
  async execute(input: any) {
    const apiKey = process.env.AIRTABLE_API_KEY;
    if (!apiKey) throw new Error('AIRTABLE_API_KEY not configured');

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    const baseUrl = `${AIRTABLE_API}/${input.base_id}/${encodeURIComponent(input.table_name)}`;

    switch (input.action) {
      case 'list_records': {
        const res = await fetch(`${baseUrl}?maxRecords=${input.max_records}`, { headers });
        if (!res.ok) throw new Error(`Airtable error: ${await res.text()}`);
        return res.json();
      }

      case 'create_record': {
        if (!input.fields) throw new Error('fields required for create_record');
        const res = await fetch(baseUrl, {
          method: 'POST', headers,
          body: JSON.stringify({ fields: input.fields }),
        });
        if (!res.ok) throw new Error(`Airtable error: ${await res.text()}`);
        return res.json();
      }

      case 'update_record': {
        if (!input.record_id || !input.fields) throw new Error('record_id and fields required');
        const res = await fetch(`${baseUrl}/${input.record_id}`, {
          method: 'PATCH', headers,
          body: JSON.stringify({ fields: input.fields }),
        });
        if (!res.ok) throw new Error(`Airtable error: ${await res.text()}`);
        return res.json();
      }

      case 'delete_record': {
        if (!input.record_id) throw new Error('record_id required');
        const res = await fetch(`${baseUrl}/${input.record_id}`, { method: 'DELETE', headers });
        if (!res.ok) throw new Error(`Airtable error: ${await res.text()}`);
        return res.json();
      }

      default:
        throw new Error(`Unknown Airtable action: ${input.action}`);
    }
  },
};
