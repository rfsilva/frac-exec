import { Component } from '@angular/core';
import { PageHeader } from '../../shared/layout/page-header/page-header';

@Component({
  selector: 'app-executive-opportunities',
  standalone: true,
  imports: [PageHeader],
  template: `<app-page-header title="Oportunidades" [breadcrumb]="['Executivo', 'Oportunidades']" />`,
})
export class ExecutiveOpportunities {}
