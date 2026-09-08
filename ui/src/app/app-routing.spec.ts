import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideRouter, Router, Route} from '@angular/router';
import {routes as appRoutes, FluxHostRoute} from './app-routing.module';

/**
 * Bug 3 exploration test (bugfix spec: angular-20-upgrade-regressions, task 1).
 *
 * Encodes the EXPECTED (fixed) behavior: navigating to `incident/{id}` resolves to a defined
 * `incident/:incidentId` route rather than falling through the `**` wildcard redirect to ''.
 * EXPECTED TO FAIL on unfixed code (no such route exists → wildcard redirect to '').
 *
 * The real route table from app-routing.module.ts is reused; only the guard/resolver and
 * component targets are stubbed so navigation is not blocked by Keycloak/backend and so the
 * heavy overview component tree is not required. Path/redirect structure is preserved, which
 * is exactly what this bug is about.
 *
 * Validates: Requirements 2.4 (Property 1 - Bug Condition)
 */
@Component({template: '', standalone: true})
class StubComponent {}

// Deep-clone the real routes, swapping only component/guard/resolver wiring while keeping
// every path and redirectTo identical to the production configuration.
function sanitize(routes: FluxHostRoute[]): Route[] {
  return routes.map(r => {
    const clone: any = {...r};
    delete clone.canActivate;
    delete clone.resolve;
    delete clone.title;
    if (clone.component) {
      clone.component = StubComponent;
    }
    if (clone.children) {
      clone.children = sanitize(clone.children);
    }
    return clone as Route;
  });
}

describe('AppRouting (Bug 3 - incident link navigation)', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(sanitize(appRoutes))]
    });
    router = TestBed.inject(Router);
  });

  it('navigates to incident/:incidentId instead of the wildcard redirect (expected/fixed behavior)', async () => {
    await router.navigateByUrl('/incident/abc-123');

    // EXPECTED (fixed): the URL stays on the incident route.
    // On unfixed code this FAILS: there is no incident/:incidentId route, so the `**`
    // wildcard redirects back to '' and router.url becomes '/'.
    expect(router.url).toBe('/incident/abc-123');
  });

  it('preserves resolution of the root route (regression guard, 3.5)', async () => {
    await router.navigateByUrl('/');
    expect(router.url).toBe('/');
  });
});
