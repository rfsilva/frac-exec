import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="auth-container">
      <h1>Redefinir senha</h1>

      @if (!done()) {
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="field">
            <label for="newPassword">Nova senha</label>
            <input id="newPassword" type="password" formControlName="newPassword" autocomplete="new-password" />
          </div>

          @if (errorMessage()) {
            <p class="error-banner" role="alert">{{ errorMessage() }}</p>
          }

          <button type="submit" [disabled]="loading() || form.invalid">
            {{ loading() ? 'Salvando…' : 'Redefinir senha' }}
          </button>
        </form>
      } @else {
        <p role="status">Senha redefinida com sucesso.</p>
        <a routerLink="/login">Fazer login</a>
      }
    </div>
  `,
})
export class ResetPassword implements OnInit {
  form;
  token        = '';
  loading      = signal(false);
  done         = signal(false);
  errorMessage = signal('');

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.form = this.fb.nonNullable.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) this.router.navigate(['/login']);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMessage.set('');

    this.auth.resetPassword(this.token, this.form.getRawValue().newPassword).subscribe({
      next:  () => { this.loading.set(false); this.done.set(true); },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Link de redefinição inválido ou expirado. Solicite um novo.');
      },
    });
  }
}
