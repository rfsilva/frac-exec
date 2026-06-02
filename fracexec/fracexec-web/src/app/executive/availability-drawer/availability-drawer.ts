import { Component, Input, Output, EventEmitter, OnChanges, HostListener, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-availability-drawer',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (isOpen) {
      <!-- Backdrop -->
      <div class="drawer-backdrop" (click)="onBackdropClick()" aria-hidden="true"></div>

      <!-- Drawer panel — P2: tabindex makes it focusable for focus-trap -->
      <div class="drawer" role="dialog" aria-modal="true" aria-label="Editar disponibilidade"
           tabindex="-1" id="availability-drawer-panel">
        <div class="drawer-header">
          <h2 class="drawer-title">Disponibilidade</h2>
          <button class="btn-close" (click)="onBackdropClick()"
                  aria-label="Fechar drawer">×</button>
        </div>

        <div class="drawer-body">
          <div class="field">
            <label class="label" for="days">Dias disponíveis / mês</label>
            <input id="days" class="input" type="number" min="0" max="20"
                   aria-label="Dias por mês" [(ngModel)]="editDays" min="1" max="20"
                   (ngModelChange)="onChanged()">
            <p class="hint">Entre 1 e 20 dias. Para pausar, use o seletor de status abaixo.</p>
          </div>

          <div class="field">
            <label class="label" for="status">Status</label>
            <select id="status" class="input select"
                    aria-label="Status de disponibilidade" [(ngModel)]="editStatus"
                    (ngModelChange)="onChanged()">
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Pausado</option>
              <option value="SUSPENDED">Indisponível</option>
            </select>
          </div>
        </div>

        <div class="drawer-footer">
          <button class="btn-secondary" (click)="onBackdropClick()">Cancelar</button>
          <!-- B1: disabled durante save para evitar PATCH duplo -->
          <button class="btn-primary" (click)="onSave()" [disabled]="saving()">
            {{ saving() ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </div>

      <!-- Confirmação de descarte -->
      @if (showConfirm()) {
        <div class="confirm-overlay" role="alertdialog" aria-modal="true"
             aria-label="Descartar alterações?">
          <div class="confirm-box">
            <p class="confirm-msg">Descartar alterações?</p>
            <div class="confirm-actions">
              <button class="btn-secondary" (click)="onContinueEditing()">Continuar editando</button>
              <button class="btn-danger"    (click)="onDiscard()">Descartar</button>
            </div>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .drawer-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 200;
    }
    .drawer {
      position: fixed; top: 0; right: 0; bottom: 0; width: 360px;
      background: var(--color-surface-card); z-index: 201;
      display: flex; flex-direction: column;
      box-shadow: -4px 0 24px rgba(0,0,0,0.12);
    }
    .drawer-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--spacing-5) var(--spacing-6);
      border-bottom: 1px solid var(--color-border-default);
    }
    .drawer-title { font-family: var(--font-display); font-size: 18px; font-weight: 700;
                    color: var(--color-text-primary); margin: 0; }
    .btn-close { background: none; border: none; font-size: 22px; cursor: pointer;
                 color: var(--color-text-muted); line-height: 1; }
    .drawer-body { flex: 1; padding: var(--spacing-6); overflow-y: auto; }
    .field { margin-bottom: var(--spacing-5); }
    .label { display: block; font-size: 13px; font-weight: 500;
             color: var(--color-text-secondary); margin-bottom: var(--spacing-2); }
    .input {
      width: 100%; padding: var(--spacing-2) var(--spacing-3);
      border: 1px solid var(--color-border-default); border-radius: var(--radius-md);
      font-size: 14px; font-family: var(--font-body);
      background: var(--color-surface-card); color: var(--color-text-primary);
    }
    .input:focus { outline: 2px solid var(--color-brand-accent); outline-offset: 2px; }
    .select { cursor: pointer; }
    .hint { font-size: 12px; color: var(--color-text-muted); margin: var(--spacing-1) 0 0; }
    .drawer-footer {
      display: flex; gap: var(--spacing-3); justify-content: flex-end;
      padding: var(--spacing-4) var(--spacing-6);
      border-top: 1px solid var(--color-border-default);
    }
    .btn-primary {
      padding: var(--spacing-2) var(--spacing-5); background: var(--color-brand-primary);
      color: var(--color-brand-accent); border: none; border-radius: var(--radius-md);
      font-family: var(--font-display); font-weight: 600; font-size: 14px; cursor: pointer;
    }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary {
      padding: var(--spacing-2) var(--spacing-4); background: transparent;
      color: var(--color-text-secondary); border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md); font-size: 13px; cursor: pointer;
    }
    .btn-danger {
      padding: var(--spacing-2) var(--spacing-4);
      background: var(--color-state-error-bg); color: var(--color-state-error);
      border: 1px solid var(--color-state-error); border-radius: var(--radius-md);
      font-size: 13px; cursor: pointer;
    }
    .confirm-overlay {
      position: fixed; inset: 0; z-index: 202;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.25);
    }
    .confirm-box {
      background: var(--color-surface-card); border-radius: var(--radius-lg);
      padding: var(--spacing-6); width: 320px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .confirm-msg { font-size: 16px; font-weight: 600; color: var(--color-text-primary);
                   margin: 0 0 var(--spacing-5); }
    .confirm-actions { display: flex; gap: var(--spacing-3); justify-content: flex-end; }
  `]
})
export class AvailabilityDrawer implements OnChanges {
  @Input() isOpen = false;
  @Input() currentDays = 20;
  @Input() currentStatus = 'ACTIVE';
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<{ availabilityDaysPerMonth: number; profileStatus: string }>();

  editDays   = 20;
  editStatus = 'ACTIVE';
  isDirty    = false;
  readonly showConfirm = signal(false);
  readonly saving      = signal(false); // B1: guard contra PATCH duplo

  ngOnChanges(): void {
    if (this.isOpen) {
      this.editDays   = this.currentDays;
      this.editStatus = this.currentStatus;
      this.isDirty    = false;
      this.showConfirm.set(false);
      // P2: move focus into drawer on open for keyboard accessibility
      setTimeout(() => {
        const panel = document.getElementById('availability-drawer-panel');
        const first = panel?.querySelector<HTMLElement>('input, select, button');
        first?.focus();
      }, 50);
    }
  }

  onChanged(): void { this.isDirty = true; }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) this.onBackdropClick();
  }

  onBackdropClick(): void {
    if (this.isDirty) {
      this.showConfirm.set(true);
    } else {
      this.closed.emit();
    }
  }

  onContinueEditing(): void { this.showConfirm.set(false); }

  onDiscard(): void {
    this.showConfirm.set(false);
    this.isDirty = false;
    this.closed.emit();
  }

  onSave(): void {
    if (this.saving()) return;
    // B2: min 1 — 0 is a system sentinel, not a user selection
    const days = Math.max(1, Math.min(20, Number(this.editDays) || 1));
    this.saving.set(true);
    this.saved.emit({ availabilityDaysPerMonth: days, profileStatus: this.editStatus });
  }

  resetSaving(): void { this.saving.set(false); }
}
