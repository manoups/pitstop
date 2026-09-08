import {WebsocketService} from './websocket.service';

/**
 * Bug 1 exploration tests (bugfix spec: angular-20-upgrade-regressions, task 1).
 *
 * These encode the EXPECTED (fixed) behavior and are therefore EXPECTED TO FAIL on the
 * current unfixed code — the failure confirms the regression exists.
 *
 * Under the Angular 20 / Keycloak flow nothing writes `Authorization` to localStorage, yet
 * `WebsocketService.openWebsocket()` still gates the connection on
 * `localStorage.getItem("Authorization")`. So while authenticated (valid Keycloak session)
 * the false "signed out" guard short-circuits and `new WebSocket(...)` is never called.
 *
 * Validates: Requirements 2.1, 2.2 (Property 1 - Bug Condition)
 */
describe('WebsocketService (Bug 1 - authenticated websocket gate)', () => {
  let socketCtorSpy: jasmine.Spy;
  let originalWebSocket: typeof WebSocket;

  beforeEach(() => {
    // A valid Keycloak session exists, but the new auth flow does NOT write an
    // "Authorization" entry into localStorage.
    localStorage.removeItem('Authorization');
    localStorage.removeItem('X-Impersonation');

    // Spy on the WebSocket constructor so we can observe whether a socket is opened.
    originalWebSocket = (window as any).WebSocket;
    const fakeSocket: any = {
      close: () => {},
      set onmessage(_v: any) {},
      set onclose(_v: any) {},
      set onopen(_v: any) {}
    };
    socketCtorSpy = jasmine.createSpy('WebSocket').and.returnValue(fakeSocket);
    (window as any).WebSocket = socketCtorSpy;
  });

  afterEach(() => {
    (window as any).WebSocket = originalWebSocket;
  });

  it('constructs a WebSocket when a Keycloak session is present (expected/fixed behavior)', () => {
    const service = new WebsocketService<any>();

    service.initialise('api/updates', () => {}, false);

    // EXPECTED (fixed): an authenticated user opens the socket via the Keycloak token.
    // On unfixed code this FAILS: the localStorage "Authorization" guard short-circuits,
    // so no WebSocket is ever constructed.
    expect(socketCtorSpy).toHaveBeenCalled();
  });

  it('carries an Authorization Bearer subprotocol when connecting (expected/fixed behavior)', () => {
    const service = new WebsocketService<any>();

    service.initialise('api/updates', () => {}, false);

    // EXPECTED (fixed): the credential is sourced from the Keycloak token and passed as the
    // WS subprotocol [encode("Authorization"), encode("Bearer <token>")].
    // On unfixed code this FAILS because the socket is never constructed at all.
    expect(socketCtorSpy).toHaveBeenCalled();
    const protocols = socketCtorSpy.calls.mostRecent()?.args?.[1] as string[];
    expect(protocols).toBeTruthy();
    expect(protocols).toContain(encodeURIComponent('Authorization'));
    expect(protocols?.some(p => decodeURIComponent(p).startsWith('Bearer '))).toBeTrue();
  });
});

/**
 * Bug 1 live-update exploration test.
 *
 * With the socket never opened on unfixed code, an incoming Incident UiUpdate can never be
 * delivered, so the onMessage callback is never invoked and the /api/incidents cache is
 * never patched live. This test asserts the fixed behavior (message delivered → callback
 * fired) and therefore FAILS on unfixed code.
 *
 * Validates: Requirements 2.2 (Property 1 - Bug Condition)
 */
describe('WebsocketService (Bug 1 - live update delivery)', () => {
  let originalWebSocket: typeof WebSocket;
  let fakeSocket: any;

  beforeEach(() => {
    // A valid Keycloak session exists, but the new auth flow does NOT write an
    // "Authorization" entry into localStorage.
    localStorage.clear();
    originalWebSocket = (window as any).WebSocket;
    fakeSocket = {
      onmessage: null as any,
      onclose: null as any,
      onopen: null as any,
      close: () => {}
    };
    (window as any).WebSocket = jasmine.createSpy('WebSocket').and.callFake(() => fakeSocket);
  });

  afterEach(() => {
    (window as any).WebSocket = originalWebSocket;
    localStorage.clear();
  });

  it('delivers an incoming Incident UiUpdate to the message handler (expected/fixed behavior)', () => {
    const received: any[] = [];
    const service = new WebsocketService<any>();

    service.initialise('api/updates', update => received.push(update), false);

    // EXPECTED (fixed): the authenticated session opens the socket, so a message handler is
    // wired up. On unfixed code the socket is never opened (false "signed out" guard), so
    // onmessage stays null — the assertion below fails, proving live updates are dead.
    expect(fakeSocket.onmessage)
      .withContext('socket must be open so incoming updates can be delivered')
      .toBeTruthy();

    // Simulate the backend streaming an Incident UiUpdate over the socket.
    const incidentUpdate = {type: 'Incident', id: '1', patch: []};
    if (typeof fakeSocket.onmessage === 'function') {
      fakeSocket.onmessage({data: JSON.stringify(incidentUpdate)} as MessageEvent);
    }

    // EXPECTED (fixed): the update reaches the handler which patches the /api/incidents cache.
    // On unfixed code this FAILS (no socket → no message → cache never patched).
    expect(received.length).toBe(1);
    expect(received[0]?.type).toBe('Incident');
  });
});
