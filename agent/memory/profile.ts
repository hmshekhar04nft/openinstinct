import { defineMemory } from "eve/memory";
import { fileMemory } from "eve/memory/file";
import { vercelBlob } from "eve/memory/file/vercel";
import { postgresFileMemoryBackend } from "../lib/profile-memory-postgres";
import {
  preserveProfileMemoryCancellation,
  resolveProfileMemoryBackend,
  resolveProfileMemoryScope,
} from "../lib/profile-memory";
import { env } from "@shared/environment";

const backend = resolveProfileMemoryBackend(env);
const provider = preserveProfileMemoryCancellation(
  backend.kind === "vercel-blob"
    ? fileMemory({
        backend: vercelBlob(backend.options),
      })
    : backend.kind === "fs"
      ? fileMemory({ backend: postgresFileMemoryBackend() })
      : fileMemory()
);

export default defineMemory({
  description: "Remember stable facts and preferences about the current user.",
  provider,
  scope: resolveProfileMemoryScope,
});
