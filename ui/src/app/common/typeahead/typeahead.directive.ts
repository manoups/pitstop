import {
  Directive,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  Renderer2,
  TemplateRef,
  ViewContainerRef
} from "@angular/core";
import {Observable, Subscriber} from "rxjs";
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms";
import {TypeaheadWindowComponent} from "./typeahead-window.component";
import {Placement} from "@popperjs/core/lib/enums";

@Directive({
    selector: "[typeahead]",
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TypeaheadDirective), multi: true }],
    standalone: false
})
export class TypeaheadDirective implements ControlValueAccessor {
  resultObservable: Observable<any[]>;
  inputObservable: Subscriber<string>;
  @Input() resultFormatter: (item: any) => string;
  @Input() inputFormatter: (item: any) => string;
  @Input() resultTemplate: TemplateRef<any>;
  @Input() minCharacters: number = 1;
  @Input() placement: Placement;
  @Output() selectItem: EventEmitter<any> = new EventEmitter<any>();

  private autocompleteValue: string;

  private typeAheadWindow: TypeaheadWindowComponent;

  constructor(private el: ElementRef, private renderer: Renderer2, private viewContainerRef: ViewContainerRef) {
    this.createWindowComponent();
    this.autocompleteValue = $(el.nativeElement).attr("autocomplete");
    if (this.minCharacters === 1) {
      $(this.el.nativeElement).attr("autocomplete", "off");
    }
    $(el.nativeElement).on("keyup", (event) => {
      const key = event.key;
      if (["ArrowDown", "ArrowUp", "Enter", "Tab"].includes(key)) {
        return;
      }
      this.inputObservable.next(el.nativeElement.value);
    });

  }

  private createWindowComponent = () => {
    const componentRef = this.viewContainerRef.createComponent(TypeaheadWindowComponent);
    this.viewContainerRef.insert(componentRef.hostView);
    this.typeAheadWindow = componentRef.instance;
    this.setAttributes();
  }

  private setAttributes() {
    $(this.el.nativeElement).attr("role", "combobox");
    $(this.el.nativeElement).attr("aria-owns", this.typeAheadWindow.el.nativeElement.id);
    this.typeAheadWindow.activeChanged.subscribe(e => {
      return $(this.el.nativeElement).attr("aria-activedescendant", e.id);
    })
  }

  @Input() set typeahead(result: (i: Observable<string>) => Observable<any[]>) {
    this.resultObservable = result(new Observable(subscriber => this.inputObservable = subscriber));
    this.resultObservable.subscribe(r => {
      const term: string = this.el.nativeElement.value;
      $(this.el.nativeElement).attr("autocomplete", this.minCharacters === 1 || term.length + 1 >= this.minCharacters ? "off" : this.autocompleteValue);
      this.typeAheadWindow.openTypeaheadWindow({
        input: this.el.nativeElement,
        term: term,
        resultFormatter: this.resultFormatter,
        inputFormatter: this.inputFormatter,
        resultTemplate: this.resultTemplate,
        results: r,
        selectItem: this.selectItem,
        placement: this.placement
      });
    });
  }

  writeValue(value: any): void {
    this.writeInputValue(this.formatItemForInput(value));
  }

  registerOnChange(fn: any): void {

  }

  registerOnTouched(fn: any): void {

  }

  setDisabledState(isDisabled: boolean): void {

  }

  private formatItemForInput(item: any): string {
    return item != null && this.inputFormatter ? this.inputFormatter(item) : item;
  }

  private writeInputValue(value: string): void {
    this.renderer.setProperty(this.el.nativeElement, 'value', value);
  }
}
