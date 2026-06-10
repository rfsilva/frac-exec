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
  templateUrl: './conflict-review.html',
  styleUrl: './conflict-review.scss'
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
  private readonly needId = '';

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
