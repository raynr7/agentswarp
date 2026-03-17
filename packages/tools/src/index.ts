import { globalRegistry } from '@agentswarm/core';
import { httpTool } from './http';
import { sendEmailTool } from './email';
import { slackTool } from './slack';
import { githubTool } from './github';
import { notionTool } from './notion';
import { sheetsTool } from './sheets';
import { rssTool } from './rss';
import { webScrapeTool } from './web-scrape';
import { discordTool } from './discord';
import { telegramTool } from './telegram';
import { twitterTool } from './twitter';
import { airtableTool } from './airtable';
import { codeExecTool } from './code-exec';
import { databaseTool } from './database';

export function registerAllTools(): void {
  const tools = [
    httpTool,
    sendEmailTool,
    slackTool,
    githubTool,
    notionTool,
    sheetsTool,
    rssTool,
    webScrapeTool,
    discordTool,
    telegramTool,
    twitterTool,
    airtableTool,
    codeExecTool,
    databaseTool,
  ];

  for (const tool of tools) {
    globalRegistry.register(tool);
    console.log(`[Tools] Registered: ${tool.name}`);
  }

  console.log(`[Tools] ${tools.length} tools registered`);
}

export {
  httpTool,
  sendEmailTool,
  slackTool,
  githubTool,
  notionTool,
  sheetsTool,
  rssTool,
  webScrapeTool,
  discordTool,
  telegramTool,
  twitterTool,
  airtableTool,
  codeExecTool,
  databaseTool,
};
