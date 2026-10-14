import { defineEvlogHook } from "evlog/eve";
export default defineEvlogHook({
  init: { env: { service: "assistant" }, redact: true },
  message: "omit",
  redact: true,
  sessionEvent: false,
  enrich: ({ event }) => {
    delete event.message;
  },
});
