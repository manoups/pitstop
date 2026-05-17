import {Component, ElementRef, EventEmitter, Output, ViewChild} from '@angular/core';
import {checkValidity} from '../utils';

@Component({
    selector: 'app-form',
    templateUrl: './form.component.html',
    styleUrls: ['./form.component.css'],
    standalone: false
})
export class FormComponent {
  @ViewChild('form', {static: true}) form: ElementRef;
  @Output() submit = new EventEmitter<SubmitEvent>();

  submitIfValid(submitEvent : SubmitEvent) {
    if (submitEvent.submitter?.getAttribute("type") !== 'submit') {
      return;
    }
    if (checkValidity(this.form)) {
      this.submit.emit(submitEvent);
    }
  }

  checkValidity() : boolean {
    return this.form.nativeElement.checkValidity();
  }

  reset() {
    this.form.nativeElement.reset();
  }
}
