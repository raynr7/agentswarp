import { z } from 'zod';
import type { Tool } from '@agentswarm/core';

export const slackTool: Tool = {
  name: 'slack_message',
  description: 'Send a message to a Slack channel or user. Requires SLACK_BOT_TOKEN env var.',
  schema: z.object({
    channel: z.string(),
    text: z.string(),
    blocks: z.array(z.unknown()).optional(),
  }),
  async execute(input: any) {
    const token = process.env.SLACK_BOT_TOKEN;
    if (!token) throw new Error('SLACK_BOT_TOKEN not configured');

    const body: Record<string, unknown> = {
      channel: input.channel,
      text: input.text,
    };
    if (input.blocks) body.blocks = input.blocks;

    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json() as any;
    if (!data.ok) throw new Error(`Slack API error: ${data.error}`);

    return { success: true, channel: data.channel, ts: data.ts, message: data.message?.text };
  },
};
