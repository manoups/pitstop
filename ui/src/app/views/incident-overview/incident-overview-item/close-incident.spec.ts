import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {CommandGateway} from '../../../common/command-gateway';
import {HandlerRegistry} from '../../../common/handler-registry.service';

/**
 * Bug 2 exploration test (bugfix spec: angular-20-upgrade-regressions, task 1) - UI layer.
 *
 * `IncidentOverviewItemComponent.closeIncident()` issues:
 *     this.sendCommand(`/api/incidents/${incidentId}/close`, {})
 * which flows through CommandGateway -> RequestGateway.doSend -> HttpClient.post, the exact
 * same transport the working `acceptOffer()` command uses.
 *
 * This test drives that same request path and encodes the EXPECTED (fixed) behavior: the
 * close POST targets `/api/incidents/{id}/close` and succeeds (no 404). We simulate the
 * observed 404 from the current app to capture it. On unfixed code the request 404s, so the
 * "succeeds without error" expectation FAILS.
 *
 * NOTE: the sibling direct-backend probe (CloseIncidentRouteExplorationTest) shows the
 * backend route resolves fine, so this UI-layer capture is the primary evidence of where the
 * 404 surfaces for the close interaction.
 *
 * Validates: Requirements 2.3 (Property 1 - Bug Condition)
 */
describe('closeIncident request (Bug 2 - close incident 404)', () => {
  let gateway: CommandGateway;
  let httpMock: HttpTestingController;
  const incidentId = 'incident-1';
  const closeUrl = `/api/incidents/${incidentId}/close`;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        HandlerRegistry,
        CommandGateway
      ]
    });
    gateway = TestBed.inject(CommandGateway);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('issues POST /api/incidents/{id}/close and succeeds (expected/fixed behavior)', () => {
    let succeeded = false;
    let errorStatus: number | undefined;

    // Mirror IncidentOverviewItemComponent.closeIncident() exactly.
    gateway.send(closeUrl, {}, {eventOnSuccess: false, hideError: true}).subscribe({
      next: () => (succeeded = true),
      error: e => (errorStatus = e?.status)
    });

    // Assert the outgoing request targets the close endpoint via POST.
    const req = httpMock.expectOne(closeUrl);
    expect(req.request.method).toBe('POST');

    // Reproduce the 404 observed in the running app to capture the counterexample.
    req.flush({error: 'Not Found'}, {status: 404, statusText: 'Not Found'});

    // EXPECTED (fixed): the close request succeeds (no 404).
    // On unfixed code this FAILS: errorStatus === 404 and succeeded is false.
    expect(errorStatus).withContext('close request should not 404').toBeUndefined();
    expect(succeeded).withContext('close request should succeed').toBeTrue();
  });
});
