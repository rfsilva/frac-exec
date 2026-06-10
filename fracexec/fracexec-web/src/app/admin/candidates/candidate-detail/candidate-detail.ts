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
  templateUrl: './candidate-detail.html',
  styleUrl: './candidate-detail.scss'
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
