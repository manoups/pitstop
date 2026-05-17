import {Component, forwardRef, Input} from '@angular/core';
import {NG_VALUE_ACCESSOR} from "@angular/forms";
import {AbstractValueAccessorComponent} from "../../component/value-accessor.component";
import moment from "moment";

@Component({
    selector: 'app-time-picker',
    templateUrl: './time-picker.component.html',
    styleUrls: ['./time-picker.component.scss'],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TimePickerComponent), multi: true }],
    standalone: false
})
export class TimePickerComponent extends AbstractValueAccessorComponent<TimePickerInfo> {
  _value: TimePickerInfo;

  @Input() required: boolean;
  @Input() defaultTime: string;

  updateModel = () => this.writeValue(this._value);

  get value(): TimePickerInfo {
    return this._value;
  }

  writeValue(value: TimePickerInfo): void {
    if (!value) {
      value = this.timeStringToInfo(this.defaultTime);
    }
    this._value = value;
    this.onModelChange();
  }

  timeStringToInfo = (value: string) => {
    const date = moment(value, "HH:mm:ss");
    return (<TimePickerInfo>{
      hour: date.hours(),
      minute: date.minutes(),
      second: date.seconds()
    });
  }
}

export interface TimePickerInfo {
  hour: number;
  minute: number;
  second: number;
}
