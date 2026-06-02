import { Component } from '@angular/core';
import { PageHeader } from '../../shared/layout/page-header/page-header';

@Component({ selector: 'app-admin-needs', standalone: true, imports: [PageHeader],
  template: `<app-page-header title="Necessidades" [breadcrumb]="['Admin', 'Necessidades']" />` })
export class AdminNeeds {}
