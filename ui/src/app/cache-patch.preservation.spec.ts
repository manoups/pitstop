import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {provideRouter} from '@angular/router';
import {AppComponent} from './app.component';
import {AppCommonUtils} from './common/app-common-utils';
import {UiUpdate} from '@pitstop/typescriptmodels/pitstop';

/**
 * Property 2 (Preservation) test for the Angular 20 upgrade regressions bugfix
 * (spec: angular-20-upgrade-regressions, task 2, sub-property 3.3).
 *
 * A delivered `Incident` / `UserProfile` / `Operator` `UiUpdate` must keep patching the
 * correct query cache (`/api/incidents`, `/api/user`, `/api/operators`) via the
 * `@HandleEvent` handlers in `app.component.ts`. Bug 1's fix only changed how the socket is
 * authenticated - the cache-patch handlers are explicitly untouched - so this behavior must
 * be preserved.
 *
 * Property-based approach: randomised `UiUpdate` payloads (varied ids and JSON patches) are
 * driven through each handler. For every payload we assert (a) the correct cache key is
 * targeted and (b) the modifier the handler hands to `modifyQueryCache` produces the
 * expected patched result - both for updating an existing entry and for inserting a
 * previously-unseen one. This mirrors the pre-fix behavior exactly.
 *
 * Validates: Requirements 3.3 (Property 2 - Preservation)
 */
describe('Cache-patch application preservation (3.3)', () => {
  let component: AppComponent;
  let captured: {queryName: string; modifier: (v: any) => any}[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideRouter([])]
    });
    component = TestBed.runInInjectionContext(() => new AppComponent());

    captured = [];
    spyOn(AppCommonUtils, 'modifyQueryCache').and.callFake((queryName: string, modifier: any) => {
      captured.push({queryName, modifier});
    });
  });

  // --- tiny deterministic PRNG so the property run is reproducible ---
  let seed = 1234567;
  function rnd(): number {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }
  function randomId(): string {
    return 'id-' + Math.floor(rnd() * 100000);
  }
  function randomStatus(): string {
    return ['open', 'closed', 'pending', 'resolved'][Math.floor(rnd() * 4)];
  }

  it('Incident update patches the /api/incidents cache (update + insert)', () => {
    for (let i = 0; i < 40; i++) {
      captured = [];
      const id = randomId();
      const newStatus = randomStatus();
      const update = {type: 'Incident', id, patch: [{op: 'replace', path: '/status', value: newStatus}]} as unknown as UiUpdate;

      component.handleOrganisationUpdate(update);

      expect(captured.length).toBe(1);
      expect(captured[0].queryName).toBe('/api/incidents');

      // Case A: the entry already exists -> it is patched in place, list length unchanged.
      const existing = [{incidentId: id, status: 'old'} as any, {incidentId: 'other', status: 'x'} as any];
      const updated = captured[0].modifier([...existing]);
      const patched = updated.find((e: any) => e.incidentId === id);
      expect(patched.status).toBe(newStatus);
      expect(updated.length).toBe(2);

      // Case B: the entry does not exist yet -> it is inserted.
      const fresh = captured[0].modifier([]);
      expect(fresh.length).toBe(1);
      expect(fresh[0].incidentId).toBeUndefined(); // patched onto an empty doc, id set via patch only
      expect(fresh[0].status).toBe(newStatus);
    }
  });

  it('UserProfile update patches the /api/user cache only for the matching user', () => {
    for (let i = 0; i < 40; i++) {
      captured = [];
      const id = randomId();
      const newStatus = randomStatus();
      const update = {type: 'UserProfile', id, patch: [{op: 'replace', path: '/status', value: newStatus}]} as unknown as UiUpdate;

      component.handleUserUpdate(update);

      expect(captured.length).toBe(1);
      expect(captured[0].queryName).toBe('/api/user');

      // Matching user -> patched.
      const matching = {userId: id, status: 'old'} as any;
      const resultMatching = captured[0].modifier(matching);
      expect(resultMatching.status).toBe(newStatus);

      // Different user -> returned unchanged (no patch applied).
      const otherUser = {userId: 'someone-else', status: 'untouched'} as any;
      const resultOther = captured[0].modifier(otherUser);
      expect(resultOther).toBe(otherUser);
      expect(resultOther.status).toBe('untouched');
    }
  });

  it('Operator update patches the /api/operators cache (update + insert)', () => {
    for (let i = 0; i < 40; i++) {
      captured = [];
      const id = randomId();
      const newStatus = randomStatus();
      const update = {type: 'Operator', id, patch: [{op: 'replace', path: '/status', value: newStatus}]} as unknown as UiUpdate;

      component.handleOperatorUpdate(update);

      expect(captured.length).toBe(1);
      expect(captured[0].queryName).toBe('/api/operators');

      const existing = [{operatorId: id, status: 'old'} as any];
      const updated = captured[0].modifier([...existing]);
      expect(updated.find((e: any) => e.operatorId === id).status).toBe(newStatus);
      expect(updated.length).toBe(1);

      const fresh = captured[0].modifier([]);
      expect(fresh.length).toBe(1);
      expect(fresh[0].status).toBe(newStatus);
    }
  });

  it('routes each update type to its own cache and never crosses caches', () => {
    const types: {type: string; cache: string; fn: (u: UiUpdate) => void}[] = [
      {type: 'Incident', cache: '/api/incidents', fn: u => component.handleOrganisationUpdate(u)},
      {type: 'UserProfile', cache: '/api/user', fn: u => component.handleUserUpdate(u)},
      {type: 'Operator', cache: '/api/operators', fn: u => component.handleOperatorUpdate(u)}
    ];
    for (let i = 0; i < 30; i++) {
      const pick = types[Math.floor(rnd() * types.length)];
      captured = [];
      pick.fn({type: pick.type, id: randomId(), patch: []} as unknown as UiUpdate);
      expect(captured.length).toBe(1);
      expect(captured[0].queryName).toBe(pick.cache);
    }
  });
});
