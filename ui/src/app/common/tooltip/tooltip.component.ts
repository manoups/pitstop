import {AfterViewInit, Component, ElementRef, Input, ViewChild, ViewEncapsulation} from '@angular/core';
import {BasePlacement, Placement} from "@popperjs/core/lib/enums";

@Component({
    selector: 'app-tooltip',
    templateUrl: './tooltip.component.html',
    styleUrls: ['./tooltip.component.css'],
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class TooltipComponent implements AfterViewInit {
  @Input() wide: boolean = true;
  @Input() autoShow: boolean;
  @Input() autoOpenDelay: number;
  @Input() placement?: BasePlacement;
  @Input() disabled: boolean;
  @Input() keepOpen: boolean;

  @ViewChild("trigger") trigger: ElementRef;
  @ViewChild("tooltipContent") tooltipContent: ElementRef;


  private tooltipElement: JQuery<any>;

  ngAfterViewInit(): void {
    if (this.autoShow) {
      setTimeout(() => this.open(), this.autoOpenDelay || 0);
    }
  }

  open() {
    this.tooltipElement = $(this.trigger.nativeElement).tooltip({
      title: this.tooltipContent.nativeElement,
      html: true,
      sanitize: true,
      placement: this.placement || "bottom"
    });
    this.tooltipElement.tooltip("show");
  }

  toggle() {
    this.tooltipElement?.tooltip("toggle");
  }

  close() {
    this.tooltipElement?.tooltip("hide");
  }
}
