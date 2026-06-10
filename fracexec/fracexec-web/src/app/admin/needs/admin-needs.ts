import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { Subject, switchMap } from 'rxjs';
import { SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
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
  imports: [StatusBadge, LoadingSkeleton, SlicePipe, RouterLink],
  templateUrl: './admin-needs.html',
  styleUrl: './admin-needs.scss',
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
