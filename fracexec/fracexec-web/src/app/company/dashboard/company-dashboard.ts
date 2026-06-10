import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CompanyService, DashboardResponse } from '../company.service';
import { NeedFunnel } from './need-funnel/need-funnel';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';

@Component({
  selector: 'app-company-dashboard',
  standalone: true,
  imports: [RouterLink, NeedFunnel, LoadingSkeleton, DatePipe],
  templateUrl: './company-dashboard.html',
  styleUrl: './company-dashboard.scss',
})
export class CompanyDashboard implements OnInit {
  private readonly svc     = inject(CompanyService);
  private readonly destroy = inject(DestroyRef);

  readonly loading   = signal(true);
  readonly dashboard = signal<DashboardResponse | null>(null);

  ngOnInit(): void {
    this.svc.getDashboard()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next:  d  => { this.dashboard.set(d);    this.loading.set(false); },
        error: () => { this.loading.set(false); },
      });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      RECEIVED: 'Recebida', UNDER_ANALYSIS: 'Em análise',
      SHORTLIST_SENT: 'Shortlist enviada', IN_MEDIATION: 'Em mediação', CONTRACTED: 'Contratado',
    };
    return map[status] ?? status;
  }

  slaLabel(deadline: string): string {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000);
    return days > 0 ? `${days} dias` : 'Prazo encerrado';
  }

  slaExpired(deadline: string): boolean {
    return new Date(deadline).getTime() < Date.now();
  }
}
