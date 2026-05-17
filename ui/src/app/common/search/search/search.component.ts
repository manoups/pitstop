import {Component, ElementRef, forwardRef, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {NG_VALUE_ACCESSOR} from '@angular/forms';
import {Observable, Subject} from 'rxjs';
import {checkValidity, dispatchChangeEvent, extractValue, lodash, newObjectFromValue, uuid} from '../../utils';
import Modal from 'bootstrap/js/dist/modal';
import {AbstractValueAccessorComponent} from "../../component/value-accessor.component";
import {Placement} from "@popperjs/core/lib/enums";

@Component({
    selector: 'app-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss'],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SearchComponent), multi: true }
    ],
    host: { 'class': 'input-group' },
    standalone: false
})
export class SearchComponent extends AbstractValueAccessorComponent<any> implements OnInit {

  inputModel;
  selectedItem;
  searching: boolean = false;

  @ViewChild('newValueModal') newValueModal: ElementRef;

  private outputSubject = new Subject<any[]>();
  private outputObservable = this.outputSubject.asObservable();
  filterTerm: string = "";

  @Input() searchFunction: (arg: string) => Observable<any[]>;
  @Input() styling: ((arg: any) => any) = null;
  @Input() dataKey: string;
  @Input() inputFormatter : ((value : any) => string);
  @Input() resultFormatter : ((value : any) => string);
  @Input() placeholder = "";
  @Input() placement: Placement = "bottom-start";
  @Input() disabled: boolean;
  @Input() minCharacters: number = 1;
  @Input() required;
  @Input() id = uuid();

  @Input() valueType : string = "entry";
  @Input() newValueFunction : ((input : string) => any) = (() => { return {} });
  @Input() newValueTemplate : TemplateRef<any>;
  @Input() newValueModalClass : string;

  @Input() newValueFromInputFunction : string | ((input : string) => any);

  constructor(private elementRef: ElementRef) {
    super();
  }

  onInput = (text$: Observable<string>) => {
    text$.subscribe(term => {
      this.filterTerm = term;
      this.search();
    });
    return this.outputObservable;
  };

  clear = (ev: any) => {
    if (ev.target.value === '') {
      this.onSelect(null);
    }
  }

  search = () => {
    if (!this.searching) {
      let noValues = [];
      if (this.newValueTemplate) {
        if (this.selectedItem) {
          const editValue = lodash.assign({}, this.selectedItem);
          editValue.requiresEditing = true;
          editValue.previousValue = this.selectedItem;
          noValues.push(editValue);
        } else {
          const newValue = this.newValueFunction(this.filterTerm);
          if (newValue) {
            newValue.requiresEditing = true;
            noValues.push(newValue);
          }
        }
      }
      if (this.filterTerm.length < this.minCharacters) {
        this.outputSubject.next(noValues);
        return;
      }
      this.searching = true;
      const lastTerm = this.filterTerm;
      this.searchFunction(lastTerm).subscribe(results => {
        results = noValues.concat(results);
        if (results.length === 0 && this.newValueFromInputFunction) {
          const newValue = (<any>this.newValueFromInputFunction)(this.filterTerm);
          if (newValue) {
            results.push(newValue);
          }
        }
        this.outputSubject.next(results);
        this.searching = false;
        if (lastTerm !== this.filterTerm) {
          this.search();
        }
      })
    }
  };

  ngOnInit() {
    if (!this.searchFunction) {
      throw new Error('Attribute searchFunction is required for app-search component');
    }
    if (this.required === "") {
      this.required = true;
    }
    if (!this.inputFormatter) {
      this.inputFormatter = value => this.dataKey ? extractValue(value, this.dataKey) : value;
    }
    if (!this.resultFormatter) {
      this.resultFormatter = this.inputFormatter;
    }
    if (typeof this.newValueFromInputFunction === 'string') {
      const objectFields : string = this.newValueFromInputFunction;
      this.newValueFromInputFunction = v => newObjectFromValue(v, objectFields);
    }
    if (this.newValueTemplate) {
      const resultFormatter = this.resultFormatter;
      const inputFormatter = this.inputFormatter;
      this.resultFormatter = v =>
          v.requiresEditing ? (this.selectedItem && this.inputModel ? 'Edit ' : 'Create new ') + this.valueType: resultFormatter(v);
      this.inputFormatter = v => v.requiresEditing && !v.previousValue ? '' : inputFormatter(v);
    }
  }

  onFocus = () => {
    if (this.minCharacters === 0 || this.newValueTemplate) {
      this.search();
    }
  }

  onBlur = () => {
    if (this.inputModel !== this.selectedItem) {
      this.onSelect(null);
    }
  };

  onSelect = (value) => {
    this.inputModel = value;
    this.selectedItem = value;
    this.searching = false;
    if (!this.selectedItem || !this.selectedItem.requiresEditing) {
      setTimeout(() => {
        this.onModelChange();
        dispatchChangeEvent(this.elementRef.nativeElement);
      }, 0);
    }
    this.toggleModal();
  };

  get value(): any {
    return this.selectedItem;
  }

  writeValue(value: any): void {
    this.selectedItem = value === undefined ? null : value;
    this.inputModel = this.selectedItem;
    this.toggleModal();
  }

  onCompleteEditing() {
    if (checkValidity(this.newValueModal)) {
      setTimeout(() => {
        delete this.selectedItem.requiresEditing;
        delete this.selectedItem.previousValue;
        const update = lodash.assign({}, this.selectedItem);
        this.onSelect(update);
      }, 0);
      return true;
    }
    return false;
  }

  onCancelEditing() {
    delete this.selectedItem.requiresEditing;
    const previousValue = this.selectedItem.previousValue;
    if (previousValue) {
      delete this.selectedItem.previousValue;
    }
    this.onSelect(previousValue);
  }

  private toggleModal() {
    if (this.newValueTemplate && this.selectedItem && this.selectedItem.requiresEditing) {
      setTimeout(() => {
        if (this.newValueModal) {
          const modal = new Modal(this.newValueModal.nativeElement, {
            backdrop: "static",
            keyboard: false,
            focus: true}
          );
          this.newValueModal.nativeElement.classList.add('fade');
          modal.show();
        }
      }, 0);
    } else if (this.newValueModal) {
      this.newValueModal.nativeElement.classList.remove('fade');
      const modal = $(this.newValueModal.nativeElement);
      modal.modal('hide');
    }
  }
}
