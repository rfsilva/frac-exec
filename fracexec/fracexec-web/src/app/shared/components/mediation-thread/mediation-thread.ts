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
  template: `
    <div class="thread">
      <h3 class="thread-title">Thread de Mediação</h3>

      @if (loading()) {
        <app-loading-skeleton type="list" />
      } @else {
        <div class="messages">
          @for (msg of messages(); track msg.id) {
            <div class="message" [class.message--admin]="msg.senderRole === 'ADMIN'">
              <div class="msg-meta">
                <span class="sender-label">{{ msg.senderLabel }}</span>
                <span class="msg-date">{{ msg.createdAt | date:'dd/MM HH:mm' }}</span>
              </div>
              <p class="msg-content">{{ msg.content }}</p>
            </div>
          }
          @if (messages().length === 0) {
            <p class="empty">Nenhuma mensagem ainda.</p>
          }
        </div>

        @if (role === 'ADMIN') {
          <div class="compose">
            <textarea class="compose-input" rows="3" placeholder="Escreva uma mensagem..."
                      [(ngModel)]="newMessage"></textarea>
            <button class="btn btn--primary" [disabled]="!newMessage.trim() || sending()"
                    (click)="send()">
              {{ sending() ? 'Enviando...' : 'Enviar mensagem' }}
            </button>
          </div>
        } @else {
          <div class="contact-box">
            <textarea class="compose-input" rows="2" placeholder="Envie uma mensagem ao time FracExec..."
                      [(ngModel)]="newMessage"></textarea>
            <button class="btn btn--secondary" [disabled]="!newMessage.trim() || sending()"
                    (click)="contactAdmin()">
              {{ sending() ? 'Enviando...' : 'Enviar ao FracExec' }}
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .thread { display: flex; flex-direction: column; gap: var(--spacing-4); }
    .thread-title { font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--color-text-secondary); margin: 0 0 var(--spacing-2); }
    .messages { display: flex; flex-direction: column; gap: var(--spacing-3); max-height: 400px; overflow-y: auto; }
    .message { padding: var(--spacing-3); border-radius: 8px; background: var(--color-surface); border: 1px solid var(--color-border); }
    .message--admin { background: #f0fdf4; border-color: #86efac; }
    .msg-meta { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .sender-label { font-size: 0.75rem; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase; }
    .msg-date { font-size: 0.75rem; color: var(--color-text-secondary); font-family: 'JetBrains Mono', monospace; }
    .msg-content { font-size: 0.9375rem; margin: 0; line-height: 1.5; }
    .empty { font-size: 0.875rem; color: var(--color-text-secondary); }
    .compose, .contact-box { display: flex; flex-direction: column; gap: var(--spacing-2); }
    .compose-input { padding: var(--spacing-2); border: 1px solid var(--color-border); border-radius: 6px; font-size: 0.875rem; resize: vertical; font-family: inherit; }
    .btn { padding: var(--spacing-2) var(--spacing-4); border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; align-self: flex-end; }
    .btn--primary   { background: var(--color-primary); color: #fff; }
    .btn--secondary { background: transparent; border: 1.5px solid var(--color-border); color: var(--color-text-primary); }
    .btn:disabled   { opacity: 0.6; cursor: not-allowed; }
  `]
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
