import {Component, inject, Input} from '@angular/core';
import {View} from "src/app/common/view";
import {Handler} from "src/app/common/handler";
import {AppContext} from '../../../../app-context';
import {Incident, Offer, Operator} from '@pitstop/typescriptmodels/pitstop';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Component({
    selector: 'app-offer-overview-item',
    templateUrl: './offer-overview-item.component.html',
    styleUrls: ['./offer-overview-item.component.scss'],
    standalone: false
})
@Handler()
export class OfferOverviewItemComponent extends View {

  protected readonly AppContext = inject(AppContext);

  @Input() incident: Incident;
  @Input() offer: Offer;

  operator: Observable<Operator> = this.subscribeTo("/api/operators").pipe(map(
    (operators: Operator[]) => operators.find(o => o.operatorId === this.offer.details.operatorId)));

  acceptOffer(): void {
    this.sendCommand(`/api/incidents/${this.incident.incidentId}/offers/${this.offer.offerId}/accept`, {});
  }
}
