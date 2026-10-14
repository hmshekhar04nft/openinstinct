# Browser prototype setup

Use Browserbase Free, with no payment card and no paid upgrade. Confirm that in the account dashboard before enabling.

Server environment:
- BROWSERBASE_API_KEY: server secret from its private vault entry
- BROWSERBASE_PROJECT_ID: project UUID
- BROWSERBASE_ENABLED=true: only after account plan validation

Apply browserbase-storage.sql to the same Postgres database. The provider checks project usage and reserves full 180-second sessions against a global 54-minute monthly app cap. Do not use the project for unrelated browser workloads. The app does not enable paid proxies, hosted agents, captcha solving, recording, or logging. OpenRouter token usage is separate.

Login setup: signed-in user opens /vault, adds a login for the exact HTTPS origin. The browser model receives only the opaque item handle, never the password. Cookies/local storage are encrypted with the same stable installation key and scoped per workspace. Deleting a vault item erases the persisted browser profile for that workspace. This does not revoke remote website sessions; sign out on the website to revoke them.

Limits: login/read prototype only. It is not email, posting, booking or purchasing support. Live MFA/CAPTCHA handoff is not implemented. Browser runtime handles are in-process; after service restarts a new browser is needed, while saved profiles persist in Postgres. Three-minute timeout is a safety budget and may be too short for slow multi-step model reasoning. No success claim until end-to-end tests pass.

Pending release gates: live provider public-page test, encrypted vault fill test, tenant isolation integration test, live chat-to-worker test, and mobile visual inspection.
