import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

interface NeedSummary { id: string; companyLegalName: string; cLevelType: string; status: string; }
interface ProfileSummary { id: string; email: string; specialties: string[]; }
interface PageResponse<T> { content: T[]; }

@Component({
  selector: 'app-new-contract',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="page-body">
      <h1 class="page-title">Novo Contrato</h1>

      <form [formGroup]="form" (ngSubmit)="submit()" class="form">
        <div class="field">
          <label class="label">Necessidade (IN_MEDIATION) *</label>
          <select class="input" formControlName="needId">
            <option value="" disabled>Selecione a necessidade</option>
            @for (n of needs(); track n.id) {
              <option [value]="n.id">{{ n.companyLegalName }} — {{ n.cLevelType }}</option>
            }
          </select>
        </div>

        <div class="field">
          <label class="label">Executivo *</label>
          <select class="input" formControlName="executiveProfileId">
            <option value="" disabled>Selecione o executivo</option>
            @for (p of profiles(); track p.id) {
              <option [value]="p.id">{{ p.email }} ({{ p.specialties.join(', ') }})</option>
            }
          </select>
        </div>

        <div class="field-row">
          <div class="field">
            <label class="label">Valor mensal (R$) *</label>
            <input class="input mono" type="number" min="100" step="100" formControlName="monthlyValue">
          </div>
          <div class="field">
            <label class="label">Dias/mês *</label>
            <input class="input" type="number" min="1" max="20" formControlName="scopeDaysPerMonth">
          </div>
          <div class="field">
            <label class="label">Duração (meses)</label>
            <input class="input" type="number" min="1" formControlName="durationMonths">
          </div>
        </div>

        @if (error()) {
          <div class="api-error" role="alert">{{ error() }}</div>
        }
        @if (success()) {
          <div class="api-success">Contrato gerado! PDF enviado por e-mail às partes.</div>
        }

        <div class="actions">
          <button type="submit" class="btn btn--primary" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Gerando...' : 'Gerar contrato' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .page-body { padding: var(--spacing-6); max-width: 700px; }
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: var(--spacing-6); }
    .form { display: flex; flex-direction: column; gap: var(--spacing-4); }
    .field { display: flex; flex-direction: column; gap: var(--spacing-1); }
    .field-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--spacing-4); }
    .label { font-size: 0.875rem; font-weight: 500; }
    .input { padding: var(--spacing-2) var(--spacing-3); border: 1px solid var(--color-border); border-radius: 6px; font-size: 0.9375rem; background: var(--color-surface); }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .api-error  { padding: var(--spacing-2) var(--spacing-3); background: #ffebee; color: #b71c1c; border-radius: 6px; font-size: 0.875rem; }
    .api-success { padding: var(--spacing-2) var(--spacing-3); background: #e8f5e9; color: #1b5e20; border-radius: 6px; font-size: 0.875rem; }
    .actions { display: flex; justify-content: flex-end; }
    .btn { padding: var(--spacing-2) var(--spacing-5); border: none; border-radius: 6px; font-size: 0.9375rem; font-weight: 600; cursor: pointer; }
    .btn--primary { background: var(--color-primary); color: #fff; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class NewContract implements OnInit {
  private readonly http    = inject(HttpClient);
  private readonly fb      = inject(FormBuilder);
  private readonly router  = inject(Router);
  private readonly destroy = inject(DestroyRef);

  readonly needs    = signal<NeedSummary[]>([]);
  readonly profiles = signal<ProfileSummary[]>([]);
  readonly loading  = signal(false);
  readonly error    = signal<string | null>(null);
  readonly success  = signal(false);

  readonly form = this.fb.group({
    needId:              ['', Validators.required],
    executiveProfileId:  ['', Validators.required],
    monthlyValue:        [null as number | null, [Validators.required, Validators.min(100)]],
    scopeDaysPerMonth:   [null as number | null, [Validators.required, Validators.min(1), Validators.max(20)]],
    durationMonths:      [null as number | null],
  });

  ngOnInit(): void {
    this.http.get<PageResponse<NeedSummary>>('/api/v1/admin/needs?status=IN_MEDIATION&size=50')
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: r => this.needs.set(r.content) });
    this.http.get<PageResponse<ProfileSummary>>('/api/v1/admin/pool?size=50')
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: r => this.profiles.set(r.content) });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.http.post('/api/v1/admin/contracts', this.form.value)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => { this.loading.set(false); this.success.set(true);
          setTimeout(() => this.router.navigate(['/admin/contracts']), 2000); },
        error: (err) => { this.loading.set(false); this.error.set(err.error?.detail ?? 'Erro ao gerar contrato.'); },
      });
  }
}
