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
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss'
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
