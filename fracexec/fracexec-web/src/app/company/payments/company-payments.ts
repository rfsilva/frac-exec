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
  templateUrl: './company-payments.html',
  styleUrl: './company-payments.scss'
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
    this.http.get<ContractItem[] | { content: ContractItem[] }>('/api/v1/company/contracts')
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: r => this.contracts.set(Array.isArray(r) ? r : r.content) });
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
