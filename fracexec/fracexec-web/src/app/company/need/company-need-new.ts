import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CompanyService, NeedRequest } from '../company.service';

const CLEVEL_OPTIONS = ['CFO', 'CTO', 'CMO', 'COO', 'Outro'];
const SCOPE_OPTIONS  = ['1-2', '3-4', '5-8'];

@Component({
  selector: 'app-company-need-new',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './company-need-new.html',
  styleUrl: './company-need-new.scss',
})
export class CompanyNeedNew implements OnInit {
  private readonly fb      = inject(FormBuilder);
  private readonly svc     = inject(CompanyService);
  private readonly router  = inject(Router);
  private readonly destroy = inject(DestroyRef);

  readonly clevelOptions = CLEVEL_OPTIONS;
  readonly scopeOptions  = SCOPE_OPTIONS;
  readonly loading       = signal(false);
  readonly apiError      = signal<string | null>(null);

  selectedCLevel = signal<string | null>(null);

  readonly form = this.fb.group({
    scopeDaysPerMonth:    ['', Validators.required],
    estimatedDuration:    [''],
    desiredStart:         [''],
    challengeDescription: ['', [Validators.required, Validators.minLength(50)]],
    expectedResult:       ['', Validators.required],
    confidentialContext:  [''],
  });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    // AC2: redirecionar para dashboard se PME já tem necessidade ativa
    this.svc.getActiveNeed()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(need => {
        if (need) this.router.navigate(['/company/dashboard']);
      });
  }

  get charsRemaining(): number {
    const len = this.f.challengeDescription.value?.length ?? 0;
    return Math.max(0, 50 - len);
  }

  selectCLevel(val: string): void {
    this.selectedCLevel.set(val);
  }

  private submit(draft: boolean): void {
    if (!this.selectedCLevel()) { this.apiError.set('Selecione o tipo de C-Level.'); return; }
    if (this.form.invalid)      { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.apiError.set(null);

    const req: NeedRequest = {
      cLevelType:          this.selectedCLevel()!,
      scopeDaysPerMonth:   this.f.scopeDaysPerMonth.value!,
      estimatedDuration:   this.f.estimatedDuration.value || undefined,
      desiredStart:        this.f.desiredStart.value || undefined,
      challengeDescription: this.f.challengeDescription.value!,
      expectedResult:      this.f.expectedResult.value!,
      confidentialContext: this.f.confidentialContext.value || undefined,
    };

    const call$ = draft ? this.svc.saveDraft(req) : this.svc.postNeed(req);
    call$.pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/company/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const detail = err.error?.detail ?? 'Ocorreu um erro. Tente novamente.';
        this.apiError.set(detail);
      },
    });
  }

  onPost()  { this.submit(false); }
  onDraft() { this.submit(true);  }
}
