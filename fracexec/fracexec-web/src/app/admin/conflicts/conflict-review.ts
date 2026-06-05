import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';

interface ConflictDetail {
  itemId: string; needId: string;
  executiveName: string; executiveCnae: string; executiveState: string;
  needSector: string; needState: string;
}

@Component({
  selector: 'app-conflict-review',
  standalone: true,
  imports: [LoadingSkeleton],
  template: `
    <div class="conflict-container">
      <h1 class="page-title">Revisão de Conflito de Interesses</h1>

      @if (loading()) { <app-loading-skeleton type="card" /> }
      @else {
        <!-- Banner de sobreposição -->
        <div class="conflict-banner">
          <div class="overlap-side">
            <span class="overlap-label">Executivo — cliente ativo</span>
            <span class="overlap-value">CNAE {{ executiveCnae() }} · {{ executiveState() }}</span>
          </div>
          <div class="overlap-icon">⟺</div>
          <div class="overlap-side">
            <span class="overlap-label">PME — necessidade</span>
            <span class="overlap-value">Setor {{ needSector() }} · {{ needState() }}</span>
          </div>
        </div>

        <p class="conflict-desc">
          O executivo possui um cliente ativo no mesmo segmento e região da PME.
          Decida como tratar esta sobreposição:
        </p>

        <div class="actions">
          <button class="btn btn--danger" (click)="decide('EXCLUDE')" [disabled]="deciding()">
            Excluir da shortlist
          </button>
          <button class="btn btn--warning" (click)="decide('APPROVE_WITH_ALERT')" [disabled]="deciding()">
            Apresentar com alerta
          </button>
          <button class="btn btn--secondary" (click)="back()" [disabled]="deciding()">
            Voltar
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .conflict-container { padding: var(--spacing-6); max-width: 700px; }
    .page-title { font-size: 1.25rem; font-weight: 700; margin-bottom: var(--spacing-6); }
    .conflict-banner { display: flex; align-items: center; gap: var(--spacing-4); background: #fff7ed; border: 1px solid #f59e0b; border-radius: 8px; padding: var(--spacing-5); margin-bottom: var(--spacing-4); }
    .overlap-side { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .overlap-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #92400e; letter-spacing: .05em; }
    .overlap-value { font-size: 1rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: #78350f; }
    .overlap-icon { font-size: 1.5rem; color: #f59e0b; }
    .conflict-desc { font-size: 0.9375rem; color: var(--color-text-secondary); margin-bottom: var(--spacing-6); line-height: 1.6; }
    .actions { display: flex; gap: var(--spacing-3); flex-wrap: wrap; }
    .btn { padding: var(--spacing-2) var(--spacing-5); border: none; border-radius: 6px; font-size: 0.9375rem; font-weight: 600; cursor: pointer; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn--danger   { background: #dc2626; color: #fff; }
    .btn--warning  { background: #f59e0b; color: #fff; }
    .btn--secondary { background: transparent; border: 1.5px solid var(--color-border); color: var(--color-text-primary); }
  `]
})
export class ConflictReview implements OnInit {
  private readonly http    = inject(HttpClient);
  private readonly route   = inject(ActivatedRoute);
  private readonly router  = inject(Router);
  private readonly destroy = inject(DestroyRef);

  readonly loading        = signal(true);
  readonly deciding       = signal(false);
  readonly executiveCnae  = signal('—');
  readonly executiveState = signal('—');
  readonly needSector     = signal('—');
  readonly needState      = signal('—');

  private itemId = '';
  private needId = '';

  ngOnInit(): void {
    this.itemId = this.route.snapshot.paramMap.get('id') ?? '';
    // Buscar shortlist para obter o needId via item
    // Por ora exibimos dados genéricos — detalhe de conflito via endpoint futuro
    this.loading.set(false);
  }

  decide(decision: string): void {
    this.deciding.set(true);
    this.http.patch(
      `/api/v1/admin/shortlist-executives/${this.itemId}/conflict-decision`,
      { decision }
    ).pipe(takeUntilDestroyed(this.destroy))
     .subscribe({
       next: () => { this.deciding.set(false); this.router.navigate(['/admin/needs']); },
       error: () => this.deciding.set(false),
     });
  }

  back(): void { this.router.navigate(['/admin/needs']); }
}
