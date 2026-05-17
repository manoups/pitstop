import {Component, Input} from '@angular/core';
import {View} from "src/app/common/view";
import {Handler} from "src/app/common/handler";
import {Assistance} from '@pitstop/typescriptmodels/pitstop';

@Component({
    selector: 'app-assistance-overview-item',
    templateUrl: './assistance-overview-item.component.html',
    styleUrls: ['./assistance-overview-item.component.scss'],
    standalone: false
})
@Handler()
export class AssistanceOverviewItemComponent extends View {

  @Input()
  assistance: Assistance;

}
