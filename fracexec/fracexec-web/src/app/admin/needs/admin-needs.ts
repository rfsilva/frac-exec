import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { Subject, switchMap } from 'rxjs';
import { SlicePipe } from '@angular/common';
import { StatusBadge, BadgeVariant } from '../../shared/components/status-badge/status-badge';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';

interface NeedSummary {
  id: string; companyLegalName: string; cLevelType: string;
  scopeDaysPerMonth: string; estimatedDuration: string | null;
  status: string; createdAt: string;
}
interface PageResponse<T> { content: T[]; totalElements: number; }

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Recebida', UNDER_ANALYSIS: 'Em análise',
  SHORTLIST_SENT: 'Shortlist enviada', IN_MEDIATION: 'Em mediação', CONTRACTED: 'Contratado',
};

@Component({
  selector: 'app-admin-needs',
  standalone: true,
  imports: [StatusBadge, LoadingSkeleton, SlicePipe],
  template: `
    <div class="page-body">
      <h1 class="page-title">Necessidades</h1>

      <div class="filters">
        <select class="input select" (change)="onFilter('status', $event)">
          <option value="">Todos os status</option>
          <option value="RECEIVED">Recebida</option>
          <option value="UNDER_ANALYSIS">Em análise</option>
          <option value="SHORTLIST_SENT">Shortlist enviada</option>
          <option value="IN_MEDIATION">Em mediação</option>
          <option value="CONTRACTED">Contratado</option>
        </select>
        <select class="input select" (change)="onFilter('cLevelType', $event)">
          <option value="">Todos os C-Levels</option>
          <option>CFO</option><option>CTO</option>
          <option>CMO</option><option>COO</option><option>Outro</option>
        </select>
      </div>

      @if (loading()) {
        <app-loading-skeleton type="table" />
      } @else if (needs().length === 0) {
        <p class="empty">Nenhuma necessidade no momento.</p>
      } @else {
        <div class="list">
          @for (need of needs(); track need.id) {
            <div class="list-item" [class.list-item--expanded]="expandedId() === need.id">
              <div class="list-row" (click)="toggle(need.id)">
                <span class="col col--company">{{ need.companyLegalName }}</span>
                <span class="col col--clevel">{{ need.cLevelType }}</span>
                <span class="col col--scope">{{ need.scopeDaysPerMonth }} dias/mês
                  @if (need.estimatedDuration) { · {{ need.estimatedDuration }} }
                </span>
                <app-status-badge [variant]="statusVariant(need.status)" [label]="statusLabel(need.status)" />
                <span class="col col--date">{{ need.createdAt | slice:0:10 }}</span>
                <span class="chevron">{{ expandedId() === need.id ? '▲' : '▼' }}</span>
              </div>

              @if (expandedId() === need.id) {
                <div class="expand-body">
                  <p><strong>C-Level:</strong> {{ need.cLevelType }}</p>
                  <p><strong>Escopo:</strong> {{ need.scopeDaysPerMonth }} dias/mês
                    @if (need.estimatedDuration) { · {{ need.estimatedDuration }} }
                  </p>
                  @if (need.status === 'RECEIVED') {
                    <button class="btn btn--primary"
                            [disabled]="patching()"
                            (click)="startAnalysis(need); $event.stopPropagation()">
                      Iniciar análise
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-body  { padding: var(--spacing-6); }
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: var(--spacing-4); }
    .filters    { display: flex; gap: var(--spacing-3); margin-bottom: var(--spacing-4); }
    .input.select { padding: var(--spacing-2) var(--spacing-3); border: 1px solid var(--color-border); border-radius: 6px; font-size: 0.875rem; }
    .empty      { color: var(--color-text-secondary); padding: var(--spacing-8) 0; }
    .list-item  { border: 1px solid var(--color-border); border-radius: 6px; margin-bottom: var(--spacing-2); overflow: hidden; }
    .list-row   { display: flex; align-items: center; gap: var(--spacing-4); padding: var(--spacing-3) var(--spacing-4); cursor: pointer; background: var(--color-surface); }
    .list-row:hover { background: var(--color-surface-hover, #f5f5f5); }
    .col        { font-size: 0.875rem; }
    .col--company { flex: 2; font-weight: 600; }
    .col--clevel  { flex: 1; }
    .col--scope   { flex: 1.5; color: var(--color-text-secondary); }
    .col--date    { flex: 1; color: var(--color-text-secondary); font-family: 'JetBrains Mono', monospace; font-size: 0.8125rem; }
    .chevron    { margin-left: auto; color: var(--color-text-secondary); }
    .expand-body { padding: var(--spacing-4); background: var(--color-surface-alt, #fafafa); border-top: 1px solid var(--color-border); display: flex; flex-direction: column; gap: var(--spacing-2); }
    .expand-body p { font-size: 0.875rem; margin: 0; }
    .btn { padding: var(--spacing-2) var(--spacing-4); border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; margin-top: var(--spacing-2); }
    .btn--primary { background: var(--color-primary); color: #fff; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
  `],
})
export class AdminNeeds implements OnInit {
  private readonly http    = inject(HttpClient);
  private readonly destroy = inject(DestroyRef);
  private readonly reload$ = new Subject<void>();

  readonly loading    = signal(true);
  readonly needs      = signal<NeedSummary[]>([]);
  readonly expandedId = signal<string | null>(null);
  readonly patching   = signal(false);

  private filters: Record<string, string> = {};

  ngOnInit(): void {
    this.reload$.pipe(
      switchMap(() => this.http.get<PageResponse<NeedSummary>>(
        '/api/v1/admin/needs', { params: { ...this.filters, size: '50' } }
      )),
      takeUntilDestroyed(this.destroy)
    ).subscribe({
      next:  r  => { this.needs.set(r.content); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.reload$.next();
  }

  onFilter(key: string, event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    if (val) this.filters[key] = val; else delete this.filters[key];
    this.loading.set(true);
    this.reload$.next();
  }

  toggle(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  startAnalysis(need: NeedSummary): void {
    this.patching.set(true);
    this.http.patch<NeedSummary>(`/api/v1/admin/needs/${need.id}/status`, { status: 'UNDER_ANALYSIS' })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next:  u  => { this.needs.update(l => l.map(n => n.id === u.id ? u : n)); this.patching.set(false); },
        error: () => this.patching.set(false),
      });
  }

  statusLabel(s: string): string  { return STATUS_LABELS[s] ?? s; }
  statusVariant(s: string): BadgeVariant {
    if (s === 'RECEIVED')       return 'status-pending';
    if (s === 'UNDER_ANALYSIS') return 'sector';
    return 'status-active';
  }
}
