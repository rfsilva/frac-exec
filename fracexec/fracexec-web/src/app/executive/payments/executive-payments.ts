import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { DatePipe, DecimalPipe } from '@angular/common';

interface PaymentItem {
  id: string; referenceMonth: string | null;
  grossAmount: number; feeAmount: number; netAmount: number;
  status: string; paidAt: string | null;
  estimatedTransferAt: string | null; transferredAt: string | null;
}

@Component({
  selector: 'app-executive-payments',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  template: `
    <div class="page-body">
      <h1 class="page-title">Meus Repasses</h1>

      @if (loading()) { <p class="loading">Carregando...</p> }
      @else if (payments().length === 0) {
        <p class="empty">Nenhum repasse registrado ainda.</p>
      } @else {
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Mês</th>
                <th class="right">Valor bruto</th>
                <th class="right">Taxa (18%)</th>
                <th class="right">Valor líquido</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              @for (p of payments(); track p.id) {
                <tr>
                  <td>{{ p.referenceMonth ?? '—' }}</td>
                  <td class="right mono">R$ {{ p.grossAmount | number:'1.2-2' }}</td>
                  <td class="right mono muted">R$ {{ p.feeAmount | number:'1.2-2' }}</td>
                  <td class="right mono bold">R$ {{ p.netAmount | number:'1.2-2' }}</td>
                  <td>
                    <span class="badge" [class.badge--green]="p.status === 'TRANSFERRED'"
                          [class.badge--orange]="p.status === 'PAID'">
                      {{ statusLabel(p.status) }}
                    </span>
                  </td>
                  <td class="mono muted">
                    {{ (p.transferredAt ?? p.estimatedTransferAt ?? p.paidAt) | date:'dd/MM/yyyy' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-body  { padding: var(--spacing-6); max-width: 900px; }
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: var(--spacing-6); }
    .loading, .empty { color: var(--color-text-secondary); padding: var(--spacing-8) 0; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th  { text-align: left; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--color-text-secondary); padding: var(--spacing-2) var(--spacing-3); border-bottom: 1px solid var(--color-border); }
    td  { padding: var(--spacing-3); border-bottom: 1px solid var(--color-border); font-size: 0.875rem; }
    .right  { text-align: right; }
    .mono   { font-family: 'JetBrains Mono', monospace; }
    .muted  { color: var(--color-text-secondary); }
    .bold   { font-weight: 700; }
    .badge  { font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
    .badge--green  { background: #e8f5e9; color: #1b5e20; }
    .badge--orange { background: #fff3e0; color: #e65100; }
  `]
})
export class ExecutivePayments implements OnInit {
  private readonly http    = inject(HttpClient);
  private readonly destroy = inject(DestroyRef);

  readonly loading  = signal(true);
  readonly payments = signal<PaymentItem[]>([]);

  ngOnInit(): void {
    this.http.get<PaymentItem[]>('/api/v1/executive/payments')
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: l => { this.payments.set(l); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  statusLabel(s: string): string {
    return { TRANSFERRED: 'Creditado', PAID: 'Aguardando repasse', TRANSFER_FAILED: 'Falhou' }[s] ?? s;
  }
}
