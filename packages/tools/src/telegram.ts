import { z } from 'zod';
import type { Tool } from '@agentswarm/core';

export const telegramTool: Tool = {
  name: 'telegram',
  description: 'Send messages via Telegram Bot API. Requires TELEGRAM_BOT_TOKEN env var.',
  schema: z.object({
    action: z.enum(['send_message', 'send_photo']),
    chat_id: z.string(),
    text: z.string().optional(),
    photo_url: z.string().url().optional(),
    parse_mode: z.enum(['HTML', 'Markdown', 'MarkdownV2']).optional(),
  }),
  async execute(input: any) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN not configured');

    const baseUrl = `https://api.telegram.org/bot${token}`;

    switch (input.action) {
      case 'send_message': {
        if (!input.text) throw new Error('text required for send_message');
        const body: any = { chat_id: input.chat_id, text: input.text };
        if (input.parse_mode) body.parse_mode = input.parse_mode;

        const res = await fetch(`${baseUrl}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json() as any;
        if (!data.ok) throw new Error(`Telegram error: ${data.description}`);
        return { success: true, message_id: data.result.message_id };
      }

      case 'send_photo': {
        if (!input.photo_url) throw new Error('photo_url required for send_photo');
        const body: any = { chat_id: input.chat_id, photo: input.photo_url };
        if (input.text) body.caption = input.text;

        const res = await fetch(`${baseUrl}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json() as any;
        if (!data.ok) throw new Error(`Telegram error: ${data.description}`);
        return { success: true, message_id: data.result.message_id };
      }

      default:
        throw new Error(`Unknown Telegram action: ${input.action}`);
    }
  },
};
