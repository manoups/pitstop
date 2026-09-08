# Project Structure & Conventions

## Layout

```
/src/main/java/com/example/app
  App.java                 # Spring Boot entry point
  pitstop/                 # core incident/offer domain
    PitStopApi.java        # REST endpoints (@Path, @HandleGet/@HandlePost)
    api/                   # aggregates + payloads (Incident, Offer, *Id, *Details)
    command/               # commands (ReportIncident, OfferAssistance, ...)
    query/                 # queries (GetIncidents)
  refdata/                 # reference data + external integrations
    rdw/                   # vehicle lookup (RDW open data)
    mapbox/                # geocoding
    api/                   # operator model, queries, commands
  user/                    # user mgmt + authentication
    api/                   # UserProfile, commands, queries
    authentication/        # roles, JWT, Sender, RequiresRole
  web/                     # websocket UI updates (UiUpdater, UiUpdate)
/src/main/resources        # application.properties, seed json, logback
/src/test/java             # behavioral tests per module
/src/test/resources        # JSON command/query/result fixtures
/ui                        # Angular 20 frontend
/local                     # local docker infra + Keycloak realm
```

## Package Convention

Each functional area (`pitstop`, `refdata`, `user`) follows a CQRS split:

- `api/` — aggregates (`@Aggregate`) and REST-facing value objects. Any class under
  `**.api.**` is exported to TypeScript, so treat these as a stable contract.
- `command/` — command records that mutate aggregates.
- `query/` — query records that read aggregates / search state.

## Coding Patterns

- **Aggregates**: immutable Lombok `@Value` + `@Builder(toBuilder = true)`, annotated
  `@Aggregate(searchable = true)`. Nested entities use `@Member` (+ `@Singular` lists).
- **Commands**: prefer Java `record`s implementing a shared command interface
  (e.g. `IncidentCommand`) and, when they return a value, `Request<T>`.
  - The command interface carries a default `@HandleCommand` that loads the aggregate and
    calls `assertAndApply(this)`; individual commands supply `@Apply` methods that return
    the new aggregate state.
  - Validation/business rules go in `@AssertLegal` methods, throwing
    `IllegalCommandException` for rule violations; use `jakarta.validation` annotations
    (`@NotNull`, etc.) for structural validation (surfaces as `ValidationException`).
  - `IncidentUpdate` extends the base command to assert the aggregate already exists.
- **Queries**: records implementing `Request<T>` with a `@HandleQuery` method; use
  `Fluxzero.search(...)` for read models.
- **IDs / value objects**: dedicated types (`IncidentId`, `OfferId`, ...) with factory
  methods like `newValue()`; do not use raw strings.
- **Identity & auth**: inject `Sender` into handlers for the current user; gate access
  with `@RequiresRole(Role.operator)` / `@RequiresUser`. Never bypass message-level auth.
- **Time**: obtain "now" from `Fluxzero.currentTime()`, never `Instant.now()`, so tests
  with a fixed clock stay deterministic.
- **External calls**: wrap integrations as `@LocalHandler` query handlers (see
  `RdwHandler`, `MapboxHandler`) issuing `SendWebRequest`-style queries.

## Testing Conventions

- Use `TestFixture.create(PitStopApi.class)` with a fixed `Clock` for determinism.
- Follow given/when/then: `givenCommands(...)` / `whenCommand(...)` / `whenQuery(...)`,
  then `expectNoErrors()`, `expectOnlyEvents(...)`, `expectResult(...)`,
  `expectExceptionalResult(...)`.
- Prefer JSON fixtures in `src/test/resources` (loaded via `JsonUtils.fromFile` /
  fixture path strings) over inline object construction where practical.
- Use `whenCommandByUser` / `whenQueryByUser` with `Sender` builders to test role and
  ownership rules. Every new feature needs accompanying behavioral tests.

## Do / Don't

- Do keep new domain areas in their own `api`/`command`/`query` sub-packages.
- Do keep REST payloads backward compatible (the UI depends on generated models).
- Don't reintroduce `io.flux-capacitor` / `FluxCapacitor` naming (migrated to fluxzero).
- Don't put business rules in the REST layer; keep them in commands via `@AssertLegal`.
