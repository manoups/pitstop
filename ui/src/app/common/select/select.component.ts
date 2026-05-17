import {Component, ElementRef, forwardRef, Input, OnInit} from '@angular/core';
import {AbstractValueAccessorComponent} from '../component/value-accessor.component';
import {Observable} from 'rxjs';
import {NG_VALUE_ACCESSOR} from '@angular/forms';
import {dispatchChangeEvent, extractValue, lodash} from '../utils';

@Component({
    selector: 'app-select',
    templateUrl: './select.component.html',
    styleUrls: ['./select.component.scss'],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectComponent), multi: true }
    ],
    host: { 'class': 'input-group' },
    standalone: false
})
export class SelectComponent extends AbstractValueAccessorComponent<any> implements OnInit {
  selectedValue;
  @Input() small: boolean = false;
  @Input() nullOption: boolean = false;
  @Input() placeholder: string = "";
  @Input() optionsProvider: Observable<any[]>;
  @Input() refreshProvider;
  @Input() _options: any[];
  @Input() dataKey: string;
  @Input() optionLabel: string;
  @Input() formatter;
  @Input() selectedFormatter;
  @Input() equalsFunction;
  @Input() id;
  @Input() disabled;
  @Input() required;
  @Input() addSelectedIfNotExists;
  @Input() autoSelectSingleOption = true;
  @Input() optionSelectable : string | ((value) => true);
  @Input() optionVisible : string | ((value) => true);
  _refreshWatch;
  @Input() set refreshWatch(value) {
    const changed = !lodash.isEqual(this._refreshWatch, value);
    this._refreshWatch = value === undefined ? null : value;
    if (this.optionsProvider && changed) {
      this.optionsProvider.subscribe(values => {
        this._options = values;
        this.onRefresh();
      });
    }
  }
  @Input() set options(options: any[]) {
    this._options = options;
    this.onUpdate();
  }

  writeValue(value: any): void {
    this.selectedValue = value ? value : null;
    if (this.selectedValue) {
      this.onUpdate();
    }
  }

  constructor(private elementRef : ElementRef) {
    super();
  }

  get value(): any {
    return this._options.find(o => this.equalsFunction(o, this.selectedValue)) || null;
  }

  ngOnInit(): void {
    if (this.refreshProvider) {
      this.optionsProvider = new Observable(subscriber => {
        const o: Observable<any[]> = this.refreshProvider(this._refreshWatch);
        if(o instanceof Observable) {
          o.subscribe(subscriber);
        }
      });
    }
    if (!this.optionsProvider && !this._options) {
      throw new Error('Attribute optionsProvider or options is required for app-select component');
    }
    if (this.required === "") {
      this.required = true;
    }
    if (this.disabled === "") {
      this.disabled = true;
    }
    if (this.addSelectedIfNotExists === "") {
      this.addSelectedIfNotExists = true;
    }
    if (this.optionsProvider) {
      this.optionsProvider.subscribe(values => {
        this._options = values;
        this.onOptions();
      });
    } else if (this._options) {
      this.onOptions();
    }
    if (!this.formatter) {
      this.formatter = value => this.optionLabel ? extractValue(value, this.optionLabel) : this.dataKey
        ? extractValue(value, this.dataKey) : value;
    }
    if (!this.selectedFormatter) {
      this.selectedFormatter = this.formatter;
    }
    if (!this.equalsFunction) {
      this.equalsFunction = (option1, option2) => {
        if (!option1 && !option2) {
          return true;
        }
        if (!option1 || !option2) {
          return false;
        }
        return this.dataKey ? lodash.isEqual(extractValue(option1, this.dataKey), extractValue(option2, this.dataKey))
          : this.optionLabel ? lodash.isEqual(extractValue(option1, this.optionLabel), extractValue(option2, this.optionLabel)) : option1 === option2;
      }
    }
  };

  private onRefresh = () => {
    setTimeout(() => {
      if (this.selectedValue) {
        const exists = this._options.find(o => this.equalsFunction(o, this.selectedValue));
        if (!exists) {
          this.selectedValue = null;
        }
      }
      this.onOptions();
    })
  }

  private onOptions = () => {
    setTimeout(() => {
      if(!this.selectedValue){
        if (this.required && this._options.length == 1 && this.autoSelectSingleOption) {
          this.selectedValue = this._options[0];
          this.onModelChange();
          dispatchChangeEvent(this.elementRef.nativeElement);
        }
      }
    }, 0);
  };

  private onUpdate = () => {
    if (this.selectedValue && this._options) {
      const exists = this._options.find(o => this.equalsFunction(o, this.selectedValue));
      if (!exists && this.addSelectedIfNotExists) {
        this._options.push(this.selectedValue);
      }
    }
  };

  isDisabled(option) {
    return this.optionSelectable && !(typeof this.optionSelectable === 'string'
      ? option[<string> this.optionSelectable] : (<any>this.optionSelectable)(option));
  }

  isVisible(option) {
    return this.optionVisible && !(typeof this.optionVisible === 'string'
      ? option[<string> this.optionVisible] : (<any>this.optionVisible)(option));
  }

}
