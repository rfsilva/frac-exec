import { Component } from '@angular/core';
import { AppShell, NavItem } from '../../shared/layout/app-shell/app-shell';

const EXECUTIVE_NAV: NavItem[] = [
  { label: 'Dashboard',     route: '/executive/dashboard',     icon: '⊞' },
  { label: 'Perfil',        route: '/executive/profile',       icon: '◎' },
  { label: 'Engajamentos',  route: '/executive/engagements',   icon: '⊡' },
  { label: 'Oportunidades', route: '/executive/opportunities', icon: '◈' },
  { label: 'Pagamentos',    route: '/executive/payments',      icon: '◇' },
];

@Component({
  selector: 'app-executive-shell',
  standalone: true,
  imports: [AppShell],
  template: `<app-shell [navItems]="navItems" />`,
})
export class ExecutiveShell {
  readonly navItems = EXECUTIVE_NAV;
}
