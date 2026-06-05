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
  template: `
    <div class="page-body">
      <h1 class="page-title">Oportunidades</h1>

      @if (loading()) {
        <p class="loading">Carregando...</p>
      } @else {
        @if (active().length > 0) {
          <section class="section">
            <h2 class="section-title">Disponíveis</h2>
            @for (opp of active(); track opp.id) {
              <div class="opp-card">
                <div class="opp-header">
                  <span class="clevel-tag">{{ opp.cLevelType }}</span>
                  <span class="sector">{{ opp.companySector }}</span>
                  <span class="expires mono">Expira {{ opp.expiresAt | date:'dd/MM/yyyy' }}</span>
                </div>
                <p class="challenge">{{ opp.challengeSummary }}...</p>
                <p class="scope">{{ opp.scopeDaysPerMonth }} dias/mês
                  @if (opp.estimatedDuration) { · {{ opp.estimatedDuration }} }
                </p>
                <div class="opp-actions">
                  <button class="btn btn--primary" (click)="interest(opp.id)" [disabled]="acting()">Tenho interesse</button>
                  <button class="btn btn--secondary" (click)="decline(opp.id)" [disabled]="acting()">Declinar</button>
                </div>
              </div>
            }
          </section>
        } @else {
          <p class="empty">Nenhuma oportunidade disponível no momento.</p>
        }

        @if (history().length > 0) {
          <section class="section">
            <h2 class="section-title">Histórico</h2>
            @for (opp of history(); track opp.id) {
              <div class="opp-card opp-card--history">
                <div class="opp-header">
                  <span class="clevel-tag">{{ opp.cLevelType }}</span>
                  <span class="sector">{{ opp.companySector }}</span>
                  <span class="status-tag">{{ statusLabel(opp.status) }}</span>
                </div>
                @if (opp.canRetract) {
                  <button class="btn btn--sm" (click)="retract(opp.id)">Retratar interesse</button>
                }
              </div>
            }
          </section>
        }
      }
    </div>
  `,
  styles: [`
    .page-body  { padding: var(--spacing-6); max-width: 800px; }
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: var(--spacing-6); }
    .section    { margin-bottom: var(--spacing-8); }
    .section-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--color-text-secondary); margin-bottom: var(--spacing-3); }
    .opp-card   { border: 1px solid var(--color-border); border-radius: 8px; padding: var(--spacing-4); margin-bottom: var(--spacing-3); background: var(--color-surface); }
    .opp-card--history { opacity: 0.7; }
    .opp-header { display: flex; align-items: center; gap: var(--spacing-3); margin-bottom: var(--spacing-2); flex-wrap: wrap; }
    .clevel-tag { background: var(--color-primary); color: #fff; font-size: 0.75rem; font-weight: 700; padding: 2px 10px; border-radius: 20px; }
    .sector     { font-size: 0.875rem; color: var(--color-text-secondary); }
    .expires    { margin-left: auto; font-size: 0.8125rem; color: var(--color-text-secondary); }
    .mono       { font-family: 'JetBrains Mono', monospace; }
    .challenge  { font-size: 0.9375rem; margin: var(--spacing-2) 0; line-height: 1.5; }
    .scope      { font-size: 0.8125rem; color: var(--color-text-secondary); margin-bottom: var(--spacing-3); }
    .opp-actions { display: flex; gap: var(--spacing-2); }
    .status-tag { font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: 20px; background: var(--color-border); color: var(--color-text-secondary); }
    .btn { padding: var(--spacing-2) var(--spacing-4); border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
    .btn--primary   { background: var(--color-primary); color: #fff; }
    .btn--secondary { background: transparent; border: 1.5px solid var(--color-border); color: var(--color-text-primary); }
    .btn--sm        { background: none; border: 1px solid var(--color-border); border-radius: 4px; font-size: 0.75rem; padding: 2px var(--spacing-2); cursor: pointer; margin-top: var(--spacing-2); }
    .btn:disabled   { opacity: 0.6; cursor: not-allowed; }
    .empty, .loading { color: var(--color-text-secondary); padding: var(--spacing-8) 0; }
  `]
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
