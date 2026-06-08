import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, switchMap } from 'rxjs';
import { PageHeader } from '../../shared/layout/page-header/page-header';
import { StatusBadge, BadgeVariant } from '../../shared/components/status-badge/status-badge';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';

interface ApplicationSummary {
  id: string; fullName: string; email: string; status: string; createdAt: string;
}
interface PositionDetail {
  roleTitle: string; companyName: string | null; periodStart: string;
  periodEnd: string | null; teamSize: string | null; revenueManaged: string | null;
}
interface ReferenceDetail { refName: string; refRole: string; refContact: string; }
interface ApplicationDetail extends ApplicationSummary {
  linkedinUrl: string | null; motivation: string;
  positions: PositionDetail[]; references: ReferenceDetail[];
}
interface PageResponse<T> {
  content: T[]; totalElements: number; totalPages: number; number: number; size: number;
}

@Component({
  selector: 'app-admin-candidates',
  standalone: true,
  imports: [PageHeader, StatusBadge, LoadingSkeleton],
  template: `
    <app-page-header title="Candidaturas" [breadcrumb]="['Admin', 'Candidaturas']" />

    <div class="page-body">
      <!-- Filtros -->
      <div class="filters">
        <select class="input select" [value]="filters.status" (change)="onStatusChange($event)">
          <option value="">Todos os status</option>
          <option value="PENDING">Aguardando análise</option>
          <option value="UNDER_REVIEW">Em análise</option>
          <option value="APPROVED">Aprovado</option>
          <option value="REJECTED">Rejeitado</option>
        </select>
        <input class="input" type="text" placeholder="Buscar por nome"
               [value]="filters.name" (input)="onNameChange($event)" />
        <input class="input" type="date" [value]="filters.dateFrom" (change)="onDateFromChange($event)" />
        <input class="input" type="date" [value]="filters.dateTo" (change)="onDateToChange($event)" />
        <button class="btn-secondary" (click)="clearFilters()">Limpar filtros</button>
      </div>

      <!-- AC-8: Loading skeleton -->
      @if (loading()) { <app-loading-skeleton type="list" /> }

      @if (!loading()) {
        @if (applications().length === 0) {
          <div class="empty-state">
            <p class="empty-message">Nenhuma candidatura encontrada com esses critérios.</p>
            <button class="btn-secondary" (click)="clearFilters()">Ajustar filtros</button>
          </div>
        } @else {
          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Nome</th><th>E-mail</th><th>Data de entrada</th><th>Status</th><th>Ação</th>
                </tr>
              </thead>
              <tbody>
                @for (app of applications(); track app.id) {
                  <tr class="table-row" [class.row--expanded]="expandedId() === app.id">
                    <td>{{ app.fullName }}</td>
                    <td class="text-muted">{{ app.email }}</td>
                    <td class="text-muted">{{ formatDate(app.createdAt) }}</td>
                    <td>
                      <app-status-badge [variant]="statusToVariant(app.status)"
                                        [label]="statusLabel(app.status)" />
                    </td>
                    <td>
                      <button class="btn-expand" (click)="toggleExpand(app.id)"
                              [attr.aria-expanded]="expandedId() === app.id"
                              [attr.aria-controls]="'detail-' + app.id">
                        {{ expandedId() === app.id ? 'Fechar ▲' : 'Ver detalhes ▼' }}
                      </button>
                    </td>
                  </tr>

                  <!-- Acordeão inline -->
                  @if (expandedId() === app.id) {
                    <tr [id]="'detail-' + app.id" class="accordion-row">
                      <td colspan="5">
                        <!-- P5: skeleton enquanto detalhe carrega -->
                        @if (loadingDetail()) { <div style="padding: var(--spacing-4)"><app-loading-skeleton type="list" /></div> }

                        @if (!loadingDetail() && detail()) {
                          <div class="detail-panel">
                            @if (detail()!.linkedinUrl) {
                              <div class="detail-row">
                                <span class="detail-label">LinkedIn</span>
                                <a [href]="detail()!.linkedinUrl!" class="link" target="_blank" rel="noopener">
                                  {{ detail()!.linkedinUrl }}
                                </a>
                              </div>
                            }
                            <div class="detail-section">
                              <h4 class="detail-section-title">Histórico C-Level</h4>
                              @for (pos of detail()!.positions; track pos.roleTitle) {
                                <div class="position-item">
                                  <strong>{{ pos.roleTitle }}</strong>
                                  @if (pos.companyName) { <span class="text-muted"> · {{ pos.companyName }}</span> }
                                  <span class="text-muted"> · {{ pos.periodStart }}{{ pos.periodEnd ? ' → ' + pos.periodEnd : ' → atual' }}</span>
                                  @if (pos.teamSize) { <span class="text-muted"> · {{ pos.teamSize }}</span> }
                                </div>
                              }
                            </div>
                            <div class="detail-section">
                              <h4 class="detail-section-title">Referências</h4>
                              @for (ref of detail()!.references; track ref.refName) {
                                <div class="reference-item">
                                  <strong>{{ ref.refName }}</strong> — {{ ref.refRole }}
                                  <span class="text-muted"> · {{ ref.refContact }}</span>
                                </div>
                              }
                            </div>
                            <div class="detail-section">
                              <h4 class="detail-section-title">Motivação</h4>
                              <p class="motivation-text">{{ detail()!.motivation }}</p>
                            </div>
                            <!-- P4: optional chaining; P2: disabled durante PATCH -->
                            @if (detail()?.status === 'PENDING') {
                              <div class="detail-actions">
                                <button class="btn-primary"
                                        [disabled]="updatingStatus()"
                                        (click)="startReview(detail()!.id)">
                                  {{ updatingStatus() ? 'Atualizando...' : 'Iniciar análise' }}
                                </button>
                              </div>
                            }
                          </div>
                        }
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
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
      color: var(--color-text-primary); background: var(--color-surface-card);
    }
    .input:focus { outline: 2px solid var(--color-brand-accent); outline-offset: 2px; }
    .select { min-width: 160px; }
    .table-wrapper {
      background: var(--color-surface-card); border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg); overflow: hidden;
    }
    .table { width: 100%; border-collapse: collapse; }
    .table th {
      text-align: left; padding: var(--spacing-3) var(--spacing-4); font-size: 12px;
      font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
      color: var(--color-text-muted); background: var(--color-surface-muted);
      border-bottom: 1px solid var(--color-border-default);
    }
    .table td {
      padding: var(--spacing-3) var(--spacing-4); font-size: 14px; color: var(--color-text-primary);
      border-bottom: 1px solid var(--color-border-default); vertical-align: middle;
    }
    .table-row:hover { background: var(--color-surface-subtle); }
    .row--expanded { background: var(--color-surface-muted); }
    .accordion-row td { padding: 0; }
    .text-muted { color: var(--color-text-secondary); }
    .detail-panel {
      padding: var(--spacing-5) var(--spacing-6); border-top: 1px solid var(--color-border-default);
      background: var(--color-surface-card);
    }
    .detail-row { display: flex; gap: var(--spacing-3); margin-bottom: var(--spacing-3); align-items: baseline; }
    .detail-label { font-size: 12px; font-weight: 600; color: var(--color-text-muted); min-width: 80px; }
    .detail-section { margin-bottom: var(--spacing-4); }
    .detail-section-title {
      font-size: 12px; font-weight: 600; text-transform: uppercase;
      color: var(--color-text-muted); letter-spacing: 0.05em; margin: 0 0 var(--spacing-2);
    }
    .position-item, .reference-item { font-size: 13px; margin-bottom: var(--spacing-1); }
    .motivation-text { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; margin: 0; }
    .detail-actions {
      margin-top: var(--spacing-4); padding-top: var(--spacing-4);
      border-top: 1px solid var(--color-border-default);
    }
    .btn-expand {
      font-size: 12px; color: var(--color-brand-accent); background: none; border: none;
      cursor: pointer; padding: var(--spacing-1) var(--spacing-2); border-radius: var(--radius-sm);
    }
    .btn-expand:hover { background: var(--color-surface-muted); }
    .btn-primary {
      padding: var(--spacing-2) var(--spacing-5); background: var(--color-brand-primary);
      color: var(--color-brand-accent); border: none; border-radius: var(--radius-md);
      font-family: var(--font-display); font-weight: 600; font-size: 14px; cursor: pointer;
    }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary {
      padding: var(--spacing-2) var(--spacing-4); background: transparent;
      color: var(--color-text-secondary); border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md); font-size: 13px; cursor: pointer; white-space: nowrap;
    }
    .link { color: var(--color-brand-accent); font-size: 13px; }
    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: var(--spacing-4);
      padding: var(--spacing-12); background: var(--color-surface-card);
      border: 1px solid var(--color-border-default); border-radius: var(--radius-lg); text-align: center;
    }
    .empty-message { color: var(--color-text-secondary); font-size: 14px; margin: 0; }
  `]
})
export class AdminCandidates {

  private readonly http       = inject(HttpClient);
  private readonly router     = inject(Router);
  private readonly route      = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // B3: Subject para cancelar requests de detalhe em voo via switchMap
  private readonly expandSubject = new Subject<string | null>();

  readonly loading        = signal(false);
  readonly loadingDetail  = signal(false);
  readonly updatingStatus = signal(false);
  readonly applications   = signal<ApplicationSummary[]>([]);
  readonly expandedId     = signal<string | null>(null);
  readonly detail         = signal<ApplicationDetail | null>(null);

  filters = { status: '', name: '', dateFrom: '', dateTo: '' };

  constructor() {
    // B3: switchMap cancela automaticamente qualquer GET anterior ao expandir nova linha
    this.expandSubject
      .pipe(
        switchMap(id => {
          if (id === null) {
            this.detail.set(null);
            this.loadingDetail.set(false);
            return [];
          }
          this.loadingDetail.set(true);
          this.detail.set(null);
          return this.http.get<ApplicationDetail>(`/api/v1/admin/applications/${id}`);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next:  d  => { this.detail.set(d); this.loadingDetail.set(false); },
        error: () => this.loadingDetail.set(false),
      });

    // AC-6: ler filtros dos query params na inicialização
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.filters.status   = params['status']   ?? '';
        this.filters.name     = params['name']     ?? '';
        this.filters.dateFrom = params['dateFrom'] ?? '';
        this.filters.dateTo   = params['dateTo']   ?? '';
        this.loadApplications();
      });
  }

  private loadApplications(): void {
    this.loading.set(true);
    const params: Record<string, string> = {};
    if (this.filters.status)   params['status']   = this.filters.status;
    if (this.filters.name)     params['name']      = this.filters.name;
    if (this.filters.dateFrom) params['dateFrom']  = new Date(this.filters.dateFrom).toISOString();
    if (this.filters.dateTo)   params['dateTo']    = new Date(this.filters.dateTo).toISOString();

    this.http.get<PageResponse<ApplicationSummary>>('/api/v1/admin/applications', { params })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  res => { this.applications.set(res.content); this.loading.set(false); },
        error: ()  => this.loading.set(false),
      });
  }

  // P1: escrever filtros de volta aos query params em cada mudança
  private applyFilters(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        status:   this.filters.status   || null,
        name:     this.filters.name     || null,
        dateFrom: this.filters.dateFrom || null,
        dateTo:   this.filters.dateTo   || null,
      },
      queryParamsHandling: 'merge',
    });
  }

  onStatusChange(e: Event)   { this.filters.status   = (e.target as HTMLSelectElement).value; this.applyFilters(); }
  onNameChange(e: Event)     { this.filters.name     = (e.target as HTMLInputElement).value;  this.applyFilters(); }
  onDateFromChange(e: Event) { this.filters.dateFrom = (e.target as HTMLInputElement).value;  this.applyFilters(); }
  onDateToChange(e: Event)   { this.filters.dateTo   = (e.target as HTMLInputElement).value;  this.applyFilters(); }

  clearFilters(): void {
    this.filters = { status: '', name: '', dateFrom: '', dateTo: '' };
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  toggleExpand(id: string): void {
    if (this.expandedId() === id) {
      this.expandedId.set(null);
      this.expandSubject.next(null);
    } else {
      this.expandedId.set(id);
      this.expandSubject.next(id);  // B3: switchMap cancela request anterior
    }
  }

  startReview(id: string): void {
    if (this.updatingStatus()) return;  // P2: guard extra
    this.updatingStatus.set(true);
    this.http.patch<ApplicationSummary>(
        `/api/v1/admin/applications/${id}/status`,
        { status: 'UNDER_REVIEW' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          this.applications.update(apps =>
            apps.map(a => a.id === id ? { ...a, status: updated.status } : a));
          this.detail.update(d => d ? { ...d, status: updated.status } : d);
          this.updatingStatus.set(false);
        },
        error: () => this.updatingStatus.set(false),
      });
  }

  // P3: UNDER_REVIEW tem variante distinta de PENDING
  statusToVariant(status: string): BadgeVariant {
    switch (status) {
      case 'PENDING':      return 'status-pending';
      case 'UNDER_REVIEW': return 'status-warning';
      case 'APPROVED':     return 'status-active';
      default:             return 'neutral';
    }
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING:      'Aguardando análise',
      UNDER_REVIEW: 'Em análise',
      APPROVED:     'Aprovado',
      REJECTED:     'Rejeitado',
    };
    return labels[status] ?? status;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-BR');
  }
}
