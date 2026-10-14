import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  MemoryDocumentConflictError,
  type MemoryDocument,
  type MemoryDocumentBackend,
} from "eve/memory/file";

const memoryDir = process.env.EVE_MEMORY_DIR ?? "/tmp/eve-memory";

function keyPath(key: string) {
  const safe = createHash("sha256").update(key).digest("hex");
  return join(memoryDir, `${safe}.json`);
}

/**
 * Filesystem-backed memory documents for self-hosted (non-Vercel) deploys.
 * One JSON file per scope key under EVE_MEMORY_DIR.
 */
export function fsFileMemoryBackend(): MemoryDocumentBackend {
  async function readDoc(key: string): Promise<MemoryDocument | null> {
    try {
      const raw = await readFile(keyPath(key), "utf8");
      return JSON.parse(raw) as MemoryDocument;
    } catch {
      return null;
    }
  }
  return {
    read: ({ key }) => readDoc(key),
    async write({ key, content, expectedVersion }) {
      await mkdir(memoryDir, { recursive: true });
      const existing = await readDoc(key);
      const existingVersion = existing?.version ?? null;
      if (existingVersion !== expectedVersion) {
        throw new MemoryDocumentConflictError(key);
      }
      const doc: MemoryDocument = {
        content,
        version: createHash("sha256").update(content).digest("hex"),
      };
      const target = keyPath(key);
      await writeFile(`${target}.tmp`, JSON.stringify(doc), "utf8");
      await rename(`${target}.tmp`, target);
      return doc;
    },
  };
}
