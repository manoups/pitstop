import {AfterViewInit, Component, ElementRef, Type, ViewChild, ViewContainerRef} from '@angular/core';
import {closeConfirmationModal} from '../../app-utils';
import {Handler} from "src/app/common/handler";
import {HandleCommand} from "../handle-command";

@Component({
    selector: 'app-confirmation-modal',
    templateUrl: './confirmation-modal.component.html',
    styleUrls: ['./confirmation-modal.component.css'],
    standalone: false
})
@Handler()
export class ConfirmationModalComponent implements AfterViewInit {

  @ViewChild('modal', {static: true}) modal: ElementRef;
  @ViewChild('container', {read: ViewContainerRef}) container: ViewContainerRef;

  ngAfterViewInit(): void {
    $(this.modal.nativeElement).on('hidden.bs.modal', () => this.container.clear());
  }

  @HandleCommand("openConfirmationModal")
  openConfirmationModal(event: ConfirmationModalPayload) {
    //hide any current modals
    const modalElements = document.body.querySelectorAll('.modal.show, .modal-backdrop.show');
    modalElements.forEach(e => e.classList.remove('show'));
    const wrappedCallback = (confirmed : boolean) => {
      if (!confirmed) {
        modalElements.forEach(e => e.classList.add('show'));
      }
      return event.callback && event.callback(confirmed);
    }

    this.container.clear();
    const componentRef = this.container.createComponent(<any>event.component);
    componentRef.instance['data'] = event.data;
    componentRef.instance['callback'] = (confirmed : boolean) => {
      closeConfirmationModal();
      wrappedCallback(confirmed);
    }
    $(componentRef.location.nativeElement).addClass('modal-content');
    $(this.modal.nativeElement).modal('show');
  }

  @HandleCommand("closeConfirmationModal")
  closeConfirmationModal() {
    $(this.modal.nativeElement).modal('hide');
  }
}

export interface ConfirmationModalPayload {
  component : Type<any>;
  data? : any;
  callback : (boolean) => any;
}
