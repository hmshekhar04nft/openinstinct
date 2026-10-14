import { defineAgent, defineDynamic } from "eve";
import { scheduledRunIdentity } from "@agent/lib/schedules/identity";
import { isScheduledAgentRunLeaseActive } from "@db/services/scheduled-agent-run-leases";
import { getGatewayModel } from "@db/services/settings";
import { openRouterModel } from "@shared/openrouter";
import { scopeFromPrincipal } from "@agent/lib/principal-scope";

const modelCache = new Map<string, { id: string; until: number }>();
async function cachedModel(scope: ReturnType<typeof scopeFromPrincipal>) {
  const cached = modelCache.get(scope.workspaceId);
  if (cached && cached.until > Date.now()) return cached.id;
  const id = await getGatewayModel(scope);
  modelCache.set(scope.workspaceId, { id, until: Date.now() + 15_000 });
  return id;
}

function contextWindowForModel(modelId: string): number {
  if (modelId.includes("muse-spark")) return 1_000_000;
  return 131_072;
}

export default defineAgent({
  defaultTools: false,
  build: { externalDependencies: ["@workflow/world-postgres"] },
  experimental: { workflow: { world: "@workflow/world-postgres" } },
  model: defineDynamic({
    events: {
      "step.started": async (_event, ctx) => {
        const scheduledRun = scheduledRunIdentity(ctx.session.auth);
        if (
          scheduledRun &&
          !(await isScheduledAgentRunLeaseActive(
            scheduledRun.runId,
            scheduledRun.leaseToken
          ))
        ) {
          throw new Error("The scheduled run lease is no longer active.");
        }
        const caller = ctx.session.auth.current ?? ctx.session.auth.initiator;
        if (!caller) throw new Error("An authenticated user is required.");
        const modelId = await cachedModel(scopeFromPrincipal(caller));
        return {
          model: openRouterModel(modelId),
          modelContextWindowTokens: contextWindowForModel(modelId),
        };
      },
    },
  }),
  reasoning: "none",
  compaction: {
    thresholdPercent: 0.7,
  },
});
