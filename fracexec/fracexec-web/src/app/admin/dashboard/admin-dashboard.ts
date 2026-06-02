import { Component } from '@angular/core';
import { PageHeader } from '../../shared/layout/page-header/page-header';

@Component({ selector: 'app-admin-dashboard', standalone: true, imports: [PageHeader],
  template: `<app-page-header title="Dashboard" [breadcrumb]="['Admin', 'Dashboard']" />` })
export class AdminDashboard {}
