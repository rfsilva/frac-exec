import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  // Public routes (no auth required)
  {
    path: 'apply',
    loadComponent: () => import('./shared/pages/apply/apply').then(m => m.Apply),
  },
  {
    path: 'login',
    loadComponent: () => import('./shared/pages/login/login').then(m => m.Login),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./shared/pages/forgot-password/forgot-password').then(m => m.ForgotPassword),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./shared/pages/reset-password/reset-password').then(m => m.ResetPassword),
  },
  {
    path: 'register',
    loadComponent: () => import('./company/registration/company-registration').then(m => m.CompanyRegistration),
  },

  // Protected portals (lazy-loaded, role-guarded)
  {
    path: 'executive',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['EXECUTIVE'] },
    loadChildren: () => import('./executive/executive.routes').then(m => m.EXECUTIVE_ROUTES),
  },
  {
    path: 'company',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PME'] },
    loadChildren: () => import('./company/company.routes').then(m => m.COMPANY_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },

  // Default redirect
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
