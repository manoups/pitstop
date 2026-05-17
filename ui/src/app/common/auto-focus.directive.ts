import {AfterViewInit, Directive, ElementRef, Input} from '@angular/core';

/*
  To allow autofocus with binding. See https://pretagteam.com/question/how-to-set-focus-on-element-with-binding
 */

@Directive({
    selector: '[appAutoFocus]',
    standalone: false
})
export class AutoFocusDirective implements AfterViewInit {

  @Input() public appAutoFocus: boolean = false;
  @Input() autoFocusInOverlay: boolean = false;

  public constructor(private el: ElementRef) {
  }

  public ngAfterViewInit() {
    if (this.appAutoFocus) {
      setTimeout(() => {
        let element = ['INPUT', 'BUTTON'].includes(this.el.nativeElement.tagName) ? this.el.nativeElement
          : this.el.nativeElement.querySelector('input,button');
        if (element == null) {
          console.log("autoFocus directive cannot find an 'input' tag to focus");
          return;
        }
        if (this.autoFocusInOverlay) {
          $(window.document).on('shown.bs.modal', function () {
            element.focus();
          });
          $(window.document).on('shown.bs.dropdown', function () {
            element.focus();
          })
        } else {
          element.focus();
        }
      }, 0);
    }
  }
}
