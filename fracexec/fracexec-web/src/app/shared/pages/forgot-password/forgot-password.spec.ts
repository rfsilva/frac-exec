import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ForgotPassword } from './forgot-password';
import { AuthService } from '../../../core/auth/auth.service';

describe('ForgotPassword', () => {
  let authSpy: { forgotPassword: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authSpy = { forgotPassword: vi.fn().mockReturnValue(of({ message: 'OK' })) };
    await TestBed.configureTestingModule({
      imports: [ForgotPassword, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        provideRouter([]),
      ],
    }).compileComponents();
  });

  it('deve criar o componente', () => {
    const fixture = TestBed.createComponent(ForgotPassword);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('submitted inicia false', () => {
    const { componentInstance: comp } = TestBed.createComponent(ForgotPassword);
    expect(comp.submitted()).toBeFalsy();
  });

  it('onSubmit com email inválido não chama service', async () => {
    const fixture = TestBed.createComponent(ForgotPassword);
    const comp = fixture.componentInstance;
    comp.onSubmit();
    await fixture.whenStable();
    expect(authSpy.forgotPassword).not.toHaveBeenCalled();
  });

  it('onSubmit com email válido chama service e marca submitted', async () => {
    const fixture = TestBed.createComponent(ForgotPassword);
    const comp = fixture.componentInstance;
    comp.form.setValue({ email: 'user@test.com' });
    comp.onSubmit();
    await fixture.whenStable();
    expect(authSpy.forgotPassword).toHaveBeenCalledWith('user@test.com');
    expect(comp.submitted()).toBeTruthy();
  });

  it('onSubmit com erro ainda marca submitted (não revela se e-mail existe)', async () => {
    authSpy.forgotPassword.mockReturnValue(throwError(() => new Error('err')));
    const fixture = TestBed.createComponent(ForgotPassword);
    const comp = fixture.componentInstance;
    comp.form.setValue({ email: 'user@test.com' });
    comp.onSubmit();
    await fixture.whenStable();
    expect(comp.submitted()).toBeTruthy();
  });
});
