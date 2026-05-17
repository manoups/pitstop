import {ChangeDetectorRef, Component, ElementRef, TemplateRef, ViewChild, ViewContainerRef} from '@angular/core';
import {createPopper, Instance} from '@popperjs/core';
import {Placement} from "@popperjs/core/lib/enums";
import {CommonModule} from "@angular/common";
import {Handler} from "src/app/common/handler";

@Component({
    selector: 'app-popover',
    templateUrl: './popover.component.html',
    styleUrls: ['./popover.component.scss'],
    imports: [CommonModule]
})
@Handler()
export class PopoverComponent {
  popperInstance: Instance;
  cssClass: string;
  title: string;

  @ViewChild('popover', {static: true}) popover: ElementRef;
  @ViewChild('container', {read: ViewContainerRef}) container: ViewContainerRef;

  constructor(private changeDetector: ChangeDetectorRef) {
  }

  ngAfterViewInit(): void {
    document.addEventListener('click', (event) => {
      if (this.popover.nativeElement && !this.popover.nativeElement.contains(event.target)) {
        this.closePopover();
      }
    }, false);
    $(this.popover.nativeElement).on('click', '*', (event) => {
      if ($(event.target).attr("data-bs-toggle") === "popover") {
        this.closePopover();
      }
    });
  }

  openPopover = (event: PopoverEvent) => {
    setTimeout(() => {
      this.container.clear();
      this.cssClass = event.cssClass;
      this.title = event.title;
      this.container.createEmbeddedView(event.component);
      this.popperInstance = createPopper(event.reference.nativeElement, this.popover.nativeElement, {
        placement: event.placement,
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, 8],
            },
          },
        ]
      });
      this.show();
    }, 0);
  }

  closePopover = () => {
    this.hide();
  }

  show() {
    this.popover.nativeElement.setAttribute('data-show', '');
    this.popperInstance.setOptions((options) => ({
      ...options,
      modifiers: [
        ...options.modifiers,
        {name: 'eventListeners', enabled: true},
      ],
    }));

    setTimeout(() => {
      this.changeDetector.markForCheck();
      setTimeout(() => this.popperInstance.update(), 0);
    }, 0);
  }

  hide() {
    if (this.popperInstance) {
      this.popover.nativeElement.removeAttribute('data-show');
      this.popperInstance.setOptions((options) => ({
        ...options,
        modifiers: [
          ...options.modifiers,
          {name: 'eventListeners', enabled: false},
        ],
      }));
    }
  }
}

interface PopoverEvent {
  component: TemplateRef<any>;
  data?;
  placement: Placement;
  reference: ElementRef;
  cssClass?: string;
  title?: string;
}
