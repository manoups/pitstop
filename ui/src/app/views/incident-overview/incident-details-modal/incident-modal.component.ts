import {Component, OnInit} from '@angular/core';
import {Handler} from '../../../common/handler';
import {IncidentDetails, Vehicle} from '@pitstop/typescriptmodels/pitstop';
import {View} from '../../../common/view';
import {toTitleCase} from '../../../common/utils';

@Component({
    selector: 'app-incident-details-modal',
    templateUrl: './incident-modal.component.html',
    styleUrls: ['./incident-modal.component.scss'],
    standalone: false
})
@Handler()
export class IncidentModalComponent extends View implements OnInit {
  data: IncidentDetails;
  newRecord: boolean;

  ngOnInit() {
    this.newRecord = !this.data;
    this.data = this.data || { };
  }

  updateInfo = () => this.sendCommand('/api/incidents', this.data);

  searchVehicles = (term: string) => this.sendQuery('/api/vehicles?term=' + term);
  vehicleFormatter = (v: Vehicle) => v ? `${v.licensePlateNumber} (${toTitleCase(v.make)} ${toTitleCase(v.model)}, ${v.year})` : '';
}

