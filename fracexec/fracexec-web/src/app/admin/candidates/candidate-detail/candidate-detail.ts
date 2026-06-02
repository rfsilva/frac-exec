import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageHeader } from '../../../shared/layout/page-header/page-header';
import { StatusBadge, BadgeVariant } from '../../../shared/components/status-badge/status-badge';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton';

interface PositionDetail { roleTitle: string; companyName: string | null; periodStart: string; periodEnd: string | null; }
interface ReferenceDetail { refName: string; refRole: string; refContact: string; }
interface ApplicationDetail {
  id: string; fullName: string; email: string; linkedinUrl: string | null;
  motivation: string; status: string; createdAt: string;
  adminNotes: string | null; supportDocumentUrl: string | null;
  positions: PositionDetail[]; references: ReferenceDetail[];
}

@Component({
  selector: 'app-candidate-detail',
  standalone: true,
  imports: [PageHeader, StatusBadge, LoadingSkeleton, FormsModule],
  template: `
    <app-page-header title="Detalhe da Candidatura" [breadcrumb]="['Admin', 'Candidaturas', 'Detalhe']" />

    <div class="page-body">
      @if (loading()) { <app-loading-skeleton type="list" /> }

      @if (!loading() && detail()) {
        <div class="detail-grid">

          <!-- Info principal -->
          <div class="card">
            <div class="card-header">
              <h2 class="candidate-name">{{ detail()!.fullName }}</h2>
              <app-status-badge [variant]="statusToVariant(detail()!.status)"
                                [label]="statusLabel(detail()!.status)" />
            </div>
            <p class="candidate-email">{{ detail()!.email }}</p>
            @if (detail()!.linkedinUrl) {
              <a [href]="detail()!.linkedinUrl!" class="link" target="_blank" rel="noopener">
                Ver LinkedIn
              </a>
            }
          </div>

          <!-- Histórico C-Level -->
          <div class="card">
            <h3 class="section-title">Histórico C-Level</h3>
            @for (pos of detail()!.positions; track pos.roleTitle) {
              <div class="position-item">
                <strong>{{ pos.roleTitle }}</strong>
                @if (pos.companyName) { <span class="muted"> · {{ pos.companyName }}</span> }
                <span class="muted"> · {{ pos.periodStart }}{{ pos.periodEnd ? ' → ' + pos.periodEnd : ' → atual' }}</span>
              </div>
            }
          </div>

          <!-- Referências -->
          <div class="card">
            <h3 class="section-title">Referências</h3>
            @for (ref of detail()!.references; track ref.refName) {
              <div class="reference-item">
                <strong>{{ ref.refName }}</strong> — {{ ref.refRole }}
                <span class="muted"> · {{ ref.refContact }}</span>
              </div>
            }
          </div>

          <!-- Motivação -->
          <div class="card">
            <h3 class="section-title">Motivação</h3>
            <p class="motivation-text">{{ detail()!.motivation }}</p>
          </div>

          <!-- AC-8: Notas internas (auto-save no blur) -->
          <div class="card">
            <h3 class="section-title">Notas internas</h3>
            <textarea class="textarea" rows="4" [value]="adminNotes()"
                      (input)="adminNotes.set($any($event.target).value)"
                      (blur)="saveNotes()"
                      placeholder="Adicione observações internas (visível apenas ao time FracExec)">
            </textarea>
            @if (notesSaved()) { <p class="save-msg">Notas salvas.</p> }
          </div>

          <!-- AC-7: Documento de suporte -->
          <div class="card">
            <h3 class="section-title">Documento de suporte</h3>
            <div class="upload-row">
              <input type="file" (change)="onFileSelected($event)" class="file-input"
                     aria-label="Selecionar documento de suporte">
              <button class="btn-secondary" (click)="uploadDocument()" [disabled]="!selectedFile() || uploading()">
                {{ uploading() ? 'Enviando...' : 'Enviar' }}
              </button>
            </div>
            @if (detail()!.supportDocumentUrl) {
              <a [href]="detail()!.supportDocumentUrl!" class="link" target="_blank" rel="noopener">
                Baixar documento atual
              </a>
            }
          </div>

          <!-- AC-2/3/4/5: Ações (apenas UNDER_REVIEW) -->
          @if (detail()!.status === 'UNDER_REVIEW') {
            <div class="card actions-card">
              <h3 class="section-title">Decisão</h3>
              <div class="action-buttons">
                <button class="btn-approve" (click)="showApproveModal.set(true)">
                  Aprovar
                </button>
                <button class="btn-reject" (click)="showRejectModal.set(true)">
                  Rejeitar
                </button>
              </div>
            </div>
          }

        </div>
      }

      <!-- Modal de aprovação -->
      @if (showApproveModal()) {
        <div class="modal-overlay" (click)="showApproveModal.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3 class="modal-title">Confirmar aprovação</h3>
            <p class="modal-body">O executivo receberá e-mail com link para criar seu perfil.</p>
            <div class="modal-actions">
              <button class="btn-secondary" (click)="showApproveModal.set(false)">Cancelar</button>
              <button class="btn-approve" [disabled]="processing()" (click)="approve()">
                {{ processing() ? 'Processando...' : 'Confirmar aprovação' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal de rejeição -->
      @if (showRejectModal()) {
        <div class="modal-overlay" (click)="showRejectModal.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3 class="modal-title">Confirmar rejeição</h3>
            <p class="modal-body">O candidato receberá e-mail com resposta genérica.</p>
            <textarea class="textarea" rows="3"
                      [(ngModel)]="rejectionReason"
                      placeholder="Motivo interno (não enviado ao candidato) *"
                      aria-label="Motivo interno da rejeição">
            </textarea>
            <div class="modal-actions">
              <button class="btn-secondary" (click)="showRejectModal.set(false)">Cancelar</button>
              <button class="btn-reject" [disabled]="!rejectionReason.trim() || processing()"
                      (click)="reject()">
                {{ processing() ? 'Processando...' : 'Confirmar rejeição' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-body { padding: var(--spacing-6); }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-5); }
    .card {
      background: var(--color-surface-card); border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg); padding: var(--spacing-5);
    }
    .actions-card { grid-column: 1 / -1; }
    .card-header { display: flex; align-items: center; gap: var(--spacing-3); margin-bottom: var(--spacing-2); }
    .candidate-name { font-family: var(--font-display); font-size: 20px; font-weight: 700;
                      color: var(--color-text-primary); margin: 0; }
    .candidate-email { font-size: 13px; color: var(--color-text-secondary); margin: 0 0 var(--spacing-2); }
    .section-title { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
                     color: var(--color-text-muted); margin: 0 0 var(--spacing-3); }
    .position-item, .reference-item { font-size: 13px; margin-bottom: var(--spacing-2); }
    .muted { color: var(--color-text-secondary); }
    .motivation-text { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; margin: 0; }
    .textarea {
      width: 100%; padding: var(--spacing-2) var(--spacing-3);
      border: 1px solid var(--color-border-default); border-radius: var(--radius-md);
      font-size: 13px; font-family: var(--font-body); resize: vertical;
      background: var(--color-surface-card); color: var(--color-text-primary);
    }
    .textarea:focus { outline: 2px solid var(--color-brand-accent); outline-offset: 2px; }
    .save-msg { font-size: 12px; color: var(--color-state-success); margin: var(--spacing-1) 0 0; }
    .upload-row { display: flex; gap: var(--spacing-3); align-items: center; margin-bottom: var(--spacing-3); }
    .file-input { font-size: 13px; }
    .link { color: var(--color-brand-accent); font-size: 13px; }
    .action-buttons { display: flex; gap: var(--spacing-4); }
    .btn-approve {
      padding: var(--spacing-2) var(--spacing-6); background: var(--color-brand-primary);
      color: var(--color-brand-accent); border: none; border-radius: var(--radius-md);
      font-family: var(--font-display); font-weight: 600; font-size: 14px; cursor: pointer;
    }
    .btn-approve:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-reject {
      padding: var(--spacing-2) var(--spacing-6); background: var(--color-state-error-bg);
      color: var(--color-state-error); border: 1px solid var(--color-state-error);
      border-radius: var(--radius-md); font-family: var(--font-display);
      font-weight: 600; font-size: 14px; cursor: pointer;
    }
    .btn-reject:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary {
      padding: var(--spacing-2) var(--spacing-4); background: transparent;
      color: var(--color-text-secondary); border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md); font-size: 13px; cursor: pointer;
    }
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center; z-index: 100;
    }
    .modal {
      background: var(--color-surface-card); border-radius: var(--radius-lg);
      padding: var(--spacing-6); width: 480px; max-width: 90vw;
      box-shadow: 0 4px 24px rgba(0,0,0,0.15);
    }
    .modal-title { font-family: var(--font-display); font-size: 18px; font-weight: 700;
                   color: var(--color-text-primary); margin: 0 0 var(--spacing-3); }
    .modal-body { font-size: 14px; color: var(--color-text-secondary); margin: 0 0 var(--spacing-4); }
    .modal-actions { display: flex; gap: var(--spacing-3); justify-content: flex-end; margin-top: var(--spacing-4); }
  `]
})
export class CandidateDetail {

  private readonly http       = inject(HttpClient);
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading          = signal(false);
  readonly detail           = signal<ApplicationDetail | null>(null);
  readonly adminNotes       = signal('');
  readonly notesSaved       = signal(false);
  readonly showApproveModal = signal(false);
  readonly showRejectModal  = signal(false);
  readonly processing       = signal(false);
  readonly uploading        = signal(false);
  readonly selectedFile     = signal<File | null>(null);

  rejectionReason = '';

  private get id(): string {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  constructor() {
    this.loading.set(true);
    this.http.get<ApplicationDetail>(`/api/v1/admin/applications/${this.id}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: d => {
          this.detail.set(d);
          this.adminNotes.set(d.adminNotes ?? '');
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  saveNotes(): void {
    this.http.patch<ApplicationDetail>(
        `/api/v1/admin/applications/${this.id}/notes`,
        { adminNotes: this.adminNotes() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notesSaved.set(true);
          setTimeout(() => this.notesSaved.set(false), 2000);
        },
      });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.selectedFile.set(file);
  }

  uploadDocument(): void {
    const file = this.selectedFile();
    if (!file) return;
    this.uploading.set(true);
    const formData = new FormData();
    formData.append('file', file);
    this.http.post<{ url: string }>(
        `/api/v1/admin/applications/${this.id}/documents`, formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.detail.update(d => d ? { ...d, supportDocumentUrl: res.url } : d);
          this.uploading.set(false);
          this.selectedFile.set(null);
        },
        error: () => this.uploading.set(false),
      });
  }

  approve(): void {
    this.processing.set(true);
    this.http.post<{ status: string }>(`/api/v1/admin/applications/${this.id}/approve`, {})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.processing.set(false);
          this.showApproveModal.set(false);
          this.router.navigate(['/admin/candidates']);
        },
        error: () => this.processing.set(false),
      });
  }

  reject(): void {
    if (!this.rejectionReason.trim()) return;
    this.processing.set(true);
    this.http.post<{ status: string }>(
        `/api/v1/admin/applications/${this.id}/reject`,
        { rejectionReason: this.rejectionReason })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.processing.set(false);
          this.showRejectModal.set(false);
          this.router.navigate(['/admin/candidates']);
        },
        error: () => this.processing.set(false),
      });
  }

  statusToVariant(status: string): BadgeVariant {
    switch (status) {
      case 'APPROVED': return 'status-active';
      case 'REJECTED': return 'neutral';
      case 'UNDER_REVIEW': return 'status-warning';
      default: return 'status-pending';
    }
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Aguardando análise', UNDER_REVIEW: 'Em análise',
      APPROVED: 'Aprovado', REJECTED: 'Rejeitado',
    };
    return labels[status] ?? status;
  }
}
