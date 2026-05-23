import {Component, inject} from '@angular/core';
import {Handler} from "../../../common/handler";
import {View} from "../../../common/view";
import Keycloak from "keycloak-js";

@Component({
  selector: 'app-edit-profile-general',
  templateUrl: './edit-profile-general.component.html',
  styleUrls: ['./edit-profile-general.component.scss'],
  standalone: false
})
@Handler()
export class EditProfileGeneralComponent extends View {
  authService = inject(Keycloak);

  // command: UpdateUser = {userId: AppContext.userProfile.userId, details: cloneObject(AppContext.userProfile.details)};

  updateInfo() {
    // this.sendCommand("host.flux.service.user.api.UpdateUser", this.command, () => {
    //   AppCommonUtils.registerSuccess("You have successfully updated your profile");
    //   AppContext.userProfile.details = cloneObject(this.command.details);
    // });
  }
}
