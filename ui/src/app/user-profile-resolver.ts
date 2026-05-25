import {ResolveFn} from '@angular/router';
import {firstValueFrom} from 'rxjs';
import {UserProfile} from "@pitstop/typescriptmodels/pitstop";
import {subscribeTo} from "./common/app-common-utils";
import {AppContext} from "./app-context";
import {inject} from "@angular/core";

export const userProfileResolver: ResolveFn<UserProfile | undefined> = async () => {
  const appContext = inject(AppContext);
  const profile = await firstValueFrom(subscribeTo("/api/user"));
  appContext.setUserProfile(profile as UserProfile);
  return profile as UserProfile | undefined;
};
