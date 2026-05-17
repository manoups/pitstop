import {Component, EventEmitter, inject, NgZone, Output} from '@angular/core';
import {Handler} from '../../../common/handler';
import {GeoLocation} from '@pitstop/typescriptmodels/pitstop';
import {sendQuery} from '../../../common/app-common-utils';

@Component({
    selector: 'app-map-box',
    templateUrl: './map-box.component.html',
    styleUrls: ['./map-box.component.scss'],
    standalone: false
})
@Handler()
export class MapBoxComponent {
  private readonly ngZone = inject(NgZone);

  @Output()
  geoLocate = new EventEmitter<GeoLocation>;

  onLocationChange(event) {
    this.ngZone.run(() => {
      const location: GeoLocation = {
        latitude: event.coords.latitude,
        longitude: event.coords.longitude,
        altitude: event.coords.altitude,
        accuracy: event.coords.accuracy,
        altitudeAccuracy: event.coords.altitudeAccuracy,
        heading: event.coords.heading,
        speed: event.coords.speed,
      }
      sendQuery(`/api/location?longitude=${location.longitude}&latitude=${location.latitude}`, {}, {responseType: 'text'})
        .subscribe({
          next: r => {
            location.name = r;
            this.geoLocate.emit(location);
          }
        });
    });
  }
}
