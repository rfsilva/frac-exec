import { Component } from '@angular/core';
import { AppShell, NavItem } from '../../shared/layout/app-shell/app-shell';

const COMPANY_NAV: NavItem[] = [
  { label: 'Dashboard',        route: '/company/dashboard', icon: '⊞' },
  { label: 'Nova Necessidade', route: '/company/need/new',  icon: '⊕' },
  { label: 'Pagamentos',       route: '/company/payments',  icon: '◇' },
];

@Component({
  selector: 'app-company-shell',
  standalone: true,
  imports: [AppShell],
  templateUrl: './company-shell.html',
  styleUrl: './company-shell.scss',
})
export class CompanyShell {
  readonly navItems = COMPANY_NAV;
}
