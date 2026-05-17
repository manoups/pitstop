import {Component, inject} from '@angular/core';
import {AppContext} from '../../../app-context';
import {cloneObject} from '../../../common/utils';
import {AppCommonUtils} from "../../../common/app-common-utils";
import {Handler} from "../../../common/handler";
import {View} from "../../../common/view";
import {AuthenticationService} from "../../../authentication/authentication.service";

@Component({
    selector: 'app-edit-profile-general',
    templateUrl: './edit-profile-general.component.html',
    styleUrls: ['./edit-profile-general.component.scss'],
    standalone: false
})
@Handler()
export class EditProfileGeneralComponent extends View {
  authService: AuthenticationService = inject(AuthenticationService);
  // command: UpdateUser = {userId: AppContext.userProfile.userId, details: cloneObject(AppContext.userProfile.details)};

  updateInfo() {
    // this.sendCommand("host.flux.service.user.api.UpdateUser", this.command, () => {
    //   AppCommonUtils.registerSuccess("You have successfully updated your profile");
    //   AppContext.userProfile.details = cloneObject(this.command.details);
    // });
  }
}
