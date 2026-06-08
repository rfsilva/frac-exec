import { Component, inject, Input } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../core/models/user.model';

export interface NavItem {
  label: string;
  route: string;
  icon: string;  // Unicode/emoji icon shown when sidebar is collapsed
}

const ROLE_LABELS: Record<Role, string> = {
  EXECUTIVE: 'Executivo',
  PME:       'PME',
  ADMIN:     'Administrador',
};

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <aside class="sidebar" aria-label="Menu de navegação">

        <div class="sidebar-header">
          <div class="avatar">{{ initials }}</div>
          <div class="user-info">
            <span class="user-name">{{ displayName }}</span>
            <span class="user-role">{{ roleLabel }}</span>
          </div>
        </div>

        <nav class="sidebar-nav" aria-label="Portal">
          @for (item of navItems; track item.route) {
            <a
              class="nav-item"
              [routerLink]="item.route"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: false }"
            >
              <span class="icon" aria-hidden="true">{{ item.icon }}</span>
              <span class="label">{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <button class="btn-logout" (click)="logout()">Sair</button>
        </div>

      </aside>

      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    .sidebar {
      width: 240px;
      min-width: 240px;
      background-color: var(--color-brand-primary);
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow-y: auto;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-3);
      padding: var(--spacing-5) var(--spacing-4);
      border-bottom: 1px solid rgba(77, 199, 138, 0.12);
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      background-color: var(--color-brand-accent);
      color: var(--color-brand-primary);
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .user-name {
      color: var(--color-text-inverse);
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      color: rgba(234, 242, 238, 0.55);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .sidebar-nav {
      flex: 1;
      padding: var(--spacing-3) 0;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-3);
      padding: var(--spacing-3) var(--spacing-4);
      color: rgba(234, 242, 238, 0.65);
      border-left: 3px solid transparent;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.15s, color 0.15s;
      cursor: pointer;
    }

    .nav-item:hover {
      color: var(--color-text-inverse);
      background: rgba(77, 199, 138, 0.07);
    }

    .nav-item.active {
      color: var(--color-brand-accent);
      border-left-color: var(--color-brand-accent);
      background: rgba(77, 199, 138, 0.10);
    }

    .icon {
      font-size: 16px;
      flex-shrink: 0;
      width: 20px;
      text-align: center;
    }

    .sidebar-footer {
      padding: var(--spacing-4);
      border-top: 1px solid rgba(77, 199, 138, 0.12);
    }

    .btn-logout {
      width: 100%;
      padding: var(--spacing-2) var(--spacing-4);
      background: transparent;
      color: rgba(234, 242, 238, 0.65);
      border: 1px solid rgba(234, 242, 238, 0.2);
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }

    .btn-logout:hover {
      background: rgba(255, 255, 255, 0.06);
      color: var(--color-text-inverse);
    }

    .content {
      flex: 1;
      overflow-y: auto;
      background-color: var(--color-surface-bg);
    }

    /* AC-9: sidebar collapses to icon-only at ≤ 768px */
    @media (max-width: 768px) {
      .sidebar { width: 60px; min-width: 60px; }
      .user-info, .label { display: none; }
      .avatar { margin: 0 auto; }
      .sidebar-header { justify-content: center; padding: var(--spacing-4) var(--spacing-2); }
      .nav-item { justify-content: center; padding: var(--spacing-3) var(--spacing-2); gap: 0; }
      .btn-logout { font-size: 10px; padding: var(--spacing-2); }
    }
  `]
})
export class AppShell {
  @Input({ required: true }) navItems!: NavItem[];

  private readonly auth = inject(AuthService);

  // B2: exibe parte local do email (antes do @) como nome amigável
  get displayName(): string {
    const email = this.auth.currentUser()?.email ?? '';
    return email.split('@')[0] || email;
  }

  // P1: label amigável em português
  get roleLabel(): string {
    const role = this.auth.currentUser()?.role;
    return role ? (ROLE_LABELS[role] ?? role) : '';
  }

  get initials(): string {
    const name = this.displayName;
    return name ? name.substring(0, 2).toUpperCase() : '??';
  }

  logout(): void { this.auth.logout(); }
}
