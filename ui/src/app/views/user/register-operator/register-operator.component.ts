import {Component} from '@angular/core';
import {View} from "src/app/common/view";
import {Handler} from "src/app/common/handler";
import {OperatorDetails} from '@pitstop/typescriptmodels/pitstop';

@Component({
    selector: 'app-register-operator',
    templateUrl: './register-operator.component.html',
    styleUrls: ['./register-operator.component.scss'],
    standalone: false
})
@Handler()
export class RegisterOperatorComponent extends View {
  details: OperatorDetails = {}

  updateInfo = () => this.sendCommand(`/api/operator`, this.details);
}
