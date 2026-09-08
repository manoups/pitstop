import {AfterViewInit, Component} from '@angular/core';
import {ComparatorChain} from '../../common/comparator-chain';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {filterByTerm, sort} from '../../common/utils';
import {View} from '../../common/view';
import {Handler} from '../../common/handler';
import {Incident} from '@pitstop/typescriptmodels/pitstop';
import {IncidentModalComponent} from './incident-details-modal/incident-modal.component';
import {AppCommonUtils} from "../../common/app-common-utils";

@Component({
    selector: 'app-incident-overview',
    templateUrl: './incident-overview.component.html',
    styleUrls: ['./incident-overview.component.scss'],
    standalone: false,
    providers: [AppCommonUtils]
})
@Handler()
export class IncidentOverviewComponent extends View implements AfterViewInit {
  comparator: ComparatorChain = new ComparatorChain("-start");

  term: string;
  query: Observable<Incident[]>;
  data: Incident[] = [];

  ngAfterViewInit(): void {
    this.executeQuery();
  }

  create = () => this.openModal(IncidentModalComponent);

  executeQuery = () => {
    this.query = this.subscribeTo("/api/incidents")
      .pipe(map((o: Incident[]) => o.filter(filterByTerm(this.term))))
      .pipe(map(c => sort(c, this.comparator)));
  };

  trackByForRecord(index: number, record: Incident) {
    return record.incidentId;
  }
}
