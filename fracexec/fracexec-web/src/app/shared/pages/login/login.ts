import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="auth-container">
      <h1>Entrar no FracExec</h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="field">
          <label for="email">E-mail</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" />
          @if (form.get('email')?.invalid && form.get('email')?.touched) {
            <span class="error">E-mail inválido.</span>
          }
        </div>

        <div class="field">
          <label for="password">Senha</label>
          <input id="password" type="password" formControlName="password" autocomplete="current-password" />
        </div>

        @if (errorMessage()) {
          <p class="error-banner" role="alert">{{ errorMessage() }}</p>
        }

        <button type="submit" [disabled]="loading() || form.invalid">
          {{ loading() ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>

      <a routerLink="/forgot-password">Esqueci minha senha</a>
    </div>
  `,
})
export class Login {
  form;
  loading      = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.nonNullable.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: res => {
        this.loading.set(false);
        this.auth.redirectToPortal(res.role);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('E-mail ou senha inválidos.');
      },
    });
  }
}
