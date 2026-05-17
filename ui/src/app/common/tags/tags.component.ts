import {Component, EventEmitter, forwardRef, Input, OnInit, Output, ViewChild} from '@angular/core';
import {AbstractValueAccessorComponent} from '../component/value-accessor.component';
import {NG_VALUE_ACCESSOR} from '@angular/forms';
import {extractValue, removeItem} from '../utils';

@Component({
    selector: 'app-tags',
    templateUrl: './tags.component.html',
    styleUrls: ['./tags.component.scss'],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TagsComponent), multi: true }
    ],
    standalone: false
})
export class TagsComponent extends AbstractValueAccessorComponent<any[]> implements OnInit {

  values = [];

  @Input() dataKey: string;
  @Input() formatter;
  @Input() required: any;
  @Input() readonly: boolean;
  @Input() itemTemplate;
  @Input() placeholder: string;
  @Output() onInput = new EventEmitter<{}>();

  @ViewChild('newValue') inputField;

  deleteValue(v: any) {
    removeItem(this.values, v);
    this.onModelChange();
  }

  get value(): any[] {
    return this.values;
  }

  writeValue(value: any[]): void {
    this.values = value ? value : [];
  }

  ngOnInit(): void {
    if (this.required === "") {
      this.required = true;
    }
    if (!this.formatter) {
      this.formatter = value => this.dataKey ? extractValue(value, this.dataKey) : value;
    }
  }

  addValue(value: any) {
    if (value && value.value) {
      this.values.push(value.value);
      this.onModelChange();
    }
  }

  clearValue(): void {
    this.inputField.nativeElement.value = "";
  }

  onSubmit($event: any) {
    console.log($event.value);
  }
}
