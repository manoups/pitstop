import {Component, ElementRef, Input, TemplateRef} from '@angular/core';
import {checkValidity} from "../utils";

@Component({
    selector: 'modal-confirm-autofocus',
    templateUrl: './modal-confirm.component.html',
    styleUrls: ['./modal-confirm.component.scss'],
    standalone: false
})
export class ModalConfirmAutofocus {
  @Input() data: ModalConfirmAutofocusData;
  callback: (boolean, string?) => any;

  constructor(private element: ElementRef) {
  }

  get title() {
    return this.data?.title || "Danger";
  }

  get points() {
    return this.data?.points || [];
  }

  get confirmText() {
    return this.data?.confirmText || "Ok";
  }

  get cancelText() {
    return this.data?.cancelText || "Cancel";
  }

  validateAndSubmit = () => {
    if (!this.data.body || checkValidity(this.element)) {
      this.callback(true);
    }
  }
}

export interface ModalConfirmAutofocusData {
  type: string | 'warning' | 'info' | 'danger';
  title: string;
  modalSize: null | 'sm' | 'lg' | 'xl';
  message: string;
  innerHtmlMessage: string;
  points: string[];
  afterPointsMessage: string;
  question: string;
  innerHtmlQuestion: string;
  confirmText: string;
  cancelText: string;
  withReason?: boolean;
  reason?: string;
  body: TemplateRef<any>;
}
