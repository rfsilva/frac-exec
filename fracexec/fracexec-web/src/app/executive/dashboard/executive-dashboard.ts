import { Component, DestroyRef, ViewChild, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { PageHeader } from '../../shared/layout/page-header/page-header';
import { AvailabilityDrawer } from '../availability-drawer/availability-drawer';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';
import { StatusBadge, BadgeVariant } from '../../shared/components/status-badge/status-badge';

interface DashData {
  activeEngagementsCount: number; committedDaysMonth: number;
  nextTransferAmount: number; pendingOpportunitiesCount: number;
  activeEngagements: { id: string; companyName: string; cLevelType: string; scopeDaysPerMonth: number; status: string }[];
  recentOpportunity: { id: string; cLevelType: string; companySector: string; status: string } | null;
}

@Component({
  selector: 'app-executive-dashboard',
  standalone: true,
  imports: [PageHeader, AvailabilityDrawer, LoadingSkeleton, StatusBadge, RouterLink, DecimalPipe],
  template: `
    <app-page-header title="Dashboard" [breadcrumb]="['Executivo', 'Dashboard']" />

    <div class="page-body">

      <!-- Story 6.1: Stat cards -->
      @if (dashLoading()) {
        <app-loading-skeleton type="card" />
      } @else if (dash()) {
        <div class="stat-row">
          <div class="stat-card">
            <span class="stat-label">Engajamentos ativos</span>
            <span class="stat-value">{{ dash()!.activeEngagementsCount }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Dias comprometidos</span>
            <span class="stat-value mono">{{ dash()!.committedDaysMonth }} dias/mês</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Próximo repasse</span>
            <span class="stat-value mono">R$ {{ dash()!.nextTransferAmount | number:'1.2-2' }}</span>
          </div>
          <div class="stat-card" [class.stat-card--alert]="dash()!.pendingOpportunitiesCount > 0">
            <span class="stat-label">Oportunidades pendentes</span>
            <span class="stat-value">{{ dash()!.pendingOpportunitiesCount }}</span>
          </div>
        </div>

        <!-- Engajamentos ativos -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">Engajamentos ativos</h2>
            <a routerLink="/executive/engagements" class="section-link">Ver todos →</a>
          </div>
          @if (dash()!.activeEngagements.length === 0) {
            <p class="empty">Nenhum engajamento ativo no momento.</p>
          } @else {
            @for (e of dash()!.activeEngagements; track e.id) {
              <div class="eng-row">
                <div class="eng-info">
                  <span class="eng-company">{{ e.companyName }}</span>
                  <span class="eng-role">{{ e.cLevelType }} · {{ e.scopeDaysPerMonth }} dias/mês</span>
                </div>
                <app-status-badge [variant]="engStatus(e.status)" [label]="e.status" />
              </div>
            }
          }
        </div>

        <!-- Oportunidades -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">Oportunidades</h2>
            <a routerLink="/executive/opportunities" class="section-link">Ver todas →</a>
          </div>
          @if (dash()!.pendingOpportunitiesCount === 0) {
            <p class="empty">Nenhuma oportunidade aguardando resposta.</p>
          } @else if (dash()!.recentOpportunity) {
            <div class="opp-preview">
              <span class="opp-badge">{{ dash()!.recentOpportunity!.cLevelType }}</span>
              <span class="opp-sector">{{ dash()!.recentOpportunity!.companySector }}</span>
              <span class="opp-count">+{{ dash()!.pendingOpportunitiesCount - 1 }} mais</span>
            </div>
          }
        </div>
      }

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
    .stat-row { display: grid; grid-template-columns: repeat(4,1fr); gap: var(--spacing-4); margin-bottom: var(--spacing-6); }
    .stat-card { background: var(--color-surface-card); border: 1px solid var(--color-border-default); border-radius: var(--radius-lg); padding: var(--spacing-4); display: flex; flex-direction: column; gap: var(--spacing-1); }
    .stat-card--alert { border-color: #f59e0b; }
    .stat-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--color-text-secondary); }
    .stat-value { font-size: 1.25rem; font-weight: 700; }
    .stat-value.mono { font-family: 'JetBrains Mono', monospace; font-size: 1rem; }
    .section { margin-bottom: var(--spacing-6); }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-3); }
    .section-title { font-size: 0.9375rem; font-weight: 700; margin: 0; }
    .section-link { font-size: 0.875rem; color: var(--color-primary); text-decoration: none; }
    .eng-row { display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-3); border: 1px solid var(--color-border-default); border-radius: var(--radius-md); margin-bottom: var(--spacing-2); background: var(--color-surface-card); }
    .eng-info { display: flex; flex-direction: column; gap: 2px; }
    .eng-company { font-weight: 600; font-size: 0.875rem; }
    .eng-role { font-size: 0.8125rem; color: var(--color-text-secondary); }
    .empty { color: var(--color-text-secondary); font-size: 0.875rem; padding: var(--spacing-4) 0; }
    .opp-preview { display: flex; align-items: center; gap: var(--spacing-3); padding: var(--spacing-3); border: 1px solid #f59e0b; border-radius: var(--radius-md); background: #fffbeb; }
    .opp-badge { background: var(--color-primary); color: #fff; font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
    .opp-sector { font-size: 0.875rem; color: var(--color-text-secondary); }
    .opp-count { font-size: 0.8125rem; color: var(--color-text-secondary); margin-left: auto; }
    .saved-msg { font-size: 12px; color: var(--color-state-success);
                 margin: var(--spacing-3) 0 0; }
  `]
})
export class ExecutiveDashboard implements OnInit {

  private readonly http       = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  @ViewChild(AvailabilityDrawer) private readonly drawerRef?: AvailabilityDrawer;

  readonly availabilityDays = signal(20);
  readonly profileStatus    = signal<string | null>(null);
  readonly drawerOpen       = signal(false);
  readonly savedMsg         = signal(false);
  readonly dashLoading      = signal(true);
  readonly dash             = signal<DashData | null>(null);

  get progressPct(): number { return Math.round((this.availabilityDays() / 20) * 100); }

  engStatus(status: string): BadgeVariant {
    return status === 'ACTIVE' ? 'status-active' : status === 'PAUSED' ? 'status-warning' : 'neutral';
  }

  ngOnInit(): void {
    this.http.get<DashData>('/api/v1/executive/dashboard')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: d => { this.dash.set(d); this.dashLoading.set(false); }, error: () => this.dashLoading.set(false) });
  }

  constructor() {
    this.http.get<{ availabilityDaysPerMonth: number; profileStatus: string }>(
        '/api/v1/executive/profile')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  p  => { this.availabilityDays.set(p.availabilityDaysPerMonth ?? 20); this.profileStatus.set(p.profileStatus ?? 'ACTIVE'); },
        error: () => this.profileStatus.set('ACTIVE'),
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
