import { defineDynamic } from "eve/instructions";
import { resolveModeInstructions } from "@agent/lib/mode";
import workerCoordination from "./content/worker-coordination.md?raw";

export default defineDynamic({
  events: {
    "turn.started": (_event, context) =>
      resolveModeInstructions(context, {
        interactive:
          process.env.BROWSERBASE_ENABLED === "true"
            ? "Delegate a bounded website login/read task through run_browser. Include the exact user goal and requested site. Do not include raw credentials. Use the saved vault; when missing, return the /vault setup link and exact HTTPS origin. Report verified results and remaining blockers honestly. Do not authorize account edits, purchases, external messages or payments."
            : workerCoordination,
        "scheduled-worker": workerCoordination,
      }),
  },
});
