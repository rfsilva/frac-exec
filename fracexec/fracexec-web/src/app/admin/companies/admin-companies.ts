import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { SlicePipe } from '@angular/common';
import { BadgeVariant, StatusBadge } from '../../shared/components/status-badge/status-badge';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';

interface CompanySummary {
  id: string; legalName: string; cnpj: string;
  responsibleName: string; responsibleEmail: string;
  status: string; createdAt: string;
}
interface PageResponse<T> { content: T[]; totalElements: number; }

@Component({
  selector: 'app-admin-companies',
  standalone: true,
  imports: [StatusBadge, LoadingSkeleton, SlicePipe],
  template: `
    <div class="page-body">
      <h1 class="page-title">Empresas</h1>

      @if (loading()) {
        <app-loading-skeleton type="table" />
      } @else if (companies().length === 0) {
        <p class="empty">Nenhuma empresa cadastrada.</p>
      } @else {
        <div class="list">
          @for (c of companies(); track c.id) {
            <div class="list-item">
              <div class="list-row">
                <span class="col col--name">{{ c.legalName }}</span>
                <span class="col col--cnpj mono">{{ c.cnpj }}</span>
                <span class="col col--resp">{{ c.responsibleName }}</span>
                <app-status-badge [variant]="statusVariant(c.status)" [label]="statusLabel(c.status)" />
                <span class="col col--date mono">{{ c.createdAt | slice:0:10 }}</span>
                @if (c.status === 'PENDING_ACTIVATION') {
                  <button class="btn btn--primary"
                          [disabled]="activating() === c.id"
                          (click)="activate(c)">
                    {{ activating() === c.id ? 'Ativando...' : 'Ativar acesso' }}
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-body  { padding: var(--spacing-6); }
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: var(--spacing-4); }
    .empty      { color: var(--color-text-secondary); padding: var(--spacing-8) 0; }
    .list-item  { border: 1px solid var(--color-border); border-radius: 6px; margin-bottom: var(--spacing-2); }
    .list-row   { display: flex; align-items: center; gap: var(--spacing-4); padding: var(--spacing-3) var(--spacing-4); background: var(--color-surface); }
    .col        { font-size: 0.875rem; }
    .col--name  { flex: 2; font-weight: 600; }
    .col--cnpj  { flex: 1.5; }
    .col--resp  { flex: 2; color: var(--color-text-secondary); }
    .col--date  { flex: 1; color: var(--color-text-secondary); }
    .mono       { font-family: 'JetBrains Mono', monospace; font-size: 0.8125rem; }
    .btn { padding: var(--spacing-1) var(--spacing-3); border: none; border-radius: 6px; font-size: 0.8125rem; font-weight: 600; cursor: pointer; margin-left: auto; }
    .btn--primary { background: var(--color-primary); color: #fff; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
  `],
})
export class AdminCompanies implements OnInit {
  private readonly http    = inject(HttpClient);
  private readonly destroy = inject(DestroyRef);

  readonly loading    = signal(true);
  readonly companies  = signal<CompanySummary[]>([]);
  readonly activating = signal<string | null>(null);

  ngOnInit(): void {
    this.http.get<PageResponse<CompanySummary>>('/api/v1/admin/companies?size=100')
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next:  r  => { this.companies.set(r.content); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  activate(c: CompanySummary): void {
    this.activating.set(c.id);
    this.http.patch<CompanySummary>(`/api/v1/admin/companies/${c.id}/activate`, {})
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next:  u  => { this.companies.update(l => l.map(x => x.id === u.id ? u : x)); this.activating.set(null); },
        error: () => this.activating.set(null),
      });
  }

  statusLabel(s: string): string   { return s === 'PENDING_ACTIVATION' ? 'Aguardando ativação' : 'Ativo'; }
  statusVariant(s: string): BadgeVariant { return s === 'PENDING_ACTIVATION' ? 'status-pending' : 'status-active'; }
}
