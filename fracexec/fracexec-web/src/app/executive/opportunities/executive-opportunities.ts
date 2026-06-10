import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';

interface Opportunity {
  id: string; needId: string; cLevelType: string; scopeDaysPerMonth: string;
  estimatedDuration: string | null; challengeSummary: string;
  companySector: string; companyEmployeeRange: string;
  status: string; expiresAt: string; canRetract: boolean;
}

@Component({
  selector: 'app-executive-opportunities',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './executive-opportunities.html',
  styleUrl: './executive-opportunities.scss'
})
export class ExecutiveOpportunities implements OnInit {
  private readonly http    = inject(HttpClient);
  private readonly destroy = inject(DestroyRef);

  readonly loading = signal(true);
  readonly active  = signal<Opportunity[]>([]);
  readonly history = signal<Opportunity[]>([]);
  readonly acting  = signal(false);

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.http.get<{ active: Opportunity[]; history: Opportunity[] }>('/api/v1/executive/opportunities')
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next:  r  => { this.active.set(r.active); this.history.set(r.history); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  interest(id: string): void {
    this.acting.set(true);
    this.http.post<Opportunity>(`/api/v1/executive/opportunities/${id}/interest`, {})
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: () => { this.acting.set(false); this.load(); }, error: () => this.acting.set(false) });
  }

  decline(id: string): void {
    this.acting.set(true);
    this.http.post<Opportunity>(`/api/v1/executive/opportunities/${id}/decline`, {})
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: () => { this.acting.set(false); this.load(); }, error: () => this.acting.set(false) });
  }

  retract(id: string): void {
    this.http.post<Opportunity>(`/api/v1/executive/opportunities/${id}/retract`, {})
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: () => this.load() });
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      INTERESTED: 'Interesse declarado', DECLINED: 'Declinado',
      EXPIRED: 'Expirado', RETRACTED: 'Retratado'
    };
    return map[s] ?? s;
  }
}
