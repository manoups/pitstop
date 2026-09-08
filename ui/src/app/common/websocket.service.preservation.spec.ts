import {WebsocketService, WebsocketCredentialsProvider} from './websocket.service';

/**
 * Property 2 (Preservation) tests for the Angular 20 upgrade regressions bugfix
 * (spec: angular-20-upgrade-regressions, task 2).
 *
 * These encode behavior that MUST remain unchanged by the fixes and therefore MUST PASS on
 * the current code. They cover two preservation sub-properties owned by the websocket layer:
 *
 *  - 3.1 Signed-out suppression: with no Keycloak session/token the service opens NO socket.
 *  - 3.4 Reconnection scheduling: 5s reconnect on a non-clean close, 60s retry on a failed open.
 *
 * Bug 1 (task 3) is already fixed: the service now gates on a credentials provider that
 * yields a token instead of the old `localStorage["Authorization"]` guard. The signed-out
 * case is therefore modelled the way `HomeComponent` wires it - a provider that resolves to
 * an empty/undefined token - which is the intended preserved anonymous-suppression behavior.
 *
 * A constructable WebSocket stub is installed (a real class, not a bare spy) so that
 * `new WebSocket(...)` inside the service succeeds and we can observe the connect/skip
 * decision and the wired-up close handler.
 *
 * Validates: Requirements 3.1, 3.4 (Property 2 - Preservation)
 */

/** Minimal constructable WebSocket stub that records every construction. */
class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  static reset() { FakeWebSocket.instances = []; }

  onmessage: ((e: MessageEvent) => void) | null = null;
  onclose: ((e: CloseEvent) => void) | null = null;
  onopen: (() => void) | null = null;
  closed = false;

  constructor(public url: string, public protocols?: string | string[]) {
    FakeWebSocket.instances.push(this);
  }

  close() { this.closed = true; }
}

describe('WebsocketService preservation (3.1 - signed-out suppression)', () => {
  let originalWebSocket: typeof WebSocket;

  beforeEach(() => {
    localStorage.clear();
    originalWebSocket = (window as any).WebSocket;
    FakeWebSocket.reset();
    (window as any).WebSocket = FakeWebSocket as any;
  });

  afterEach(() => {
    (window as any).WebSocket = originalWebSocket;
    localStorage.clear();
  });

  /** Randomised "signed-out" credential states a HomeComponent-style provider could yield. */
  function unauthenticatedCredentialProviders(): WebsocketCredentialsProvider[] {
    const emptyTokens: (string | undefined)[] = [undefined, '', '   '.trim(), null as any];
    const impersonations: (string | undefined)[] = [undefined, '', 'op-42'];
    const providers: WebsocketCredentialsProvider[] = [];
    for (const token of emptyTokens) {
      for (const impersonation of impersonations) {
        // Synchronous providers.
        providers.push(() => ({token, impersonation}));
        // Async providers (mirrors HomeComponent's `async () => { await updateToken; ... }`).
        providers.push(async () => ({token, impersonation}));
      }
    }
    // Provider that resolves to no credentials object at all.
    providers.push(() => ({} as any));
    providers.push(() => undefined as any);
    return providers;
  }

  it('opens NO socket for any unauthenticated (empty-token) credential state', async () => {
    for (const provider of unauthenticatedCredentialProviders()) {
      FakeWebSocket.reset();
      const service = new WebsocketService<any>();

      service.initialise('api/updates', () => {}, false, undefined, provider);

      // Allow async providers to resolve before asserting.
      await Promise.resolve();
      await Promise.resolve();

      expect(FakeWebSocket.instances.length)
        .withContext(`signed-out state must not open a socket (provider: ${provider})`)
        .toBe(0);
      service.ngOnDestroy();
    }
  });

  it('opens a socket once a Keycloak token is present (fixed behavior boundary)', () => {
    const service = new WebsocketService<any>();

    service.initialise('api/updates', () => {}, false, undefined, () => ({token: 'valid-token'}));

    // Authenticated: exactly one socket, carrying the Bearer subprotocol built from the token.
    expect(FakeWebSocket.instances.length).toBe(1);
    const protocols = FakeWebSocket.instances[0].protocols as string[];
    expect(protocols).toContain(encodeURIComponent('Authorization'));
    expect(protocols.some(p => decodeURIComponent(p) === 'Bearer valid-token')).toBeTrue();
    service.ngOnDestroy();
  });
});

describe('WebsocketService preservation (3.4 - reconnection scheduling)', () => {
  let originalWebSocket: typeof WebSocket;

  beforeEach(() => {
    localStorage.clear();
    originalWebSocket = (window as any).WebSocket;
    FakeWebSocket.reset();
    (window as any).WebSocket = FakeWebSocket as any;
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    (window as any).WebSocket = originalWebSocket;
    localStorage.clear();
  });

  it('schedules a reconnect 5s after a non-clean close (retryOnClose = true)', () => {
    const service = new WebsocketService<any>();
    // Authenticated so the first socket opens; retryOnClose true.
    service.initialise('api/updates', () => {}, true, undefined, () => ({token: 'valid-token'}));

    expect(FakeWebSocket.instances.length).toBe(1);
    const firstSocket = FakeWebSocket.instances[0];

    // Simulate an unexpected (non-clean) drop.
    firstSocket.onclose?.({wasClean: false, reason: 'network', code: 1006} as CloseEvent);

    // Nothing reconnects before the 5s window elapses...
    jasmine.clock().tick(4_999);
    expect(FakeWebSocket.instances.length).toBe(1);

    // ...and exactly one reconnect fires at 5s.
    jasmine.clock().tick(1);
    expect(FakeWebSocket.instances.length).toBe(2);
    service.ngOnDestroy();
  });

  it('retries opening 60s after a failed open (constructor throws)', () => {
    // Make the very first construction throw to force the failed-open path, then succeed.
    let firstCall = true;
    const throwingCtor: any = function (this: any, url: string, protocols?: string[]) {
      if (firstCall) {
        firstCall = false;
        throw new Error('handshake failed');
      }
      return new FakeWebSocket(url, protocols);
    };
    (window as any).WebSocket = throwingCtor;

    const service = new WebsocketService<any>();
    service.initialise('api/updates', () => {}, true, undefined, () => ({token: 'valid-token'}));

    // Failed open: no socket recorded yet and no reconnect before 60s.
    expect(FakeWebSocket.instances.length).toBe(0);
    jasmine.clock().tick(59_999);
    expect(FakeWebSocket.instances.length).toBe(0);

    // At 60s the service retries and this time the construction succeeds.
    jasmine.clock().tick(1);
    expect(FakeWebSocket.instances.length).toBe(1);
    service.ngOnDestroy();
  });

  it('does not reconnect on a non-clean close when retryOnClose = false', () => {
    const service = new WebsocketService<any>();
    service.initialise('api/updates', () => {}, false, undefined, () => ({token: 'valid-token'}));

    expect(FakeWebSocket.instances.length).toBe(1);
    FakeWebSocket.instances[0].onclose?.({wasClean: false, reason: 'x', code: 1006} as CloseEvent);

    jasmine.clock().tick(60_000);
    // No retry scheduled: still just the original socket.
    expect(FakeWebSocket.instances.length).toBe(1);
    service.ngOnDestroy();
  });
});
