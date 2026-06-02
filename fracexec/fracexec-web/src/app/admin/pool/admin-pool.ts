import { Component } from '@angular/core';
import { PageHeader } from '../../shared/layout/page-header/page-header';

@Component({ selector: 'app-admin-pool', standalone: true, imports: [PageHeader],
  template: `<app-page-header title="Pool de Executivos" [breadcrumb]="['Admin', 'Pool de Executivos']" />` })
export class AdminPool {}
