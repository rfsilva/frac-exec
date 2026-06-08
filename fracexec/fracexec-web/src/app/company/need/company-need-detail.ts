import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { MediationThread } from '../../shared/components/mediation-thread/mediation-thread';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';

interface AnonProfile {
  shortlistExecutiveId: string; sectorInitials: string; cLevelType: string;
  sectors: string[]; availabilityDaysPerMonth: number;
  bioSummary: string | null; conflictStatus: string;
}

@Component({
  selector: 'app-company-need-detail',
  standalone: true,
  imports: [MediationThread, LoadingSkeleton],
  template: `
    <div class="page-body">
      @if (loading()) { <app-loading-skeleton type="card" /> }

      @if (!loading() && needStatus() === 'SHORTLIST_SENT') {
        <h1 class="page-title">Revise os perfis selecionados</h1>
        <p class="subtitle">Selecione até 2 executivos de interesse para avançar.</p>

        <div class="profiles-grid">
          @for (p of profiles(); track p.shortlistExecutiveId) {
            @if (p.conflictStatus === 'APPROVED_WITH_ALERT') {
              <div class="conflict-alert">⚠ Este executivo atua em empresa do mesmo segmento na sua região.</div>
            }
            <div class="profile-card" [class.profile-card--selected]="isSelected(p.shortlistExecutiveId)"
                 (click)="toggleSelect(p.shortlistExecutiveId)">
              <div class="avatar">{{ p.sectorInitials }}</div>
              <div class="profile-info">
                <span class="clevel">{{ p.cLevelType }}</span>
                <span class="sectors">{{ p.sectors.join(', ') }}</span>
                <span class="avail mono">{{ p.availabilityDaysPerMonth }} dias/mês</span>
                @if (p.bioSummary) { <p class="bio">{{ p.bioSummary }}...</p> }
              </div>
              <div class="check-indicator">{{ isSelected(p.shortlistExecutiveId) ? '✓' : '' }}</div>
            </div>
          }
        </div>

        <div class="selection-actions">
          <span class="selection-count">{{ selected().length }} / 2 selecionados</span>
          <button class="btn btn--primary" [disabled]="selected().length === 0 || confirming()"
                  (click)="confirmSelection()">
            {{ confirming() ? 'Confirmando...' : 'Confirmar seleção' }}
          </button>
        </div>
      }

      @if (!loading() && (needStatus() === 'IN_MEDIATION' || needStatus() === 'CONTRACTED')) {
        <h1 class="page-title">Thread de Mediação</h1>
        <app-mediation-thread [needId]="needId" role="PME" />
      }
    </div>
  `,
  styles: [`
    .page-body  { padding: var(--spacing-6); max-width: 800px; }
    .page-title { font-size: 1.25rem; font-weight: 700; margin-bottom: var(--spacing-2); }
    .subtitle   { color: var(--color-text-secondary); margin-bottom: var(--spacing-6); }
    .profiles-grid { display: flex; flex-direction: column; gap: var(--spacing-4); }
    .conflict-alert { background: #fff7ed; border: 1px solid #f59e0b; color: #92400e; padding: var(--spacing-2) var(--spacing-3); border-radius: 6px; font-size: 0.875rem; }
    .profile-card { display: flex; align-items: flex-start; gap: var(--spacing-4); padding: var(--spacing-4); border: 1.5px solid var(--color-border); border-radius: 8px; background: var(--color-surface); cursor: pointer; transition: border-color .15s; }
    .profile-card:hover { border-color: var(--color-primary); }
    .profile-card--selected { border-color: var(--color-primary); background: #f0fdf4; }
    .avatar { width: 48px; height: 48px; border-radius: 50%; background: var(--color-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; flex-shrink: 0; }
    .profile-info { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .clevel  { font-weight: 700; font-size: 1rem; }
    .sectors { font-size: 0.875rem; color: var(--color-text-secondary); }
    .avail   { font-size: 0.8125rem; color: var(--color-text-secondary); }
    .mono    { font-family: 'JetBrains Mono', monospace; }
    .bio     { font-size: 0.875rem; margin: 4px 0 0; line-height: 1.5; }
    .check-indicator { font-size: 1.25rem; color: var(--color-primary); font-weight: 700; width: 24px; flex-shrink: 0; }
    .selection-actions { display: flex; align-items: center; justify-content: flex-end; gap: var(--spacing-4); margin-top: var(--spacing-6); }
    .selection-count { font-size: 0.875rem; color: var(--color-text-secondary); }
    .btn { padding: var(--spacing-2) var(--spacing-6); border: none; border-radius: 6px; font-size: 0.9375rem; font-weight: 600; cursor: pointer; }
    .btn--primary { background: var(--color-primary); color: #fff; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class CompanyNeedDetail implements OnInit {
  private readonly http    = inject(HttpClient);
  private readonly route   = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);

  readonly loading    = signal(true);
  readonly needStatus = signal('');
  readonly profiles   = signal<AnonProfile[]>([]);
  readonly selected   = signal<string[]>([]);
  readonly confirming = signal(false);

  needId = '';

  ngOnInit(): void {
    this.needId = this.route.snapshot.paramMap.get('id') ?? '';
    // Buscar status da necessidade via dashboard
    this.http.get<{ activeNeed: { id: string; status: string } | null }>('/api/v1/company/dashboard')
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: d => {
          const status = d.activeNeed?.status ?? '';
          this.needStatus.set(status);
          if (status === 'SHORTLIST_SENT') this.loadProfiles();
          else this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  private loadProfiles(): void {
    this.http.get<AnonProfile[]>(`/api/v1/company/needs/${this.needId}/shortlist`)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: p => { this.profiles.set(p); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  isSelected(id: string): boolean { return this.selected().includes(id); }

  toggleSelect(id: string): void {
    if (this.isSelected(id)) {
      this.selected.update(s => s.filter(x => x !== id));
    } else if (this.selected().length < 2) {
      this.selected.update(s => [...s, id]);
    }
  }

  confirmSelection(): void {
    if (!this.selected().length) return;
    this.confirming.set(true);
    this.http.post(`/api/v1/company/needs/${this.needId}/shortlist/select`,
      { selectedExecutiveIds: this.selected() })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => { this.confirming.set(false); this.needStatus.set('IN_MEDIATION'); },
        error: () => this.confirming.set(false),
      });
  }
}
