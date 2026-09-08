# Bugfix Requirements Document

## Introduction

After upgrading the PitStop Angular UI from Angular 16 to Angular 20 (which also
migrated authentication to `keycloak-angular` / `provideKeycloak` and moved template
syntax to the new control-flow blocks), three user-facing regressions appeared in the
incident overview screen. All three were reported together immediately after the upgrade:

1. **Live incident updates over the websocket stopped working.** Newly reported
   incidents no longer appear in the UI without a manual refresh, even though the backend
   still streams JSON-patch diffs on the `/api/updates` websocket channel
   (`web/UiUpdater.java`).
2. **Closing an incident returns HTTP 404.** The trash button on an incident card opens a
   "Close incident" confirmation whose confirm action calls
   `POST /api/incidents/{incidentId}/close`, but that request now fails with a 404
   (the backend endpoint exists in `pitstop/PitStopApi.java`).
3. **The incident title link does not navigate.** Clicking the license-plate link built
   with `[routerLink]="'incident/' + incident.incidentId"` in
   `incident-overview-item.component.html` does not take the user to the incident view.

This document describes the defective behavior, the expected behavior, and the existing
behavior that must be preserved. The technical root-cause analysis and the concrete fixes
belong to the design phase.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user is signed in via Keycloak and the UI opens the `/api/updates` websocket THEN the system does not establish the websocket connection, because the connection is gated on an `Authorization` value in `localStorage` that the new Keycloak-based auth flow no longer sets.

1.2 WHEN an incident is reported (by the current user or another user) while the overview screen is open THEN the system does not push the new/updated incident to the UI live, so the incident list only changes after a manual reload.

1.3 WHEN the user clicks the trash/close control on an incident card and confirms "Close incident" THEN the system issues `POST /api/incidents/{incidentId}/close` and receives an HTTP 404 response, so the incident is not closed and an error is surfaced.

1.4 WHEN the user clicks the incident license-plate link (`routerLink` = `incident/{incidentId}`) THEN the system does not navigate to the incident view and the user stays on (or is redirected back to) the incident overview.

### Expected Behavior (Correct)

2.1 WHEN a user is signed in via Keycloak and the UI opens the `/api/updates` websocket THEN the system SHALL authenticate the websocket using the current Keycloak-issued token and establish the connection.

2.2 WHEN an incident is reported or updated while the overview screen is open THEN the system SHALL receive the JSON-patch update over the websocket and reflect the new/updated incident in the UI live, without a manual reload.

2.3 WHEN the user clicks the trash/close control on an incident card and confirms "Close incident" THEN the system SHALL successfully invoke the existing close endpoint (`POST /api/incidents/{incidentId}/close`), close the incident, and reflect the change in the UI without a 404.

2.4 WHEN the user clicks the incident license-plate link (`routerLink` = `incident/{incidentId}`) THEN the system SHALL navigate to the intended incident route rather than silently staying on the overview.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user is not signed in (no valid Keycloak session) THEN the system SHALL CONTINUE TO skip opening the `/api/updates` websocket rather than connecting anonymously.

3.2 WHEN authenticated HTTP requests are sent (e.g. `GET /api/incidents`, `POST /api/incidents`, `POST /api/incidents/{id}/offers`, `POST /api/incidents/{id}/offers/{offerId}/accept`) THEN the system SHALL CONTINUE TO attach the Keycloak bearer token and succeed as before.

3.3 WHEN the websocket receives an `Incident`, `UserProfile`, or `Operator` update THEN the system SHALL CONTINUE TO apply the JSON patch to the correct query cache (`/api/incidents`, `/api/user`, `/api/operators`) exactly as it does today.

3.4 WHEN the websocket connection drops unexpectedly THEN the system SHALL CONTINUE TO retry reconnecting on the existing schedule.

3.5 WHEN the user navigates to the root route (`''`) or any currently defined route THEN the system SHALL CONTINUE TO resolve and render the incident overview as it does today.

3.6 WHEN backend commands and queries are processed THEN the system SHALL CONTINUE TO enforce message-level authorization and existing business rules unchanged.

## Bug Condition and Properties

The three regressions share a trigger context (the state of the app after the Angular 20 /
Keycloak upgrade) but have independent conditions. They are captured as a single
composite bug condition over the relevant input/interaction `X`.

```pascal
FUNCTION isBugCondition(X)
  INPUT: X describing a signed-in user interaction on the incident overview
  OUTPUT: boolean

  RETURN
    // Bug 1: websocket for live updates
    (X.action = OPEN_UPDATES_WEBSOCKET AND X.userAuthenticated = true)
    OR
    (X.action = INCIDENT_CHANGED_WHILE_OVERVIEW_OPEN)
    // Bug 2: close incident
    OR (X.action = CONFIRM_CLOSE_INCIDENT)
    // Bug 3: incident link navigation
    OR (X.action = CLICK_INCIDENT_ROUTERLINK)
END FUNCTION
```

**Definitions**
- **F**: the UI/behavior as it exists after the Angular 20 upgrade (the buggy version).
- **F'**: the UI/behavior after the fix.

```pascal
// Property: Fix Checking
FOR ALL X WHERE isBugCondition(X) DO
  result <- F'(X)
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

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
END FOR
```

This preservation property covers the unchanged behaviors in section 3: anonymous
websocket suppression, authenticated HTTP requests, JSON-patch cache application,
reconnection, existing route resolution, and backend authorization/business rules.
