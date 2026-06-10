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
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss'
})
export class StatusBadge {
  @Input({ required: true }) variant!: BadgeVariant;
  @Input() label?: string;

  get defaultLabel(): string {
    return VARIANT_LABELS[this.variant] ?? this.variant;
  }
}
