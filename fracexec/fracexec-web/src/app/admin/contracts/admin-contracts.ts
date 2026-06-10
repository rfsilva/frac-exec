import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

interface ContractSummary {
  id: string; engagementId: string; needId: string;
  companyName: string; executiveEmail: string;
  monthlyValue: number; scopeDaysPerMonth: number; durationMonths: number;
  signedByPme: boolean; signedByExecutive: boolean; fullySigned: boolean;
  generatedAt: string; fullySignedAt: string | null;
}

@Component({
  selector: 'app-admin-contracts',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './admin-contracts.html',
  styleUrl: './admin-contracts.scss'
})
export class AdminContracts implements OnInit {
  private readonly http    = inject(HttpClient);
  private readonly destroy = inject(DestroyRef);

  readonly loading   = signal(true);
  readonly contracts = signal<ContractSummary[]>([]);

  ngOnInit(): void {
    this.http.get<ContractSummary[]>('/api/v1/admin/contracts')
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: l => { this.contracts.set(l); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  sign(c: ContractSummary): void {
    this.http.post<ContractSummary>(`/api/v1/admin/contracts/${c.id}/sign`,
      { signedByPme: true, signedByExecutive: true })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: updated => this.contracts.update(l => l.map(x => x.id === updated.id ? updated : x)) });
  }
}
