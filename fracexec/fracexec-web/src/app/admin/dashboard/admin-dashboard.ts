import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';

interface AdminDash {
  candidatures: { total: number };
  pool: { active: number };
  needs: { active: number };
  contracts: { active: number };
  paymentPipeline: { toReceive: number; inEscrow: number; transferred: number };
  lgpdPendingCount: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [LoadingSkeleton, RouterLink, DecimalPipe],
  template: `
    <div class="page-body">
      <h1 class="page-title">Dashboard Operacional</h1>

      @if (loading()) { <app-loading-skeleton type="card" /> }
      @else if (data()) {
        @let d = data()!;

        <!-- Métricas operacionais -->
        <div class="stat-grid">
          <div class="stat-card">
            <span class="label">Candidaturas</span>
            <span class="value">{{ d.candidatures.total }}</span>
            <a routerLink="/admin/candidates" class="link">Ver fila →</a>
          </div>
          <div class="stat-card">
            <span class="label">Executivos na pool</span>
            <span class="value">{{ d.pool.active }}</span>
            <a routerLink="/admin/pool" class="link">Ver pool →</a>
          </div>
          <div class="stat-card">
            <span class="label">Necessidades ativas</span>
            <span class="value">{{ d.needs.active }}</span>
            <a routerLink="/admin/needs" class="link">Ver necessidades →</a>
          </div>
          <div class="stat-card">
            <span class="label">Contratos ativos</span>
            <span class="value">{{ d.contracts.active }}</span>
            <a routerLink="/admin/contracts" class="link">Ver contratos →</a>
          </div>
        </div>

        <!-- Pipeline financeiro -->
        <div class="pipeline-card">
          <h2 class="section-title">Pipeline de Pagamentos</h2>
          <div class="pipeline-row">
            <div class="pipe-item">
              <span class="label">A receber</span>
              <span class="amount mono">R$ {{ d.paymentPipeline.toReceive | number:'1.2-2' }}</span>
            </div>
            <div class="pipe-item">
              <span class="label">Em escrow</span>
              <span class="amount mono">R$ {{ d.paymentPipeline.inEscrow | number:'1.2-2' }}</span>
            </div>
            <div class="pipe-item">
              <span class="label">Repassado (mês)</span>
              <span class="amount mono">R$ {{ d.paymentPipeline.transferred | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>

        <!-- LGPD -->
        <div class="lgpd-card">
          <h2 class="section-title">LGPD — Exclusão de Dados</h2>
          <p class="lgpd-count">{{ d.lgpdPendingCount }} solicitações pendentes</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-body  { padding: var(--spacing-6); max-width: 1000px; }
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: var(--spacing-6); }
    .stat-grid  { display: grid; grid-template-columns: repeat(4,1fr); gap: var(--spacing-4); margin-bottom: var(--spacing-6); }
    .stat-card  { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: var(--spacing-4); display: flex; flex-direction: column; gap: var(--spacing-1); }
    .label      { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--color-text-secondary); }
    .value      { font-size: 1.5rem; font-weight: 700; }
    .link       { font-size: 0.8125rem; color: var(--color-primary); text-decoration: none; margin-top: auto; }
    .section-title { font-size: 0.9375rem; font-weight: 700; margin: 0 0 var(--spacing-3); }
    .pipeline-card, .lgpd-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: var(--spacing-4); margin-bottom: var(--spacing-4); }
    .pipeline-row { display: grid; grid-template-columns: repeat(3,1fr); gap: var(--spacing-4); }
    .pipe-item  { display: flex; flex-direction: column; gap: 4px; }
    .amount     { font-size: 1.125rem; font-weight: 700; }
    .mono       { font-family: 'JetBrains Mono', monospace; }
    .lgpd-count { font-size: 0.9375rem; color: var(--color-text-secondary); margin: 0; }
  `]
})
export class AdminDashboard implements OnInit {
  private readonly http    = inject(HttpClient);
  private readonly destroy = inject(DestroyRef);

  readonly loading = signal(true);
  readonly data    = signal<AdminDash | null>(null);

  ngOnInit(): void {
    this.http.get<AdminDash>('/api/v1/admin/dashboard')
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: d => { this.data.set(d); this.loading.set(false); }, error: () => this.loading.set(false) });
  }
}
