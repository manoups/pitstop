import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideRouter, Router, Route} from '@angular/router';
import {routes as appRoutes, FluxHostRoute} from './app-routing.module';

/**
 * Property 2 (Preservation) test for the Angular 20 upgrade regressions bugfix
 * (spec: angular-20-upgrade-regressions, task 2, sub-property 3.5).
 *
 * Bug 3's fix (task 5) adds an `incident/:incidentId` route. Every OTHER route must keep
 * resolving exactly as it does today: `''` and `auth/callback` render the overview at `/`,
 * and any unknown path falls through the `**` wildcard redirect back to `''`.
 *
 * Property-based approach: generate many random paths that are NOT `incident/:incidentId`
 * and assert each resolves to `/` under the current (pre-Bug-3-fix) route table - the
 * baseline that must be preserved after the route is added.
 *
 * The real route table from `app-routing.module.ts` is reused; only guard/resolver/component
 * wiring is stubbed (matching the existing exploration spec) so navigation is not blocked by
 * Keycloak/backend and the heavy overview tree is not required. Path/redirect structure is
 * preserved, which is exactly what this property is about.
 *
 * Validates: Requirements 3.5 (Property 2 - Preservation)
 */
@Component({template: '', standalone: true})
class StubComponent {}

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

describe('AppRouting preservation (3.5 - existing route resolution)', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(sanitize(appRoutes))]
    });
    router = TestBed.inject(Router);
  });

  // Deterministic PRNG for reproducibility.
  let seed = 987654321;
  function rnd(): number {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }

  const segments = ['foo', 'bar', 'incidents', 'offers', 'user', 'operators', 'accept', 'close', 'x', 'auth', 'callbacks'];

  function randomNonIncidentPath(): string {
    const depth = 1 + Math.floor(rnd() * 4);
    const parts: string[] = [];
    for (let i = 0; i < depth; i++) {
      parts.push(segments[Math.floor(rnd() * segments.length)]);
    }
    const path = '/' + parts.join('/');
    // Exclude the exact shape the Bug 3 fix will add: `incident/:incidentId`.
    if (/^\/incident\/[^/]+$/.test(path)) {
      return randomNonIncidentPath();
    }
    return path;
  }

  it('resolves the root route to /', async () => {
    await router.navigateByUrl('/');
    expect(router.url).toBe('/');
  });

  it('resolves auth/callback to / (redirectTo)', async () => {
    await router.navigateByUrl('/auth/callback');
    expect(router.url).toBe('/');
  });

  it('redirects any non-incident path to / via the wildcard (property over random paths)', async () => {
    for (let i = 0; i < 60; i++) {
      const path = randomNonIncidentPath();
      await router.navigateByUrl(path);
      expect(router.url)
        .withContext(`unknown path "${path}" must fall through ** to "/"`)
        .toBe('/');
    }
  });
});
