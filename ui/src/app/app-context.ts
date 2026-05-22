import {AppCommonUtils} from "./common/app-common-utils";
import {environment} from '../environments/environment';
import {Role, UserProfile} from '@pitstop/typescriptmodels/pitstop';
import {BehaviorSubject} from "rxjs";
import {Injectable} from "@angular/core";
import {toSignal} from "@angular/core/rxjs-interop";

@Injectable({providedIn: 'root'})
export class AppContext {
  private userProfile$$ = new BehaviorSubject<UserProfile | undefined>(undefined);

  userProfile = toSignal(this.userProfile$$);

  initials = '';

  setUserProfile = (userProfile: UserProfile | undefined) => {
    if (!userProfile) {
      AppCommonUtils.clearCache();
    }
    this.initials = userProfile
      ? (userProfile.details.firstName + ' ' + userProfile.details.lastName)
        .match(/(\b\S)?/g)!.join('').match(/(^\S|\S$)?/g)!.join('').toUpperCase()
      : '';
    this.userProfile$$.next(userProfile);
  };

  isAdmin = () =>
    this.userProfile()?.userRole === Role.admin;

  isProduction = () => environment.production;
}
