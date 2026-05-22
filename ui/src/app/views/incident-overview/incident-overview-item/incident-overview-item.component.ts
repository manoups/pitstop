import {Component, inject, Input, OnInit} from '@angular/core';
import {View} from '../../../common/view';
import {HandleQuery} from '../../../common/handle-query';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Handler} from '../../../common/handler';
import {Incident, Offer} from '@pitstop/typescriptmodels/pitstop';
import {OfferModalComponent} from '../offer-modal/offer-modal.component';
import {AppContext} from '../../../app-context';
import {AppCommonUtils} from '../../../common/app-common-utils';

@Component({
    selector: 'app-incident-overview-item',
    templateUrl: './incident-overview-item.component.html',
    styleUrls: ['./incident-overview-item.component.scss'],
    standalone: false
})
@Handler()
export class IncidentOverviewItemComponent extends View implements OnInit {
  @Input() incident: Incident;

  ngOnInit(): void {
  }

  @HandleQuery("getIncident")
  getIncident(): Observable<Incident> {
    return this.subscribeTo("getIncidents").pipe(map(
      (incidents: Incident[]) => incidents.find(o => o.incidentId === this.incident.incidentId)));
  }

  addOffer(): void {
    this.openModal(OfferModalComponent, c => c.incidentId = this.incident.incidentId);
  }

  closeIncident() {
    this.sendCommand(`/api/incidents/${this.incident.incidentId}/close`, {});
  }

  trackByOfferId = (index: number, record: Offer) => record.offerId;

  protected readonly AppContext = inject(AppContext);
  protected readonly appUtils = inject(AppCommonUtils);
}
