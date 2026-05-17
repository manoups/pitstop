import {Component, ElementRef, EventEmitter, Output, ViewChild} from '@angular/core';

@Component({
    selector: 'app-confirmation-toggle',
    templateUrl: './confirmation-toggle.component.html',
    styleUrls: ['./confirmation-toggle.component.css'],
    standalone: false
})
export class ConfirmationToggleComponent {
  @Output() confirmed = new EventEmitter();

  @ViewChild('modal', { static: true }) modal: ElementRef;

  toggleModal() {
    $(this.modal.nativeElement).modal("show");
  }
}
