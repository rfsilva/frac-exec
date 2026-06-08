import { Component } from '@angular/core';
import { AppShell, NavItem } from '../../shared/layout/app-shell/app-shell';

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard',          route: '/admin/dashboard',   icon: '⊞' },
  { label: 'Candidaturas',       route: '/admin/candidates',  icon: '◉' },
  { label: 'Pool de Executivos', route: '/admin/pool',        icon: '⊟' },
  { label: 'Necessidades',       route: '/admin/needs',       icon: '◈' },
  { label: 'Empresas',           route: '/admin/companies',   icon: '⊛' },
  { label: 'Engajamentos',       route: '/admin/engagements', icon: '⊡' },
  { label: 'Contratos',          route: '/admin/contracts',   icon: '⊠' },
];

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [AppShell],
  template: `<app-shell [navItems]="navItems" />`,
})
export class AdminShell {
  readonly navItems = ADMIN_NAV;
}
