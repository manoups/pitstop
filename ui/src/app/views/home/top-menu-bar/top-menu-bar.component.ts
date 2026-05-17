import {Component, inject} from '@angular/core';
import {AppContext} from "../../../app-context";
import {AppCommonUtils} from "../../../common/app-common-utils";
import {Handler} from "src/app/common/handler";
import {View} from '../../../common/view';
import {RegisterOperatorComponent} from '../../user/register-operator/register-operator.component';
import {KeycloakService} from "keycloak-angular";

@Component({
    selector: 'app-top-menu-bar',
    templateUrl: './top-menu-bar.component.html',
    styleUrls: ['./top-menu-bar.component.scss'],
    standalone: false
})
@Handler()
export class TopMenuBarComponent extends View {
  appContext = AppContext;
  authService = inject(KeycloakService);

  signOut() {
    this.authService.logout();
    AppContext.setUserProfile(undefined);
    AppCommonUtils.navigateToUrl("/login");
  }

  protected readonly RegisterOperatorComponent = RegisterOperatorComponent;
}
