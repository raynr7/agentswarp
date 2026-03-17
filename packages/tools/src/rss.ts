import { z } from 'zod';
import type { Tool } from '@agentswarm/core';

export const rssTool: Tool = {
  name: 'read_rss',
  description: 'Fetch and parse an RSS or Atom feed. Returns latest N items with title, link, summary, date.',
  schema: z.object({
    url: z.string().url(),
    limit: z.number().default(10),
  }),
  async execute(input: any) {
    const res = await fetch(input.url, {
      headers: { 'User-Agent': 'AgentSwarp RSS Reader/1.0' },
    });

    if (!res.ok) throw new Error(`Failed to fetch RSS feed: ${res.status}`);

    const xml = await res.text();
    const items: any[] = [];

    // Simple XML parsing for RSS 2.0 and Atom feeds
    const isAtom = xml.includes('<feed');

    if (isAtom) {
      const entries = xml.split('<entry').slice(1);
      for (const entry of entries.slice(0, input.limit)) {
        items.push({
          title: extractTag(entry, 'title'),
          link: extractAttr(entry, 'link', 'href') || extractTag(entry, 'link'),
          summary: extractTag(entry, 'summary') || extractTag(entry, 'content'),
          date: extractTag(entry, 'updated') || extractTag(entry, 'published'),
        });
      }
    } else {
      const entries = xml.split('<item').slice(1);
      for (const entry of entries.slice(0, input.limit)) {
        items.push({
          title: extractTag(entry, 'title'),
          link: extractTag(entry, 'link'),
          summary: extractTag(entry, 'description'),
          date: extractTag(entry, 'pubDate'),
        });
      }
    }

    return { feed_url: input.url, item_count: items.length, items };
  },
};

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i');
  const cdataMatch = regex.exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();

  const simpleRegex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i');
  const match = simpleRegex.exec(xml);
  return match ? match[1].trim() : '';
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"[^>]*/?`, 'i');
  const match = regex.exec(xml);
  return match ? match[1].trim() : '';
}
