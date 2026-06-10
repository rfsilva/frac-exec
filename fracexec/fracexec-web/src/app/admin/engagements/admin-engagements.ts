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
  templateUrl: './admin-engagements.html',
  styleUrl: './admin-engagements.scss'
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
