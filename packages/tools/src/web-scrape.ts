import { z } from 'zod';
import type { Tool } from '@agentswarm/core';

export const webScrapeTool: Tool = {
  name: 'web_scrape',
  description: 'Fetch and extract text content from any webpage URL. Returns clean text, title, and links.',
  schema: z.object({
    url: z.string().url(),
    selector: z.string().optional(),
  }),
  async execute(input: any) {
    const res = await fetch(input.url, {
      headers: {
        'User-Agent': 'AgentSwarp WebScraper/1.0',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`);

    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Strip HTML tags and extract text
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();

    // Truncate to ~10K chars
    if (text.length > 10000) text = text.slice(0, 10000) + '... [truncated]';

    // Extract links
    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]*)<\/a>/gi;
    const links: { url: string; text: string }[] = [];
    let match;
    while ((match = linkRegex.exec(html)) !== null && links.length < 50) {
      if (match[1].startsWith('http')) {
        links.push({ url: match[1], text: match[2].trim() });
      }
    }

    return { url: input.url, title, text, links: links.slice(0, 20) };
  },
};
