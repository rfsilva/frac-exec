import { Component, DestroyRef, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { AppShell, NavItem } from '../../shared/layout/app-shell/app-shell';
import { SealBanner, SealStatus } from '../seal-banner/seal-banner';
import { AvailabilityDrawer } from '../availability-drawer/availability-drawer';
import { AuthService } from '../../core/auth/auth.service';

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
  imports: [AppShell, SealBanner, AvailabilityDrawer],
  template: `
    <div class="exec-layout">
      <!-- AC-2.5: SealBanner non-dismissible acima do content -->
      @if (profileStatus()) {
        <app-seal-banner
          [profileStatus]="profileStatus()!"
          [email]="userEmail()"
          [verificationDate]="null"
          (updateAvailability)="openDrawer()" />
      }
      <app-shell [navItems]="navItems" />
    </div>

    <!-- Drawer de disponibilidade -->
    <app-availability-drawer
      [isOpen]="drawerOpen()"
      [currentDays]="availabilityDays()"
      [currentStatus]="profileStatus() ?? 'INACTIVE'"
      (closed)="drawerOpen.set(false)"
      (saved)="onAvailabilitySaved($event)" />
  `,
  styles: [`
    .exec-layout { display: flex; flex-direction: column; height: 100vh; }
    .exec-layout > app-shell { flex: 1; overflow: hidden; }
  `]
})
export class ExecutiveShell {
  readonly navItems = EXECUTIVE_NAV;

  private readonly http       = inject(HttpClient);
  private readonly auth       = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  @ViewChild(AvailabilityDrawer) private readonly drawerRef?: AvailabilityDrawer;

  readonly profileStatus    = signal<SealStatus | null>(null);
  readonly userEmail        = signal<string>('');
  readonly availabilityDays = signal(20);
  readonly drawerOpen       = signal(false);

  constructor() {
    this.http.get<{
      profileStatus: string;
      availabilityDaysPerMonth: number;
      isComplete: boolean;
    }>('/api/v1/executive/profile')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: p => {
          this.profileStatus.set((p.profileStatus ?? 'INACTIVE') as SealStatus);
          this.availabilityDays.set(p.availabilityDaysPerMonth ?? 20);
        },
        error: () => this.profileStatus.set('INACTIVE'), // P4: fallback visível
      });

    // B3: email via AuthService — evita parsing manual de JWT com atob sem padding
    const user = this.auth.currentUser();
    if (user) this.userEmail.set(user.email);
  }

  openDrawer(): void { this.drawerOpen.set(true); }

  onAvailabilitySaved(payload: { availabilityDaysPerMonth: number; profileStatus: string }): void {
    this.http.patch<{ availabilityDaysPerMonth: number; profileStatus: string }>(
        '/api/v1/executive/profile/availability', payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.availabilityDays.set(res.availabilityDaysPerMonth);
          this.profileStatus.set(res.profileStatus as SealStatus);
          this.drawerOpen.set(false);
          this.drawerRef?.resetSaving();
        },
        error: () => this.drawerRef?.resetSaving(),  // P4: reset saving on error
      });
  }
}
