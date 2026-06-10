import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

export type SealStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

@Component({
  selector: 'app-seal-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './seal-banner.html',
  styleUrl: './seal-banner.scss'
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
