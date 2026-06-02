import { Routes } from '@angular/router';
import { AdminShell } from './admin-shell/admin-shell';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminShell,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/admin-dashboard').then(m => m.AdminDashboard),
      },
      {
        path: 'candidates',
        loadComponent: () =>
          import('./candidates/admin-candidates').then(m => m.AdminCandidates),
      },
      {
        path: 'candidates/:id',
        loadComponent: () =>
          import('./candidates/candidate-detail/candidate-detail').then(m => m.CandidateDetail),
      },
      {
        path: 'pool',
        loadComponent: () =>
          import('./pool/admin-pool').then(m => m.AdminPool),
      },
      {
        path: 'needs',
        loadComponent: () =>
          import('./needs/admin-needs').then(m => m.AdminNeeds),
      },
      {
        path: 'engagements',
        loadComponent: () =>
          import('./engagements/admin-engagements').then(m => m.AdminEngagements),
      },
      {
        path: 'contracts',
        loadComponent: () =>
          import('./contracts/admin-contracts').then(m => m.AdminContracts),
      },
    ],
  },
];
