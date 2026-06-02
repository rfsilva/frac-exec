import { Component, Input } from '@angular/core';

export type BadgeVariant =
  | 'sector'
  | 'status-active'
  | 'status-pending'
  | 'status-warning'
  | 'neutral';

const VARIANT_LABELS: Record<BadgeVariant, string> = {
  'sector':         'Setor',
  'status-active':  'Ativo',
  'status-pending': 'Pendente',
  'status-warning': 'Atenção',
  'neutral':        'Neutro',
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span [class]="'badge badge--' + variant">
      {{ label || defaultLabel }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-family: var(--font-body);
      line-height: 1.5;
    }

    .badge--sector {
      background-color: var(--color-brand-accent-light);
      color: var(--color-brand-deep);
    }

    .badge--status-active {
      background-color: var(--color-state-success-bg);
      color: var(--color-state-success);
    }

    .badge--status-pending {
      background-color: var(--color-state-warning-bg);
      color: var(--color-state-warning);
    }

    .badge--status-warning {
      background-color: var(--color-state-warning-bg);
      color: var(--color-state-warning);
    }

    .badge--neutral {
      background-color: var(--color-surface-muted);
      color: var(--color-text-secondary);
    }
  `]
})
export class StatusBadge {
  @Input({ required: true }) variant!: BadgeVariant;
  @Input() label?: string;

  get defaultLabel(): string {
    return VARIANT_LABELS[this.variant] ?? this.variant;
  }
}
