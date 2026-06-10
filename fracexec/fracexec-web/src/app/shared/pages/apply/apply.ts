import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray, FormBuilder, FormGroup,
  ReactiveFormsModule, Validators
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { StatusBadge } from '../../components/status-badge/status-badge';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-apply',
  standalone: true,
  imports: [ReactiveFormsModule, StatusBadge],
  templateUrl: './apply.html',
  styleUrl: './apply.scss'
})
export class Apply {
  readonly privacyUrl = environment.privacyPolicyUrl;
  readonly steps = [
    { n: 1, label: 'Dados pessoais' },
    { n: 2, label: 'Histórico C-Level' },
    { n: 3, label: 'Referências' },
  ];

  readonly currentStep = signal(1);
  readonly submitted   = signal(false);
  readonly submitting  = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly form: FormGroup;

  private readonly destroyRef = inject(DestroyRef);

  constructor(private readonly fb: FormBuilder, private readonly http: HttpClient) {
    this.form = this.fb.group({
      fullName:    ['', Validators.required],
      email:       ['', [Validators.required, Validators.email]],
      linkedinUrl: ['', [
        Validators.required,
        Validators.pattern(/^https:\/\/(www\.)?linkedin\.com\/in\/.+/)
      ]],
      positions:   this.fb.array([this.createPositionGroup()]),
      references:  this.fb.array([this.createReferenceGroup(), this.createReferenceGroup()]),
      motivation:  ['', Validators.required],
      lgpdConsent: [false, Validators.requiredTrue],
    });
  }

  get f() { return this.form.controls; }
  get positions() { return this.form.get('positions') as FormArray; }
  get references() { return this.form.get('references') as FormArray; }

  createPositionGroup(): FormGroup {
    return this.fb.group({
      roleTitle:      ['', Validators.required],
      companyName:    [''],
      periodStart:    ['', Validators.required],
      periodEnd:      [''],
      teamSize:       [''],
      revenueManaged: [''],
    });
  }

  createReferenceGroup(): FormGroup {
    return this.fb.group({
      refName:    ['', Validators.required],
      refRole:    ['', Validators.required],
      refContact: ['', Validators.required],
    });
  }

  addPosition()  { this.positions.push(this.createPositionGroup()); }
  addReference() { this.references.push(this.createReferenceGroup()); }
  removePosition(i: number) { if (this.positions.length > 1) this.positions.removeAt(i); }

  /** AC-5: Valida apenas os campos da etapa atual */
  nextStep(): void {
    const stepControls = this.getStepControls();
    stepControls.forEach(c => c.markAllAsTouched());

    const stepValid = stepControls.every(c => c.valid);
    if (!stepValid) return;

    this.currentStep.update(s => s + 1);
  }

  prevStep(): void { this.currentStep.update(s => s - 1); }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.submitting.set(true);
    this.serverError.set(null);

    const payload = this.buildPayload();

    this.http.post('/api/v1/applications', payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next:  () => { this.submitting.set(false); this.submitted.set(true); },
      error: (err) => {
        this.submitting.set(false);
        if (err.status === 409) {
          this.serverError.set('Você já possui uma candidatura em análise.');
        } else {
          this.serverError.set('Não foi possível enviar. Verifique sua conexão e tente novamente.');
        }
      }
    });
  }

  private getStepControls() {
    if (this.currentStep() === 1) {
      return [this.f['fullName'], this.f['email'], this.f['linkedinUrl']];
    }
    if (this.currentStep() === 2) {
      return [this.positions];
    }
    return [this.references, this.f['motivation'], this.f['lgpdConsent']];
  }

  private buildPayload() {
    const v = this.form.value;
    return {
      fullName:    v.fullName,
      email:       v.email,
      linkedinUrl: v.linkedinUrl,
      positions: v.positions.map((p: any) => ({
        roleTitle:      p.roleTitle,
        companyName:    p.companyName || null,
        periodStart:    p.periodStart,
        periodEnd:      p.periodEnd || null,
        teamSize:       p.teamSize || null,
        revenueManaged: p.revenueManaged || null,
      })),
      references: v.references.map((r: any) => ({
        refName: r.refName, refRole: r.refRole, refContact: r.refContact
      })),
      motivation:  v.motivation,
      lgpdConsent: v.lgpdConsent,
    };
  }
}
