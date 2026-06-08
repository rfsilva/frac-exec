import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

export type SealStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

@Component({
  selector: 'app-seal-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="seal-banner" role="banner" aria-label="Selo FracExec">
      <div class="seal-icon" aria-hidden="true">✦</div>
      <div class="seal-info">
        <span class="seal-name">{{ displayName }}</span>
        <span class="seal-date">{{ verificationDateLabel }}</span>
      </div>
      <div class="seal-status">
        <span class="badge" [class]="statusClass" [attr.aria-label]="statusLabel + ' status'">
          {{ statusLabel }}
        </span>
        @if (profileStatus === 'INACTIVE') {
          <button class="btn-update" (click)="updateAvailability.emit()"
                  aria-label="Atualizar disponibilidade">
            Atualizar disponibilidade
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .seal-banner {
      display: flex; align-items: center; gap: var(--spacing-4);
      background: linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-deep));
      padding: var(--spacing-3) var(--spacing-5);
      flex-shrink: 0;
    }
    .seal-icon {
      width: 36px; height: 36px; border-radius: var(--radius-full);
      background-color: var(--color-brand-accent);
      color: var(--color-brand-primary);
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; font-weight: 700; flex-shrink: 0;
    }
    .seal-info { display: flex; flex-direction: column; flex: 1; }
    .seal-name { color: var(--color-text-inverse); font-size: 14px; font-weight: 600;
                 font-family: var(--font-display); }
    .seal-date { color: rgba(234, 242, 238, 0.55); font-size: 11px; }
    .seal-status { display: flex; align-items: center; gap: var(--spacing-3); }
    .badge {
      padding: 2px 10px; border-radius: var(--radius-full);
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
    }
    .badge--active   { background: var(--color-state-success-bg); color: var(--color-state-success); }
    .badge--inactive { background: var(--color-state-warning-bg); color: var(--color-state-warning); }
    .badge--suspended { background: var(--color-surface-muted);   color: var(--color-text-muted); }
    .btn-update {
      font-size: 12px; color: var(--color-brand-accent);
      background: rgba(77, 199, 138, 0.12);
      border: 1px solid rgba(77, 199, 138, 0.3);
      border-radius: var(--radius-sm); padding: 2px 10px; cursor: pointer;
    }
    .btn-update:hover { background: rgba(77, 199, 138, 0.2); }
  `]
})
export class SealBanner {
  @Input({ required: true }) profileStatus!: SealStatus;
  @Input() email?: string;
  @Input() verificationDate?: string | null;
  @Output() updateAvailability = new EventEmitter<void>();

  get displayName(): string {
    if (!this.email) return 'Executivo';
    return this.email.split('@')[0];
  }

  get verificationDateLabel(): string {
    if (!this.verificationDate) return 'Data de verificação não disponível';
    return 'Verificado em ' + new Date(this.verificationDate).toLocaleDateString('pt-BR');
  }

  get statusLabel(): string {
    const labels: Record<SealStatus, string> = {
      ACTIVE: 'Ativo', INACTIVE: 'Inativo', SUSPENDED: 'Suspenso'
    };
    return labels[this.profileStatus] ?? this.profileStatus;
  }

  get statusClass(): string {
    const classes: Record<SealStatus, string> = {
      ACTIVE: 'badge badge--active',
      INACTIVE: 'badge badge--inactive',
      SUSPENDED: 'badge badge--suspended',
    };
    return classes[this.profileStatus] ?? 'badge badge--suspended';
  }
}
