import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewChild
} from '@angular/core';
import {createPopper, Instance} from "@popperjs/core";
import {debounce} from "lodash";
import {CommonModule} from "@angular/common";
import {HighlightComponent} from "./highlight/highlight.component";
import {EventGateway} from "../event-gateway";
import {Placement} from "@popperjs/core/lib/enums";

@Component({
    selector: 'app-typeahead-window',
    templateUrl: './typeahead-window.component.html',
    styleUrls: ['./typeahead-window.component.scss'],
    imports: [
        CommonModule, HighlightComponent
    ]
})
export class TypeaheadWindowComponent {
  values: any[] = [];
  popperInstance: Instance;
  activeIndex = 0;

  @ViewChild("dropdownMenu") dropdownMenu: ElementRef;
  @Input() term: string;
  @Output() activeChanged: EventEmitter<HTMLElement> = new EventEmitter<HTMLElement>();
  static incrementalId: number = 0;

  data: TypeaheadData;
  private debounceWait = 10;
  el: ElementRef;

  constructor(private eventGateway: EventGateway, private changeDetector: ChangeDetectorRef, private element: ElementRef) {
    this.el = element;
    $(element.nativeElement).attr("id", `typeahead-window-${TypeaheadWindowComponent.incrementalId}`);
    TypeaheadWindowComponent.incrementalId++;
  }

  openTypeaheadWindow = (event: TypeaheadData) => {
    this.data = event;
    if (event.results.length === 0) {
      this.closeWindow();
      return;
    }
    this.values = event.results;
    this.popperInstance = createPopper(event.input, this.dropdownMenu.nativeElement, {
      placement: "bottom-start"
    });
    $(this.dropdownMenu.nativeElement).addClass('show');
    setTimeout(() => {
      this.popperInstance.update();
      this.addListeners();
      this.selectFirstItem();
      this.changeDetector.markForCheck();
    }, 0);
    $(this.data.input).attr("aria-expanded", 'true');
  }

  onSelect = (index: number) => {
    if (!this.dropdownVisible()) {
      return;
    }
    this.data.selectItem.emit({
      item: this.data.results[index] || null,
      value: this.values[index] || null
    });
    this.closeWindow();
  }

  dropdownVisible = () => $(this.dropdownMenu.nativeElement).hasClass("show");

  private closeWindow = () => {
    $(this.data.input).attr("aria-expanded", 'true');
    return $(this.dropdownMenu.nativeElement).removeClass('show');
  };

  private debouncedKeydown = debounce((event) => {
    if (!this.dropdownVisible()) {
      return;
    }
    const key = event.key;
    if (key === "ArrowDown" || key === "ArrowUp") {
      let newTabindex = key === "ArrowDown" ? this.activeIndex + 1 : this.activeIndex - 1;
      if (newTabindex < 0) {
        newTabindex = this.values.length - 1;
      }
      if (newTabindex >= this.values.length) {
        newTabindex = 0;
      }
      this.activateDropdownItem(newTabindex);
    }
    if (["Enter", "Tab"].includes(key)) {
      this.focussedElement.click();
    }
  }, this.debounceWait);

  addListeners = () => {
    $(document).keydown((event) => this.debouncedKeydown(event));
  }

  selectFirstItem = () => {
    this.activateDropdownItem(0);
  }

  activateDropdownItem = (index: number) => {
    const newActiveElement = this.getElementAtIndex(index);
    const element = newActiveElement.get(0);
    if (element) {
      if (!this.isVisible(element, this.dropdownMenu.nativeElement)) {
        element.scrollIntoView({
          block: "nearest"
        });
      }
      setTimeout(() => this.activeChanged.emit(element), 0);
    }
    this.activeIndex = index;
    this.changeDetector.markForCheck();
  }

  isVisible = (element, container) => {
    const { bottom, height, top } = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const offset = 30;
    return top <= containerRect.top
      ? containerRect.top - (top - offset) <= height
      : bottom - (containerRect.bottom - offset) <= height;
  };

  get focussedElement() {
    return this.getElementAtIndex(this.activeIndex);
  }

  private getElementAtIndex(index: number) {
    return $('[value=' + index + ']');
  }
}

interface TypeaheadData {
  input: HTMLElement;
  term: string;
  results: any[];
  resultFormatter: (value: any) => string;
  inputFormatter: (value: any) => string;
  resultTemplate: TemplateRef<any>;
  selectItem: EventEmitter<TypeaheadItem>;
  placement: Placement;
}

interface TypeaheadItem {
  item: any;
  value: string;
}
