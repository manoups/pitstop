import {ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanActivateFn, UrlTree} from '@angular/router';
import { inject } from '@angular/core';
import { createAuthGuard, AuthGuardData } from 'keycloak-angular';
import Keycloak from "keycloak-js";

const isAccessAllowed = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
  authData: AuthGuardData
): Promise<boolean | UrlTree> => {
  const { authenticated, grantedRoles } = authData;
  console.log('[AuthGuard]', state.url, {authenticated, grantedRoles});

  // Not signed in → redirect to Keycloak login page
  if (!authenticated) {
    const keycloak = inject(Keycloak);
    await keycloak.login({redirectUri: window.location.origin + state.url});
    return false;
  }

  // No role requirement on this route → allow any authenticated user
  const requiredRole = route.data['role'] as string | undefined;
  if (!requiredRole) {
    return true;
  }

  const hasRequiredRole = (role: string): boolean =>
    Object.values(grantedRoles.resourceRoles).some((roles) => roles.includes(role));

  if (authenticated && hasRequiredRole(requiredRole)) {
    return true;
  }

  const router = inject(Router);
  return router.parseUrl('/forbidden');
};

export const canActivateAuthRole = createAuthGuard<CanActivateFn>(isAccessAllowed);
