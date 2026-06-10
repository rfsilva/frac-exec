import { Component, Input, Output, EventEmitter, OnChanges, HostListener, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-availability-drawer',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './availability-drawer.html',
  styleUrl: './availability-drawer.scss'
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
