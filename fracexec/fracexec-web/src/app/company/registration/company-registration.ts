import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl, FormBuilder, ReactiveFormsModule,
  ValidationErrors, ValidatorFn, Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CompanyService } from '../company.service';

// Algoritmo de validação de CNPJ (módulo 11) — espelha o backend
function cnpjValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = (control.value ?? '').replace(/\D/g, '');
    if (!raw) return null; // required cuida do obrigatório
    if (raw.length !== 14) return { cnpjInvalid: true };
    if (/^(\d)\1{13}$/.test(raw)) return { cnpjInvalid: true };

    const d = raw.split('').map(Number);
    const calc = (weights: number[]) => {
      const sum = weights.reduce((acc, w, i) => acc + d[i] * w, 0);
      const r = sum % 11;
      return r < 2 ? 0 : 11 - r;
    };
    const dv1 = calc([5,4,3,2,9,8,7,6,5,4,3,2]);
    const dv2 = calc([6,5,4,3,2,9,8,7,6,5,4,3,2]);
    return d[12] === dv1 && d[13] === dv2 ? null : { cnpjInvalid: true };
  };
}

@Component({
  selector: 'app-company-registration',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './company-registration.html',
  styleUrl: './company-registration.scss',
})
export class CompanyRegistration {
  private readonly fb      = inject(FormBuilder);
  private readonly svc     = inject(CompanyService);
  private readonly destroy = inject(DestroyRef);

  readonly submitted = signal(false);
  readonly loading   = signal(false);
  readonly apiError  = signal<string | null>(null);

  readonly employeeRanges = [
    { value: 'E_1_10',    label: '1 – 10 funcionários' },
    { value: 'E_11_50',   label: '11 – 50 funcionários' },
    { value: 'E_51_200',  label: '51 – 200 funcionários' },
    { value: 'E_201_500', label: '201 – 500 funcionários' },
    { value: 'E_500_PLUS',label: '500+ funcionários' },
  ];

  readonly revenueRanges = [
    { value: 'UP_TO_1M',  label: 'Até R$ 1M' },
    { value: 'R_1M_5M',   label: 'R$ 1M – 5M' },
    { value: 'R_5M_20M',  label: 'R$ 5M – 20M' },
    { value: 'ABOVE_20M', label: 'Acima de R$ 20M' },
  ];

  readonly form = this.fb.group({
    legalName:          ['', Validators.required],
    cnpj:               ['', [Validators.required, cnpjValidator()]],
    sector:             ['', Validators.required],
    employeeRange:      ['', Validators.required],
    annualRevenueRange: ['', Validators.required],
    responsibleName:    ['', Validators.required],
    responsibleEmail:   ['', [Validators.required, Validators.email]],
  });

  get f() { return this.form.controls; }

  // Aplica máscara CNPJ enquanto o usuário digita
  formatCnpj(event: Event): void {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '').substring(0, 14);
    if (v.length > 12)      v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8,12)}-${v.slice(12)}`;
    else if (v.length > 8)  v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8)}`;
    else if (v.length > 5)  v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5)}`;
    else if (v.length > 2)  v = `${v.slice(0,2)}.${v.slice(2)}`;
    this.f['cnpj'].setValue(v, { emitEvent: false });
    input.value = v;
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading.set(true);
    this.apiError.set(null);

    this.svc.register(this.form.value as any)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.submitted.set(true);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          const detail = err.error?.detail ?? 'Ocorreu um erro. Tente novamente.';
          if (err.status === 409 && detail.includes('e-mail')) {
            this.f['responsibleEmail'].setErrors({ emailTaken: true });
          } else if (err.status === 409 && detail.includes('CNPJ')) {
            this.f['cnpj'].setErrors({ cnpjTaken: true });
          } else {
            this.apiError.set(detail);
          }
        },
      });
  }
}
