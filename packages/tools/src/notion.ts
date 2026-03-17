import { z } from 'zod';
import type { Tool } from '@agentswarm/core';

const NOTION_API = 'https://api.notion.com/v1';

async function notionFetch(path: string, options: RequestInit = {}) {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) throw new Error('NOTION_API_KEY not configured');

  const res = await fetch(`${NOTION_API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Notion API error (${res.status}): ${err}`);
  }

  return res.json();
}

export const notionTool: Tool = {
  name: 'notion',
  description: 'Read and write Notion pages and databases. Requires NOTION_API_KEY env var.',
  schema: z.object({
    action: z.enum(['get_page', 'create_page', 'append_block', 'query_database', 'create_database_entry']),
    page_id: z.string().optional(),
    database_id: z.string().optional(),
    title: z.string().optional(),
    content: z.string().optional(),
    properties: z.record(z.unknown()).optional(),
  }),
  async execute(input: any) {
    switch (input.action) {
      case 'get_page':
        if (!input.page_id) throw new Error('page_id required');
        return notionFetch(`/pages/${input.page_id}`);

      case 'create_page': {
        if (!input.database_id) throw new Error('database_id required for create_page');
        const body: any = {
          parent: { database_id: input.database_id },
          properties: input.properties || {},
        };
        if (input.title) {
          body.properties.Name = { title: [{ text: { content: input.title } }] };
        }
        return notionFetch('/pages', { method: 'POST', body: JSON.stringify(body) });
      }

      case 'append_block': {
        if (!input.page_id || !input.content) throw new Error('page_id and content required');
        return notionFetch(`/blocks/${input.page_id}/children`, {
          method: 'PATCH',
          body: JSON.stringify({
            children: [{
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [{ type: 'text', text: { content: input.content } }],
              },
            }],
          }),
        });
      }

      case 'query_database': {
        if (!input.database_id) throw new Error('database_id required');
        return notionFetch(`/databases/${input.database_id}/query`, {
          method: 'POST',
          body: JSON.stringify({}),
        });
      }

      case 'create_database_entry': {
        if (!input.database_id || !input.properties) throw new Error('database_id and properties required');
        return notionFetch('/pages', {
          method: 'POST',
          body: JSON.stringify({
            parent: { database_id: input.database_id },
            properties: input.properties,
          }),
        });
      }

      default:
        throw new Error(`Unknown Notion action: ${input.action}`);
    }
  },
};
