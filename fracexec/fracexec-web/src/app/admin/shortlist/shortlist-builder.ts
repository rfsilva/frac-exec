import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
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
  templateUrl: './shortlist-builder.html',
  styleUrl: './shortlist-builder.scss'
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
