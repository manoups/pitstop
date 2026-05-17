import {Component, inject, ViewContainerRef} from '@angular/core';
import {AppCommonUtils} from "./common/app-common-utils";
import {Handler} from "src/app/common/handler";
import {HandleQuery} from "./common/handle-query";
import {Observable} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {HandleCommand} from './common/handle-command';
import {ModalComponent} from './common/modal/modal.component';
import {defaultModalOptions, OpenModal} from './common/modal/modal';
import {Incident, Operator, UiUpdate, UserProfile} from '@pitstop/typescriptmodels/pitstop';
import { HttpClient } from '@angular/common/http';
import * as jsonPatch from "fast-json-patch";
import {HandleEvent} from './common/handle-event';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
@Handler()
export class AppComponent {
  appUtils = AppCommonUtils;
  route = inject(ActivatedRoute);
  viewContainerRef: ViewContainerRef = inject(ViewContainerRef);
  http = inject(HttpClient);

  @HandleEvent("Incident")
  handleOrganisationUpdate(event: UiUpdate) {
    AppCommonUtils.modifyQueryCache("/api/incidents", (entries: Incident[]) => {
      const before = entries.find(o => o.incidentId === event.id);
      const patchResult = jsonPatch.applyPatch(before, event.patch);
      const after = patchResult.newDocument;
      if (!before) {
        entries.push(after);
      }
      return [...entries];
    });
  }

  @HandleEvent("UserProfile")
  handleUserUpdate(event: UiUpdate) {
    AppCommonUtils.modifyQueryCache("/api/user", (user: UserProfile) =>
      event.id === user.userId ? jsonPatch.applyPatch(user, event.patch).newDocument : user);
  }

  @HandleEvent("Operator")
  handleOperatorUpdate(event: UiUpdate) {
    AppCommonUtils.modifyQueryCache("/api/operators", (entries: Operator[]) => {
      const before = entries.find(o => o.operatorId === event.id);
      const patchResult = jsonPatch.applyPatch(before, event.patch);
      const after = patchResult.newDocument;
      if (!before) {
        entries.push(after);
      }
      return [...entries];
    });
  }

  @HandleCommand("openModal")
  openModal(command: OpenModal) {
    const container = command.container || this.viewContainerRef;
    const modal = container.createComponent(ModalComponent);
    container.element.nativeElement.appendChild(modal.location.nativeElement);
    command.options = command.options || defaultModalOptions;
    const optionsCallback = command.options.closeCallback;
    command.options.closeCallback = (args?) => {
      try {
        if (optionsCallback) {
          optionsCallback(args);
        }
      } finally {
        modal.destroy();
      }
    }
    setTimeout(() => modal.instance.handle(command), 0);
  }
}
