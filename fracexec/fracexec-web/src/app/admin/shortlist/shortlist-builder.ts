import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BadgeVariant, StatusBadge } from '../../shared/components/status-badge/status-badge';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';

interface PoolItem {
  id: string; fullName: string; specialties: string[];
  availabilityDaysPerMonth: number; profileStatus: string; isAvailable: boolean;
}
interface ShortlistItem {
  id: string; executiveProfileId: string; fullName: string;
  specialties: string[]; availabilityDaysPerMonth: number;
  conflictStatus: string; conflictDetail: string | null;
}
interface Shortlist {
  id: string; needId: string; status: string;
  executives: ShortlistItem[]; canSend: boolean;
}
interface PageResponse<T> { content: T[]; totalElements: number; }

@Component({
  selector: 'app-shortlist-builder',
  standalone: true,
  imports: [StatusBadge, LoadingSkeleton, RouterLink],
  template: `
    <div class="builder-container">
      <div class="builder-header">
        <h2 class="builder-title">Construir Shortlist</h2>
        @if (shortlist()?.canSend) {
          <button class="btn btn--primary" (click)="sendShortlist()" [disabled]="sending()">
            {{ sending() ? 'Enviando...' : 'Enviar shortlist' }}
          </button>
        } @else if (shortlist()) {
          <button class="btn btn--primary btn--disabled" disabled
                  title="Resolva os conflitos antes de enviar ou adicione pelo menos 2 executivos.">
            Enviar shortlist
          </button>
        }
      </div>

      @if (sendError()) {
        <div class="alert alert--error">{{ sendError() }}</div>
      }

      <div class="split-view">
        <!-- Painel esquerdo: pool -->
        <div class="panel panel--pool">
          <h3 class="panel-title">Pool de Executivos</h3>
          @if (loadingPool()) { <app-loading-skeleton type="list" /> }
          @else {
            <div class="pool-list">
              @for (exec of pool(); track exec.id) {
                <div class="pool-card" [class.pool-card--disabled]="!exec.isAvailable">
                  <div class="pool-card-info">
                    <span class="exec-name">{{ exec.fullName }}</span>
                    <span class="exec-meta">{{ exec.specialties.join(', ') }}</span>
                    <span class="exec-avail">{{ exec.availabilityDaysPerMonth }} dias/mês</span>
                  </div>
                  <button class="btn btn--sm" (click)="addExecutive(exec.id)"
                          [disabled]="!exec.isAvailable || adding()">
                    + Adicionar
                  </button>
                </div>
              }
              @if (pool().length === 0) {
                <p class="empty">Nenhum executivo disponível na pool.</p>
              }
            </div>
          }
        </div>

        <!-- Painel direito: shortlist -->
        <div class="panel panel--shortlist">
          <h3 class="panel-title">Shortlist ({{ shortlistItems().length }}/4)</h3>
          @if (loadingShortlist()) { <app-loading-skeleton type="list" /> }
          @else {
            <div class="shortlist-slots">
              @for (item of shortlistItems(); track item.id) {
                <div class="slot" [class.slot--conflict]="item.conflictStatus === 'PENDING_REVIEW'"
                                  [class.slot--excluded]="item.conflictStatus === 'EXCLUDED'">
                  <div class="slot-info">
                    <span class="exec-name">{{ item.fullName }}</span>
                    <span class="exec-meta">{{ item.specialties.join(', ') }}</span>
                    @if (item.conflictStatus === 'PENDING_REVIEW') {
                      <div class="conflict-badge">
                        ⚠ {{ item.conflictDetail }}
                        <a [routerLink]="['/admin/conflicts', item.id]" class="review-link">Revisar conflito</a>
                      </div>
                    } @else if (item.conflictStatus === 'APPROVED_WITH_ALERT') {
                      <span class="alert-badge">⚠ Com alerta</span>
                    } @else if (item.conflictStatus === 'EXCLUDED') {
                      <span class="excluded-badge">Excluído</span>
                    } @else {
                      <span class="clear-badge">✓ Sem conflito</span>
                    }
                  </div>
                  <button class="btn-remove" (click)="removeExecutive(item.id)">×</button>
                </div>
              }
              @if (shortlistItems().length === 0) {
                <p class="empty">Adicione executivos da pool para construir a shortlist.</p>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .builder-container { padding: var(--spacing-4); }
    .builder-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-4); }
    .builder-title { font-size: 1.125rem; font-weight: 700; margin: 0; }
    .split-view { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-4); }
    .panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: var(--spacing-4); }
    .panel-title { font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--color-text-secondary); margin: 0 0 var(--spacing-3); }
    .pool-card { display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-2) 0; border-bottom: 1px solid var(--color-border); }
    .pool-card:last-child { border-bottom: none; }
    .pool-card--disabled { opacity: 0.5; }
    .pool-card-info { display: flex; flex-direction: column; gap: 2px; }
    .exec-name { font-size: 0.875rem; font-weight: 600; }
    .exec-meta { font-size: 0.75rem; color: var(--color-text-secondary); }
    .exec-avail { font-size: 0.75rem; font-family: 'JetBrains Mono', monospace; color: var(--color-text-secondary); }
    .slot { display: flex; align-items: flex-start; justify-content: space-between; padding: var(--spacing-3); border-radius: 6px; border: 1px solid var(--color-border); margin-bottom: var(--spacing-2); background: var(--color-surface); }
    .slot--conflict { border-color: #f59e0b; background: #fffbeb; }
    .slot--excluded { opacity: 0.5; }
    .slot-info { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .conflict-badge { font-size: 0.75rem; color: #92400e; background: #fef3c7; padding: 2px 6px; border-radius: 4px; }
    .review-link { margin-left: 8px; color: var(--color-primary); text-decoration: underline; font-size: 0.75rem; }
    .alert-badge { font-size: 0.75rem; color: #92400e; }
    .excluded-badge { font-size: 0.75rem; color: var(--color-text-secondary); }
    .clear-badge { font-size: 0.75rem; color: #166534; }
    .btn-remove { background: none; border: none; color: var(--color-text-secondary); font-size: 18px; cursor: pointer; padding: 0 4px; }
    .btn-remove:hover { color: var(--color-error, #d32f2f); }
    .empty { font-size: 0.875rem; color: var(--color-text-secondary); padding: var(--spacing-4) 0; }
    .btn { padding: var(--spacing-1) var(--spacing-3); border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
    .btn--primary { background: var(--color-primary); color: #fff; }
    .btn--primary:disabled, .btn--disabled { opacity: 0.5; cursor: not-allowed; }
    .btn--sm { padding: 2px var(--spacing-2); font-size: 0.75rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 4px; cursor: pointer; }
    .btn--sm:disabled { opacity: 0.5; cursor: not-allowed; }
    .alert--error { background: #ffebee; color: #b71c1c; padding: var(--spacing-2) var(--spacing-3); border-radius: 6px; font-size: 0.875rem; margin-bottom: var(--spacing-3); }
  `]
})
export class ShortlistBuilder implements OnInit {
  private readonly http    = inject(HttpClient);
  private readonly route   = inject(ActivatedRoute);
  private readonly router  = inject(Router);
  private readonly destroy = inject(DestroyRef);

  readonly loadingPool      = signal(true);
  readonly loadingShortlist = signal(true);
  readonly pool             = signal<PoolItem[]>([]);
  readonly shortlist        = signal<Shortlist | null>(null);
  readonly adding           = signal(false);
  readonly sending          = signal(false);
  readonly sendError        = signal<string | null>(null);

  get shortlistItems() { return () => this.shortlist()?.executives ?? []; }

  private needId = '';

  ngOnInit(): void {
    this.needId = this.route.parent?.snapshot.paramMap.get('id') ?? '';
    this.loadPool();
    this.loadShortlist();
  }

  private loadPool(): void {
    this.http.get<PageResponse<PoolItem>>('/api/v1/admin/pool?size=50')
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: r => { this.pool.set(r.content); this.loadingPool.set(false); }, error: () => this.loadingPool.set(false) });
  }

  private loadShortlist(): void {
    this.http.get<Shortlist>(`/api/v1/admin/needs/${this.needId}/shortlist`)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: s => { this.shortlist.set(s); this.loadingShortlist.set(false); }, error: () => this.loadingShortlist.set(false) });
  }

  addExecutive(profileId: string): void {
    this.adding.set(true);
    this.http.post<ShortlistItem>(`/api/v1/admin/needs/${this.needId}/shortlist/executives`, { executiveProfileId: profileId })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: item => { this.shortlist.update(s => s ? { ...s, executives: [...s.executives, item] } : s); this.adding.set(false); this.reloadShortlist(); },
        error: () => this.adding.set(false),
      });
  }

  removeExecutive(itemId: string): void {
    this.http.delete(`/api/v1/admin/needs/${this.needId}/shortlist/executives/${itemId}`)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: () => { this.shortlist.update(s => s ? { ...s, executives: s.executives.filter(e => e.id !== itemId) } : s); this.reloadShortlist(); } });
  }

  sendShortlist(): void {
    this.sending.set(true);
    this.sendError.set(null);
    this.http.post<Shortlist>(`/api/v1/admin/needs/${this.needId}/shortlist/send`, {})
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => { this.sending.set(false); this.router.navigate(['/admin/needs']); },
        error: (err) => { this.sending.set(false); this.sendError.set(err.error?.detail ?? 'Erro ao enviar shortlist.'); },
      });
  }

  private reloadShortlist(): void {
    this.http.get<Shortlist>(`/api/v1/admin/needs/${this.needId}/shortlist`)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: s => this.shortlist.set(s) });
  }
}
