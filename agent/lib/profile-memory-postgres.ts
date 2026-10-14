import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@db";
import { MemoryDocumentConflictError, type MemoryDocumentBackend } from "eve/memory/file";

export function postgresFileMemoryBackend(): MemoryDocumentBackend {
  return {
    async read({ key }) {
      const result = await db.execute(sql`SELECT content, version FROM assistant_memory_documents WHERE key = ${key}`);
      const row = result.rows[0];
      return row ? { content: String(row.content), version: String(row.version) } : null;
    },
    async write({ key, content, expectedVersion }) {
      const version = createHash("sha256").update(content).digest("hex");
      const result = expectedVersion === null
        ? await db.execute(sql`INSERT INTO assistant_memory_documents (key,content,version) VALUES (${key},${content},${version}) ON CONFLICT DO NOTHING RETURNING version`)
        : await db.execute(sql`UPDATE assistant_memory_documents SET content=${content},version=${version},updated_at=now() WHERE key=${key} AND version=${expectedVersion} RETURNING version`);
      if (result.rows.length === 0) throw new MemoryDocumentConflictError(key);
      return { content, version };
    },
  };
}
