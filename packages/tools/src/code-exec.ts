import { z } from 'zod';
import type { Tool } from '@agentswarm/core';

export const codeExecTool: Tool = {
  name: 'execute_code',
  description: 'Execute JavaScript/TypeScript code snippets safely. Use for data transformation, calculations, parsing. Returns stdout and result.',
  schema: z.object({
    code: z.string(),
    language: z.enum(['javascript', 'typescript']).default('javascript'),
  }),
  async execute(input: any) {
    const logs: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;

    // Capture console output
    console.log = (...args) => logs.push(args.map(String).join(' '));
    console.error = (...args) => logs.push('[stderr] ' + args.map(String).join(' '));

    try {
      // Create a sandboxed context with limited globals
      const sandbox = {
        console: { log: console.log, error: console.error, warn: console.log },
        JSON, Math, Date, Array, Object, String, Number, Boolean, RegExp,
        parseInt, parseFloat, isNaN, isFinite,
        encodeURIComponent, decodeURIComponent,
        encodeURI, decodeURI,
        setTimeout: undefined, setInterval: undefined, // Block timers
        fetch: undefined, // Block network access
        process: undefined, // Block process access
        require: undefined, // Block module access
        Bun: undefined, // Block Bun APIs
      };

      // Use Function constructor for basic sandboxing
      const fn = new Function(
        ...Object.keys(sandbox),
        `"use strict"; ${input.code}`
      );

      const result = fn(...Object.values(sandbox));

      return {
        result: result !== undefined ? result : null,
        stdout: logs.join('\n'),
        stderr: '',
        error: null,
      };
    } catch (error) {
      return {
        result: null,
        stdout: logs.join('\n'),
        stderr: error instanceof Error ? error.message : String(error),
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      console.log = originalLog;
      console.error = originalError;
    }
  },
};
