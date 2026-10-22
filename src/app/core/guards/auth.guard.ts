import { inject } from '@angular/core';

import {
  ActivatedRouteSnapshot,
  CanActivateChildFn,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { AppRole } from '../auth/app-role';

async function checkAccess(
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Promise<boolean | UrlTree> {
  const auth = inject(AuthService);
  const router = inject(Router);

  let token: string | null = null;

  try {
    token = await auth.getValidToken();
  } catch {
    token = null;
  }

  if (!token) {
    try {
      await auth.login(state.url);
    } catch {
      return router.createUrlTree(['/']);
    }

    return false;
  }

  const requiredRoles =
    (route.data['roles'] ?? []) as AppRole[];

  if (
    requiredRoles.length === 0 ||
    auth.hasAnyRole(requiredRoles)
  ) {
    return true;
  }

  return router.createUrlTree(['/forbidden']);
}

export const authGuard: CanActivateFn = (
  route,
  state
) => checkAccess(route, state);

export const authChildGuard: CanActivateChildFn = (
  route,
  state
) => checkAccess(route, state);