import { Component } from '@angular/core';
import { PageHeader } from '../../shared/layout/page-header/page-header';

@Component({ selector: 'app-admin-engagements', standalone: true, imports: [PageHeader],
  template: `<app-page-header title="Engajamentos" [breadcrumb]="['Admin', 'Engajamentos']" />` })
export class AdminEngagements {}
