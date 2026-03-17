import crypto from 'crypto';
import type { Database } from 'better-sqlite3';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_DIGEST = 'sha256';

export class Vault {
  private static instance: Vault | null = null;
  private encryptionKey: Buffer;

  constructor(secretKey?: string) {
    const key = secretKey ?? process.env.SECRET_KEY;
    if (!key || key.trim() === '') {
      throw new Error('SECRET_KEY environment variable is required for Vault initialization');
    }

    // Derive static salt from first 16 chars of the secret key (padded if necessary)
    const saltSource = key.slice(0, 16).padEnd(16, '0');
    const salt = Buffer.from(saltSource, 'utf8');

    this.encryptionKey = crypto.pbkdf2Sync(
      key,
      salt,
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      PBKDF2_DIGEST
    );
  }

  static getInstance(): Vault {
    if (!Vault.instance) {
      Vault.instance = new Vault();
    }
    return Vault.instance;
  }

  /**
   * Encrypts a plaintext string.
   * Returns a base64-encoded string in the format: iv:authTag:ciphertext
   */
  encrypt(plaintext: string): string {
    if (typeof plaintext !== 'string') {
      throw new TypeError('Vault.encrypt: plaintext must be a string');
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    }) as crypto.CipherGCM;

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error('Vault.encrypt: unexpected auth tag length');
    }

    const ivB64 = iv.toString('base64');
    const authTagB64 = authTag.toString('base64');
    const ciphertextB64 = encrypted.toString('base64');

    return `${ivB64}:${authTagB64}:${ciphertextB64}`;
  }

  /**
   * Decrypts an encrypted string produced by encrypt().
   * Expects base64-encoded format: iv:authTag:ciphertext
   */
  decrypt(encrypted: string): string {
    if (typeof encrypted !== 'string' || encrypted.trim() === '') {
      throw new TypeError('Vault.decrypt: encrypted must be a non-empty string');
    }

    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      throw new Error(
        'Vault.decrypt: invalid encrypted data format, expected iv:authTag:ciphertext'
      );
    }

    const [ivB64, authTagB64, ciphertextB64] = parts;

    let iv: Buffer;
    let authTag: Buffer;
    let ciphertextBuffer: Buffer;

    try {
      iv = Buffer.from(ivB64, 'base64');
      authTag = Buffer.from(authTagB64, 'base64');
      ciphertextBuffer = Buffer.from(ciphertextB64, 'base64');
    } catch (err) {
      throw new Error('Vault.decrypt: failed to decode base64 components');
    }

    if (iv.length !== IV_LENGTH) {
      throw new Error(
        `Vault.decrypt: invalid IV length ${iv.length}, expected ${IV_LENGTH}`
      );
    }

    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(
        `Vault.decrypt: invalid auth tag length ${authTag.length}, expected ${AUTH_TAG_LENGTH}`
      );
    }

    try {
      const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv, {
        authTagLength: AUTH_TAG_LENGTH,
      }) as crypto.DecipherGCM;

      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(ciphertextBuffer),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (err) {
      if (err instanceof Error && err.message.includes('Unsupported state or unable to authenticate data')) {
        throw new Error('Vault.decrypt: authentication failed - data may be tampered or key is incorrect');
      }
      throw new Error(
        `Vault.decrypt: decryption failed - ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /**
   * Serializes an object to JSON and encrypts it.
   */
  encryptJson(data: object): string {
    if (data === null || typeof data !== 'object') {
      throw new TypeError('Vault.encryptJson: data must be a non-null object');
    }

    let json: string;
    try {
      json = JSON.stringify(data);
    } catch (err) {
      throw new Error(
        `Vault.encryptJson: failed to serialize data - ${err instanceof Error ? err.message : String(err)}`
      );
    }

    return this.encrypt(json);
  }

  /**
   * Decrypts and deserializes an encrypted JSON string.
   */
  decryptJson<T = unknown>(encrypted: string): T {
    const plaintext = this.decrypt(encrypted);

    try {
      return JSON.parse(plaintext) as T;
    } catch (err) {
      throw new Error(
        `Vault.decryptJson: failed to deserialize JSON - ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /**
   * Re-encrypts all stored credentials in the database using a new secret key.
   * This is a transactional operation - all or nothing.
   */
  rotateKey(oldKey: string, newKey: string, db: Database): void {
    if (!oldKey || oldKey.trim() === '') {
      throw new Error('Vault.rotateKey: oldKey must be a non-empty string');
    }
    if (!newKey || newKey.trim() === '') {
      throw new Error('Vault.rotateKey: newKey must be a non-empty string');
    }
    if (!db) {
      throw new Error('Vault.rotateKey: db must be a valid Database instance');
    }

    const oldVault = new Vault(oldKey);
    const newVault = new Vault(newKey);

    // Gather all tables and columns that may store encrypted credentials.
    // We look for tables with a column named 'credentials' or 'encrypted_credentials'.
    const tables = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
      )
      .all() as Array<{ name: string }>;

    const rotate = db.transaction(() => {
      for (const { name: tableName } of tables) {
        // Retrieve column info for the table
        const columns = db
          .prepare(`PRAGMA table_info("${tableName}")`)
          .all() as Array<{ name: string; type: string; pk: number }>;

        const credentialColumns = columns
          .filter((col) =>
            ['credentials', 'encrypted_credentials', 'credential', 'secret', 'token', 'access_token', 'refresh_token'].includes(
              col.name.toLowerCase()
            )
          )
          .map((col) => col.name);

        if (credentialColumns.length === 0) {
          continue;
        }

        // Find primary key columns
        const pkColumns = columns
          .filter((col) => col.pk > 0)
          .sort((a, b) => a.pk - b.pk)
          .map((col) => col.name);

        if (pkColumns.length === 0) {
          // Skip tables without a primary key
          continue;
        }

        const pkSelect = pkColumns.map((c) => `"${c}"`).join(', ');
        const credSelect = credentialColumns.map((c) => `"${c}"`).join(', ');
        const rows = db
          .prepare(`SELECT ${pkSelect}, ${credSelect} FROM "${tableName}"`)
          .all() as Array<Record<string, unknown>>;

        for (const row of rows) {
          const updates: string[] = [];
          const values: unknown[] = [];

          for (const col of credentialColumns) {
            const encryptedValue = row[col];
            if (encryptedValue === null || encryptedValue === undefined || encryptedValue === '') {
              continue;
            }

            if (typeof encryptedValue !== 'string') {
              continue;
            }

            let plaintext: string;
            try {
              plaintext = oldVault.decrypt(encryptedValue);
            } catch {
              // Skip values that cannot be decrypted with the old key
              // (might be plaintext or encrypted with a different algorithm)
              continue;
            }

            const reEncrypted = newVault.encrypt(plaintext);
            updates.push(`"${col}" = ?`);
            values.push(reEncrypted);
          }

          if (updates.length === 0) {
            continue;
          }

          const whereClause = pkColumns
            .map((c) => `"${c}" = ?`)
            .join(' AND ');
          const pkValues = pkColumns.map((c) => row[c]);

          db.prepare(
            `UPDATE "${tableName}" SET ${updates.join(', ')} WHERE ${whereClause}`
          ).run(...values, ...pkValues);
        }
      }

      // After successful rotation, update the in-memory encryption key
      this.encryptionKey = newVault.encryptionKey;

      // Reset the singleton so next getInstance() will use the new key
      if (Vault.instance === this) {
        Vault.instance = null;
      }
    });

    rotate();
  }
}

// Export singleton instance
export const vault = Vault.getInstance();

export default vault;
