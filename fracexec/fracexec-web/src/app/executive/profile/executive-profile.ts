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
  templateUrl: './executive-profile.html',
  styleUrl: './executive-profile.scss'
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

  // Story 6.3: LGPD
  readonly deleteConfirm = signal(false);
  readonly deleting      = signal(false);
  readonly deleteMsg     = signal<string | null>(null);

  requestDeletion(): void {
    this.deleting.set(true);
    this.http.post<{ message: string }>('/api/v1/account/deletion-request', {})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: r => { this.deleting.set(false); this.deleteMsg.set(r.message); this.deleteConfirm.set(false); },
        error: () => { this.deleting.set(false); this.deleteMsg.set('Erro ao processar solicitação. Tente novamente.'); },
      });
  }
}
