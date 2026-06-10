import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';

interface AdminDash {
  candidatures: { total: number };
  pool: { active: number };
  needs: { active: number };
  contracts: { active: number };
  paymentPipeline: { toReceive: number; inEscrow: number; transferred: number };
  lgpdPendingCount: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [LoadingSkeleton, RouterLink, DecimalPipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard implements OnInit {
  private readonly http    = inject(HttpClient);
  private readonly destroy = inject(DestroyRef);

  readonly loading = signal(true);
  readonly data    = signal<AdminDash | null>(null);

  ngOnInit(): void {
    this.http.get<AdminDash>('/api/v1/admin/dashboard')
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: d => { this.data.set(d); this.loading.set(false); }, error: () => this.loading.set(false) });
  }
}
