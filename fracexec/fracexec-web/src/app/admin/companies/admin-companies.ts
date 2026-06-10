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
  templateUrl: './admin-companies.html',
  styleUrl: './admin-companies.scss',
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
