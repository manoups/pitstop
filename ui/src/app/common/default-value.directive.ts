import {AfterViewInit, Directive, HostListener, Input} from '@angular/core';
import {NgModel} from '@angular/forms';

@Directive({
    selector: '[appDefaultValue]',
    standalone: false
})
export class DefaultValueDirective implements AfterViewInit {

  @Input() appDefaultValue;

  constructor(private ngModel: NgModel) {
  }

  ngAfterViewInit(): void {
    if (this.ngModel.model === undefined || this.ngModel.model === null) {
      setTimeout(() => this.ngModel.update.emit(this.appDefaultValue), 0);
    }
  }

  @HostListener('blur', ['$event'])
  onBlur(event: UIEvent) {
    if (this.ngModel.model === undefined || this.ngModel.model === null) {
      this.ngModel.update.emit(this.appDefaultValue);
    }
  }

}
