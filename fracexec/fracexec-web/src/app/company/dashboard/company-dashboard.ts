import { Component } from '@angular/core';
import { PageHeader } from '../../shared/layout/page-header/page-header';

@Component({
  selector: 'app-company-dashboard',
  standalone: true,
  imports: [PageHeader],
  template: `<app-page-header title="Dashboard" [breadcrumb]="['PME', 'Dashboard']" />`,
})
export class CompanyDashboard {}
