import { Hono } from 'hono';
import type Database from 'better-sqlite3';

interface AppSetting {
  key: string;
  value: string;
  updated_at: string;
}

interface PersonalityPreset {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  isCustom: boolean;
}

const SETTINGS_KEYS = [
  'llm_provider',
  'llm_model',
  'llm_api_key',
  'llm_base_url',
  'voice_enabled',
  'voice_model',
  'default_personality',
  'max_sub_agents',
] as const;

type SettingsKey = typeof SETTINGS_KEYS[number];

const BUILT_IN_PERSONALITIES: PersonalityPreset[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'A helpful, harmless, and honest AI assistant.',
    systemPrompt:
      'You are a helpful, harmless, and honest AI assistant. You provide clear, accurate, and thoughtful responses.',
    isCustom: false,
  },
  {
    id: 'concise',
    name: 'Concise',
    description: 'Brief and to-the-point responses with minimal elaboration.',
    systemPrompt:
      'You are a concise AI assistant. Provide brief, direct answers. Avoid unnecessary elaboration or filler words.',
    isCustom: false,
  },
  {
    id: 'expert',
    name: 'Expert Analyst',
    description: 'Deep technical expertise with structured analytical responses.',
    systemPrompt:
      'You are an expert analyst with deep technical knowledge across multiple domains. Provide structured, in-depth analysis with supporting reasoning and evidence.',
    isCustom: false,
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Creative and imaginative with an exploratory approach.',
    systemPrompt:
      'You are a creative AI assistant. Approach problems with imagination and originality. Explore unconventional ideas and think outside the box.',
    isCustom: false,
  },
  {
    id: 'teacher',
    name: 'Teacher',
    description: 'Patient educator that explains concepts clearly with examples.',
    systemPrompt:
      'You are a patient and thorough teacher. Explain concepts clearly using examples, analogies, and step-by-step breakdowns. Adapt your explanations to the learner\'s level.',
    isCustom: false,
  },
  {
    id: 'coder',
    name: 'Software Engineer',
    description: 'Focused on writing clean, efficient, production-ready code.',
    systemPrompt:
      'You are an experienced software engineer. Focus on writing clean, efficient, and maintainable code. Follow best practices, consider edge cases, and provide clear explanations of your implementation decisions.',
    isCustom: false,
  },
];

function ensureSettingsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function maskApiKey(value: string): string {
  if (!value || value.length === 0) return '';
  if (value.length <= 8) return '***';
  return value.substring(0, 4) + '***' + value.substring(value.length - 4);
}

function getSetting(db: Database.Database, key: string): string | null {
  const row = db
    .prepare('SELECT value FROM app_settings WHERE key = ?')
    .get(key) as { value: string } | undefined;
  return row ? row.value : null;
}

function upsertSetting(db: Database.Database, key: string, value: string): void {
  db.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).run(key, value);
}

export function createSettingsRouter(db: Database.Database): Hono {
  ensureSettingsTable(db);

  const router = new Hono();

  // GET /api/settings
  router.get('/', (c) => {
    try {
      const settings: Record<string, string | null> = {};

      for (const key of SETTINGS_KEYS) {
        const value = getSetting(db, key);
        if (key === 'llm_api_key') {
          settings[key] = value ? maskApiKey(value) : null;
        } else {
          settings[key] = value;
        }
      }

      return c.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to fetch settings',
        },
        500
      );
    }
  });

  // POST /api/settings
  router.post('/', async (c) => {
    try {
      const body = await c.req.json<Record<string, string>>();

      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return c.json(
          {
            success: false,
            error: 'Request body must be a JSON object of key-value pairs',
          },
          400
        );
      }

      const allowedKeys = new Set<string>(SETTINGS_KEYS);
      const updated: string[] = [];
      const skipped: string[] = [];

      const upsertMany = db.transaction((entries: [string, string][]) => {
        for (const [key, value] of entries) {
          upsertSetting(db, key, value);
        }
      });

      const validEntries: [string, string][] = [];

      for (const [key, value] of Object.entries(body)) {
        if (!allowedKeys.has(key)) {
          skipped.push(key);
          continue;
        }
        if (typeof value !== 'string') {
          skipped.push(key);
          continue;
        }
        validEntries.push([key, value]);
        updated.push(key);
      }

      upsertMany(validEntries);

      return c.json({
        success: true,
        data: {
          updated,
          skipped,
        },
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to update settings',
        },
        500
      );
    }
  });

  // GET /api/settings/personalities
  router.get('/personalities', (c) => {
    try {
      const rows = db
        .prepare(
          `SELECT key, value FROM app_settings WHERE key LIKE 'personality_%' ORDER BY key`
        )
        .all() as { key: string; value: string }[];

      const customPersonalities: PersonalityPreset[] = rows.map((row) => {
        let parsed: { name?: string; description?: string; systemPrompt?: string } = {};
        try {
          parsed = JSON.parse(row.value);
        } catch {
          parsed = { name: row.key, description: '', systemPrompt: row.value };
        }
        return {
          id: row.key,
          name: parsed.name ?? row.key.replace('personality_', ''),
          description: parsed.description ?? '',
          systemPrompt: parsed.systemPrompt ?? row.value,
          isCustom: true,
        };
      });

      const allPersonalities = [...BUILT_IN_PERSONALITIES, ...customPersonalities];

      return c.json({
        success: true,
        data: allPersonalities,
      });
    } catch (error) {
      console.error('Error fetching personalities:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to fetch personalities',
        },
        500
      );
    }
  });

  // POST /api/settings/personalities
  router.post('/personalities', async (c) => {
    try {
      const body = await c.req.json<{
        name?: string;
        description?: string;
        systemPrompt?: string;
      }>();

      if (!body || typeof body !== 'object') {
        return c.json(
          {
            success: false,
            error: 'Request body must be a JSON object',
          },
          400
        );
      }

      const { name, description, systemPrompt } = body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return c.json(
          {
            success: false,
            error: 'name is required and must be a non-empty string',
          },
          400
        );
      }

      if (!systemPrompt || typeof systemPrompt !== 'string' || systemPrompt.trim().length === 0) {
        return c.json(
          {
            success: false,
            error: 'systemPrompt is required and must be a non-empty string',
          },
          400
        );
      }

      const sanitizedName = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_');

      const key = `personality_${sanitizedName}`;

      const payload = JSON.stringify({
        name: name.trim(),
        description: typeof description === 'string' ? description.trim() : '',
        systemPrompt: systemPrompt.trim(),
      });

      upsertSetting(db, key, payload);

      const newPersonality: PersonalityPreset = {
        id: key,
        name: name.trim(),
        description: typeof description === 'string' ? description.trim() : '',
        systemPrompt: systemPrompt.trim(),
        isCustom: true,
      };

      return c.json(
        {
          success: true,
          data: newPersonality,
        },
        201
      );
    } catch (error) {
      console.error('Error creating personality:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to create personality',
        },
        500
      );
    }
  });

  return router;
}

export default createSettingsRouter;
