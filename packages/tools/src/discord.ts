import { z } from 'zod';
import type { Tool } from '@agentswarm/core';

export const discordTool: Tool = {
  name: 'discord',
  description: 'Send messages to Discord webhooks or channels. Use webhook_url for simple sends, or channel_id + DISCORD_BOT_TOKEN for bot messages.',
  schema: z.object({
    action: z.enum(['send_message', 'send_embed']),
    webhook_url: z.string().url().optional(),
    channel_id: z.string().optional(),
    content: z.string().optional(),
    embed: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      color: z.number().optional(),
      fields: z.array(z.object({ name: z.string(), value: z.string(), inline: z.boolean().optional() })).optional(),
    }).optional(),
  }),
  async execute(input: any) {
    const body: Record<string, unknown> = {};

    if (input.content) body.content = input.content;
    if (input.embed) body.embeds = [input.embed];

    // Webhook mode (simpler, no bot token needed)
    if (input.webhook_url) {
      const res = await fetch(input.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Discord webhook error: ${res.status} ${await res.text()}`);
      return { success: true, mode: 'webhook' };
    }

    // Bot mode
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) throw new Error('DISCORD_BOT_TOKEN not configured and no webhook_url provided');
    if (!input.channel_id) throw new Error('channel_id required when using bot mode');

    const res = await fetch(`https://discord.com/api/v10/channels/${input.channel_id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bot ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Discord API error: ${res.status} ${await res.text()}`);
    const data = await res.json() as any;
    return { success: true, mode: 'bot', message_id: data.id, channel_id: data.channel_id };
  },
};
