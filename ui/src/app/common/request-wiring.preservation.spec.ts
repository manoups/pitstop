import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {CommandGateway} from './command-gateway';
import {QueryGateway} from './query-gateway';
import {HandlerRegistry} from './handler-registry.service';
import {environment} from '../../environments/environment';

/**
 * Property 2 (Preservation) test for the Angular 20 upgrade regressions bugfix
 * (spec: angular-20-upgrade-regressions, task 2, sub-property 3.2).
 *
 * The already-working commands/queries (`report` / `offer` / `accept` / `getIncidents`) must
 * keep succeeding with unchanged request wiring after the fixes. In production the Keycloak
 * bearer token is attached by `keycloak-angular`'s `includeBearerTokenInterceptor`
 * (configured in `app.module.ts`) - not by the gateway - so this suite pins the wiring the
 * gateway itself owns and that the fixes must not disturb:
 *
 *  - URL construction in `RequestGateway.doSend`
 *    (`environment.apiProtocol + environment.apiDomain + path`).
 *  - HTTP method selection (commands POST, queries GET).
 *  - `withCredentials = true`.
 *  - The legacy `Authorization` / `X-Impersonation` localStorage-to-header copy that the
 *    interceptor-based bearer attach coexists with.
 *
 * These assertions hold on the current (fixed-Bug-1) code and must continue to hold.
 *
 * Validates: Requirements 3.2 (Property 2 - Preservation)
 */
describe('Request wiring preservation (3.2 - working HTTP commands/queries)', () => {
  let commandGateway: CommandGateway;
  let queryGateway: QueryGateway;
  let httpMock: HttpTestingController;

  const base = environment.apiProtocol + environment.apiDomain;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        HandlerRegistry,
        CommandGateway,
        QueryGateway
      ]
    });
    commandGateway = TestBed.inject(CommandGateway);
    queryGateway = TestBed.inject(QueryGateway);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('report incident issues a POST to /api/incidents with credentials', () => {
    let result: any;
    commandGateway.send('/api/incidents', {vehicle: {licensePlateNumber: 'Z-613-AB'}}, {hideError: true})
      .subscribe(r => (result = r));

    const req = httpMock.expectOne(base + '/api/incidents');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();

    req.flush('1');
    expect(result).toBe('1');
  });

  it('offer assistance issues a POST to /api/incidents/{id}/offers', () => {
    commandGateway.send('/api/incidents/1/offers', {price: 100}, {hideError: true}).subscribe();

    const req = httpMock.expectOne(base + '/api/incidents/1/offers');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    req.flush('offer-1');
  });

  it('accept offer issues a POST to /api/incidents/{id}/offers/{offerId}/accept', () => {
    commandGateway.send('/api/incidents/1/offers/1/accept', {}, {hideError: true}).subscribe();

    const req = httpMock.expectOne(base + '/api/incidents/1/offers/1/accept');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(null);
  });

  it('getIncidents issues a GET to /api/incidents with credentials', () => {
    let result: any;
    queryGateway.send('/api/incidents', {}, {hideError: true}).subscribe(r => (result = r));

    const req = httpMock.expectOne(base + '/api/incidents');
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBeTrue();

    const incidents = [{incidentId: '1'}];
    req.flush(incidents);
    expect(result).toEqual(incidents);
  });

  it('attaches a legacy Authorization/X-Impersonation header from localStorage when present', () => {
    localStorage.setItem('Authorization', 'Bearer legacy-token');
    localStorage.setItem('X-Impersonation', 'op-7');

    commandGateway.send('/api/incidents', {}, {hideError: true}).subscribe();

    const req = httpMock.expectOne(base + '/api/incidents');
    expect(req.request.headers.get('Authorization')).toBe('Bearer legacy-token');
    expect(req.request.headers.get('X-Impersonation')).toBe('op-7');
    req.flush('1');
  });

  it('builds absolute URLs unchanged and does not double-prefix an already-absolute path', () => {
    commandGateway.send('https://external.example/api/incidents', {}, {hideError: true}).subscribe();

    // Paths containing '://' are used as-is (no base prefix), preserving the gateway rule.
    const req = httpMock.expectOne('https://external.example/api/incidents');
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });
});
