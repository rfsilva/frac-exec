import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
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
