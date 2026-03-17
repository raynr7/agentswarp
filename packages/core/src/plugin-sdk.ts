/**
 * AgentSwarp Plugin SDK
 * Create custom tools that anyone can install
 *
 * Example:
 *   import { defineTool } from '@agentswarm/core'
 *   export default defineTool({ name, description, schema, execute })
 */

import type { ToolConfig, PluginConfig, Plugin } from './types';
import type { Tool } from './tool-registry';
import type { ZodSchema } from 'zod';

export function defineTool(config: ToolConfig): Tool {
  return {
    name: config.name,
    description: config.description,
    schema: config.schema as ZodSchema,
    execute: config.execute,
  };
}

export function definePlugin(config: PluginConfig): Plugin {
  return {
    name: config.name,
    version: config.version,
    description: config.description,
    tools: config.tools,
  };
}
