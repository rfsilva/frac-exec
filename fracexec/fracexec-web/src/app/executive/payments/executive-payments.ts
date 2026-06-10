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
  templateUrl: './executive-payments.html',
  styleUrl: './executive-payments.scss'
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
