import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { MediationThread } from '../../shared/components/mediation-thread/mediation-thread';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';

interface AnonProfile {
  shortlistExecutiveId: string; sectorInitials: string; cLevelType: string;
  sectors: string[]; availabilityDaysPerMonth: number;
  bioSummary: string | null; conflictStatus: string;
}

@Component({
  selector: 'app-company-need-detail',
  standalone: true,
  imports: [MediationThread, LoadingSkeleton],
  templateUrl: './company-need-detail.html',
  styleUrl: './company-need-detail.scss'
})
export class CompanyNeedDetail implements OnInit {
  private readonly http    = inject(HttpClient);
  private readonly route   = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);

  readonly loading    = signal(true);
  readonly needStatus = signal('');
  readonly profiles   = signal<AnonProfile[]>([]);
  readonly selected   = signal<string[]>([]);
  readonly confirming = signal(false);

  needId = '';

  ngOnInit(): void {
    this.needId = this.route.snapshot.paramMap.get('id') ?? '';
    // Buscar status da necessidade via dashboard
    this.http.get<{ activeNeed: { id: string; status: string } | null }>('/api/v1/company/dashboard')
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: d => {
          const status = d.activeNeed?.status ?? '';
          this.needStatus.set(status);
          if (status === 'SHORTLIST_SENT') this.loadProfiles();
          else this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  private loadProfiles(): void {
    this.http.get<AnonProfile[]>(`/api/v1/company/needs/${this.needId}/shortlist`)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: p => { this.profiles.set(p); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  isSelected(id: string): boolean { return this.selected().includes(id); }

  toggleSelect(id: string): void {
    if (this.isSelected(id)) {
      this.selected.update(s => s.filter(x => x !== id));
    } else if (this.selected().length < 2) {
      this.selected.update(s => [...s, id]);
    }
  }

  confirmSelection(): void {
    if (!this.selected().length) return;
    this.confirming.set(true);
    this.http.post(`/api/v1/company/needs/${this.needId}/shortlist/select`,
      { selectedExecutiveIds: this.selected() })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => { this.confirming.set(false); this.needStatus.set('IN_MEDIATION'); },
        error: () => this.confirming.set(false),
      });
  }
}
