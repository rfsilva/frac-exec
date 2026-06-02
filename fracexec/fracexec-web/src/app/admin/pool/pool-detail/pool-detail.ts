import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeader } from '../../../shared/layout/page-header/page-header';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton';

interface AdminExecProfile {
  id: string; userId: string; email: string; fullName: string;
  bio: string | null; experienceSummary: string | null; photoUrl: string | null;
  specialties: string[]; sectors: string[];
  availabilityDaysPerMonth: number; profileStatus: string;
  companyVisibilityRaw: Record<string, boolean>;
}

@Component({
  selector: 'app-pool-detail',
  standalone: true,
  imports: [PageHeader, LoadingSkeleton],
  template: `
    <app-page-header title="Perfil do Executivo"
                     [breadcrumb]="['Admin', 'Pool', 'Detalhe']" />

    <div class="page-body">
      @if (loading()) { <app-loading-skeleton type="list" /> }

      @if (!loading() && profile()) {
        <div class="detail-grid">
          <div class="card">
            <div class="profile-header">
              @if (profile()!.photoUrl) {
                <img [src]="profile()!.photoUrl!" class="photo" alt="Foto do executivo">
              } @else {
                <div class="avatar">{{ initials }}</div>
              }
              <div>
                <h2 class="name">{{ profile()!.fullName }}</h2>
                <p class="email text-muted">{{ profile()!.email }}</p>
                <p class="availability">
                  {{ profile()!.availabilityDaysPerMonth }} dias/mês ·
                  <span class="status">{{ profile()!.profileStatus }}</span>
                </p>
              </div>
            </div>
          </div>

          @if (profile()!.bio) {
            <div class="card">
              <h3 class="section-title">Bio</h3>
              <p class="body-text">{{ profile()!.bio }}</p>
            </div>
          }

          <div class="card">
            <h3 class="section-title">Especialidades</h3>
            <div class="tags">
              @for (s of profile()!.specialties; track s) {
                <span class="tag">{{ s }}</span>
              }
            </div>
          </div>

          @if (profile()!.sectors.length) {
            <div class="card">
              <h3 class="section-title">Setores</h3>
              <p class="body-text">{{ profile()!.sectors.join(', ') }}</p>
            </div>
          }

          <!-- AC-6: visibilidade de empresas — admin vê nomes reais -->
          @if (companyEntries.length > 0) {
            <div class="card">
              <h3 class="section-title">Empresas anteriores (visão admin)</h3>
              @for (entry of companyEntries; track entry.name) {
                <div class="company-row">
                  <span>{{ entry.name }}</span>
                  <span class="vis-flag" [class.vis-hidden]="!entry.visible">
                    {{ entry.visible ? 'Exibir nome' : 'Anonimizado' }}
                  </span>
                </div>
              }
            </div>
          }
        </div>

        <button class="btn-back" (click)="back()">← Voltar para pool</button>
      }
    </div>
  `,
  styles: [`
    .page-body { padding: var(--spacing-6); max-width: 720px; }
    .detail-grid { display: flex; flex-direction: column; gap: var(--spacing-4); }
    .card {
      background: var(--color-surface-card); border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg); padding: var(--spacing-5);
    }
    .profile-header { display: flex; gap: var(--spacing-4); align-items: center; }
    .photo { width: 72px; height: 72px; border-radius: var(--radius-full); object-fit: cover; }
    .avatar {
      width: 72px; height: 72px; border-radius: var(--radius-full);
      background: var(--color-brand-accent-light); color: var(--color-brand-deep);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-display); font-size: 22px; font-weight: 700; flex-shrink: 0;
    }
    .name { font-family: var(--font-display); font-size: 20px; font-weight: 700;
            color: var(--color-text-primary); margin: 0 0 4px; }
    .email, .availability { font-size: 13px; color: var(--color-text-secondary); margin: 0; }
    .status { font-weight: 600; color: var(--color-state-success); }
    .text-muted { color: var(--color-text-secondary); }
    .section-title { font-size: 12px; font-weight: 600; text-transform: uppercase;
                     color: var(--color-text-muted); letter-spacing: 0.05em; margin: 0 0 var(--spacing-3); }
    .body-text { font-size: 14px; color: var(--color-text-secondary); line-height: 1.6; margin: 0; }
    .tags { display: flex; flex-wrap: wrap; gap: var(--spacing-2); }
    .tag {
      font-size: 12px; font-weight: 700; text-transform: uppercase;
      background: var(--color-brand-accent-light); color: var(--color-brand-deep);
      padding: 2px 10px; border-radius: var(--radius-full);
    }
    .company-row { display: flex; justify-content: space-between; align-items: center;
                   padding: var(--spacing-2) 0; border-bottom: 1px solid var(--color-border-default);
                   font-size: 13px; }
    .company-row:last-child { border-bottom: none; }
    .vis-flag { font-size: 11px; font-weight: 600; color: var(--color-state-success); }
    .vis-hidden { color: var(--color-text-muted); }
    .btn-back {
      margin-top: var(--spacing-5); padding: var(--spacing-2) var(--spacing-4);
      background: transparent; color: var(--color-text-secondary);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md); font-size: 13px; cursor: pointer;
    }
    .btn-back:hover { background: var(--color-surface-muted); }
  `]
})
export class PoolDetail {

  private readonly http       = inject(HttpClient);
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly profile = signal<AdminExecProfile | null>(null);

  get initials(): string {
    const name = this.profile()?.fullName ?? this.profile()?.email ?? '';
    return name.substring(0, 2).toUpperCase();
  }

  get companyEntries(): { name: string; visible: boolean }[] {
    const raw = this.profile()?.companyVisibilityRaw ?? {};
    return Object.entries(raw).map(([name, visible]) => ({ name, visible }));
  }

  constructor() {
    const id = this.route.snapshot.paramMap.get('profileId');
    if (id) {
      this.http.get<AdminExecProfile>(`/api/v1/admin/pool/${id}`)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next:  p  => { this.profile.set(p); this.loading.set(false); },
          error: () => this.loading.set(false),
        });
    }
  }

  back(): void { this.router.navigate(['/admin/pool']); }
}
