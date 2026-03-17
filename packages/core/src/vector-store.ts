import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

export type EmbeddingProvider = 'ollama' | 'openai';

export interface VectorStoreConfig {
  db: Database.Database;
  embeddingProvider?: EmbeddingProvider;
  ollamaUrl?: string;
  openaiApiKey?: string;
  dimensions?: number;
}

export interface MemoryEntry {
  id: string;
  agent_id: string;
  content: string;
  embedding: Float64Array;
  tier: 1 | 2 | 3;
  category: 'episodic' | 'semantic' | 'procedural';
  access_count: number;
  last_accessed: number;
  created_at: number;
}

export type SearchResult = MemoryEntry & { score: number };

class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  values(): IterableIterator<V> {
    return this.cache.values();
  }

  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  get size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
  }
}

function cosineSimilarity(a: Float64Array, b: Float64Array): number {
  if (a.length !== b.length) throw new Error('Vector dimension mismatch');
  let dot = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}

function float64ArrayToBuffer(arr: Float64Array): Buffer {
  return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
}

function bufferToFloat64Array(buf: Buffer): Float64Array {
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  return new Float64Array(ab);
}

export class VectorStore {
  private db: Database.Database;
  private embeddingProvider: EmbeddingProvider;
  private ollamaUrl: string;
  private openaiApiKey: string | undefined;
  private dimensions: number;
  private hotCache: LRUCache<string, MemoryEntry>;
  private vecExtensionLoaded: boolean = false;

  constructor(config: VectorStoreConfig) {
    this.db = config.db;
    this.embeddingProvider = config.embeddingProvider ?? 'ollama';
    this.ollamaUrl = config.ollamaUrl ?? 'http://localhost:11434';
    this.openaiApiKey = config.openaiApiKey;
    this.dimensions = config.dimensions ?? (this.embeddingProvider === 'openai' ? 1536 : 768);
    this.hotCache = new LRUCache<string, MemoryEntry>(100);
    this.loadVecExtension();
    this.init();
  }

  private loadVecExtension(): void {
    try {
      this.db.loadExtension('sqlite-vec');
      this.vecExtensionLoaded = true;
    } catch {
      try {
        this.db.loadExtension('vec0');
        this.vecExtensionLoaded = true;
      } catch {
        this.vecExtensionLoaded = false;
      }
    }
  }

  init(): void {
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -131072');
    this.db.pragma('temp_store = MEMORY');
    this.db.pragma('mmap_size = 536870912');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memory_entries (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding BLOB NOT NULL,
        tier INTEGER NOT NULL DEFAULT 2,
        category TEXT NOT NULL DEFAULT 'episodic',
        access_count INTEGER NOT NULL DEFAULT 0,
        last_accessed INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_memory_agent ON memory_entries(agent_id);
      CREATE INDEX IF NOT EXISTS idx_memory_tier ON memory_entries(tier);
      CREATE INDEX IF NOT EXISTS idx_memory_category ON memory_entries(category);
      CREATE INDEX IF NOT EXISTS idx_memory_agent_tier ON memory_entries(agent_id, tier);
      CREATE INDEX IF NOT EXISTS idx_memory_agent_category ON memory_entries(agent_id, category);
      CREATE INDEX IF NOT EXISTS idx_memory_last_accessed ON memory_entries(last_accessed);
      CREATE INDEX IF NOT EXISTS idx_memory_created_at ON memory_entries(created_at);
    `);

    if (this.vecExtensionLoaded) {
      try {
        this.db.exec(`
          CREATE VIRTUAL TABLE IF NOT EXISTS memory_vectors USING vec0(
            id TEXT PRIMARY KEY,
            embedding FLOAT[${this.dimensions}]
          );
        `);
      } catch {
        this.vecExtensionLoaded = false;
      }
    }
  }

  async embed(texts: string[]): Promise<Float64Array[]> {
    if (texts.length === 0) return [];

    const BATCH_SIZE = 32;
    const results: Float64Array[] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      let batchResults: Float64Array[];

      if (this.embeddingProvider === 'ollama') {
        try {
          batchResults = await this.embedOllama(batch);
        } catch (err) {
          if (this.openaiApiKey) {
            batchResults = await this.embedOpenAI(batch);
          } else {
            throw err;
          }
        }
      } else {
        try {
          batchResults = await this.embedOpenAI(batch);
        } catch (err) {
          try {
            batchResults = await this.embedOllama(batch);
          } catch {
            throw err;
          }
        }
      }

      results.push(...batchResults);
    }

    return results;
  }

  private async embedOllama(texts: string[]): Promise<Float64Array[]> {
    const url = `${this.ollamaUrl}/api/embed`;
    const model = 'nomic-embed-text';

    const promises = texts.map(async (text) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, input: text }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama embed failed: ${response.status} ${errText}`);
      }

      const data = await response.json() as { embeddings: number[][] };
      if (!data.embeddings || data.embeddings.length === 0) {
        throw new Error('Ollama returned empty embeddings');
      }
      return new Float64Array(data.embeddings[0]);
    });

    return Promise.all(promises);
  }

  private async embedOpenAI(texts: string[]): Promise<Float64Array[]> {
    if (!this.openaiApiKey) throw new Error('OpenAI API key not configured');

    const url = 'https://api.openai.com/v1/embeddings';
    const model = 'text-embedding-3-small';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({ model, input: texts }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI embed failed: ${response.status} ${errText}`);
    }

    const data = await response.json() as { data: { embedding: number[]; index: number }[] };
    if (!data.data || data.data.length === 0) {
      throw new Error('OpenAI returned empty embeddings');
    }

    const sorted = [...data.data].sort((a, b) => a.index - b.index);
    return sorted.map(item => new Float64Array(item.embedding));
  }

  async store(
    agentId: string,
    content: string,
    category: MemoryEntry['category'],
    tier: number = 2
  ): Promise<string> {
    const validTier = Math.max(1, Math.min(3, tier)) as 1 | 2 | 3;
    const [embedding] = await this.embed([content]);
    const id = randomUUID();
    const now = Date.now();

    const insertEntry = this.db.prepare(`
      INSERT INTO memory_entries (id, agent_id, content, embedding, tier, category, access_count, last_accessed, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
    `);

    const embeddingBuf = float64ArrayToBuffer(embedding);

    const runInsert = this.db.transaction(() => {
      insertEntry.run(id, agentId, content, embeddingBuf, validTier, category, now, now);

      if (this.vecExtensionLoaded) {
        try {
          const insertVec = this.db.prepare(`
            INSERT INTO memory_vectors (id, embedding) VALUES (?, ?)
          `);
          const float32Buf = Buffer.from(new Float32Array(embedding).buffer);
          insertVec.run(id, float32Buf);
        } catch {
          // vec table insert failed, continue without
        }
      }
    });

    runInsert();

    const entry: MemoryEntry = {
      id,
      agent_id: agentId,
      content,
      embedding,
      tier: validTier,
      category,
      access_count: 0,
      last_accessed: now,
      created_at: now,
    };

    if (validTier === 1) {
      this.hotCache.set(id, entry);
    }

    return id;
  }

  async search(
    agentId: string,
    query: string,
    topK: number = 10,
    filter?: { category?: string; tier?: number }
  ): Promise<SearchResult[]> {
    const [queryEmbedding] = await this.embed([query]);

    let candidates: MemoryEntry[];

    if (this.vecExtensionLoaded) {
      candidates = this.searchWithVec(agentId, queryEmbedding, topK * 4, filter);
    } else {
      candidates = this.searchBruteForce(agentId, filter);
    }

    const scored: SearchResult[] = candidates.map(entry => ({
      ...entry,
      score: cosineSimilarity(queryEmbedding, entry.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, topK);

    const now = Date.now();
    const updateAccess = this.db.prepare(`
      UPDATE memory_entries SET access_count = access_count + 1, last_accessed = ? WHERE id = ?
    `);

    const updateBatch = this.db.transaction(() => {
      for (const result of top) {
        updateAccess.run(now, result.id);
        result.access_count += 1;
        result.last_accessed = now;
        if (result.tier === 1) {
          this.hotCache.set(result.id, result);
        }
      }
    });

    updateBatch();

    return top;
  }

  private searchWithVec(
    agentId: string,
    queryEmbedding: Float64Array,
    limit: number,
    filter?: { category?: string; tier?: number }
  ): MemoryEntry[] {
    try {
      const float32Buf = Buffer.from(new Float32Array(queryEmbedding).buffer);

      let whereClause = 'me.agent_id = ?';
      const params: unknown[] = [agentId];

      if (filter?.category) {
        whereClause += ' AND me.category = ?';
        params.push(filter.category);
      }
      if (filter?.tier !== undefined) {
        whereClause += ' AND me.tier = ?';
        params.push(filter.tier);
      }

      params.push(float32Buf, limit);

      const stmt = this.db.prepare(`
        SELECT me.id, me.agent_id, me.content, me.embedding, me.tier, me.category,
               me.access_count, me.last_accessed, me.created_at
        FROM memory_entries me
        INNER JOIN memory_vectors mv ON me.id = mv.id
        WHERE ${whereClause}
        AND mv.embedding MATCH ?
        ORDER BY mv.distance
        LIMIT ?
      `);

      const rows = stmt.all(...params) as Array<{
        id: string;
        agent_id: string;
        content: string;
        embedding: Buffer;
        tier: number;
        category: string;
        access_count: number;
        last_accessed: number;
        created_at: number;
      }>;

      return rows.map(row => this.rowToEntry(row));
    } catch {
      return this.searchBruteForce(agentId, filter);
    }
  }

  private searchBruteForce(
    agentId: string,
    filter?: { category?: string; tier?: number }
  ): MemoryEntry[] {
    let sql = 'SELECT id, agent_id, content, embedding, tier, category, access_count, last_accessed, created_at FROM memory_entries WHERE agent_id = ?';
    const params: unknown[] = [agentId];

    if (filter?.category) {
      sql += ' AND category = ?';
      params.push(filter.category);
    }
    if (filter?.tier !== undefined) {
      sql += ' AND tier = ?';
      params.push(filter.tier);
    }

    // Prioritize tier 1 and recently accessed
    sql += ' ORDER BY tier ASC, last_accessed DESC';

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as Array<{
      id: string;
      agent_id: string;
      content: string;
      embedding: Buffer;
      tier: number;
      category: string;
      access_count: number;
      last_accessed: number;
      created_at: number;
    }>;

    return rows.map(row => this.rowToEntry(row));
  }

  private rowToEntry(row: {
    id: string;
    agent_id: string;
    content: string;
    embedding: Buffer;
    tier: number;
    category: string;
    access_count: number;
    last_accessed: number;
    created_at: number;
  }): MemoryEntry {
    const tier = row.tier as 1 | 2 | 3;

    if (tier === 1 && this.hotCache.has(row.id)) {
      return this.hotCache.get(row.id)!;
    }

    const entry: MemoryEntry = {
      id: row.id,
      agent_id: row.agent_id,
      content: row.content,
      embedding: bufferToFloat64Array(row.embedding),
      tier,
      category: row.category as MemoryEntry['category'],
      access_count: row.access_count,
      last_accessed: row.last_accessed,
      created_at: row.created_at,
    };

    if (tier === 1) {
      this.hotCache.set(entry.id, entry);
    }

    return entry;
  }

  async promote(id: string): Promise<void> {
    const stmt = this.db.prepare('SELECT tier FROM memory_entries WHERE id = ?');
    const row = stmt.get(id) as { tier: number } | undefined;
    if (!row) throw new Error(`Memory entry not found: ${id}`);

    const currentTier = row.tier as 1 | 2 | 3;
    if (currentTier === 1) return;

    const newTier = (currentTier - 1) as 1 | 2;
    const now = Date.now();

    const update = this.db.prepare('UPDATE memory_entries SET tier = ?, last_accessed = ? WHERE id = ?');
    update.run(newTier, now, id);

    if (this.hotCache.has(id)) {
      const cached = this.hotCache.get(id)!;
      cached.tier = newTier;
      cached.last_accessed = now;
    } else if (newTier === 1) {
      const fullStmt = this.db.prepare(
        'SELECT id, agent_id, content, embedding, tier, category, access_count, last_accessed, created_at FROM memory_entries WHERE id = ?'
      );
      const fullRow = fullStmt.get(id) as {
        id: string; agent_id: string; content: string; embedding: Buffer;
        tier: number; category: string; access_count: number; last_accessed: number; created_at: number;
      } | undefined;
      if (fullRow) {
        const entry = this.rowToEntry(fullRow);
        this.hotCache.set(id, entry);
      }
    }
  }

  async demote(id: string): Promise<void> {
    const stmt = this.db.prepare('SELECT tier FROM memory_entries WHERE id = ?');
    const row = stmt.get(id) as { tier: number } | undefined;
    if (!row) throw new Error(`Memory entry not found: ${id}`);

    const currentTier = row.tier as 1 | 2 | 3;
    if (currentTier === 3) return;

    const newTier = (currentTier + 1) as 2 | 3;
    const now = Date.now();

    const update = this.db.prepare('UPDATE memory_entries SET tier = ?, last_accessed = ? WHERE id = ?');
    update.run(newTier, now, id);

    if (newTier > 1) {
      this.hotCache.delete(id);
    }
  }

  async prune(maxAgeDays: number): Promise<number> {
    const cutoffMs = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;

    const selectStmt = this.db.prepare(
      'SELECT id FROM memory_entries WHERE tier = 3 AND last_accessed < ?'
    );
    const toDelete = selectStmt.all(cutoffMs) as { id: string }[];

    if (toDelete.length === 0) return 0;

    const ids = toDelete.map(r => r.id);

    const deleteEntries = this.db.prepare(
      `DELETE FROM memory_entries WHERE tier = 3 AND last_accessed < ?`
    );

    const pruneTransaction = this.db.transaction(() => {
      deleteEntries.run(cutoffMs);

      if (this.vecExtensionLoaded) {
        try {
          const placeholders = ids.map(() => '?').join(',');
          const deleteVec = this.db.prepare(`DELETE FROM memory_vectors WHERE id IN (${placeholders})`);
          deleteVec.run(...ids);
        } catch {
          // vec table cleanup failed, continue
        }
      }

      for (const id of ids) {
        this.hotCache.delete(id);
      }
    });

    pruneTransaction();
    return toDelete.length;
  }

  getStats(agentId: string): {
    total: number;
    byTier: Record<1 | 2 | 3, number>;
    byCategory: Record<MemoryEntry['category'], number>;
  } {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM memory_entries WHERE agent_id = ?');
    const totalRow = totalStmt.get(agentId) as { count: number };

    const tierStmt = this.db.prepare(
      'SELECT tier, COUNT(*) as count FROM memory_entries WHERE agent_id = ? GROUP BY tier'
    );
    const tierRows = tierStmt.all(agentId) as { tier: number; count: number }[];

    const categoryStmt = this.db.prepare(
      'SELECT category, COUNT(*) as count FROM memory_entries WHERE agent_id = ? GROUP BY category'
    );
    const categoryRows = categoryStmt.all(agentId) as { category: string; count: number }[];

    const byTier: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
    for (const row of tierRows) {
      const t = row.tier as 1 | 2 | 3;
      if (t === 1 || t === 2 || t === 3) {
        byTier[t] = row.count;
      }
    }

    const byCategory: Record<MemoryEntry['category'], number> = {
      episodic: 0,
      semantic: 0,
      procedural: 0,
    };
    for (const row of categoryRows) {
      const cat = row.category as MemoryEntry['category'];
      if (cat === 'episodic' || cat === 'semantic' || cat === 'procedural') {
        byCategory[cat] = row.count;
      }
    }

    return {
      total: totalRow.count,
      byTier,
      byCategory,
    };
  }

  evictColdFromCache(): void {
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    for (const key of Array.from(this.hotCache.keys())) {
      const entry = this.hotCache.get(key);
      if (entry && now - entry.last_accessed > ONE_HOUR) {
        this.hotCache.delete(key);
      }
    }
  }

  getCacheSize(): number {
    return this.hotCache.size;
  }

  clearCache(): void {
    this.hotCache.clear();
  }

  isVecExtensionLoaded(): boolean {
    return this.vecExtensionLoaded;
  }
}
