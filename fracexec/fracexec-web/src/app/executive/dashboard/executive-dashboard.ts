import { Component, DestroyRef, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { PageHeader } from '../../shared/layout/page-header/page-header';
import { AvailabilityDrawer } from '../availability-drawer/availability-drawer';

@Component({
  selector: 'app-executive-dashboard',
  standalone: true,
  imports: [PageHeader, AvailabilityDrawer],
  template: `
    <app-page-header title="Dashboard" [breadcrumb]="['Executivo', 'Dashboard']" />

    <div class="page-body">

      <!-- AC-2.5: Widget de disponibilidade -->
      <div class="widget-card">
        <h2 class="widget-title">Disponibilidade</h2>
        <div class="availability-row">
          <div class="progress-wrap">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="progressPct"></div>
            </div>
            <span class="days-value">{{ availabilityDays() }} / 20</span>
          </div>
          <button class="btn-edit" (click)="drawerOpen.set(true)"
                  aria-label="Editar disponibilidade">Editar</button>
        </div>
        @if (savedMsg()) {
          <p class="saved-msg">Disponibilidade atualizada.</p>
        }
      </div>

    </div>

    <!-- Drawer de disponibilidade -->
    <app-availability-drawer
      [isOpen]="drawerOpen()"
      [currentDays]="availabilityDays()"
      [currentStatus]="profileStatus() ?? 'ACTIVE'"
      (closed)="drawerOpen.set(false)"
      (saved)="onSaved($event)" />
  `,
  styles: [`
    .page-body { padding: var(--spacing-6); }
    .widget-card {
      background: var(--color-surface-card); border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg); padding: var(--spacing-5); max-width: 480px;
    }
    .widget-title { font-family: var(--font-display); font-size: 16px; font-weight: 600;
                    color: var(--color-text-primary); margin: 0 0 var(--spacing-4); }
    .availability-row { display: flex; align-items: center; gap: var(--spacing-4); }
    .progress-wrap { flex: 1; display: flex; flex-direction: column; gap: var(--spacing-2); }
    .progress-bar {
      height: 8px; background: var(--color-surface-muted); border-radius: var(--radius-full); overflow: hidden;
    }
    .progress-fill {
      height: 100%; background: var(--color-brand-accent);
      border-radius: var(--radius-full); transition: width 0.3s;
    }
    .days-value {
      font-family: var(--font-mono); font-size: 14px; font-weight: 600;
      color: var(--color-text-primary);
    }
    .btn-edit {
      padding: var(--spacing-2) var(--spacing-4); background: transparent;
      color: var(--color-brand-accent); border: 1px solid var(--color-brand-accent);
      border-radius: var(--radius-md); font-size: 13px; cursor: pointer;
      white-space: nowrap;
    }
    .btn-edit:hover { background: rgba(77, 199, 138, 0.08); }
    .saved-msg { font-size: 12px; color: var(--color-state-success);
                 margin: var(--spacing-3) 0 0; }
  `]
})
export class ExecutiveDashboard {

  private readonly http       = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  @ViewChild(AvailabilityDrawer) private drawerRef?: AvailabilityDrawer;

  readonly availabilityDays = signal(20);
  readonly profileStatus    = signal<string | null>(null); // P3: null até o GET retornar
  readonly drawerOpen       = signal(false);
  readonly savedMsg         = signal(false);

  // B4: getter retorna número diretamente (não lambda) para binding correto
  get progressPct(): number { return Math.round((this.availabilityDays() / 20) * 100); }

  constructor() {
    this.http.get<{ availabilityDaysPerMonth: number; profileStatus: string }>(
        '/api/v1/executive/profile')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  p  => { this.availabilityDays.set(p.availabilityDaysPerMonth ?? 20); this.profileStatus.set(p.profileStatus ?? 'ACTIVE'); },
        error: () => this.profileStatus.set('ACTIVE'), // P4: fallback
      });
  }

  onSaved(payload: { availabilityDaysPerMonth: number; profileStatus: string }): void {
    this.http.patch<{ availabilityDaysPerMonth: number; profileStatus: string }>(
        '/api/v1/executive/profile/availability', payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.availabilityDays.set(res.availabilityDaysPerMonth);
          this.profileStatus.set(res.profileStatus);
          this.drawerOpen.set(false);
          this.drawerRef?.resetSaving();
          this.savedMsg.set(true);
          setTimeout(() => this.savedMsg.set(false), 4000);
        },
        error: () => this.drawerRef?.resetSaving(), // P4: reset saving on error
      });
  }
}
