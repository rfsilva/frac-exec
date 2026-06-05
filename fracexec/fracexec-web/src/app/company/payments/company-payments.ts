import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { DatePipe, DecimalPipe } from '@angular/common';

interface PaymentItem { id: string; referenceMonth: string | null; grossAmount: number; status: string; paidAt: string | null; }
interface ContractItem { id: string; executiveEmail: string; monthlyValue: number; durationMonths: number; signedAt: string | null; }

@Component({
  selector: 'app-company-payments',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  template: `
    <div class="page-body">
      <h1 class="page-title">Pagamentos</h1>

      @if (loading()) { <p class="loading">Carregando...</p> }
      @else {
        <!-- Pagamentos -->
        <section class="section">
          <h2 class="section-title">Histórico de pagamentos</h2>
          @if (payments().length === 0) { <p class="empty">Nenhum pagamento registrado ainda.</p> }
          @else {
            <div class="list">
              @for (p of payments(); track p.id) {
                <div class="row">
                  <span class="month">{{ p.referenceMonth ?? '—' }}</span>
                  <span class="amount mono">R$ {{ p.grossAmount | number:'1.2-2' }}</span>
                  <span class="badge" [class.badge--paid]="p.status === 'PAID' || p.status === 'TRANSFERRED'"
                        [class.badge--pending]="p.status === 'PENDING'">
                    {{ statusLabel(p.status) }}
                  </span>
                  <span class="date">{{ p.paidAt | date:'dd/MM/yyyy' }}</span>
                </div>
              }
            </div>
          }
        </section>

        <!-- Contratos -->
        <section class="section">
          <h2 class="section-title">Contratos</h2>
          @if (contracts().length === 0) { <p class="empty">Nenhum contrato gerado ainda.</p> }
          @else {
            @for (c of contracts(); track c.id) {
              <div class="row">
                <span class="exec">{{ c.executiveEmail }}</span>
                <span class="amount mono">R$ {{ c.monthlyValue | number:'1.2-2' }}/mês</span>
                <span class="duration">{{ c.durationMonths }} meses</span>
                <button class="btn btn--sm" (click)="downloadContract(c.id)">Baixar PDF</button>
              </div>
            }
          }
        </section>
      }
    </div>
  `,
  styles: [`
    .page-body { padding: var(--spacing-6); max-width: 800px; }
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: var(--spacing-6); }
    .section { margin-bottom: var(--spacing-8); }
    .section-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--color-text-secondary); margin-bottom: var(--spacing-3); }
    .loading, .empty { color: var(--color-text-secondary); }
    .list { display: flex; flex-direction: column; gap: var(--spacing-2); }
    .row { display: flex; align-items: center; gap: var(--spacing-4); padding: var(--spacing-3); border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-surface); }
    .month, .exec { flex: 1; font-size: 0.875rem; }
    .amount { font-family: 'JetBrains Mono', monospace; font-size: 0.875rem; font-weight: 600; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .duration { font-size: 0.8125rem; color: var(--color-text-secondary); }
    .date { font-size: 0.8125rem; color: var(--color-text-secondary); font-family: 'JetBrains Mono', monospace; }
    .badge { font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
    .badge--paid    { background: #e8f5e9; color: #1b5e20; }
    .badge--pending { background: #fff3e0; color: #e65100; }
    .btn { padding: var(--spacing-1) var(--spacing-3); border: 1px solid var(--color-border); border-radius: 4px; background: transparent; font-size: 0.8125rem; cursor: pointer; margin-left: auto; }
  `]
})
export class CompanyPayments implements OnInit {
  private readonly http    = inject(HttpClient);
  private readonly destroy = inject(DestroyRef);

  readonly loading   = signal(true);
  readonly payments  = signal<PaymentItem[]>([]);
  readonly contracts = signal<ContractItem[]>([]);

  ngOnInit(): void {
    this.http.get<PaymentItem[]>('/api/v1/company/payments')
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: l => { this.payments.set(l); this.loading.set(false); }, error: () => this.loading.set(false) });
    this.http.get<{ content: ContractItem[] }>('/api/v1/company/contracts')
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: r => this.contracts.set(r.content ?? r as any) });
  }

  downloadContract(id: string): void {
    this.http.get<{ url: string }>(`/api/v1/company/contracts/${id}/download`)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: r => window.open(r.url, '_blank') });
  }

  statusLabel(s: string): string {
    return { PENDING: 'Aguardando', PAID: 'Pago', TRANSFERRED: 'Repassado', EXPIRED: 'Expirado' }[s] ?? s;
  }
}
