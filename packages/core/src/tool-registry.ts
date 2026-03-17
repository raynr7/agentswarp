import type { ZodSchema } from 'zod';
import type { ToolDef, ToolResult, ToolContext } from './types';

export interface Tool {
  name: string;
  description: string;
  schema: ZodSchema;
  execute(input: unknown, context?: ToolContext): Promise<unknown>;
}

type JsonSchemaType = {
  type?: string;
  properties?: Record<string, JsonSchemaType>;
  items?: JsonSchemaType;
  required?: string[];
  enum?: unknown[];
  const?: unknown;
  anyOf?: JsonSchemaType[];
  additionalProperties?: JsonSchemaType | boolean;
  description?: string;
  default?: unknown;
  nullable?: boolean;
};

function zodToJsonSchema(schema: ZodSchema): JsonSchemaType {
  const def = (schema as any)._def;
  if (!def) {
    return { type: 'object', properties: {} };
  }

  const typeName: string = def.typeName;

  switch (typeName) {
    case 'ZodString': {
      const result: JsonSchemaType = { type: 'string' };
      if (def.description) result.description = def.description;
      return result;
    }

    case 'ZodNumber': {
      const result: JsonSchemaType = { type: 'number' };
      if (def.description) result.description = def.description;
      return result;
    }

    case 'ZodBoolean': {
      const result: JsonSchemaType = { type: 'boolean' };
      if (def.description) result.description = def.description;
      return result;
    }

    case 'ZodArray': {
      const result: JsonSchemaType = {
        type: 'array',
        items: zodToJsonSchema(def.type),
      };
      if (def.description) result.description = def.description;
      return result;
    }

    case 'ZodObject': {
      const shape = typeof def.shape === 'function' ? def.shape() : def.shape;
      const properties: Record<string, JsonSchemaType> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(shape)) {
        const fieldSchema = value as ZodSchema;
        const fieldDef = (fieldSchema as any)._def;
        const fieldTypeName: string = fieldDef?.typeName;

        properties[key] = zodToJsonSchema(fieldSchema);

        const isOptional =
          fieldTypeName === 'ZodOptional' ||
          fieldTypeName === 'ZodDefault' ||
          (fieldTypeName === 'ZodNullable' &&
            (fieldDef?.innerType as any)?._def?.typeName === 'ZodOptional');

        if (!isOptional) {
          required.push(key);
        }
      }

      const result: JsonSchemaType = { type: 'object', properties };
      if (required.length > 0) result.required = required;
      if (def.description) result.description = def.description;
      return result;
    }

    case 'ZodEnum': {
      const result: JsonSchemaType = { type: 'string', enum: def.values };
      if (def.description) result.description = def.description;
      return result;
    }

    case 'ZodOptional': {
      const inner = zodToJsonSchema(def.innerType);
      if (def.description) inner.description = def.description;
      return inner;
    }

    case 'ZodNullable': {
      const inner = zodToJsonSchema(def.innerType);
      const result: JsonSchemaType = { ...inner, nullable: true };
      if (def.description) result.description = def.description;
      return result;
    }

    case 'ZodDefault': {
      const inner = zodToJsonSchema(def.innerType);
      try {
        inner.default = def.defaultValue();
      } catch {
        // ignore if defaultValue() throws
      }
      if (def.description) inner.description = def.description;
      return inner;
    }

    case 'ZodLiteral': {
      const result: JsonSchemaType = { const: def.value };
      const valueType = typeof def.value;
      if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
        result.type = valueType;
      }
      if (def.description) result.description = def.description;
      return result;
    }

    case 'ZodUnion': {
      const options: ZodSchema[] = def.options;
      const result: JsonSchemaType = {
        anyOf: options.map((opt) => zodToJsonSchema(opt)),
      };
      if (def.description) result.description = def.description;
      return result;
    }

    case 'ZodRecord': {
      const valueSchema = def.valueType ?? def.type;
      const result: JsonSchemaType = {
        type: 'object',
        additionalProperties: valueSchema ? zodToJsonSchema(valueSchema) : true,
      };
      if (def.description) result.description = def.description;
      return result;
    }

    default: {
      console.warn(`[ToolRegistry] Unknown Zod type: "${typeName}". Falling back to empty schema.`);
      return { type: 'object', properties: {} };
    }
  }
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): ToolDef[] {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      parameters: zodToJsonSchema(t.schema),
    }));
  }

  async executeByName(
    name: string,
    input: unknown,
    ctx: ToolContext,
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return { success: false, output: null, error: `Tool "${name}" not found` };
    }

    try {
      const parsed = tool.schema.parse(input);
      const output = await tool.execute(parsed, ctx);
      return { success: true, output };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, output: null, error: message };
    }
  }
}

export const globalRegistry = new ToolRegistry();
