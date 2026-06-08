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
  template: `
    <div class="page-body">
      <div class="page-header-row">
        <h1 class="page-title">Contratos</h1>
        <a routerLink="/admin/contracts/new" class="btn btn--primary">+ Novo contrato</a>
      </div>

      @if (loading()) {
        <p class="loading">Carregando...</p>
      } @else if (contracts().length === 0) {
        <p class="empty">Nenhum contrato gerado ainda.</p>
      } @else {
        <div class="list">
          @for (c of contracts(); track c.id) {
            <div class="contract-card">
              <div class="contract-row">
                <div class="contract-info">
                  <span class="company">{{ c.companyName }}</span>
                  <span class="exec">{{ c.executiveEmail }}</span>
                  <span class="value mono">R$ {{ c.monthlyValue | number:'1.2-2' }}/mês</span>
                  <span class="scope">{{ c.scopeDaysPerMonth }} dias/mês · {{ c.durationMonths }} meses</span>
                </div>
                <div class="contract-status">
                  @if (c.fullySigned) {
                    <span class="badge badge--active">Assinado</span>
                    <span class="signed-date">{{ c.fullySignedAt | date:'dd/MM/yyyy' }}</span>
                  } @else {
                    <span class="badge badge--pending">Aguardando assinatura</span>
                    <span class="sig-flags">
                      PME: {{ c.signedByPme ? '✓' : '○' }} |
                      Executivo: {{ c.signedByExecutive ? '✓' : '○' }}
                    </span>
                  }
                </div>
                <div class="contract-actions">
                  <a [href]="'/api/v1/admin/contracts/' + c.id + '/download'" target="_blank" class="btn btn--sm">
                    Baixar PDF
                  </a>
                  @if (!c.fullySigned) {
                    <button class="btn btn--sm btn--primary" (click)="sign(c)">Registrar assinatura</button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-body  { padding: var(--spacing-6); }
    .page-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-4); }
    .page-title { font-size: 1.5rem; font-weight: 700; margin: 0; }
    .loading, .empty { color: var(--color-text-secondary); padding: var(--spacing-8) 0; }
    .contract-card { border: 1px solid var(--color-border); border-radius: 8px; margin-bottom: var(--spacing-2); background: var(--color-surface); }
    .contract-row { display: flex; align-items: center; gap: var(--spacing-4); padding: var(--spacing-4); flex-wrap: wrap; }
    .contract-info { display: flex; flex-direction: column; gap: 2px; flex: 2; }
    .company { font-weight: 700; font-size: 0.9375rem; }
    .exec, .scope { font-size: 0.8125rem; color: var(--color-text-secondary); }
    .value { font-family: 'JetBrains Mono', monospace; font-size: 0.875rem; font-weight: 600; }
    .contract-status { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .badge { font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; width: fit-content; }
    .badge--active  { background: #e8f5e9; color: #1b5e20; }
    .badge--pending { background: #fff3e0; color: #e65100; }
    .signed-date, .sig-flags { font-size: 0.75rem; color: var(--color-text-secondary); }
    .contract-actions { display: flex; gap: var(--spacing-2); }
    .btn { padding: var(--spacing-2) var(--spacing-4); border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; text-decoration: none; }
    .btn--primary { background: var(--color-primary); color: #fff; }
    .btn--sm { font-size: 0.8125rem; padding: var(--spacing-1) var(--spacing-3); background: transparent; border: 1px solid var(--color-border); color: var(--color-text-primary); }
  `]
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
