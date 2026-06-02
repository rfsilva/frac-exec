import { Component } from '@angular/core';
import { PageHeader } from '../../shared/layout/page-header/page-header';

@Component({
  selector: 'app-company-payments',
  standalone: true,
  imports: [PageHeader],
  template: `<app-page-header title="Pagamentos" [breadcrumb]="['PME', 'Pagamentos']" />`,
})
export class CompanyPayments {}
