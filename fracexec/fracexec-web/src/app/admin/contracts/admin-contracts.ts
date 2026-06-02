import { Component } from '@angular/core';
import { PageHeader } from '../../shared/layout/page-header/page-header';

@Component({ selector: 'app-admin-contracts', standalone: true, imports: [PageHeader],
  template: `<app-page-header title="Contratos" [breadcrumb]="['Admin', 'Contratos']" />` })
export class AdminContracts {}
