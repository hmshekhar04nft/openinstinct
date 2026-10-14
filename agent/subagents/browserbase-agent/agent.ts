import { defineAgent, defineDynamic } from "eve";
import { openRouterModel, DEFAULT_OPENROUTER_MODEL } from "@shared/openrouter";
export default defineAgent({
  description:
    "Execute a bounded public HTTPS website login/read task using Browserbase Free and opaque saved-vault credentials.",
  tool: false,
  model: defineDynamic({
    events: {
      "step.started": () => ({
        model: openRouterModel(
          process.env.BROWSER_MODEL ?? DEFAULT_OPENROUTER_MODEL
        ),
        modelContextWindowTokens: 1_000_000,
      }),
    },
  }),
  reasoning: "low",
  defaultTools: false,
  build: { externalDependencies: ["playwright-core"] },
});
