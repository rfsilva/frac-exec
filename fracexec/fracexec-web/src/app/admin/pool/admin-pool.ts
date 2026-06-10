import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { PageHeader } from '../../shared/layout/page-header/page-header';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
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
  templateUrl: './admin-pool.html',
  styleUrl: './admin-pool.scss'
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
