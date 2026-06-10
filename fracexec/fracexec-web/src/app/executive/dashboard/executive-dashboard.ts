import { Component, DestroyRef, ViewChild, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { PageHeader } from '../../shared/layout/page-header/page-header';
import { AvailabilityDrawer } from '../availability-drawer/availability-drawer';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';
import { StatusBadge, BadgeVariant } from '../../shared/components/status-badge/status-badge';

interface DashData {
  activeEngagementsCount: number; committedDaysMonth: number;
  nextTransferAmount: number; pendingOpportunitiesCount: number;
  activeEngagements: { id: string; companyName: string; cLevelType: string; scopeDaysPerMonth: number; status: string }[];
  recentOpportunity: { id: string; cLevelType: string; companySector: string; status: string } | null;
}

@Component({
  selector: 'app-executive-dashboard',
  standalone: true,
  imports: [PageHeader, AvailabilityDrawer, LoadingSkeleton, StatusBadge, RouterLink, DecimalPipe],
  templateUrl: './executive-dashboard.html',
  styleUrl: './executive-dashboard.scss'
})
export class ExecutiveDashboard implements OnInit {

  private readonly http       = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  @ViewChild(AvailabilityDrawer) private readonly drawerRef?: AvailabilityDrawer;

  readonly availabilityDays = signal(20);
  readonly profileStatus    = signal<string | null>(null);
  readonly drawerOpen       = signal(false);
  readonly savedMsg         = signal(false);
  readonly dashLoading      = signal(true);
  readonly dash             = signal<DashData | null>(null);

  get progressPct(): number { return Math.round((this.availabilityDays() / 20) * 100); }

  engStatus(status: string): BadgeVariant {
    if (status === 'ACTIVE') return 'status-active';
    if (status === 'PAUSED') return 'status-warning';
    return 'neutral';
  }

  ngOnInit(): void {
    this.http.get<DashData>('/api/v1/executive/dashboard')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: d => { this.dash.set(d); this.dashLoading.set(false); }, error: () => this.dashLoading.set(false) });
  }

  constructor() {
    this.http.get<{ availabilityDaysPerMonth: number; profileStatus: string }>(
        '/api/v1/executive/profile')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  p  => { this.availabilityDays.set(p.availabilityDaysPerMonth ?? 20); this.profileStatus.set(p.profileStatus ?? 'ACTIVE'); },
        error: () => this.profileStatus.set('ACTIVE'),
      });
  }

  onSaved(payload: { availabilityDaysPerMonth: number; profileStatus: string }): void {
    this.http.patch<{ availabilityDaysPerMonth: number; profileStatus: string }>(
        '/api/v1/executive/profile/availability', payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.availabilityDays.set(res.availabilityDaysPerMonth);
          this.profileStatus.set(res.profileStatus);
          this.drawerOpen.set(false);
          this.drawerRef?.resetSaving();
          this.savedMsg.set(true);
          setTimeout(() => this.savedMsg.set(false), 4000);
        },
        error: () => this.drawerRef?.resetSaving(), // P4: reset saving on error
      });
  }
}
