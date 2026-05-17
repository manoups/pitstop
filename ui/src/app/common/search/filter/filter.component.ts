import {Component, EventEmitter, forwardRef, Input, OnInit, Output} from '@angular/core';
import {NG_VALUE_ACCESSOR} from '@angular/forms';

/**
 * Component used to filter (search in) a list of results
 */
@Component({
    selector: 'app-filter',
    templateUrl: './filter.component.html',
    styleUrls: ['./filter.component.scss'],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => FilterComponent), multi: true }
    ],
    host: { 'class': 'input-group' },
    standalone: false
})
export class FilterComponent implements OnInit {
  @Input() filterTerm: string;
  @Input() localStorageKey: string;
  @Input() disabled: boolean;
  @Input() placeholder = '';
  @Input() minCharacters: number = 1;

  @Output() filterTermChange: EventEmitter<string> = new EventEmitter<string>();
  @Output() onUpdate: EventEmitter<string> = new EventEmitter<string>();
  searching: boolean = false;

  ngOnInit() {
    const value = this.localStorageKey ? localStorage.getItem(this.localStorageKey) : null;
    if (this.localStorageKey) {
      this.updateFilterValue(value);
    }
  }

  onInput(value: string) {
    this.filterTerm = value || '';
    if (this.localStorageKey) {
      localStorage.setItem(this.localStorageKey, this.filterTerm);
    }
    this.updateFilterValue(this.filterTerm);
    this.onUpdate.emit(this.filterTerm);
  }

  private updateFilterValue(value: string) {
    this.filterTerm = value;
    this.filterTermChange.emit(value);
  }
}
