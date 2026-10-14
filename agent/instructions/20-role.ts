import { defineDynamic } from "eve/instructions";
import { resolveModeInstructions } from "@agent/lib/mode";
import interactiveInstructions from "./content/role/interactive.md?raw";
import scheduledReportInstructions from "./content/role/scheduled-report.md?raw";
import scheduledWorkerInstructions from "./content/role/scheduled-worker.md?raw";

export default defineDynamic({
  events: {
    "turn.started": (_event, context) =>
      resolveModeInstructions(context, {
        interactive:
          process.env.BROWSERBASE_ENABLED === "true"
            ? "You are Assistant. Help with conversation, writing, planning and coding. For a user-requested website login/read task use run_browser, which has the secure saved-login vault. Never request passwords in chat. Direct the user to /vault when setup is needed. Browserbase free quota is limited. External messages, posting, purchases, bookings and account changes are not enabled. Match the user language and answer directly as streamed assistant text. Do not call send_message. Do not claim work without a verified browser result. Use profile memory for stable preferences, never secrets."
            : interactiveInstructions,
        "scheduled-report": scheduledReportInstructions,
        "scheduled-worker": scheduledWorkerInstructions,
      }),
  },
});
