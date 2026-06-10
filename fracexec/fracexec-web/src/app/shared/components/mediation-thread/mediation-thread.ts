import { Component, Input, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadingSkeleton } from '../loading-skeleton/loading-skeleton';

interface Message {
  id: string; senderRole: string; senderLabel: string;
  content: string; createdAt: string;
}

@Component({
  selector: 'app-mediation-thread',
  standalone: true,
  imports: [DatePipe, FormsModule, LoadingSkeleton],
  templateUrl: './mediation-thread.html',
  styleUrl: './mediation-thread.scss'
})
export class MediationThread implements OnInit {
  @Input() needId!: string;
  @Input() role: 'ADMIN' | 'PME' | 'EXECUTIVE' = 'PME';

  private readonly http    = inject(HttpClient);
  private readonly destroy = inject(DestroyRef);

  readonly loading  = signal(true);
  readonly messages = signal<Message[]>([]);
  readonly sending  = signal(false);
  newMessage = '';

  private get apiBase(): string {
    if (this.role === 'ADMIN')    return `/api/v1/admin/needs/${this.needId}/messages`;
    if (this.role === 'PME')      return `/api/v1/company/needs/${this.needId}/messages`;
    return `/api/v1/executive/needs/${this.needId}/messages`;
  }

  ngOnInit(): void {
    this.http.get<Message[]>(this.apiBase)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: m => { this.messages.set(m); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  send(): void {
    if (!this.newMessage.trim()) return;
    this.sending.set(true);
    this.http.post<Message>(this.apiBase, { content: this.newMessage })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: msg => { this.messages.update(m => [...m, msg]); this.newMessage = ''; this.sending.set(false); },
        error: () => this.sending.set(false),
      });
  }

  contactAdmin(): void {
    if (!this.newMessage.trim()) return;
    this.sending.set(true);
    const url = this.role === 'PME'
      ? `/api/v1/company/needs/${this.needId}/contact-admin`
      : `/api/v1/executive/needs/${this.needId}/contact-admin`;
    this.http.post(url, { content: this.newMessage })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: () => { this.newMessage = ''; this.sending.set(false); }, error: () => this.sending.set(false) });
  }
}
