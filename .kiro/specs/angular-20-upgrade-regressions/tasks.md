# Implementation Plan

> Environment note: do NOT start long-running dev servers/watchers in automated steps.
> Use single-run test commands (`ng test` with a non-watch configuration, e.g.
> `ng test --watch=false --browsers=ChromeHeadless`, and `mvn test`) or ask the user to
> run the app/UI. The direct backend close probe can use the repo HTTP client
> (`http-client.env.json`) against a locally running app or a `TestFixture` test.

- [x] 1. Write bug condition exploration tests (BEFORE any fix)
  - **Property 1: Bug Condition** - Upgrade Regressions Are Fixed
  - **CRITICAL**: These tests MUST FAIL / surface counterexamples on the unfixed code - the failures confirm the regressions exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: These tests encode the expected behavior - they validate the fixes once they pass after implementation
  - **GOAL**: Surface counterexamples for each bug-condition action and confirm/refute the root-cause hypotheses (especially Bug 2, whose backend-route cause is a pending hypothesis)
  - **Scoped PBT Approach**: These are deterministic regressions; scope each property to the concrete failing interaction (authenticated websocket open, close POST, `incident/:incidentId` navigation) for reproducibility
  - Bug 1 websocket gate test (`WebsocketService`): with `localStorage["Authorization"]` unset but a valid Keycloak session, invoke `initialise("api/updates", ...)` and spy on the socket factory; assert `new WebSocket` is never constructed. EXPECTED: fails to connect (false "signed out" guard from `localStorage.getItem("Authorization")`).
  - Bug 1 live-update test: with the socket closed on unfixed code, simulate an incoming `Incident` `UiUpdate` and assert the `/api/incidents` cache is never patched because no message arrives. EXPECTED: no patch (dead live updates).
  - Bug 2 close 404 test (UI, `IncidentOverviewItemComponent.closeIncident`): trigger `closeIncident()` and assert the outgoing request targets `POST /api/incidents/{id}/close`; capture the 404. EXPECTED: 404.
  - Bug 2 close 404 test (direct backend, PRIORITY - hypothesis confirmation): issue `POST /api/incidents/{id}/close` with a valid token directly against the running backend via the HTTP client (`http-client.env.json`) or a `TestFixture.create(PitStopApi.class)` route probe, bypassing the UI. If it 404s → confirms the backend-route hypothesis; if it succeeds → refutes it (defect is UI-side, re-hypothesize before task 4).
  - Bug 3 navigation test (`app-routing.module.ts`): navigate to `incident/{someId}` on the unfixed router and assert the resolved URL falls back to `''` via the `**` wildcard rather than an `incident/...` route. EXPECTED: wildcard redirect to `''`.
  - Run tests on UNFIXED code (`ng test --watch=false`, `mvn test` for the backend probe)
  - **EXPECTED OUTCOME**: Tests FAIL / surface the counterexamples (this is correct - it proves the bugs exist)
  - Document counterexamples found: no `WebSocket` constructed while authenticated; cache never patched; HTTP 404 from `/api/incidents/{id}/close` and which layer the direct probe pinpoints; `incident/{id}` resolves to `''`
  - Mark complete when tests are written, run, failures documented, and the Bug 2 hypothesis is confirmed or refuted
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_

- [ ] 2. Write preservation property tests (BEFORE implementing fixes)
  - **Property 2: Preservation** - Non-Bug Behavior Is Unchanged
  - **IMPORTANT**: Follow observation-first methodology - record behavior on UNFIXED code, then assert the fixed code matches
  - Observe & assert (3.1) signed-out suppression: with no Keycloak session, `initialise` opens no socket on unfixed code; encode a property over randomized unauthenticated states asserting no socket is ever opened.
  - Observe & assert (3.2) working HTTP commands/queries: `report`/`offer`/`accept`/`getIncidents` succeed with the Keycloak bearer token on unfixed code; assert the request wiring (bearer attach, URL construction) is unchanged.
  - Observe & assert (3.3) cache-patch application: a delivered `Incident`/`UserProfile`/`Operator` `UiUpdate` patches the correct cache (`/api/incidents`, `/api/user`, `/api/operators`); property-based test over randomized `UiUpdate` payloads asserting post-fix cache result equals pre-fix result (`app.component.ts` handlers).
  - Observe & assert (3.4) reconnection scheduling: 5s reconnect on non-clean close, 60s retry on failed open; assert timers unchanged.
  - Observe & assert (3.5) existing routes: `''`, `auth/callback`, and `**` resolution (with `canActivateAuthRole` guard + `userProfileResolver`); property-based test over randomized paths that are NOT `incident/:incidentId` asserting resolution is unchanged.
  - Observe & assert (3.6) backend authorization/business rules: `TestFixture.create(PitStopApi.class)` with a fixed clock - `CloseIncident`/`AcceptOffer` auth and `@AssertLegal` outcomes are unchanged.
  - Run tests on UNFIXED code (`ng test --watch=false`, `mvn test`)
  - **EXPECTED OUTCOME**: Tests PASS (this confirms the baseline behavior to preserve)
  - Mark complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Fix Bug 1 - Websocket authenticates via the Keycloak token

  - [ ] 3.1 Source the websocket credential from Keycloak instead of localStorage
    - In `ui/src/app/common/websocket.service.ts#openWebsocket`: replace the `localStorage.getItem("Authorization")` gate with a Keycloak-token gate; return early (no connect) when there is no authenticated token so anonymous users still do not connect
    - Build the credential subprotocol from the Keycloak token, keeping the existing transport shape `[encodeURIComponent("Authorization"), encodeURIComponent("Bearer " + token)]`; preserve the optional `X-Impersonation` entry only if such a value still exists
    - Refresh the token before (re)connecting: call `keycloak.updateToken(minValidity)` (or read current `keycloak.token`) at connect time so reconnects use a valid token; wrap the connect in the resolved token (async-safe)
    - Inject `Keycloak` into `WebsocketService` (preferred) or pass a token-provider from `ui/src/app/views/home/home.component.ts` (which already injects `Keycloak`); update the `initialise(...)` call site accordingly
    - Leave `subscribeToSocket`, `onMessageReceived`, `onSocketClose` (reconnect timer), `onSocketOpen`, `ngOnDestroy`, and `getUrl()` untouched
    - _Bug_Condition: isBugCondition(X) where X.action = OPEN_UPDATES_WEBSOCKET AND X.userAuthenticated = true (also INCIDENT_CHANGED_WHILE_OVERVIEW_OPEN)_
    - _Expected_Behavior: websocket_connects_with_keycloak_token(result) AND ui_reflects_change_live(result)_
    - _Preservation: anonymous websocket suppression (3.1), cache-patch application (3.3), reconnection scheduling (3.4)_
    - _Requirements: 2.1, 2.2_

- [ ] 4. Fix Bug 2 - Close incident reaches the existing endpoint

  - [ ] 4.1 Fix the Angular dev-server proxy so nested API POSTs reach PitStopApi.closeIncident
    - Root cause (task 1's direct-backend probe REFUTED the backend-route hypothesis): a direct `POST http://localhost:8080/api/incidents/{id}/close` succeeds against `PitStopApi.closeIncident`, but the same request through the Angular dev server on `http://localhost:4200` returns 404. Under Angular 20 (`@angular/build` 20.3.x, http-proxy-middleware v3 / Vite dev server) the proxy pattern `/api/*` matches only a SINGLE path segment, so `/api/incidents` matches while nested paths (`/api/incidents/{id}/close`, `/api/incidents/{id}/offers`, `/api/incidents/{id}/offers/{offerId}/accept`) fall through to the SPA and 404. The old webpack proxy treated `/api/*` as a prefix; v3 does not - an Angular-upgrade proxy-glob regression.
    - Fix `ui/src/proxy.conf.json`: switch `/api/*` -> `/api/**` and `/search/geocode/*` -> `/search/geocode/**` so nested segments match recursively; keep the `/api/updates` entry (with `ws: true`) as its own key ABOVE `/api/**` so the websocket path keeps precedence. Do NOT change targets, `secure`, `changeOrigin`, `logLevel`, or the `ws` flag - only the match patterns.
    - Leave the backend untouched: `PitStopApi.closeIncident` route, `CloseIncident` command semantics, `@AssertLegal` rules, and message-level authorization are all correct as-is.
    - Leave the UI close CTA untouched: `IncidentOverviewItemComponent.closeIncident()` stays a plain `POST /api/incidents/{id}/close` with an empty body.
    - Verification: the proxy is a dev-server concern not exercised by `TestFixture`, so do NOT encode it in a backend test. Confirm the JSON is valid and run `mvn test` (backend suite, incl. the `CloseIncidentRouteTest` route probe that asserts the handler returns 2xx). Do NOT start `ng serve`; if live proxy validation is needed, the user should run `ng serve` and retry the close action.
    - _Bug_Condition: isBugCondition(X) where X.action = CONFIRM_CLOSE_INCIDENT_
    - _Expected_Behavior: close_request_succeeds_no_404(result)_
    - _Preservation: backend message-level authorization and business rules unchanged (3.6), bearer-token HTTP requests for working commands unchanged (3.2)_
    - _Requirements: 2.3_

- [ ] 5. Fix Bug 3 - Add the missing incident route (no new view)

  - [ ] 5.1 Add the incident/:incidentId route reusing the existing overview
    - In `ui/src/app/app-routing.module.ts`, add an `incident/:incidentId` child route under the `''` host route (sibling of the overview child) that renders the existing `IncidentOverviewComponent` - no new component
    - Keep the child added before `**` so it takes precedence over the wildcard redirect
    - Leave `''`, `auth/callback`, `**`, the `canActivateAuthRole` guard, and `userProfileResolver` untouched
    - _Bug_Condition: isBugCondition(X) where X.action = CLICK_INCIDENT_ROUTERLINK_
    - _Expected_Behavior: navigation_occurs(result) - resolves to a defined route instead of the wildcard redirect_
    - _Preservation: existing route resolution unchanged (3.5)_
    - _Requirements: 2.4_

- [ ] 6. Verify bug condition exploration tests now pass
  - **Property 1: Expected Behavior** - Upgrade Regressions Are Fixed
  - **IMPORTANT**: Re-run the SAME tests from task 1 - do NOT write new tests
  - The tests from task 1 encode the expected behavior; when they pass they confirm the fixes are correct
  - Websocket: `new WebSocket` IS constructed when a Keycloak session exists (with the `Bearer` token subprotocol); the incoming `Incident` `UiUpdate` patches the `/api/incidents` cache live
  - Close: `POST /api/incidents/{id}/close` returns 2xx (no 404) at the layer the fix targeted (backend route confirmed via `mvn test` / HTTP client probe; UI request unchanged unless refuted)
  - Navigation: `incident/{id}` resolves to the defined `incident/:incidentId` route instead of `''`
  - Run via `ng test --watch=false` and `mvn test`
  - **EXPECTED OUTCOME**: Tests PASS (confirms bugs are fixed)
  - _Requirements: 2.1, 2.2, 2.3, 2.4 (Property 1)_

- [ ] 7. Verify preservation tests still pass
  - **Property 2: Preservation** - Non-Bug Behavior Is Unchanged
  - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
  - Confirm signed-out suppression (3.1), working HTTP commands/queries (3.2), cache-patch application (3.3), reconnection scheduling (3.4), existing route resolution (3.5), and backend authorization/business rules (3.6) all still hold
  - Run via `ng test --watch=false` and `mvn test`
  - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6 (Property 2)_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Run the full frontend suite (`ng test --watch=false`) and backend suite (`mvn test`); optionally the full build (`mvn clean install`) to regenerate TS models
  - Optionally run the integration flows the design calls for (live-update, close, navigation) manually or ask the user to run the app/UI (no long-running processes in automated steps)
  - Ensure all tests pass; ask the user if questions arise
