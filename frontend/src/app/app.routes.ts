import { Routes } from '@angular/router';
import { authGuard, ownerGuard, tenantGuard, guestGuard, forceChangePasswordGuard } from './core/guards/auth.guard';
import { inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';

const logoutGuard = () => {
  inject(AuthService).logout();
  return false;
};

export const routes: Routes = [
  {
    path: '',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent),
  },
  { path: 'logout', canActivate: [logoutGuard], children: [] },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'change-password',
    canActivate: [forceChangePasswordGuard],
    loadComponent: () => import('./features/auth/force-change-password/force-change-password.component').then(m => m.ForceChangePasswordComponent),
  },
  {
    path: 'welcome',
    canActivate: [authGuard],
    loadComponent: () => import('./features/auth/welcome/welcome.component').then(m => m.WelcomeComponent),
  },
  {
    path: 'owner',
    canActivate: [ownerGuard],
    loadComponent: () => import('./shared/layouts/owner-layout/owner-layout.component').then(m => m.OwnerLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/owner/dashboard/dashboard.component').then(m => m.OwnerDashboardComponent) },
      { path: 'properties', loadComponent: () => import('./features/owner/properties/properties.component').then(m => m.OwnerPropertiesComponent) },
      { path: 'tenants', loadComponent: () => import('./features/owner/tenants/tenants.component').then(m => m.OwnerTenantsComponent) },
      { path: 'tenants/:id', loadComponent: () => import('./features/owner/tenants/tenant-detail.component').then(m => m.OwnerTenantDetailComponent) },
      { path: 'payments', loadComponent: () => import('./features/owner/payments/payments.component').then(m => m.OwnerPaymentsComponent) },
      { path: 'invoices', loadComponent: () => import('./features/owner/invoices/invoices.component').then(m => m.OwnerInvoicesComponent) },
      { path: 'profile', loadComponent: () => import('./features/owner/profile/profile.component').then(m => m.OwnerProfileComponent) },
    ],
  },
  {
    path: 'tenant',
    canActivate: [tenantGuard],
    loadComponent: () => import('./shared/layouts/tenant-layout/tenant-layout.component').then(m => m.TenantLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/tenant/dashboard/dashboard.component').then(m => m.TenantDashboardComponent) },
      { path: 'incidents', loadComponent: () => import('./features/tenant/incidents/incidents.component').then(m => m.TenantIncidentsComponent) },
      { path: 'profile', loadComponent: () => import('./features/tenant/profile/profile.component').then(m => m.TenantProfileComponent) },
    ],
  },
  { path: '**', redirectTo: '/login' },
];
