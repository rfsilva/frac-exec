import { Component } from '@angular/core';
import { PageHeader } from '../../shared/layout/page-header/page-header';

@Component({
  selector: 'app-executive-engagements',
  standalone: true,
  imports: [PageHeader],
  template: `<app-page-header title="Engajamentos" [breadcrumb]="['Executivo', 'Engajamentos']" />`,
})
export class ExecutiveEngagements {}
