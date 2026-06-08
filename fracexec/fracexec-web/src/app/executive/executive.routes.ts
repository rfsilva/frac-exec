import { Routes } from '@angular/router';
import { ExecutiveShell } from './executive-shell/executive-shell';
import { profileGuard } from '../core/auth/profile.guard';

export const EXECUTIVE_ROUTES: Routes = [
  {
    path: '',
    component: ExecutiveShell,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        // profile não tem profileGuard — é o destino do redirect
        path: 'profile',
        loadComponent: () =>
          import('./profile/executive-profile').then(m => m.ExecutiveProfile),
      },
      {
        path: 'dashboard',
        canActivate: [profileGuard],
        loadComponent: () =>
          import('./dashboard/executive-dashboard').then(m => m.ExecutiveDashboard),
      },
      {
        path: 'engagements',
        canActivate: [profileGuard],
        loadComponent: () =>
          import('./engagements/executive-engagements').then(m => m.ExecutiveEngagements),
      },
      {
        path: 'opportunities',
        canActivate: [profileGuard],
        loadComponent: () =>
          import('./opportunities/executive-opportunities').then(m => m.ExecutiveOpportunities),
      },
      {
        path: 'payments',
        canActivate: [profileGuard],
        loadComponent: () =>
          import('./payments/executive-payments').then(m => m.ExecutivePayments),
      },
    ],
  },
];
