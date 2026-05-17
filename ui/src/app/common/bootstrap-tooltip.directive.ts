import {AfterViewInit, Directive, ElementRef} from "@angular/core";
import tooltip from "bootstrap/js/dist/tooltip";

@Directive({
    selector: '[data-bs-toggle="tooltip"], [data-bs-title]',
    standalone: false
})
export class BootstrapTooltipDirective implements AfterViewInit {
    private bootstrapElement;

    constructor(private element: ElementRef) {
    }

    ngAfterViewInit(): void {
        const element = this.element.nativeElement;
        this.bootstrapElement = new tooltip(this.element.nativeElement, {
            placement: element.getAttribute("data-bs-placement") || "top",
            title: () => element.getAttribute("data-bs-title"),
            container: element.getAttribute("data-bs-container") || "div[appTranslate]",
            customClass: element.classList.contains("notranslate") ? "notranslate" : ""
        });
    }
}
