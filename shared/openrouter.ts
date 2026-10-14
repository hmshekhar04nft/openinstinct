import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export const DEFAULT_OPENROUTER_MODEL =
  "meta/muse-spark-1.3-contributor";

function requireOpenRouterApiKey() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error("Set OPENROUTER_API_KEY in the server environment.");
  }
  return apiKey.trim();
}

export function openRouterModel(modelId: string) {
  const provider = createOpenAICompatible({
    name: "openrouter",
    baseURL: OPENROUTER_BASE_URL,
    apiKey: requireOpenRouterApiKey(),
    headers: {
      "HTTP-Referer": process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
      "X-Title": "Assistant",
    },
  });
  return provider.chatModel(modelId);
}

interface OpenRouterCatalogEntry {
  readonly id: string;
  readonly name: string;
  readonly context_length?: number;
  readonly supported_parameters?: readonly string[];
  readonly pricing?: { readonly prompt?: string; readonly completion?: string };
}

export interface OpenRouterModelSummary {
  readonly id: string;
  readonly name: string;
  readonly ownedBy: string;
  readonly contextLength?: number;
}

export async function listOpenRouterFreeModels(): Promise<
  OpenRouterModelSummary[]
> {
  const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
    headers: { Authorization: `Bearer ${requireOpenRouterApiKey()}` },
  });
  if (!response.ok) {
    throw new Error(`OpenRouter model list failed (${response.status}).`);
  }
  const payload = (await response.json()) as { data?: OpenRouterCatalogEntry[] };
  const models = payload.data ?? [];
  return models
    .filter(
      (model) =>
        model.id.endsWith(":free") &&
        (model.supported_parameters ?? []).includes("tools")
    )
    .map((model) => ({
      id: model.id,
      name: model.name,
      ownedBy: model.id.split("/")[0] ?? "openrouter",
      contextLength: model.context_length,
    }))
    .toSorted((left, right) => left.id.localeCompare(right.id));
}
