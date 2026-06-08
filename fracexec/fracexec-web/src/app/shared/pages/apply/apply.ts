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
  template: `
    @if (!submitted()) {
      <div class="apply-container">
        <header class="apply-header">
          <h1 class="apply-title">Candidatura FracExec</h1>
          <p class="apply-subtitle">Junte-se ao nosso pool de executivos C-Level verificados.</p>
        </header>

        <!-- Stepper indicator -->
        <div class="stepper" role="list" aria-label="Etapas da candidatura">
          @for (step of steps; track step.n) {
            <div class="step"
                 [class.step--active]="currentStep() === step.n"
                 [class.step--done]="currentStep() > step.n"
                 role="listitem">
              <div class="step-circle">{{ currentStep() > step.n ? '✓' : step.n }}</div>
              <span class="step-label">{{ step.label }}</span>
            </div>
            @if (!$last) { <div class="step-line"></div> }
          }
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

          <!-- ── Etapa 1: Dados pessoais ──────────────────────────── -->
          @if (currentStep() === 1) {
            <div class="form-section">
              <h2 class="section-title">Dados pessoais</h2>

              <div class="field">
                <label class="label" for="fullName">Nome completo *</label>
                <input id="fullName" class="input" type="text"
                       formControlName="fullName" autocomplete="name">
                @if (f['fullName'].invalid && f['fullName'].touched) {
                  <span class="error">Nome completo é obrigatório.</span>
                }
              </div>

              <div class="field">
                <label class="label" for="email">E-mail profissional *</label>
                <input id="email" class="input" type="email"
                       formControlName="email" autocomplete="email">
                @if (f['email'].invalid && f['email'].touched) {
                  <span class="error">E-mail válido é obrigatório.</span>
                }
              </div>

              <div class="field">
                <label class="label" for="linkedinUrl">LinkedIn *</label>
                <input id="linkedinUrl" class="input" type="url"
                       formControlName="linkedinUrl"
                       placeholder="https://linkedin.com/in/seu-perfil">
                @if (f['linkedinUrl'].invalid && f['linkedinUrl'].touched) {
                  <span class="error">URL do LinkedIn inválida. Use o formato: https://linkedin.com/in/seu-perfil</span>
                }
              </div>
            </div>
          }

          <!-- ── Etapa 2: Histórico C-Level ───────────────────────── -->
          @if (currentStep() === 2) {
            <div class="form-section">
              <h2 class="section-title">Histórico C-Level</h2>
              <p class="section-hint">Adicione ao menos 1 cargo. Nomes de empresa são opcionais e podem ser anonimizados.</p>

              <div formArrayName="positions">
                @for (pos of positions.controls; track $index) {
                  <div class="position-block" [formGroupName]="$index">
                    <div class="position-header">
                      <span class="position-label">Cargo {{ $index + 1 }}</span>
                      @if (positions.length > 1) {
                        <button type="button" class="btn-remove"
                                (click)="removePosition($index)"
                                [attr.aria-label]="'Remover cargo ' + ($index + 1)">
                          Remover
                        </button>
                      }
                    </div>

                    <div class="field">
                      <label class="label">Cargo C-Level *</label>
                      <input class="input" type="text" formControlName="roleTitle"
                             placeholder="Ex: CFO, CTO, COO">
                      @if (pos.get('roleTitle')?.invalid && pos.get('roleTitle')?.touched) {
                        <span class="error">Cargo é obrigatório.</span>
                      }
                    </div>

                    <div class="field">
                      <label class="label">Empresa (opcional — será anonimizada)</label>
                      <input class="input" type="text" formControlName="companyName"
                             placeholder="Deixe em branco para manter anônimo">
                    </div>

                    <div class="field-row">
                      <div class="field">
                        <label class="label">Início *</label>
                        <input class="input" type="date" formControlName="periodStart">
                        @if (pos.get('periodStart')?.invalid && pos.get('periodStart')?.touched) {
                          <span class="error">Data de início obrigatória.</span>
                        }
                      </div>
                      <div class="field">
                        <label class="label">Fim</label>
                        <input class="input" type="date" formControlName="periodEnd">
                      </div>
                    </div>

                    <div class="field-row">
                      <div class="field">
                        <label class="label">Tamanho da equipe</label>
                        <input class="input" type="text" formControlName="teamSize"
                               placeholder="Ex: 50 pessoas">
                      </div>
                      <div class="field">
                        <label class="label">Receita sob gestão</label>
                        <input class="input" type="text" formControlName="revenueManaged"
                               placeholder="Ex: R$50M (deixe em branco se não aplicável)">
                      </div>
                    </div>
                  </div>
                }
              </div>

              <button type="button" class="btn-secondary" (click)="addPosition()">
                + Adicionar cargo
              </button>
            </div>
          }

          <!-- ── Etapa 3: Referências + Motivação + LGPD ─────────── -->
          @if (currentStep() === 3) {
            <div class="form-section">
              <h2 class="section-title">Referências e motivação</h2>

              <div formArrayName="references">
                @for (ref of references.controls; track $index) {
                  <div class="reference-block" [formGroupName]="$index">
                    <p class="position-label">Referência {{ $index + 1 }} @if ($index < 2) { <span class="required-badge">obrigatória</span> }</p>

                    <div class="field-row">
                      <div class="field">
                        <label class="label">Nome *</label>
                        <input class="input" type="text" formControlName="refName">
                        @if (ref.get('refName')?.invalid && ref.get('refName')?.touched) {
                          <span class="error">Nome é obrigatório.</span>
                        }
                      </div>
                      <div class="field">
                        <label class="label">Cargo *</label>
                        <input class="input" type="text" formControlName="refRole">
                        @if (ref.get('refRole')?.invalid && ref.get('refRole')?.touched) {
                          <span class="error">Cargo é obrigatório.</span>
                        }
                      </div>
                    </div>
                    <div class="field">
                      <label class="label">Contato (e-mail ou telefone) *</label>
                      <input class="input" type="text" formControlName="refContact">
                      @if (ref.get('refContact')?.invalid && ref.get('refContact')?.touched) {
                        <span class="error">Contato é obrigatório.</span>
                      }
                    </div>
                  </div>
                }
              </div>

              <button type="button" class="btn-secondary" (click)="addReference()">
                + Adicionar referência
              </button>

              <div class="field" style="margin-top: var(--spacing-6)">
                <label class="label" for="motivation">Motivação *</label>
                <textarea id="motivation" class="input textarea" rows="5"
                          formControlName="motivation"
                          placeholder="Por que você quer fazer parte do FracExec?"></textarea>
                @if (f['motivation'].invalid && f['motivation'].touched) {
                  <span class="error">Motivação é obrigatória.</span>
                }
              </div>

              <div class="field lgpd-field">
                <label class="lgpd-label">
                  <input type="checkbox" formControlName="lgpdConsent">
                  <span>
                    Li e aceito os termos de uso e a
                    <a [href]="privacyUrl" class="link" target="_blank" rel="noopener">política de privacidade</a>.
                    Consinto com o tratamento dos meus dados pessoais para fins de verificação e match de oportunidades.
                  </span>
                </label>
                @if (f['lgpdConsent'].invalid && f['lgpdConsent'].touched) {
                  <span class="error">O consentimento LGPD é obrigatório para enviar a candidatura.</span>
                }
              </div>

              @if (serverError()) {
                <div class="alert alert--error" role="alert">{{ serverError() }}</div>
              }
            </div>
          }

          <!-- ── Navegação ─────────────────────────────────────────── -->
          <div class="form-actions">
            @if (currentStep() > 1) {
              <button type="button" class="btn-secondary" (click)="prevStep()">
                ← Etapa anterior
              </button>
            }
            @if (currentStep() < 3) {
              <button type="button" class="btn-primary" (click)="nextStep()">
                Próxima etapa →
              </button>
            }
            @if (currentStep() === 3) {
              <button type="submit" class="btn-primary" [disabled]="submitting()">
                {{ submitting() ? 'Enviando...' : 'Enviar candidatura' }}
              </button>
            }
          </div>
        </form>
      </div>
    }

    <!-- ── Tela de confirmação ─────────────────────────────────────── -->
    @if (submitted()) {
      <div class="confirmation">
        <div class="confirmation-card">
          <p class="confirmation-icon">✦</p>
          <h2 class="confirmation-title">Candidatura recebida.</h2>
          <p class="confirmation-body">Retorno em até 10 dias úteis.</p>
          <p class="confirmation-body">
            Você receberá um e-mail de confirmação com mais detalhes.
          </p>
          <div style="margin-top: var(--spacing-4)">
            <app-status-badge variant="status-pending" label="Aguardando análise" />
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .apply-container {
      max-width: 680px;
      margin: 0 auto;
      padding: var(--spacing-8) var(--spacing-4);
    }

    .apply-header { margin-bottom: var(--spacing-8); text-align: center; }
    .apply-title  { font-family: var(--font-display); font-size: 28px; font-weight: 700;
                    color: var(--color-text-primary); margin: 0 0 var(--spacing-2); }
    .apply-subtitle { color: var(--color-text-secondary); font-size: 15px; margin: 0; }

    /* Stepper */
    .stepper {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--spacing-8);
      gap: 0;
    }
    .step { display: flex; flex-direction: column; align-items: center; gap: var(--spacing-1); }
    .step-circle {
      width: 36px; height: 36px; border-radius: var(--radius-full);
      border: 2px solid var(--color-border-default);
      background: var(--color-surface-card);
      color: var(--color-text-muted);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 600; transition: all 0.2s;
    }
    .step--active .step-circle {
      border-color: var(--color-brand-accent);
      background: var(--color-brand-accent);
      color: var(--color-brand-primary);
    }
    .step--done .step-circle {
      border-color: var(--color-state-success);
      background: var(--color-state-success-bg);
      color: var(--color-state-success);
    }
    .step-label { font-size: 11px; color: var(--color-text-muted); text-align: center; white-space: nowrap; }
    .step--active .step-label { color: var(--color-brand-accent); font-weight: 600; }
    .step-line { flex: 1; height: 2px; background: var(--color-border-default); margin: 0 var(--spacing-2); margin-bottom: var(--spacing-4); }

    /* Form */
    .form-section { background: var(--color-surface-card); border-radius: var(--radius-lg);
                    border: 1px solid var(--color-border-default); padding: var(--spacing-6); margin-bottom: var(--spacing-4); }
    .section-title { font-family: var(--font-display); font-size: 18px; font-weight: 700;
                     color: var(--color-text-primary); margin: 0 0 var(--spacing-2); }
    .section-hint  { font-size: 13px; color: var(--color-text-secondary); margin: 0 0 var(--spacing-4); }

    .field { display: flex; flex-direction: column; gap: var(--spacing-1); margin-bottom: var(--spacing-4); }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-4); }
    .label { font-size: 13px; font-weight: 500; color: var(--color-text-secondary); }
    .input {
      padding: var(--spacing-2) var(--spacing-3);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md);
      font-size: 14px; font-family: var(--font-body);
      color: var(--color-text-primary);
      background: var(--color-surface-card);
      transition: border-color 0.15s;
    }
    .input:focus { outline: 2px solid var(--color-brand-accent); outline-offset: 2px; border-color: var(--color-brand-accent); }
    .textarea { resize: vertical; min-height: 120px; }
    .error { font-size: 12px; color: var(--color-state-error); }

    /* Position/Reference blocks */
    .position-block, .reference-block {
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md);
      padding: var(--spacing-4);
      margin-bottom: var(--spacing-4);
      background: var(--color-surface-muted);
    }
    .position-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-3); }
    .position-label  { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }
    .required-badge  { font-size: 11px; color: var(--color-state-warning); margin-left: var(--spacing-2); }
    .btn-remove { font-size: 12px; color: var(--color-state-error); background: none; border: none; cursor: pointer; padding: 0; }

    /* LGPD */
    .lgpd-field { margin-top: var(--spacing-4); }
    .lgpd-label { display: flex; align-items: flex-start; gap: var(--spacing-2);
                  font-size: 13px; color: var(--color-text-secondary); cursor: pointer; }
    .lgpd-label input[type="checkbox"] { margin-top: 2px; flex-shrink: 0; }
    .link { color: var(--color-brand-accent); }

    /* Alerts */
    .alert { padding: var(--spacing-3) var(--spacing-4); border-radius: var(--radius-md);
             font-size: 13px; margin-top: var(--spacing-4); }
    .alert--error { background: var(--color-state-error-bg); color: var(--color-state-error); border: 1px solid var(--color-state-error); }

    /* Actions */
    .form-actions { display: flex; justify-content: flex-end; gap: var(--spacing-3); padding: var(--spacing-4) 0; }
    .btn-primary {
      padding: var(--spacing-2) var(--spacing-6);
      background: var(--color-brand-primary);
      color: var(--color-brand-accent);
      border: none; border-radius: var(--radius-md);
      font-family: var(--font-display); font-weight: 600; font-size: 14px;
      cursor: pointer; transition: opacity 0.15s;
    }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary {
      padding: var(--spacing-2) var(--spacing-5);
      background: transparent;
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md); font-size: 14px;
      cursor: pointer; transition: background 0.15s;
    }
    .btn-secondary:hover { background: var(--color-surface-muted); }

    /* Confirmation */
    .confirmation { display: flex; align-items: center; justify-content: center;
                    min-height: 60vh; padding: var(--spacing-8); }
    .confirmation-card {
      max-width: 480px; width: 100%;
      background: var(--color-surface-card);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg);
      padding: var(--spacing-10);
      text-align: center;
    }
    .confirmation-icon { font-size: 48px; color: var(--color-brand-accent); margin: 0 0 var(--spacing-4); }
    .confirmation-title { font-family: var(--font-display); font-size: 22px; font-weight: 700;
                          color: var(--color-text-primary); margin: 0 0 var(--spacing-3); }
    .confirmation-body { color: var(--color-text-secondary); font-size: 14px; margin: 0 0 var(--spacing-2); }
  `]
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
