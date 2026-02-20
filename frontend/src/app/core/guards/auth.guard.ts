import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const ownerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isOwner()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const tenantGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated() || !authService.isTenant()) {
    router.navigate(['/login']);
    return false;
  }

  if (authService.mustChangePassword()) {
    router.navigate(['/change-password']);
    return false;
  }

  return true;
};

export const forceChangePasswordGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  if (!authService.mustChangePassword()) {
    const role = authService.user()?.role;
    router.navigate([role === 'owner' ? '/owner/dashboard' : '/tenant/dashboard']);
    return false;
  }

  return true;
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  if (authService.mustChangePassword()) {
    router.navigate(['/change-password']);
    return false;
  }

  const role = authService.user()?.role;
  router.navigate([role === 'owner' ? '/owner/dashboard' : '/tenant/dashboard']);
  return false;
};
