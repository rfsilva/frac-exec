import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageHeader } from '../../../shared/layout/page-header/page-header';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton';

interface AdminExecProfile {
  id: string; userId: string; email: string; fullName: string;
  bio: string | null; experienceSummary: string | null; photoUrl: string | null;
  specialties: string[]; sectors: string[];
  availabilityDaysPerMonth: number; profileStatus: string;
  companyVisibilityRaw: Record<string, boolean>;
}

interface ExecutiveClient {
  id: string; cnae2digit: string; regionState: string;
  regionCity: string | null; companySizeRange: string | null;
}

@Component({
  selector: 'app-pool-detail',
  standalone: true,
  imports: [PageHeader, LoadingSkeleton, FormsModule],
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

          <!-- Story 4.1: Clientes ativos para detecção de conflito -->
          <div class="card">
            <h3 class="section-title">Clientes ativos (conflito de interesses)</h3>
            @if (loadingClients()) {
              <p class="body-text">Carregando...</p>
            } @else {
              <div class="client-list">
                @for (c of clients(); track c.id) {
                  <div class="client-row">
                    <span class="client-tag">CNAE {{ c.cnae2digit }} · {{ c.regionState }}
                      @if (c.regionCity) { — {{ c.regionCity }} }
                    </span>
                    <button class="btn-remove" (click)="removeClient(c.id)" title="Remover">×</button>
                  </div>
                }
                @if (clients().length === 0) {
                  <p class="body-text text-muted">Nenhum cliente registrado.</p>
                }
              </div>
              @if (!showAddClient()) {
                <button class="btn-add" (click)="showAddClient.set(true)">+ Adicionar cliente</button>
              } @else {
                <div class="add-form">
                  <input class="input-small" type="text" placeholder="CNAE (2 dígitos)"
                         maxlength="2" [(ngModel)]="newCnae">
                  <input class="input-small" type="text" placeholder="UF (SP, RJ...)"
                         maxlength="2" [(ngModel)]="newState">
                  <input class="input-small" type="text" placeholder="Cidade (opcional)"
                         [(ngModel)]="newCity">
                  <button class="btn-save" [disabled]="!newCnae || !newState" (click)="addClient()">Salvar</button>
                  <button class="btn-cancel" (click)="showAddClient.set(false)">Cancelar</button>
                </div>
              }
            }
          </div>
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
    .client-list { display: flex; flex-direction: column; gap: var(--spacing-1); margin-bottom: var(--spacing-3); }
    .client-row { display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-1) 0; border-bottom: 1px solid var(--color-border-default); font-size: 13px; }
    .client-row:last-child { border-bottom: none; }
    .client-tag { color: var(--color-text-primary); font-family: 'JetBrains Mono', monospace; font-size: 12px; }
    .btn-remove { background: none; border: none; color: var(--color-text-muted); font-size: 16px; cursor: pointer; padding: 0 4px; line-height: 1; }
    .btn-remove:hover { color: var(--color-error, #d32f2f); }
    .btn-add { background: none; border: 1px dashed var(--color-border-default); border-radius: var(--radius-md); color: var(--color-text-secondary); font-size: 12px; padding: var(--spacing-1) var(--spacing-3); cursor: pointer; }
    .btn-add:hover { border-color: var(--color-primary); color: var(--color-primary); }
    .add-form { display: flex; gap: var(--spacing-2); flex-wrap: wrap; align-items: center; margin-top: var(--spacing-2); }
    .input-small { padding: var(--spacing-1) var(--spacing-2); border: 1px solid var(--color-border-default); border-radius: var(--radius-sm); font-size: 12px; width: 100px; }
    .btn-save { background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-sm); font-size: 12px; padding: var(--spacing-1) var(--spacing-3); cursor: pointer; }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-cancel { background: none; border: 1px solid var(--color-border-default); border-radius: var(--radius-sm); font-size: 12px; padding: var(--spacing-1) var(--spacing-3); cursor: pointer; color: var(--color-text-secondary); }
  `]
})
export class PoolDetail {

  private readonly http       = inject(HttpClient);
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading        = signal(true);
  readonly profile        = signal<AdminExecProfile | null>(null);
  readonly loadingClients = signal(false);
  readonly clients        = signal<ExecutiveClient[]>([]);
  readonly showAddClient  = signal(false);

  newCnae  = '';
  newState = '';
  newCity  = '';

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
          next:  p  => { this.profile.set(p); this.loading.set(false); this.loadClients(id); },
          error: () => this.loading.set(false),
        });
    }
  }

  private loadClients(profileId: string): void {
    this.loadingClients.set(true);
    this.http.get<ExecutiveClient[]>(`/api/v1/admin/executives/${profileId}/clients`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  list => { this.clients.set(list); this.loadingClients.set(false); },
        error: ()   => this.loadingClients.set(false),
      });
  }

  addClient(): void {
    const profileId = this.profile()?.id;
    if (!profileId || !this.newCnae || !this.newState) return;
    const body = { cnae2digit: this.newCnae.toUpperCase(), regionState: this.newState.toUpperCase(), regionCity: this.newCity || null };
    this.http.post<ExecutiveClient>(`/api/v1/admin/executives/${profileId}/clients`, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: client => {
          this.clients.update(l => [...l, client]);
          this.newCnae = ''; this.newState = ''; this.newCity = '';
          this.showAddClient.set(false);
        },
      });
  }

  removeClient(clientId: string): void {
    const profileId = this.profile()?.id;
    if (!profileId) return;
    this.http.delete(`/api/v1/admin/executives/${profileId}/clients/${clientId}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.clients.update(l => l.filter(c => c.id !== clientId)) });
  }

  back(): void { this.router.navigate(['/admin/pool']); }
}
