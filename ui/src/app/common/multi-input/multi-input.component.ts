import {Component, forwardRef, Input, TemplateRef} from '@angular/core';
import {AbstractValueAccessorComponent} from '../component/value-accessor.component';
import {Observable} from 'rxjs';
import {uuid} from '../utils';
import {NG_VALUE_ACCESSOR} from '@angular/forms';

@Component({
    selector: 'app-multi-input',
    templateUrl: './multi-input.component.html',
    styleUrls: ['./multi-input.component.scss'],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MultiInputComponent), multi: true }
    ],
    standalone: false
})
export class MultiInputComponent extends AbstractValueAccessorComponent<any[]> {

  items: any[] = [];

  @Input() searchFunction: (arg: string) => Observable<any[]>;
  @Input() styling: ((arg: any) => any) = null;
  @Input() dataKey: string;
  @Input() inputFormatter : (value : any) => string;
  @Input() resultFormatter : (value : any) => string;
  @Input() placeholder = "";
  @Input() placement = "bottom-left";
  @Input() disabled: boolean;
  @Input() minCharacters: number = 1;
  @Input() required;
  @Input() id = uuid();

  @Input() valueType : string = "entry";
  @Input() newValueFunction : ((input : string) => any) = (() => { return {} });
  @Input() newValueTemplate : TemplateRef<any>;
  @Input() newValueModalClass : string;

  get value(): any[] {
    return this.items;
  }

  writeValue(value: any[]): void {
    this.items = !value ? [] : value;
  }

}
