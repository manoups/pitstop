# Tech Stack & Build

## Backend

- **Java 24** (toolchain), **Spring Boot 3.5.x** (`spring-boot-starter-parent`).
- **Fluxzero SDK** (`io.fluxzero`, BOM-managed, currently 1.144.0) for CQRS, event
  sourcing, message handling, web endpoints, and websockets. This is the core framework,
  not plain Spring MVC.
- **Lombok** for boilerplate (`@Value`, `@Builder`, `@Singular`, `@With`, `@Slf4j`).
  Lombok + the Fluxzero SDK are configured as annotation processors.
- **Auth0 java-jwt / jwks-rsa** for JWT verification (Keycloak-issued tokens).
- **zjsonpatch** for computing JSON-patch diffs pushed to the UI.
- Build produces TypeScript models from `com.example.app.**.api.**` classes via the
  `typescript-generator-maven-plugin`, packaged as an npm tarball consumed by the UI.

## Frontend

- **Angular 20** app in `/ui`, using `angular-oauth2-oidc` + `keycloak-angular` for auth,
  `mapbox-gl` / `ngx-mapbox-gl` for maps, Bootstrap 5, RxJS, `fast-json-patch`.
- Consumes generated backend models from `@pitstop/typescriptmodels`
  (built from the Maven `target/typescript-generator` tarball).

## Common Commands

Backend (from repo root):

- Build + generate TS models + run tests: `mvn clean install`
- Run tests only: `mvn test`
- Run the app: via the `App` main class or IntelliJ run configs in `.run/`.

Frontend (from `/ui`):

- Install: `npm install` (or `./install-all.sh`)
- Dev server: `ng serve` (`npm start`)
- Build: `ng build` (`npm run build`)
- Test: `ng test`

Local infra lives in `/local` and is started with the compose file there (also
provisions an OpenSearch dashboard on `localhost:5601`).

## Configuration

- `src/main/resources/application.properties` holds Keycloak, JWK, RDW, Mapbox, and AAA
  endpoints.
- `application-local.properties` (git-ignored, supplied separately) holds local secrets.
- The `rewrite.yml` OpenRewrite recipe exists to migrate legacy `io.flux-capacitor`
  packages to `io.fluxzero`; do not reintroduce the old naming.

## Environment Notes

- Do not start long-running processes (dev servers, watchers) in automated steps; ask
  the user to run them or use single-run test commands.
