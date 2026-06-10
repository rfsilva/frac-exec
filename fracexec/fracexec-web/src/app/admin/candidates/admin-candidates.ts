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
  templateUrl: './admin-candidates.html',
  styleUrl: './admin-candidates.scss'
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
