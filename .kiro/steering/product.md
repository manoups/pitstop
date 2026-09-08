# Product Overview

PitStop is a roadside assistance web application built as a training project for the
Flux (fluxzero) Foundations course. It demonstrates event-driven / CQRS patterns using
the Fluxzero Java SDK.

## Domain

- **Users** report incidents with their vehicle (e.g. breakdown at a location).
- **Operators** (service providers) offer assistance for a reported incident.
- The reporting user (or an admin) **accepts** exactly one offer.
- Incidents can be **closed**, manually or automatically after 24h.
- **Reference data** (vehicles via RDW, locations/geocoding via Mapbox, operators)
  supports the core flow.
- A default fallback operator (**AAA**) provides assistance when no suitable offer exists.

## Core Features

- Report incident
- Get incidents (scoped to the reporter, admins see all)
- Offer assistance (operator role required)
- Accept an offer (reporter or admin, only one offer per incident)
- Close incident (manual + scheduled auto-close)
- Categorization, operator voting, and operator performance reports (advanced)

## Key Behavior Rules

- Commands are validated synchronously (accept/reject) but processed asynchronously.
- Processing outcomes reach the UI through a websocket channel (`/api/updates`) that
  streams JSON-patch diffs of changed aggregates, filtered per authenticated user.
- Access control is enforced at the message (command/query) level via roles.
- REST payload objects (in `api` packages) must not be structurally changed, as the
  Angular UI depends on their generated TypeScript models.
