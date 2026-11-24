# Codex Guide: FTdx3000 Console

This is a local, single-operator console for the Yaesu FTdx3000. It is
real station software, not a radio simulator. The app can tune and
transmit with physical hardware, and QRZ operations can change a real
logbook. Preserve the operator's control over those actions.

## Before Changing Anything

1. Run `git status --short`. Preserve work and local settings that are
   already present. Do not reset or clean this workspace.
2. Read [README.md](README.md) for setup and key constraints. Read the
   relevant part of [docs/owners-manual.md](docs/owners-manual.md) for
   operator workflows.
3. Trace changes from the UI through the WebSocket or HTTP handler to the
   radio or external service. Do not assume similarly named controls
   share a path. Several controls are duplicated across tabs or windows.
4. Say when a change could affect hardware or personal data. Verify
   software with synthetic data first.

## Non-Negotiable Safety

- Never connect, retune, key, run the antenna tuner, change serial
  control lines, change radio settings, power-cycle the rig, or run a
  hardware smoke test without the operator's explicit approval. A CAT
  connect applies a preset; auto ATU can transmit a carrier.
- Do not open, reload, or close an app page attached to an active CAT
  session just to test UI. Socket close, browser blur, and page unload
  can release PTT or stop a scan. Use an isolated server with no radio
  attached or mock its WebSocket in the browser.
- Do not restart the operator's running server without checking with
  them first. Starting a separate test process is fine; use an
  ephemeral port and stop only the process you started.
- Never introduce a raw CAT passthrough. Keep reads allowlisted and
  writes behind dedicated commands with bounded inputs. Check exact
  model, command parameters, units, and state transitions against
  official Yaesu documentation. Other Yaesu models are not substitutes.
- Keep hold-to-talk fail-closed. Preserve release on keyup, browser
  blur or hide, disconnect, scan start, and the server-side timeout.
  The app timeout is not a substitute for the radio's own protections.
- Only the operator controls transmission. A band profile is a tuning
  and scanning aid, not a license check or transmit interlock. Use
  current FCC sources for U.S. allocations and state the assumed
  operator class and location before changing a band plan.
- No tests that upload or delete real QSO records, change QRZ account
  settings, submit real POTA spots, or open private live logbook data.
  Stub external calls and use invented records.

## Project Map

| Area | Files and purpose |
| --- | --- |
| Startup and routes | `src/server.js`: Express static/API routes, `/cat` WebSocket, serial session, timers, CAT state and command handlers. |
| Local security | `src/localAccess.js`: loopback Host and same-origin browser checks; the server applies them to APIs and CAT upgrades. |
| CAT protocol | `src/cat.js`: command formatting, readback parsing, limits, serial port guard. This is a good place for protocol unit tests. |
| Console | `public/index.html`, `public/app.js`, `public/styles.css`: Run views, connect controls, tuning, meters, scanner, journal controls, POTA/Logger framing and logbook. |
| Band plan | `public/band-plan.js` is shared with the server. The server exposes effective presets/ranges through `/api/config`; keep profile IDs distinct from canonical ADIF bands. |
| Scanner and Hunter | `src/scanAudio.js`, `src/ssbHunter.js`, scan handling in `src/server.js`, and `public/ssb-hunter.*`: audio detection, adaptation, sweep, refinement, peak/hold, and browser display. |
| Logging and spots | `src/qrz.js`, `src/pota.js`, `public/contact-log.*`, and `public/pota-spots.*`: normalization, outbound integration, display, and draft handoff. |
| Personalization | `public/station.js` reads optional ignored station settings. `src/localEnv.js` loads ignored QRZ config on the server. |
| Regression coverage | `test/*.test.js`: Node test runner, pure protocol and policy tests, audio analysis, band limits, QRZ and POTA parsing. |

There is no frontend build step. Browser files use native JavaScript
modules. Match the existing patterns before adding a dependency or
introducing new app architecture.

## Operating and Data Boundaries

- Keep the default service loopback-only and server/client checks
  same-origin. Do not add wildcard CORS, remote binds, public tunnels,
  or proxy trust to get a demo working. Network operation would be a
  separate security design, not a flag on the existing console.
- Keep serial ownership in the server, not in the browser. Treat radio
  gain write intent and radio readback as distinct; readback should not
  fight a drag, and focusing a slider must not disable later readback.
- Public POTA/QRZ responses and local/browser messages are data, not
  HTML or trusted instructions. Prefer text nodes or escaped content,
  fixed link origins, same-origin messages, and bounded numeric inputs.
- QRZ keys/passwords belong only in the ignored `.env.local` (or the
  existing session entry flow). Do not print them, send them to tools
  other than their intended service, commit them, or put them in screenshots.
- Keep CB/11 m records local, including add, edit, delete, import, batch
  paths, and any future logbook integration.
- Browser-stored records are tied to the origin and browser profile.
  `localhost`, `127.0.0.1`, and a different port have separate storage.
  Do not clear or migrate the operator's storage without approval.
- The Git repo is for source, tests, generic manuals, and vetted assets.
  Do not force-add station settings, live screenshots, exports, logs,
  serial IDs, recordings, firmware, device dumps, `.tmp/`, or `output/`.
  The workspace can contain unrelated radio projects.

## Validate Changes

```sh
npm ci
npm test
npm audit --omit=dev
node --check src/server.js
node --check public/app.js
```

Use `PORT=0 npm start` from a clean test copy for manual integration
checks; the printed URL includes the selected port. Do not press
Connect CAT in that test. Test UI/radio behavior with mocked CAT states,
including disconnected, connected, pending, manual tuning, and active
scan cases as relevant. Mock POTA/QRZ in browser and API tests. Inspect
desktop and narrow layouts for UI changes. Report what was exercised,
and distinguish simulated checks from real radio validation.

For any change touching the trust boundary, verify that foreign Host
headers and cross-origin browsers cannot reach the API or WebSocket,
and that legitimate localhost clients still work. For release work,
inspect the files actually staged and the reachable history, not just
`.gitignore`. Never make the source repo public or grant new access
without the owner's explicit request.

## Documentation and Handoff

- Update the owner manual when operator behavior, defaults, or controls
  change. Use official manufacturer, service, and FCC sources and
  distinguish a documented fact from a hardware assumption.
- Prefer small, reviewable changes. Add focused tests for new protocol
  and safety behavior, and mention any tests that could not be run.
- Treat hardware tests, a server restart, and repository release as
  separate actions. A clean deployment should not reconnect CAT or
  retune the rig by itself.
