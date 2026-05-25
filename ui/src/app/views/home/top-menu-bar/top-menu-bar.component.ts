import {Component, inject} from '@angular/core';
import {AppContext} from "../../../app-context";
import {AppCommonUtils} from "../../../common/app-common-utils";
import {Handler} from "src/app/common/handler";
import {View} from '../../../common/view';
import {RegisterOperatorComponent} from '../../user/register-operator/register-operator.component';
import Keycloak from "keycloak-js";

@Component({
    selector: 'app-top-menu-bar',
    templateUrl: './top-menu-bar.component.html',
    styleUrls: ['./top-menu-bar.component.scss'],
    standalone: false
})
@Handler()
export class TopMenuBarComponent extends View {
  appContext = inject(AppContext);
  authService = inject(Keycloak);

  signOut() {
    this.authService.logout().then(_ =>
    this.appContext.setUserProfile(undefined)).then(_ =>
    AppCommonUtils.navigateToUrl("/login"));
  }

  protected readonly RegisterOperatorComponent = RegisterOperatorComponent;
}
