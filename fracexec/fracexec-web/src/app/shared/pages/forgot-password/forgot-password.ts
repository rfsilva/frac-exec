import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="auth-container">
      <h1>Recuperar senha</h1>

      @if (!submitted()) {
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="field">
            <label for="email">E-mail</label>
            <input id="email" type="email" formControlName="email" autocomplete="email" />
          </div>

          <button type="submit" [disabled]="loading() || form.invalid">
            {{ loading() ? 'Enviando…' : 'Enviar instruções' }}
          </button>
        </form>
      } @else {
        <!-- AC-13: mesma mensagem independente se email existe -->
        <p role="status">
          Se o e-mail estiver cadastrado, você receberá as instruções em instantes.
        </p>
        <a routerLink="/login">Voltar ao login</a>
      }
    </div>
  `,
})
export class ForgotPassword {
  form;
  loading   = signal(false);
  submitted = signal(false);

  constructor(private readonly fb: FormBuilder, private readonly auth: AuthService) {
    this.form = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);

    this.auth.forgotPassword(this.form.getRawValue().email).subscribe({
      next:  () => { this.loading.set(false); this.submitted.set(true); },
      error: () => { this.loading.set(false); this.submitted.set(true); }, // always show same message
    });
  }
}
