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
  templateUrl: './new-contract.html',
  styleUrl: './new-contract.scss'
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
