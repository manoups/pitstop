import {Directive, ElementRef, Input, TemplateRef, ViewContainerRef} from "@angular/core";
import {Placement} from "@popperjs/core/lib/enums";
import {PopoverComponent} from "./popover.component";

@Directive({
    selector: "[onPopover]",
    standalone: false
})
export class PopoverDirective {
  @Input() popoverContent: TemplateRef<any>;
  @Input() placement: Placement;
  @Input() popoverClass: string;
  @Input() popoverTitle: string;

  popover: PopoverComponent;

  constructor(private el: ElementRef, private viewContainerRef: ViewContainerRef) {
    this.createPopover();
    $(el.nativeElement).on("click", () => {
      this.openPopover();
    });
  }

  private createPopover = () => {
    const componentRef = this.viewContainerRef.createComponent(PopoverComponent);
    this.viewContainerRef.insert(componentRef.hostView);
    this.popover = componentRef.instance;
  }

  openPopover = () => {
    this.popover.openPopover({
      component: this.popoverContent,
      reference: this.el,
      placement: this.placement,
      cssClass: this.popoverClass,
      title: this.popoverTitle
    });
  }
}
