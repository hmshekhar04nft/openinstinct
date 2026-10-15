import { defineDynamic } from "eve/instructions";
import { resolveModeInstructions } from "@agent/lib/mode";
import workerCoordination from "./content/worker-coordination.md?raw";

export default defineDynamic({
  events: {
    "turn.started": (_event, context) =>
      resolveModeInstructions(context, {
        interactive:
          process.env.BROWSERBASE_ENABLED === "true"
            ? "Use read_public_page for a single public HTTPS page question, including pricing. It returns verified page text and closes automatically; answer immediately from that data without run_browser. Delegate login or multi-page tasks through run_browser. Include the exact user goal and requested site. Do not include raw credentials. Use the saved vault; when missing, return the /vault setup link and exact HTTPS origin. Report verified results and remaining blockers honestly. Do not authorize account edits, purchases, external messages or payments."
            : workerCoordination,
        "scheduled-worker": workerCoordination,
      }),
  },
});
