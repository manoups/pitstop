import {Component, ElementRef, EventEmitter, forwardRef, Input, Output, TemplateRef, ViewChild} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {filterByTerm, lodash} from '../../utils';
import {AbstractValueAccessorComponent} from "../../component/value-accessor.component";
import {NG_VALUE_ACCESSOR} from "@angular/forms";
import { DebouncedFunc } from 'lodash';

@Component({
    selector: 'app-local-filter',
    templateUrl: './local-filter.component.html',
    styleUrls: ['./local-filter.component.scss'],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => LocalFilterComponent), multi: true }
    ],
    host: { 'class': 'input-group' },
    standalone: false
})
export class LocalFilterComponent {
  private filterTerm: string;

  get term(): string {
    return this.filterTerm;
  }

  @Input() set term(value: string) {
    this.filterTerm = value;
    this.termChanged.emit(value);
    this.onUpdate();
  }

  @Input() filterFunction: (term) => (value : any) => boolean = t => filterByTerm(t);

  @Input()
  set data(value: any[] | Observable<any[]>) {
    if (lodash.isArray(value)) {
      this.input = value as any;
      this.onUpdate();
    } else {
      this.searching = true;
      (value as any).subscribe(r => {
        this.input = r;
        this.searching = false;
        this.onUpdate();
      }, e => this.searching = false);
    }
  }

  @Input() placeholder = "";

  @Output() updated = new EventEmitter<any[]>();

  @Output() termChanged = new EventEmitter<string>();

  searching: boolean;
  private input: any[] = [];

  private onUpdate() {
    setTimeout(() => this.updated.emit(this.input.filter(this.filterFunction(this.filterTerm))), 0);
  }
}
