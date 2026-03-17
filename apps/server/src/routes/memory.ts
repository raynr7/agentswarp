import { Hono } from 'hono';
import type Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

type Bindings = Record<string, never>;
type Variables = {
  db: Database.Database;
};

const memory = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /api/memory/:agentId - list all memory entries
memory.get('/:agentId', (c) => {
  const db = c.get('db');
  const { agentId } = c.req.param();

  try {
    // KV memories
    const kvEntries = (() => {
      try {
        return db
          .prepare(
            `SELECT id, agent_id, key, value, 'kv' as type, created_at, updated_at
             FROM memory_kv
             WHERE agent_id = ?
             ORDER BY updated_at DESC`
          )
          .all(agentId);
      } catch {
        return [];
      }
    })();

    // Vector memories
    const vectorEntries = (() => {
      try {
        return db
          .prepare(
            `SELECT id, agent_id, content, metadata, 'vector' as type, created_at
             FROM memory_vectors
             WHERE agent_id = ?
             ORDER BY created_at DESC`
          )
          .all(agentId);
      } catch {
        return [];
      }
    })();

    // File memories
    const fileEntries = (() => {
      try {
        return db
          .prepare(
            `SELECT id, agent_id, filename, filepath, size, mime_type, 'file' as type, created_at
             FROM memory_files
             WHERE agent_id = ?
             ORDER BY created_at DESC`
          )
          .all(agentId);
      } catch {
        return [];
      }
    })();

    return c.json({
      agentId,
      kv: kvEntries,
      vectors: vectorEntries,
      files: fileEntries,
      total:
        (kvEntries as unknown[]).length +
        (vectorEntries as unknown[]).length +
        (fileEntries as unknown[]).length,
    });
  } catch (error) {
    console.error('Error listing memory entries:', error);
    return c.json({ error: 'Failed to list memory entries' }, 500);
  }
});

// POST /api/memory/:agentId/search - semantic vector search
memory.post('/:agentId/search', async (c) => {
  const db = c.get('db');
  const { agentId } = c.req.param();

  let body: { query: string; limit?: number };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { query, limit = 10 } = body;

  if (!query || typeof query !== 'string') {
    return c.json({ error: 'query is required and must be a string' }, 400);
  }

  const safeLimit = Math.min(Math.max(1, Number(limit) || 10), 100);

  try {
    // Try sqlite-vec vector similarity search
    // Falls back to full-text search on content if vectors not available
    let results: unknown[] = [];

    try {
      // Attempt sqlite-vec cosine similarity search
      // The memory_vectors table should have an embedding column as a float32 blob
      // and a companion vec_memory_vectors virtual table
      const vecResults = db
        .prepare(
          `SELECT
             mv.id,
             mv.agent_id,
             mv.content,
             mv.metadata,
             mv.created_at,
             vss.distance as distance,
             (1.0 - vss.distance) as similarity
           FROM vec_memory_vectors vss
           JOIN memory_vectors mv ON mv.id = vss.rowid
           WHERE mv.agent_id = ?
             AND vss.embedding MATCH (
               SELECT embedding FROM memory_vectors WHERE agent_id = ? AND content LIKE ? LIMIT 1
             )
           ORDER BY vss.distance ASC
           LIMIT ?`
        )
        .all(agentId, agentId, `%${query}%`, safeLimit);

      results = vecResults as unknown[];
    } catch {
      // Fallback: simple LIKE-based text search on memory_vectors content
      try {
        const textResults = db
          .prepare(
            `SELECT
               id,
               agent_id,
               content,
               metadata,
               created_at,
               0.0 as distance,
               1.0 as similarity
             FROM memory_vectors
             WHERE agent_id = ?
               AND content LIKE ?
             ORDER BY created_at DESC
             LIMIT ?`
          )
          .all(agentId, `%${query}%`, safeLimit);

        results = textResults as unknown[];
      } catch {
        results = [];
      }
    }

    return c.json({
      agentId,
      query,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error performing vector search:', error);
    return c.json({ error: 'Failed to perform vector search' }, 500);
  }
});

// GET /api/memory/:agentId/files - list workspace files for agent
memory.get('/:agentId/files', (c) => {
  const db = c.get('db');
  const { agentId } = c.req.param();

  try {
    const files = (() => {
      try {
        return db
          .prepare(
            `SELECT id, agent_id, filename, filepath, size, mime_type, created_at
             FROM memory_files
             WHERE agent_id = ?
             ORDER BY created_at DESC`
          )
          .all(agentId);
      } catch {
        return [];
      }
    })();

    return c.json({
      agentId,
      files,
      count: (files as unknown[]).length,
    });
  } catch (error) {
    console.error('Error listing workspace files:', error);
    return c.json({ error: 'Failed to list workspace files' }, 500);
  }
});

// POST /api/memory/:agentId - add new memory entry
memory.post('/:agentId', async (c) => {
  const db = c.get('db');
  const { agentId } = c.req.param();

  let body: { key?: string; value?: string; content?: string; metadata?: string; type: 'kv' | 'vector' | 'file'; filename?: string; filepath?: string; size?: number; mime_type?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { type } = body;

  if (!type || !['kv', 'vector', 'file'].includes(type)) {
    return c.json({ error: 'type must be one of: kv, vector, file' }, 400);
  }

  const id = randomUUID();
  const now = new Date().toISOString();

  try {
    if (type === 'kv') {
      const { key, value } = body;

      if (!key || typeof key !== 'string') {
        return c.json({ error: 'key is required for kv type' }, 400);
      }
      if (value === undefined || value === null) {
        return c.json({ error: 'value is required for kv type' }, 400);
      }

      try {
        // Try upsert first (update if key exists for this agent)
        const existing = db
          .prepare(`SELECT id FROM memory_kv WHERE agent_id = ? AND key = ?`)
          .get(agentId, key) as { id: string } | undefined;

        if (existing) {
          db.prepare(
            `UPDATE memory_kv SET value = ?, updated_at = ? WHERE agent_id = ? AND key = ?`
          ).run(String(value), now, agentId, key);

          const updated = db
            .prepare(`SELECT * FROM memory_kv WHERE id = ?`)
            .get(existing.id);

          return c.json({ entry: updated, created: false }, 200);
        } else {
          db.prepare(
            `INSERT INTO memory_kv (id, agent_id, key, value, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`
          ).run(id, agentId, key, String(value), now, now);

          const created = db
            .prepare(`SELECT * FROM memory_kv WHERE id = ?`)
            .get(id);

          return c.json({ entry: created, created: true }, 201);
        }
      } catch (dbError) {
        console.error('Error inserting kv memory:', dbError);
        return c.json({ error: 'Failed to store kv memory entry. Table may not exist.' }, 500);
      }
    } else if (type === 'vector') {
      const content = body.content ?? body.value;
      const { metadata } = body;

      if (!content || typeof content !== 'string') {
        return c.json({ error: 'content (or value) is required for vector type' }, 400);
      }

      try {
        db.prepare(
          `INSERT INTO memory_vectors (id, agent_id, content, metadata, created_at)
           VALUES (?, ?, ?, ?, ?)`
        ).run(id, agentId, content, metadata ? String(metadata) : null, now);

        const created = db
          .prepare(`SELECT * FROM memory_vectors WHERE id = ?`)
          .get(id);

        return c.json({ entry: created, created: true }, 201);
      } catch (dbError) {
        console.error('Error inserting vector memory:', dbError);
        return c.json({ error: 'Failed to store vector memory entry. Table may not exist.' }, 500);
      }
    } else if (type === 'file') {
      const { filename, filepath, size, mime_type } = body;

      if (!filename || typeof filename !== 'string') {
        return c.json({ error: 'filename is required for file type' }, 400);
      }
      if (!filepath || typeof filepath !== 'string') {
        return c.json({ error: 'filepath is required for file type' }, 400);
      }

      try {
        db.prepare(
          `INSERT INTO memory_files (id, agent_id, filename, filepath, size, mime_type, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(
          id,
          agentId,
          filename,
          filepath,
          size != null ? Number(size) : null,
          mime_type ?? null,
          now
        );

        const created = db
          .prepare(`SELECT * FROM memory_files WHERE id = ?`)
          .get(id);

        return c.json({ entry: created, created: true }, 201);
      } catch (dbError) {
        console.error('Error inserting file memory:', dbError);
        return c.json({ error: 'Failed to store file memory entry. Table may not exist.' }, 500);
      }
    }

    return c.json({ error: 'Unhandled memory type' }, 400);
  } catch (error) {
    console.error('Error adding memory entry:', error);
    return c.json({ error: 'Failed to add memory entry' }, 500);
  }
});

// DELETE /api/memory/:agentId/:id - delete specific memory entry
memory.delete('/:agentId/:id', (c) => {
  const db = c.get('db');
  const { agentId, id } = c.req.param();

  try {
    let deleted = false;

    // Try each table and delete from the first match
    const tables = ['memory_kv', 'memory_vectors', 'memory_files'] as const;

    for (const table of tables) {
      try {
        const result = db
          .prepare(`DELETE FROM ${table} WHERE id = ? AND agent_id = ?`)
          .run(id, agentId);

        if (result.changes > 0) {
          deleted = true;
          return c.json({
            success: true,
            id,
            agentId,
            deletedFrom: table,
          });
        }
      } catch {
        // Table might not exist, continue to next
      }
    }

    if (!deleted) {
      return c.json({ error: 'Memory entry not found' }, 404);
    }

    return c.json({ success: true, id, agentId });
  } catch (error) {
    console.error('Error deleting memory entry:', error);
    return c.json({ error: 'Failed to delete memory entry' }, 500);
  }
});

export default memory;
