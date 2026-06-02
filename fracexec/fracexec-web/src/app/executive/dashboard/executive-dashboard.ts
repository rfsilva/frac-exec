import { Component } from '@angular/core';
import { PageHeader } from '../../shared/layout/page-header/page-header';

@Component({
  selector: 'app-executive-dashboard',
  standalone: true,
  imports: [PageHeader],
  template: `
    <app-page-header title="Dashboard" [breadcrumb]="['Executivo', 'Dashboard']" />
    <div style="padding: var(--spacing-6)">
      <p>Conteúdo do dashboard em breve.</p>
    </div>
  `,
})
export class ExecutiveDashboard {}
