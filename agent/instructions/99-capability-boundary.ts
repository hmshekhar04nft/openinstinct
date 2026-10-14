import { defineDynamic, defineInstructions } from "eve/instructions";
import capabilityBoundary from "./content/capability-boundary.md?raw";
export default defineDynamic({
  events: {
    "turn.started": () => defineInstructions({ content: capabilityBoundary }),
  },
});
