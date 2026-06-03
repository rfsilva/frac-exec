import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CompanyService, DashboardResponse } from '../company.service';
import { NeedFunnel } from './need-funnel/need-funnel';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';

@Component({
  selector: 'app-company-dashboard',
  standalone: true,
  imports: [RouterLink, NeedFunnel, LoadingSkeleton, DatePipe],
  template: `
    <div class="page-body">
      <h1 class="page-title">Dashboard</h1>

      @if (loading()) {
        <app-loading-skeleton type="card" />
      } @else if (dashboard()) {
        @let d = dashboard()!;

        @if (d.activeNeed) {
          @let need = d.activeNeed;

          <!-- Stats -->
          <div class="stats-row">
            <div class="stat-card">
              <span class="stat-label">Status</span>
              <span class="stat-value">{{ statusLabel(need.status) }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Postada em</span>
              <span class="stat-value mono">{{ need.createdAt | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">SLA restante</span>
              <span class="stat-value mono" [class.stat-value--warn]="slaExpired(need.slaDeadline)">
                {{ slaLabel(need.slaDeadline) }}
              </span>
            </div>
          </div>

          <!-- Funil -->
          <div class="funnel-card">
            <h2 class="section-title">Progresso da sua necessidade</h2>
            <app-need-funnel [currentStatus]="need.status" />
          </div>
        } @else {
          <!-- Estado vazio -->
          <div class="empty-state">
            <p class="empty-msg">Você ainda não postou uma necessidade.</p>
            <a routerLink="/company/need/new" class="btn btn--primary">Postar necessidade</a>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-body  { padding: var(--spacing-6); max-width: 900px; }
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: var(--spacing-6); }
    .stats-row  { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-4); margin-bottom: var(--spacing-6); }
    .stat-card  { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: var(--spacing-4); display: flex; flex-direction: column; gap: var(--spacing-1); }
    .stat-label { font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .05em; }
    .stat-value { font-size: 1rem; font-weight: 600; color: var(--color-text-primary); }
    .stat-value.mono { font-family: 'JetBrains Mono', monospace; }
    .stat-value--warn { color: var(--color-error, #d32f2f); }
    .funnel-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: var(--spacing-6); }
    .section-title { font-size: 1rem; font-weight: 600; margin-bottom: var(--spacing-4); }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: var(--spacing-4); padding: var(--spacing-16) 0; }
    .empty-msg   { color: var(--color-text-secondary); }
    .btn { padding: var(--spacing-2) var(--spacing-6); border: none; border-radius: 6px; font-size: 0.9375rem; font-weight: 600; cursor: pointer; text-decoration: none; }
    .btn--primary { background: var(--color-primary); color: #fff; }
  `],
})
export class CompanyDashboard implements OnInit {
  private readonly svc     = inject(CompanyService);
  private readonly destroy = inject(DestroyRef);

  readonly loading   = signal(true);
  readonly dashboard = signal<DashboardResponse | null>(null);

  ngOnInit(): void {
    this.svc.getDashboard()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next:  d  => { this.dashboard.set(d);    this.loading.set(false); },
        error: () => { this.loading.set(false); },
      });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      RECEIVED: 'Recebida', UNDER_ANALYSIS: 'Em análise',
      SHORTLIST_SENT: 'Shortlist enviada', IN_MEDIATION: 'Em mediação', CONTRACTED: 'Contratado',
    };
    return map[status] ?? status;
  }

  slaLabel(deadline: string): string {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000);
    return days > 0 ? `${days} dias` : 'Prazo encerrado';
  }

  slaExpired(deadline: string): boolean {
    return new Date(deadline).getTime() < Date.now();
  }
}
