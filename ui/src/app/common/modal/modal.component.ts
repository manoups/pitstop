import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  TemplateRef,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {Handler} from "src/app/common/handler";
import {HandleCommand} from "../handle-command";
import {defaultModalOptions, ModalOptions, OpenModal} from './modal';
import {View} from '../view';
import Modal from 'bootstrap/js/dist/modal';
import {HandleEvent} from '../handle-event';
import {publishEvent} from "../app-common-utils";
import {cloneDeep} from "lodash";

@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.scss'],
    standalone: false
})
@Handler()
export class ModalComponent extends View implements AfterViewInit {
  changeDetectorRef= inject(ChangeDetectorRef);
  @ViewChild('modal', {static: true}) modal: ElementRef;
  @ViewChild('container', {read: ViewContainerRef}) container: ViewContainerRef;
  options: ModalOptions;
  closeArgs: any;

  ngAfterViewInit(): void {
    $(this.modal.nativeElement).on('shown.bs.modal', () => {
      publishEvent("modalOpened", this, this.modal);
    });
    $(this.modal.nativeElement).on('hidden.bs.modal', () => {
      publishEvent("modalClosed", this, this.modal);
      this.container.clear();
      if (this.options.closeCallback) {
        this.options.closeCallback(this.closeArgs);
        this.closeArgs = null;
      }
    });
  }

  handle = (command: OpenModal) => {
    this.container.clear();
    this.options = command.options || defaultModalOptions;
    setTimeout(() => {
      if (command.component instanceof TemplateRef) {
        this.container.createEmbeddedView(command.component);
      } else {
        const componentRef = this.container.createComponent(<any>command.component);
        const component = componentRef.instance;
        if (command.initializer) {
          command.initializer(component);
        }
        $(componentRef.location.nativeElement).addClass('modal-content');
      }
      const options = cloneDeep(this.options);
      options.backdrop = false;
      Modal.getOrCreateInstance(this.modal.nativeElement, options).show();
      this.changeDetectorRef.detectChanges();
    }, 0);
  };

  closeModalOnClick = (event: MouseEvent, intendedTarget: Element) => {
    if (this.options?.backdrop !== 'static' && event.target === intendedTarget) {
      this.closeModal();
    }
  }

  @HandleCommand("closeModal")
  closeModal(closeArgs?: any) {
    if (closeArgs) {
      this.closeArgs = closeArgs;
    }
    $(this.modal.nativeElement).modal('hide');
  }

  @HandleEvent("commandSuccess")
  onSuccess(returnValue : any) {
    if (this.options.closeOnSuccess) {
      this.closeModal(returnValue);
    }
  }
}
