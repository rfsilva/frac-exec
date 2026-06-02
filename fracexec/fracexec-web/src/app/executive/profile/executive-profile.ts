import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeader } from '../../shared/layout/page-header/page-header';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';

const SPECIALTIES = ['CFO', 'CTO', 'CMO', 'COO', 'OUTRO'] as const;
type Specialty = typeof SPECIALTIES[number];

interface ProfileResponse {
  id: string | null;
  bio: string | null;
  experienceSummary: string | null;
  photoUrl: string | null;
  specialties: Specialty[];
  sectors: string[];
  companyVisibility: Record<string, boolean>;
  applicationCompanies: string[];  // B1: empresas da candidatura para toggles
  availabilityDaysPerMonth: number;
  profileStatus: string;
  isComplete: boolean;
}

const MAX_WORDS = 300;

@Component({
  selector: 'app-executive-profile',
  standalone: true,
  imports: [PageHeader, LoadingSkeleton, ReactiveFormsModule, FormsModule],
  template: `
    <app-page-header title="Meu Perfil" [breadcrumb]="['Executivo', 'Perfil']" />

    <div class="page-body">

      @if (showBanner()) {
        <div class="banner" role="alert">
          Complete seu perfil para aparecer na pool de executivos.
        </div>
      }

      @if (loading()) { <app-loading-skeleton type="list" /> }

      @if (!loading()) {
        <form [formGroup]="form" (ngSubmit)="saveProfile()" novalidate>

          <!-- Foto -->
          <div class="card">
            <h2 class="section-title">Foto de perfil</h2>
            <div class="photo-row">
              @if (photoUrl()) {
                <img [src]="photoUrl()!" class="photo-preview" alt="Foto de perfil">
              } @else {
                <div class="photo-placeholder" aria-hidden="true">◎</div>
              }
              <div>
                <input type="file" accept="image/*" (change)="onPhotoSelected($event)"
                       class="file-input" aria-label="Selecionar foto de perfil">
                @if (uploadingPhoto()) { <p class="hint">Enviando foto...</p> }
              </div>
            </div>
          </div>

          <!-- Bio -->
          <div class="card">
            <h2 class="section-title">Bio <span class="required">*</span></h2>
            <textarea class="textarea" rows="5" formControlName="bio"
                      placeholder="Descreva sua trajetória C-Level (máx. 300 palavras)"></textarea>
            <p class="word-counter" [class.word-counter--over]="wordCount() > MAX_WORDS">
              {{ wordCount() }} / {{ MAX_WORDS }} palavras
            </p>
            @if (f['bio'].invalid && f['bio'].touched) {
              <p class="error">Bio é obrigatória.</p>
            }
            @if (wordCount() > MAX_WORDS) {
              <p class="error">Bio excede o limite de {{ MAX_WORDS }} palavras.</p>
            }
          </div>

          <!-- Especialidades -->
          <div class="card">
            <h2 class="section-title">Especialidades C-Level <span class="required">*</span></h2>
            <div class="checkbox-group">
              @for (s of allSpecialties; track s) {
                <label class="checkbox-label">
                  <input type="checkbox" [checked]="isSelected(s)" (change)="toggleSpecialty(s)">
                  {{ s }}
                </label>
              }
            </div>
            @if (selectedSpecialties().length === 0 && specialtiesTouched()) {
              <p class="error">Selecione ao menos uma especialidade.</p>
            }
          </div>

          <!-- Setores -->
          <div class="card">
            <h2 class="section-title">Setores de experiência</h2>
            <div class="chips-row">
              @for (sector of sectors(); track sector) {
                <span class="chip">
                  {{ sector }}
                  <button type="button" class="chip-remove" (click)="removeSector(sector)"
                          [attr.aria-label]="'Remover ' + sector">×</button>
                </span>
              }
            </div>
            <div class="sector-input-row">
              <input class="input" type="text" [(ngModel)]="newSector"
                     [ngModelOptions]="{standalone: true}"
                     placeholder="Ex: Tecnologia, Varejo, Saúde"
                     (keydown.enter)="addSector(); $event.preventDefault()">
              <button type="button" class="btn-secondary" (click)="addSector()">Adicionar</button>
            </div>
          </div>

          <!-- B1: Visibilidade de empresas anteriores (AC-2) -->
          @if (applicationCompanies().length > 0) {
            <div class="card">
              <h2 class="section-title">Visibilidade das empresas anteriores</h2>
              <p class="hint-text">Escolha quais nomes de empresa serão exibidos publicamente no seu perfil.</p>
              @for (company of applicationCompanies(); track company) {
                <div class="visibility-row">
                  <span class="company-name">{{ company }}</span>
                  <div class="toggle-group">
                    <label class="checkbox-label">
                      <input type="radio" [name]="'vis-' + company" [value]="true"
                             [checked]="getVisibility(company) !== false"
                             (change)="setVisibility(company, true)">
                      Exibir nome
                    </label>
                    <label class="checkbox-label">
                      <input type="radio" [name]="'vis-' + company" [value]="false"
                             [checked]="getVisibility(company) === false"
                             (change)="setVisibility(company, false)">
                      Anonimizar
                    </label>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Resumo de experiência -->
          <div class="card">
            <h2 class="section-title">Resumo de experiência verificada</h2>
            <textarea class="textarea" rows="4" formControlName="experienceSummary"
                      placeholder="Descreva suas principais realizações."></textarea>
          </div>

          <!-- Ações -->
          <div class="form-actions">
            @if (savedMsg()) { <p class="saved-msg">Perfil atualizado.</p> }
            @if (errorMsg()) { <p class="error">{{ errorMsg() }}</p> }
            <button type="submit" class="btn-primary" [disabled]="saving()">
              {{ saving() ? 'Salvando...' : 'Salvar perfil' }}
            </button>
          </div>

        </form>
      }
    </div>
  `,
  styles: [`
    .page-body { padding: var(--spacing-6); max-width: 720px; }
    .banner {
      background: var(--color-state-warning-bg); color: var(--color-state-warning);
      border: 1px solid var(--color-state-warning); border-radius: var(--radius-md);
      padding: var(--spacing-3) var(--spacing-4); margin-bottom: var(--spacing-5); font-size: 14px;
    }
    .card {
      background: var(--color-surface-card); border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg); padding: var(--spacing-5); margin-bottom: var(--spacing-5);
    }
    .section-title { font-family: var(--font-display); font-size: 16px; font-weight: 600;
                     color: var(--color-text-primary); margin: 0 0 var(--spacing-4); }
    .required { color: var(--color-state-error); }
    .photo-row { display: flex; align-items: center; gap: var(--spacing-4); }
    .photo-preview { width: 80px; height: 80px; border-radius: var(--radius-full); object-fit: cover; }
    .photo-placeholder {
      width: 80px; height: 80px; border-radius: var(--radius-full);
      background: var(--color-brand-accent-light); color: var(--color-brand-deep);
      display: flex; align-items: center; justify-content: center; font-size: 32px;
    }
    .file-input { font-size: 13px; }
    .textarea {
      width: 100%; padding: var(--spacing-2) var(--spacing-3);
      border: 1px solid var(--color-border-default); border-radius: var(--radius-md);
      font-size: 14px; font-family: var(--font-body); resize: vertical;
      background: var(--color-surface-card); color: var(--color-text-primary);
    }
    .textarea:focus { outline: 2px solid var(--color-brand-accent); outline-offset: 2px; }
    .word-counter { font-size: 12px; color: var(--color-text-muted); margin: var(--spacing-1) 0 0; }
    .word-counter--over { color: var(--color-state-error); font-weight: 600; }
    .hint { font-size: 12px; color: var(--color-text-muted); margin: var(--spacing-1) 0 0; }
    .hint-text { font-size: 13px; color: var(--color-text-secondary); margin: 0 0 var(--spacing-3); }
    .checkbox-group { display: flex; flex-wrap: wrap; gap: var(--spacing-3); }
    .checkbox-label { display: flex; align-items: center; gap: var(--spacing-2);
                      font-size: 14px; cursor: pointer; }
    .chips-row { display: flex; flex-wrap: wrap; gap: var(--spacing-2); margin-bottom: var(--spacing-3); }
    .chip {
      display: inline-flex; align-items: center; gap: var(--spacing-1);
      background: var(--color-brand-accent-light); color: var(--color-brand-deep);
      padding: 2px 10px; border-radius: var(--radius-full); font-size: 13px;
    }
    .chip-remove { background: none; border: none; cursor: pointer; color: var(--color-brand-deep);
                   font-size: 16px; line-height: 1; padding: 0; }
    .sector-input-row { display: flex; gap: var(--spacing-3); }
    .input {
      flex: 1; padding: var(--spacing-2) var(--spacing-3);
      border: 1px solid var(--color-border-default); border-radius: var(--radius-md);
      font-size: 14px; font-family: var(--font-body);
    }
    .visibility-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--spacing-2) 0; border-bottom: 1px solid var(--color-border-default);
    }
    .visibility-row:last-child { border-bottom: none; }
    .company-name { font-size: 14px; color: var(--color-text-primary); font-weight: 500; }
    .toggle-group { display: flex; gap: var(--spacing-4); }
    .form-actions { display: flex; align-items: center; gap: var(--spacing-4); padding: var(--spacing-4) 0; }
    .btn-primary {
      padding: var(--spacing-2) var(--spacing-6); background: var(--color-brand-primary);
      color: var(--color-brand-accent); border: none; border-radius: var(--radius-md);
      font-family: var(--font-display); font-weight: 600; font-size: 14px; cursor: pointer;
    }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary {
      padding: var(--spacing-2) var(--spacing-4); background: transparent;
      color: var(--color-text-secondary); border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md); font-size: 13px; cursor: pointer;
    }
    .saved-msg { font-size: 13px; color: var(--color-state-success); margin: 0; }
    .error { font-size: 12px; color: var(--color-state-error); margin: var(--spacing-1) 0 0; }
  `]
})
export class ExecutiveProfile {

  private readonly http       = inject(HttpClient);
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly fb         = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly allSpecialties: Specialty[] = [...SPECIALTIES];
  readonly MAX_WORDS = MAX_WORDS;

  readonly loading              = signal(true);
  readonly saving               = signal(false);
  readonly uploadingPhoto       = signal(false);
  readonly savedMsg             = signal(false);
  readonly errorMsg             = signal<string | null>(null);
  readonly photoUrl             = signal<string | null>(null);
  readonly selectedSpecialties  = signal<Specialty[]>([]);
  readonly sectors              = signal<string[]>([]);
  readonly showBanner           = signal(false);
  readonly specialtiesTouched   = signal(false);
  readonly applicationCompanies = signal<string[]>([]);
  readonly companyVisibility    = signal<Record<string, boolean>>({});

  newSector = '';

  readonly form: FormGroup;

  // P2: wordCount como computed signal — não recria closure a cada ciclo
  readonly wordCount = computed(() => {
    const bio = this.form?.get('bio')?.value ?? '';
    return bio.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
  });

  constructor() {
    this.form = this.fb.group({
      bio:               ['', Validators.required],
      experienceSummary: [''],
    });

    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params['banner'] === 'true') this.showBanner.set(true);
      });

    this.http.get<ProfileResponse>('/api/v1/executive/profile')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: profile => {
          this.form.patchValue({
            bio:               profile.bio ?? '',
            experienceSummary: profile.experienceSummary ?? '',
          });
          this.selectedSpecialties.set(profile.specialties ?? []);
          this.sectors.set(profile.sectors ?? []);
          this.photoUrl.set(profile.photoUrl ?? null);
          this.applicationCompanies.set(profile.applicationCompanies ?? []);
          this.companyVisibility.set({ ...profile.companyVisibility });
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  get f() { return this.form.controls; }

  isSelected(s: Specialty): boolean { return this.selectedSpecialties().includes(s); }

  toggleSpecialty(s: Specialty): void {
    this.specialtiesTouched.set(true);
    this.selectedSpecialties.update(list =>
      list.includes(s) ? list.filter(x => x !== s) : [...list, s]);
  }

  addSector(): void {
    const v = this.newSector.trim();
    if (v && !this.sectors().includes(v)) this.sectors.update(l => [...l, v]);
    this.newSector = '';
  }

  removeSector(s: string): void { this.sectors.update(l => l.filter(x => x !== s)); }

  // B1: getters/setters para companyVisibility
  getVisibility(company: string): boolean | undefined {
    return this.companyVisibility()[company];
  }

  setVisibility(company: string, visible: boolean): void {
    this.companyVisibility.update(v => ({ ...v, [company]: visible }));
  }

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingPhoto.set(true);
    const formData = new FormData();
    formData.append('file', file);
    this.http.post<{ photoUrl: string }>('/api/v1/executive/profile/photo', formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => { this.photoUrl.set(res.photoUrl); this.uploadingPhoto.set(false); },
        error: () => this.uploadingPhoto.set(false),
      });
  }

  saveProfile(): void {
    this.form.markAllAsTouched();
    this.specialtiesTouched.set(true);

    // P1: validação de 300 palavras na bio
    if (this.wordCount() > MAX_WORDS) return;
    if (this.form.invalid || this.selectedSpecialties().length === 0) return;

    this.saving.set(true);
    this.errorMsg.set(null);

    const payload = {
      bio:               this.form.value.bio,
      experienceSummary: this.form.value.experienceSummary,
      specialties:       this.selectedSpecialties(),
      sectors:           this.sectors(),
      companyVisibility: this.companyVisibility(),  // B1: envia mapa real
    };

    this.http.put<ProfileResponse>('/api/v1/executive/profile', payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.savedMsg.set(true);
          setTimeout(() => this.savedMsg.set(false), 3000);
          localStorage.setItem('fracexec_profile_complete', 'true');
          this.showBanner.set(false);
          this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.errorMsg.set(
            err.error?.detail ?? 'Não foi possível salvar o perfil. Tente novamente.');
        },
      });
  }
}
