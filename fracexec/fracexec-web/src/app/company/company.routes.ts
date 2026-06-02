import { Routes } from '@angular/router';
import { CompanyShell } from './company-shell/company-shell';

export const COMPANY_ROUTES: Routes = [
  {
    path: '',
    component: CompanyShell,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/company-dashboard').then(m => m.CompanyDashboard),
      },
      {
        path: 'need/new',
        loadComponent: () =>
          import('./need/company-need-new').then(m => m.CompanyNeedNew),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./payments/company-payments').then(m => m.CompanyPayments),
      },
    ],
  },
];
