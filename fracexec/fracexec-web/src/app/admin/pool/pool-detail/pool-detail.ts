import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageHeader } from '../../../shared/layout/page-header/page-header';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton';

interface AdminExecProfile {
  id: string; userId: string; email: string; fullName: string;
  bio: string | null; experienceSummary: string | null; photoUrl: string | null;
  specialties: string[]; sectors: string[];
  availabilityDaysPerMonth: number; profileStatus: string;
  companyVisibilityRaw: Record<string, boolean>;
}

interface ExecutiveClient {
  id: string; cnae2digit: string; regionState: string;
  regionCity: string | null; companySizeRange: string | null;
}

@Component({
  selector: 'app-pool-detail',
  standalone: true,
  imports: [PageHeader, LoadingSkeleton, FormsModule],
  templateUrl: './pool-detail.html',
  styleUrl: './pool-detail.scss'
})
export class PoolDetail {

  private readonly http       = inject(HttpClient);
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading        = signal(true);
  readonly profile        = signal<AdminExecProfile | null>(null);
  readonly loadingClients = signal(false);
  readonly clients        = signal<ExecutiveClient[]>([]);
  readonly showAddClient  = signal(false);

  newCnae  = '';
  newState = '';
  newCity  = '';

  get initials(): string {
    const name = this.profile()?.fullName ?? this.profile()?.email ?? '';
    return name.substring(0, 2).toUpperCase();
  }

  get companyEntries(): { name: string; visible: boolean }[] {
    const raw = this.profile()?.companyVisibilityRaw ?? {};
    return Object.entries(raw).map(([name, visible]) => ({ name, visible }));
  }

  constructor() {
    const id = this.route.snapshot.paramMap.get('profileId');
    if (id) {
      this.http.get<AdminExecProfile>(`/api/v1/admin/pool/${id}`)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next:  p  => { this.profile.set(p); this.loading.set(false); this.loadClients(id); },
          error: () => this.loading.set(false),
        });
    }
  }

  private loadClients(profileId: string): void {
    this.loadingClients.set(true);
    this.http.get<ExecutiveClient[]>(`/api/v1/admin/executives/${profileId}/clients`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  list => { this.clients.set(list); this.loadingClients.set(false); },
        error: ()   => this.loadingClients.set(false),
      });
  }

  addClient(): void {
    const profileId = this.profile()?.id;
    if (!profileId || !this.newCnae || !this.newState) return;
    const body = { cnae2digit: this.newCnae.toUpperCase(), regionState: this.newState.toUpperCase(), regionCity: this.newCity || null };
    this.http.post<ExecutiveClient>(`/api/v1/admin/executives/${profileId}/clients`, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: client => {
          this.clients.update(l => [...l, client]);
          this.newCnae = ''; this.newState = ''; this.newCity = '';
          this.showAddClient.set(false);
        },
      });
  }

  removeClient(clientId: string): void {
    const profileId = this.profile()?.id;
    if (!profileId) return;
    this.http.delete(`/api/v1/admin/executives/${profileId}/clients/${clientId}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.clients.update(l => l.filter(c => c.id !== clientId)) });
  }

  back(): void { this.router.navigate(['/admin/pool']); }
}
