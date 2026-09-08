# Angular 20 Upgrade Regressions Bugfix Design

## Overview

The Angular 16 → 20 upgrade of the PitStop UI moved authentication from a bespoke
token-in-`localStorage` scheme to `keycloak-angular` (`provideKeycloak` +
`includeBearerTokenInterceptor`) and migrated templates to the new control-flow blocks.
Three user-facing regressions on the incident overview screen came out of that upgrade:

1. **Live updates dead** — the `/api/updates` websocket never opens because
   `websocket.service.ts` still gates the connection on `localStorage.getItem("Authorization")`
   and passes that value as a WS subprotocol. Nothing writes `Authorization` to
   `localStorage` under the new Keycloak flow, so the guard always short-circuits.
2. **Close incident 404** — the trash button confirms "Close incident" and calls
   `POST /api/incidents/{incidentId}/close`. The backend endpoint exists in
   `PitStopApi.java`, yet the request returns 404 after the upgrade.
3. **Incident link does not navigate** — `[routerLink]="'incident/' + incident.incidentId"`
   points at a route (`incident/:incidentId`) that does not exist in
   `app-routing.module.ts`; the wildcard route redirects it back to the overview.

The fix strategy is deliberately minimal and independent per regression:

- **Bug 1**: source the websocket credential from the live Keycloak token instead of
  `localStorage`, keeping the existing subprotocol transport, anonymous suppression,
  JSON-patch cache application, and reconnection untouched.
- **Bug 2**: identify why the single `close` route 404s (all other commands on the same
  gateway succeed) and correct the route registration/wiring so the existing endpoint is
  reached, changing nothing about the request transport shared with the working commands.
- **Bug 3**: add the missing `incident/:incidentId` route wiring only — no new detail
  view — so navigation resolves instead of falling through to the wildcard redirect.

## Glossary

- **Bug_Condition (C)**: A signed-in incident-overview interaction that is broken by the
  upgrade — opening the updates websocket, receiving a live incident change, confirming
  "Close incident", or clicking the incident license-plate link.
- **Property (P)**: The desired behavior for a bug-condition input — websocket connects
  with the Keycloak token, the UI reflects the change live, the close request succeeds
  without 404, and the link navigates.
- **Preservation**: Behavior that must remain byte-for-byte identical for non-bug inputs —
  anonymous websocket suppression, bearer-token HTTP requests, JSON-patch cache
  application to `/api/incidents`, `/api/user`, `/api/operators`, websocket reconnection,
  existing route resolution, and backend message-level authorization/business rules.
- **`WebsocketService` (`ui/src/app/common/websocket.service.ts`)**: Generic websocket
  wrapper. `openWebsocket()` currently guards on `localStorage.getItem("Authorization")`
  and builds the WS subprotocol list from `localStorage`.
- **`HomeComponent` (`ui/src/app/views/home/home.component.ts`)**: Owns the
  `WebsocketService` instance and calls `socketService.initialise("api/updates", ...)`
  after `/api/user` resolves. Already injects `Keycloak`.
- **`includeBearerTokenInterceptor` / `provideKeycloak`**: The `keycloak-angular` wiring in
  `app.module.ts` that now attaches `Bearer` tokens to matching `/api` HTTP requests. WS
  connections do **not** pass through Angular's `HttpClient`, so this interceptor never
  touches the updates socket.
- **`Keycloak` (`keycloak-js`)**: Injectable instance exposing `token` and
  `updateToken(minValidity)` for the current access token.
- **`RequestGateway.doSend` (`ui/src/app/common/request-gateway.ts`)**: Builds command/query
  URLs and (legacy) copies `Authorization`/`X-Impersonation` from `localStorage` into
  headers. Used by both the working `accept` command and the failing `close` command.
- **`PitStopApi` (`src/main/java/.../pitstop/PitStopApi.java`)**: `@Path("/api")` class whose
  `@HandlePost("incidents/{incidentId}/close")` method is the target close endpoint.
- **`UiUpdater` (`src/main/java/.../web/UiUpdater.java`)**: `@HandleSocketOpen("/api/updates")`
  + `@RequiresUser`; authorizes the socket from the request's `Authorization` and streams
  JSON-patch `UiUpdate`s per subscribed user.

## Bug Details

### Bug Condition

The composite bug manifests for a signed-in incident-overview interaction `X` that is one
of: opening the updates websocket, an incident changing while the overview is open,
confirming "Close incident", or clicking the incident `routerLink`. In each case the
Angular 20 / Keycloak upgrade broke a piece of wiring that used to work:

- **Websocket**: `openWebsocket()` returns early because `localStorage.getItem("Authorization")`
  is null under the Keycloak flow, so `new WebSocket(...)` is never called; live updates
  therefore never arrive and the cache is never patched.
- **Close**: `POST /api/incidents/{incidentId}/close` resolves to 404 despite the endpoint
  existing, while sibling commands (`report`, `offer`, `accept`) on the same gateway succeed.
- **Navigation**: the router has no `incident/:incidentId` route, so the click matches
  `**` → `''` and lands back on the overview.

**Formal Specification:**
```
FUNCTION isBugCondition(X)
  INPUT: X, a signed-in incident-overview interaction
  OUTPUT: boolean

  RETURN
       (X.action = OPEN_UPDATES_WEBSOCKET AND X.userAuthenticated = true)
    OR (X.action = INCIDENT_CHANGED_WHILE_OVERVIEW_OPEN)
    OR (X.action = CONFIRM_CLOSE_INCIDENT)
    OR (X.action = CLICK_INCIDENT_ROUTERLINK)
END FUNCTION
```

### Examples

- **Websocket**: User signs in via Keycloak, opens the overview. Expected: `/api/updates`
  connects using the Keycloak token. Actual: `openWebsocket()` sees no `localStorage`
  `Authorization`, returns immediately, socket never opens.
- **Live update**: Another user reports an incident while the overview is open. Expected:
  the new incident appears without reload (JSON patch applied to `/api/incidents`). Actual:
  nothing arrives (socket is closed), list only updates on manual refresh.
- **Close**: User clicks trash → confirms "Close incident". Expected: `POST
  /api/incidents/{id}/close` succeeds (204) and the card reflects closure. Actual: HTTP 404
  and an error alert.
- **Navigation (edge)**: User clicks the license-plate link `incident/{incidentId}`.
  Expected: navigation to the incident route. Actual: silent redirect back to the overview
  via `**` → `''`.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Signed-out users (no valid Keycloak session) must CONTINUE to skip opening the
  `/api/updates` websocket rather than connecting anonymously (bugfix 3.1).
- Authenticated HTTP requests (`GET /api/incidents`, `POST /api/incidents`,
  `POST /api/incidents/{id}/offers`, `POST /api/incidents/{id}/offers/{offerId}/accept`)
  must CONTINUE to attach the Keycloak bearer token and succeed as before (bugfix 3.2).
- On an `Incident`, `UserProfile`, or `Operator` update, the JSON patch must CONTINUE to be
  applied to the correct query cache (`/api/incidents`, `/api/user`, `/api/operators`)
  exactly as today (bugfix 3.3).
- On unexpected websocket drop, the service must CONTINUE to retry reconnecting on the
  existing schedule (5s after a non-clean close; 60s after a failed open) (bugfix 3.4).
- Navigating to `''` or any currently defined route must CONTINUE to resolve and render the
  incident overview (bugfix 3.5).
- Backend command/query processing must CONTINUE to enforce message-level authorization and
  existing business rules unchanged (bugfix 3.6).

**Scope:**
All inputs where `isBugCondition(X)` is false must be completely unaffected by this fix,
including:
- Mouse-click / non-affected HTTP interactions that already work (report, offer, accept).
- Signed-out websocket suppression.
- Cache-patch handlers in `app.component.ts` and reconnection timers in
  `websocket.service.ts` (their logic must not change).
- All other routes and route guards/resolvers.

> The concrete expected correct behavior for bug-condition inputs is defined in the
> Correctness Properties section (Property 1). This section defines only what must NOT change.

## Hypothesized Root Cause

### Bug 1 — Websocket live updates (root cause confirmed from code)

`websocket.service.ts#openWebsocket()`:
```ts
if (!localStorage.getItem("Authorization")) {
  return; // signed out
}
const url = this.getUrl();
this.socket = new WebSocket(url, getProtocolFromHeaders("Authorization", "X-Impersonation"));
```
Under Angular 16 the app wrote the token to `localStorage["Authorization"]`. The Angular 20
upgrade replaced that with `provideKeycloak` + `includeBearerTokenInterceptor`, which keeps
the token inside the `Keycloak` (`keycloak-js`) instance and injects it only into `HttpClient`
requests. Two consequences:

1. **False "signed out" guard** — `localStorage.getItem("Authorization")` is always null, so
   the method returns before opening the socket. This is the dominant cause of the dead
   updates.
2. **Empty credential subprotocol** — even if the guard were removed,
   `getProtocolFromHeaders(...)` reads the same empty `localStorage`, so the backend
   `@HandleSocketOpen("/api/updates")` + `@RequiresUser` would reject the anonymous socket.

The backend still authorizes the socket from the request `Authorization` (see
`AuthenticationUtils.decode`, which strips `Bearer ` and decodes the JWT), and the transport
today carries credentials as WS subprotocol entries `[encode("Authorization"),
encode(headerValue)]`. The fix must feed the **current Keycloak token** into that same
subprotocol mechanism.

### Bug 2 — Close incident 404 (hypotheses; confirm via exploratory test)

Facts established from code:
- Frontend `closeIncident()` calls `sendCommand(\`/api/incidents/${id}/close\`, {})` — the
  same gateway, method (`post`), interceptor condition, and URL construction as the working
  `acceptOffer()` (`/api/incidents/{id}/offers/{offerId}/accept`).
- Backend `PitStopApi` is `@Path("/api")` with `@HandlePost("incidents/{incidentId}/close")`,
  structurally identical to the working `accept`/`offers` handlers.

Because the request transport is shared with commands that succeed, the interceptor, base
URL, and bearer token are ruled out as the cause. The remaining candidates, in priority
order, are:

1. **Backend route not registered / not matched for `close`** (primary hypothesis). The
   single `close` endpoint differs from `accept` only in its path segment; a stale build,
   an ordering/greediness interaction with the `@Path("/api/*") @HandleOptions` preflight
   handler, or a route-matching regression from the `io.flux-capacitor` → `io.fluxzero`
   migration could leave `incidents/{incidentId}/close` unmapped, producing a 404 while
   `accept` maps fine. Confirm by hitting the endpoint directly (curl/HTTP client) with a
   valid token, bypassing the UI.
2. **Path/segment mismatch** — a trailing-slash or encoding difference between the UI-built
   URL and the registered route pattern for `close` specifically.
3. **Preflight interaction** — the `@HandleOptions` CORS handler answering the `close`
   POST's preflight in a way that diverts the actual POST (less likely, since `accept`
   shares the preflight path).

The exploratory test (below) will confirm or refute hypothesis 1 first; the concrete fix in
"Fix Implementation" is written against that hypothesis and will be revised if the
exploratory step refutes it. In all cases the fix restores routing to the **existing**
endpoint — no change to `CloseIncident` business rules or authorization.

### Bug 3 — Incident link navigation (root cause confirmed from code)

`app-routing.module.ts` defines only:
```
'' (HomeComponent) -> children: [ '' -> IncidentOverviewComponent ]
'auth/callback' -> redirectTo ''
'**' -> redirectTo ''
```
There is no `incident/:incidentId` route, so `[routerLink]="'incident/' + incident.incidentId"`
resolves through `**` back to `''`. The user chose to fix only the navigation wiring with
**no new detail view**. The minimal fix adds an `incident/:incidentId` child route that
renders the existing overview (the destination the app already has), so the link resolves to
a real route instead of the wildcard redirect. The relative `routerLink` resolves under the
`''` host route, so the new route is added as a sibling child of the overview.

## Correctness Properties

Property 1: Bug Condition - Upgrade Regressions Are Fixed

_For any_ input where the bug condition holds (`isBugCondition` returns true), the fixed code
SHALL produce the corrected behavior for that action:
- `OPEN_UPDATES_WEBSOCKET` (authenticated) → the `/api/updates` websocket connects using the
  current Keycloak-issued token (credential sourced from the live `Keycloak` instance, not
  `localStorage`).
- `INCIDENT_CHANGED_WHILE_OVERVIEW_OPEN` → the JSON-patch `UiUpdate` is received over the
  socket and the incident list reflects the change live, without a manual reload.
- `CONFIRM_CLOSE_INCIDENT` → `POST /api/incidents/{incidentId}/close` reaches the existing
  backend endpoint and succeeds (no 404), and the incident is closed.
- `CLICK_INCIDENT_ROUTERLINK` → navigation to `incident/{incidentId}` resolves to a defined
  route instead of redirecting back to the overview.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Non-Bug Behavior Is Unchanged

_For any_ input where the bug condition does NOT hold (`isBugCondition` returns false), the
fixed code SHALL produce the same observable result as the pre-fix code, preserving:
anonymous websocket suppression, bearer-token HTTP requests for already-working commands and
queries, JSON-patch cache application to `/api/incidents`, `/api/user`, and `/api/operators`,
websocket reconnection scheduling, existing route resolution, and backend message-level
authorization and business rules.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming the root-cause analysis is correct (Bug 2 pending exploratory confirmation):

#### Bug 1 — Websocket authenticates via Keycloak

**File**: `ui/src/app/common/websocket.service.ts` (and its caller
`ui/src/app/views/home/home.component.ts`)

**Function**: `WebsocketService.openWebsocket` / `initialise`

**Specific Changes**:
1. **Replace the `localStorage` gate with a Keycloak-token gate.** Obtain the current token
   from the `Keycloak` instance. If there is no authenticated token, keep returning early so
   anonymous users still do not connect (preserves 3.1).
2. **Build the credential subprotocol from the Keycloak token**, not `localStorage`. Keep the
   existing subprotocol transport shape (`[encodeURIComponent("Authorization"),
   encodeURIComponent("Bearer " + token)]`) so the backend `@HandleSocketOpen` +
   `AuthenticationUtils.decode` (which strips `Bearer `) authorizes the session exactly as
   for HTTP. Preserve the optional `X-Impersonation` entry only if such a value still exists.
3. **Refresh the token before (re)connecting.** Since `openWebsocket()` is also the
   reconnection entry point, call `keycloak.updateToken(minValidity)` (or read the current
   `keycloak.token`) at connect time so reconnects after a token refresh use a valid token.
4. **Inject `Keycloak` into the service** (or pass a token-provider callback from
   `HomeComponent`, which already injects `Keycloak`). Prefer injecting `Keycloak` directly
   to keep the change local to the service; the token lookup must be async-safe if
   `updateToken` is used (wrap the connect in the resolved token).
5. **Leave untouched**: `subscribeToSocket`, `onMessageReceived`, `onSocketClose`
   (reconnect timer), `onSocketOpen`, `ngOnDestroy`, and the `getUrl()` derivation — so
   message parsing, cache patching (in `app.component.ts`), and reconnection behavior are
   preserved (3.3, 3.4).

#### Bug 2 — Close incident reaches the existing endpoint

**File**: primarily `src/main/java/com/example/app/pitstop/PitStopApi.java` (backend
route), with the frontend `closeIncident()` call left unchanged unless the exploratory test
shows a UI-side path defect.

**Function**: `PitStopApi.closeIncident` route mapping (and, if refuted, the
`incident-overview-item.component.ts#closeIncident` URL).

**Specific Changes** (against the primary hypothesis — restore the missing/mismatched route):
1. **Confirm the registered path** for `incidents/{incidentId}/close` matches the URL the UI
   sends, mirroring the working `accept` handler exactly (same `@Path`/`@HandlePost` segment
   style, same `@PathParam` binding).
2. **Correct the route wiring** so the close POST resolves to `PitStopApi.closeIncident`
   (e.g. align the `@HandlePost` path segment / annotation with the working sibling handlers
   if a discrepancy is found), producing a 2xx instead of 404.
3. **Do not change** `CloseIncident` command semantics, `@AssertLegal` rules, or
   authorization — only the route so the request lands (3.6 preserved).
4. **If the exploratory test refutes the backend hypothesis** (direct call to the endpoint
   with a valid token succeeds), re-hypothesize on the UI side: verify the exact URL string
   built for `close` versus `accept` and correct any UI-side path defect only.
5. **Rebuild** the backend (`mvn` build regenerates TS models and recompiles handlers) so a
   stale route registration cannot mask the fix.

#### Bug 3 — Add the missing incident route (no new view)

**File**: `ui/src/app/app-routing.module.ts`

**Function**: `routes` definition

**Specific Changes**:
1. **Add an `incident/:incidentId` child route** under the `''` host route (sibling of the
   overview child) that renders the existing `IncidentOverviewComponent` (or the intended
   existing destination), so the relative `routerLink` resolves to a defined route.
2. **Keep the child added before `**`** so it takes precedence over the wildcard redirect.
3. **No new component** is introduced (per the user's choice); reuse the existing overview so
   the click resolves rather than silently redirecting.
4. **Leave `''`, `auth/callback`, and `**`** and the `canActivateAuthRole` guard /
   `userProfileResolver` untouched so existing route resolution is preserved (3.5).

## Testing Strategy

> Environment note: do not start long-running dev servers/watchers in automated steps. Use
> single-run test commands (`ng test` with a non-watch configuration, `mvn test`) or ask the
> user to run the app/UI. Backend behavior is exercised with `TestFixture` per project
> convention; the close endpoint can be probed with the repo's HTTP client
> (`http-client.env.json`) against a locally running app.

### Validation Approach

Two phases: first surface counterexamples that demonstrate each regression on the current
(unfixed) code and confirm/refute the root-cause hypotheses; then verify each fix works and
that non-bug behavior is preserved.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples on the UNFIXED code to demonstrate the bugs and confirm or
refute the hypotheses. If a hypothesis is refuted (notably Bug 2), re-hypothesize before
implementing.

**Test Plan**: Drive each bug-condition action and observe the failure at its true layer —
websocket connect logic, the close HTTP request, and router navigation.

**Test Cases**:
1. **Websocket gate test**: With `localStorage["Authorization"]` unset but a valid Keycloak
   session, invoke `WebsocketService.initialise("api/updates", ...)` and assert `new
   WebSocket` is never constructed (spy on the socket factory). (Will fail-to-connect on
   unfixed code — demonstrates the false "signed out" guard.)
2. **Live-update test**: With the socket closed (unfixed), simulate an incoming `Incident`
   `UiUpdate` and assert the `/api/incidents` cache is never patched because no message
   arrives. (Demonstrates dead live updates on unfixed code.)
3. **Close 404 test (UI)**: Trigger `closeIncident()` and assert the outgoing request targets
   `/api/incidents/{id}/close`; capture the 404 response. (Will fail on unfixed code.)
4. **Close 404 test (direct backend)**: Issue `POST /api/incidents/{id}/close` with a valid
   token directly against the running backend (HTTP client / `TestFixture`), bypassing the
   UI. If it 404s → confirms the backend-route hypothesis; if it succeeds → refutes it and
   the defect is UI-side (re-hypothesize).
5. **Navigation test**: Navigate to `incident/{someId}` on the unfixed router and assert the
   resolved URL falls back to `''` (wildcard redirect) rather than an `incident/...` route.
   (Will fail on unfixed code.)

**Expected Counterexamples**:
- Websocket: no `WebSocket` constructed while authenticated; cache never patched.
- Close: HTTP 404 from `/api/incidents/{id}/close`; the direct-backend probe pinpoints the
  layer (backend route vs UI path).
- Navigation: `incident/{id}` resolves to `''`.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed code produces
the expected behavior.

**Pseudocode:**
```
FOR ALL X WHERE isBugCondition(X) DO
  result := fixedBehavior(X)
  ASSERT
    (X.action = OPEN_UPDATES_WEBSOCKET
       => websocket_connects_with_keycloak_token(result))
    AND (X.action = INCIDENT_CHANGED_WHILE_OVERVIEW_OPEN
       => ui_reflects_change_live(result))
    AND (X.action = CONFIRM_CLOSE_INCIDENT
       => close_request_succeeds_no_404(result))
    AND (X.action = CLICK_INCIDENT_ROUTERLINK
       => navigation_occurs(result))
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed code
produces the same result as the original code.

**Pseudocode:**
```
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT originalBehavior(X) = fixedBehavior(X)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation because it
generates many inputs across the domain, catches edge cases manual tests miss, and gives a
strong guarantee that non-bug behavior is unchanged. Capture the current (unfixed) behavior
for non-bug inputs first, then assert the fixed code matches it.

**Test Plan**: Observe behavior on UNFIXED code for signed-out websocket suppression,
already-working HTTP commands/queries, cache-patch application, reconnection scheduling, and
existing routes; then encode that behavior as tests that must still pass after the fix.

**Test Cases**:
1. **Signed-out suppression**: Observe that with no Keycloak session `initialise` opens no
   socket on unfixed code; assert it still opens none after the fix (3.1).
2. **Working HTTP commands/queries**: Observe `report`/`offer`/`accept`/`getIncidents`
   succeed with a bearer token on unfixed code; assert unchanged after the fix (3.2).
3. **Cache-patch application**: Observe that a delivered `Incident`/`UserProfile`/`Operator`
   `UiUpdate` patches the correct cache; assert the `app.component.ts` handlers behave
   identically after the fix (3.3).
4. **Reconnection scheduling**: Observe the 5s reconnect on non-clean close and 60s retry on
   failed open; assert timers are unchanged after the fix (3.4).
5. **Existing routes**: Observe `''`, `auth/callback`, and `**` resolution (guard + resolver)
   on unfixed code; assert unchanged after adding `incident/:incidentId` (3.5).
6. **Backend authorization/business rules**: Observe `TestFixture` command/query auth and
   `@AssertLegal` outcomes for close/accept on unfixed code; assert unchanged after the route
   fix (3.6).

### Unit Tests

- `WebsocketService`: token gate (connect only when a Keycloak token exists), subprotocol
  built from the Keycloak token with `Bearer ` prefix, early-return when unauthenticated,
  reconnect timer unchanged.
- `IncidentOverviewItemComponent.closeIncident`: issues a POST to
  `/api/incidents/{id}/close` (URL assertion).
- Routing: `incident/:incidentId` resolves to a defined route; `''` and `**` unchanged.
- Backend (`TestFixture.create(PitStopApi.class)` with a fixed clock): `CloseIncident`
  succeeds for an open incident, is rejected when already closed / end-before-start, and
  enforces authorization — confirming the route reaches the handler.

### Property-Based Tests

- Preservation of cache patching: for randomized `UiUpdate` payloads (varied ids/patches
  across `Incident`/`UserProfile`/`Operator`), the post-fix cache result equals the pre-fix
  result.
- Preservation of websocket gating: for randomized auth states, the connect/skip decision
  after the fix matches the intended rule (skip iff no Keycloak token) and never connects
  when unauthenticated.
- Preservation of routing: for randomized paths that are not `incident/:incidentId`,
  resolution after the fix equals resolution before the fix.

### Integration Tests

- Full live-update flow: sign in (Keycloak), open overview, report an incident from another
  session, assert the card appears without reload (socket + patch end-to-end).
- Close flow: open overview, confirm "Close incident", assert 2xx and the card reflects
  closure with no 404 and no error alert.
- Navigation flow: click the license-plate link and assert the router navigates to
  `incident/{incidentId}` rather than redirecting to the overview via `**`.
