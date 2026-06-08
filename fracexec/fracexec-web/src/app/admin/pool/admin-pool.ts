import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { PageHeader } from '../../shared/layout/page-header/page-header';
import { StatusBadge, BadgeVariant } from '../../shared/components/status-badge/status-badge';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';

interface PoolItem {
  id: string; userId: string; email: string; fullName: string; initials: string;
  specialties: string[]; sectors: string[];
  availabilityDaysPerMonth: number; profileStatus: string; isAvailable: boolean;
}
interface PageResponse<T> { content: T[]; totalElements: number; }

@Component({
  selector: 'app-admin-pool',
  standalone: true,
  imports: [PageHeader, StatusBadge, LoadingSkeleton, RouterLink],
  template: `
    <app-page-header title="Pool de Executivos" [breadcrumb]="['Admin', 'Pool']" />

    <div class="page-body">
      <!-- Filtros -->
      <div class="filters">
        <select class="input select" (change)="onFilter('specialty', $event)">
          <option value="">Todas especialidades</option>
          <option value="CFO">CFO</option>
          <option value="CTO">CTO</option>
          <option value="CMO">CMO</option>
          <option value="COO">COO</option>
          <option value="OUTRO">Outro</option>
        </select>
        <input class="input" type="number" min="0" max="20" placeholder="Disp. mínima (dias/mês)"
               (change)="onFilter('minAvailability', $event)">
        <input class="input" type="text" placeholder="Setor"
               (input)="onFilter('sector', $event)">
        <select class="input select" (change)="onFilter('profileStatus', $event)">
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativo</option>
          <option value="INACTIVE">Pausado</option>
          <option value="SUSPENDED">Indisponível</option>
        </select>
        <button class="btn-secondary" (click)="clearFilters()">Limpar</button>
      </div>

      @if (loading()) { <app-loading-skeleton type="list" /> }

      @if (!loading()) {
        @if (pool().length === 0) {
          <div class="empty-state">
            <p class="empty-msg">Nenhum executivo encontrado com esses critérios.</p>
            <button class="btn-secondary" (click)="clearFilters()">Ajustar filtros</button>
          </div>
        } @else {
          <div class="pool-grid">
            @for (exec of pool(); track exec.id) {
              <div class="pool-card" [class.pool-card--unavailable]="!exec.isAvailable"
                   [routerLink]="['/admin/pool', exec.id]">
                <div class="card-avatar" [attr.aria-label]="exec.fullName + ' iniciais'">
                  {{ exec.initials }}
                </div>
                <div class="card-info">
                  <p class="card-name">{{ exec.fullName }}</p>
                  <p class="card-email text-muted">{{ exec.email }}</p>
                  <div class="card-tags">
                    @for (s of exec.specialties; track s) {
                      <span class="tag">{{ s }}</span>
                    }
                  </div>
                  <p class="card-sectors text-muted">{{ exec.sectors.join(', ') }}</p>
                </div>
                <div class="card-right">
                  <span class="availability-chip"
                        [class.availability-chip--zero]="exec.availabilityDaysPerMonth === 0">
                    {{ exec.availabilityDaysPerMonth }} dias/mês
                  </span>
                  @if (exec.isAvailable) {
                    <app-status-badge variant="status-active" label="Disponível" />
                  } @else {
                    <app-status-badge variant="neutral" label="Indisponível" />
                  }
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-body { padding: var(--spacing-6); }
    .filters {
      display: flex; gap: var(--spacing-3); flex-wrap: wrap; margin-bottom: var(--spacing-5);
      padding: var(--spacing-4); background: var(--color-surface-card);
      border: 1px solid var(--color-border-default); border-radius: var(--radius-md);
    }
    .input {
      padding: var(--spacing-2) var(--spacing-3); border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md); font-size: 13px; font-family: var(--font-body);
      background: var(--color-surface-card); color: var(--color-text-primary);
    }
    .input:focus { outline: 2px solid var(--color-brand-accent); outline-offset: 2px; }
    .select { min-width: 160px; cursor: pointer; }
    .btn-secondary {
      padding: var(--spacing-2) var(--spacing-4); background: transparent;
      color: var(--color-text-secondary); border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md); font-size: 13px; cursor: pointer;
    }
    .pool-grid { display: flex; flex-direction: column; gap: var(--spacing-3); }
    .pool-card {
      display: flex; align-items: center; gap: var(--spacing-4);
      background: var(--color-surface-card); border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg); padding: var(--spacing-4); cursor: pointer;
      text-decoration: none; color: inherit;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .pool-card:hover { border-color: var(--color-brand-accent); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .pool-card--unavailable { opacity: 0.65; }
    .card-avatar {
      width: 48px; height: 48px; border-radius: var(--radius-full); flex-shrink: 0;
      background-color: var(--color-brand-accent-light); color: var(--color-brand-deep);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-display); font-size: 16px; font-weight: 700;
    }
    .card-info { flex: 1; min-width: 0; }
    .card-name { font-size: 14px; font-weight: 600; color: var(--color-text-primary); margin: 0 0 2px; }
    .card-email { font-size: 12px; margin: 0 0 var(--spacing-2); }
    .text-muted { color: var(--color-text-secondary); }
    .card-tags { display: flex; flex-wrap: wrap; gap: var(--spacing-1); margin-bottom: var(--spacing-1); }
    .tag {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      background: var(--color-brand-accent-light); color: var(--color-brand-deep);
      padding: 1px 8px; border-radius: var(--radius-full);
    }
    .card-sectors { font-size: 12px; margin: 0; }
    .card-right { display: flex; flex-direction: column; align-items: flex-end; gap: var(--spacing-2); }
    .availability-chip {
      font-family: var(--font-mono); font-size: 13px; font-weight: 600;
      color: var(--color-brand-accent); padding: 2px 8px;
      background: rgba(77, 199, 138, 0.10); border-radius: var(--radius-sm);
    }
    .availability-chip--zero { color: var(--color-text-muted); background: var(--color-surface-muted); }
    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: var(--spacing-4);
      padding: var(--spacing-12); background: var(--color-surface-card);
      border: 1px solid var(--color-border-default); border-radius: var(--radius-lg); text-align: center;
    }
    .empty-msg { color: var(--color-text-secondary); font-size: 14px; margin: 0; }
  `]
})
export class AdminPool {

  private readonly http       = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly pool    = signal<PoolItem[]>([]);

  private filters: Record<string, string | null> = {
    specialty: null, minAvailability: null, sector: null, profileStatus: null
  };

  // P3: Subject+switchMap cancels in-flight requests; debounce for text input
  private readonly filterTrigger$ = new Subject<void>();

  constructor() {
    this.filterTrigger$
      .pipe(
        debounceTime(300),
        switchMap(() => {
          const params: Record<string, string> = {};
          Object.entries(this.filters).forEach(([k, v]) => { if (v) params[k] = v; });
          this.loading.set(true);
          return this.http.get<PageResponse<PoolItem>>('/api/v1/admin/pool', { params });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next:  res => { this.pool.set(res.content); this.loading.set(false); },
        error: ()  => this.loading.set(false),
      });
    this.filterTrigger$.next();
  }

  onFilter(key: string, event: Event): void {
    const val = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.filters[key] = val || null;
    this.filterTrigger$.next();
  }

  clearFilters(): void {
    this.filters = { specialty: null, minAvailability: null, sector: null, profileStatus: null };
    this.filterTrigger$.next();
  }

  private load(): void {
    this.filterTrigger$.next();
  }
}
