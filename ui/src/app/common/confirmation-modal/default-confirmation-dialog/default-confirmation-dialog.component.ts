import {Component} from '@angular/core';

@Component({
    selector: 'app-default-confirmation-dialog',
    templateUrl: './default-confirmation-dialog.component.html',
    styleUrls: ['./default-confirmation-dialog.component.css'],
    standalone: false
})
export class DefaultConfirmationDialogComponent {

  callback: (boolean) => any;

  continueEditing = () => {
    this.callback(false);
  };

  close = () => {
    this.callback(true);
  };
}
