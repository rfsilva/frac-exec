import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';

interface EngagementItem {
  id: string; companyName: string; executiveEmail: string;
  cLevelType: string; monthlyValue: number; status: string; startedAt: string | null;
}

@Component({
  selector: 'app-admin-engagements',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  template: `
    <div class="page-body">
      <h1 class="page-title">Engajamentos</h1>

      @if (loading()) { <p class="loading">Carregando...</p> }
      @else if (engagements().length === 0) { <p class="empty">Nenhum engajamento registrado.</p> }
      @else {
        <div class="list">
          @for (e of engagements(); track e.id) {
            <div class="card">
              <div class="row">
                <div class="info">
                  <span class="company">{{ e.companyName }}</span>
                  <span class="exec">{{ e.executiveEmail }}</span>
                  <span class="role mono">{{ e.cLevelType }} · R$ {{ e.monthlyValue | number:'1.2-2' }}/mês</span>
                  <span class="date muted">Início: {{ e.startedAt | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="actions">
                  <span class="badge badge--{{ e.status.toLowerCase() }}">{{ e.status }}</span>
                  @if (e.status === 'ACTIVE' || e.status === 'PAUSED') {
                    <button class="btn btn--sm" (click)="openModal(e)">Alterar status</button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Modal de mudança de status -->
      @if (modalEngagement()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3 class="modal-title">Alterar status do engajamento</h3>
            <p class="modal-company">{{ modalEngagement()!.companyName }} — {{ modalEngagement()!.cLevelType }}</p>
            <div class="field">
              <label class="label">Novo status</label>
              <select class="input" [(ngModel)]="modalStatus">
                <option value="PAUSED">PAUSED (Suspensão temporária)</option>
                <option value="COMPLETED">COMPLETED (Encerramento natural)</option>
                <option value="CANCELLED">CANCELLED (Rescisão antecipada)</option>
              </select>
            </div>
            <div class="field">
              <label class="label">Motivo</label>
              <textarea class="input" rows="3" [(ngModel)]="modalReason" placeholder="Descreva o motivo da alteração..."></textarea>
            </div>
            <div class="modal-actions">
              <button class="btn" (click)="closeModal()">Cancelar</button>
              <button class="btn btn--primary" [disabled]="saving()" (click)="saveStatus()">
                {{ saving() ? 'Salvando...' : 'Confirmar' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-body { padding: var(--spacing-6); }
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: var(--spacing-4); }
    .loading, .empty { color: var(--color-text-secondary); }
    .card { border: 1px solid var(--color-border); border-radius: 8px; margin-bottom: var(--spacing-2); background: var(--color-surface); }
    .row  { display: flex; align-items: flex-start; justify-content: space-between; padding: var(--spacing-4); gap: var(--spacing-4); }
    .info { display: flex; flex-direction: column; gap: 3px; flex: 1; }
    .company { font-weight: 700; font-size: 0.9375rem; }
    .exec, .date { font-size: 0.8125rem; color: var(--color-text-secondary); }
    .role, .mono { font-family: 'JetBrains Mono', monospace; font-size: 0.8125rem; }
    .muted { color: var(--color-text-secondary); }
    .actions { display: flex; flex-direction: column; align-items: flex-end; gap: var(--spacing-2); }
    .badge { font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
    .badge--active    { background: #e8f5e9; color: #1b5e20; }
    .badge--paused    { background: #fff3e0; color: #e65100; }
    .badge--completed { background: #e3f2fd; color: #0d47a1; }
    .badge--cancelled { background: #fce4ec; color: #880e4f; }
    .btn { padding: var(--spacing-1) var(--spacing-3); border: 1px solid var(--color-border); border-radius: 6px; background: transparent; font-size: 0.8125rem; cursor: pointer; }
    .btn--primary { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
    .btn--sm { padding: 2px var(--spacing-2); font-size: 0.75rem; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: var(--color-surface); border-radius: 8px; padding: var(--spacing-6); max-width: 480px; width: 90%; display: flex; flex-direction: column; gap: var(--spacing-4); }
    .modal-title { font-size: 1.125rem; font-weight: 700; margin: 0; }
    .modal-company { font-size: 0.875rem; color: var(--color-text-secondary); margin: 0; }
    .field { display: flex; flex-direction: column; gap: var(--spacing-1); }
    .label { font-size: 0.875rem; font-weight: 500; }
    .input { padding: var(--spacing-2) var(--spacing-3); border: 1px solid var(--color-border); border-radius: 6px; font-size: 0.875rem; background: var(--color-surface); }
    .modal-actions { display: flex; justify-content: flex-end; gap: var(--spacing-3); }
  `]
})
export class AdminEngagements implements OnInit {
  private readonly http    = inject(HttpClient);
  private readonly destroy = inject(DestroyRef);

  readonly loading         = signal(true);
  readonly engagements     = signal<EngagementItem[]>([]);
  readonly modalEngagement = signal<EngagementItem | null>(null);
  readonly saving          = signal(false);

  modalStatus = 'PAUSED';
  modalReason = '';

  ngOnInit(): void {
    this.http.get<EngagementItem[]>('/api/v1/admin/engagements')
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: l => { this.engagements.set(l); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  openModal(e: EngagementItem): void { this.modalEngagement.set(e); this.modalStatus = 'PAUSED'; this.modalReason = ''; }
  closeModal(): void { this.modalEngagement.set(null); }

  saveStatus(): void {
    const eng = this.modalEngagement();
    if (!eng) return;
    this.saving.set(true);
    this.http.patch<EngagementItem>(`/api/v1/admin/engagements/${eng.id}/status`,
      { status: this.modalStatus, reason: this.modalReason })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: updated => {
          this.engagements.update(l => l.map(x => x.id === updated.id ? updated : x));
          this.saving.set(false);
          this.closeModal();
        },
        error: () => this.saving.set(false),
      });
  }
}
