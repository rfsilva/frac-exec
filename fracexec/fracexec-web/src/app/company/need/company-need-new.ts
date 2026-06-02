import { Component } from '@angular/core';
import { PageHeader } from '../../shared/layout/page-header/page-header';

@Component({
  selector: 'app-company-need-new',
  standalone: true,
  imports: [PageHeader],
  template: `<app-page-header title="Nova Necessidade" [breadcrumb]="['PME', 'Nova Necessidade']" />`,
})
export class CompanyNeedNew {}
