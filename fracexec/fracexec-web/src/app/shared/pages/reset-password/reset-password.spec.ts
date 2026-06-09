import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ResetPassword } from './reset-password';
import { AuthService } from '../../../core/auth/auth.service';

function makeRoute(token = 'tok123') {
  return {
    snapshot: { queryParamMap: { get: (k: string) => k === 'token' ? token : null } }
  };
}

describe('ResetPassword', () => {
  let authSpy: { resetPassword: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authSpy = { resetPassword: vi.fn().mockReturnValue(of({ message: 'OK' })) };
    await TestBed.configureTestingModule({
      imports: [ResetPassword, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: ActivatedRoute, useValue: makeRoute() },
        provideRouter([{ path: 'login', component: class {} as any }]),
      ],
    }).compileComponents();
  });

  it('deve criar o componente', () => {
    const fixture = TestBed.createComponent(ResetPassword);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('done inicia false', () => {
    const fixture = TestBed.createComponent(ResetPassword);
    fixture.detectChanges();
    expect(fixture.componentInstance.done()).toBeFalsy();
  });

  it('onSubmit com form inválido não chama service', async () => {
    const fixture = TestBed.createComponent(ResetPassword);
    fixture.detectChanges();
    fixture.componentInstance.onSubmit();
    await fixture.whenStable();
    expect(authSpy.resetPassword).not.toHaveBeenCalled();
  });

  it('onSubmit com senha válida chama resetPassword e marca done', async () => {
    const fixture = TestBed.createComponent(ResetPassword);
    fixture.detectChanges(); // dispara ngOnInit que lê o token da rota
    await fixture.whenStable();
    const comp = fixture.componentInstance;
    comp.form.setValue({ newPassword: 'NovaSenha@1' });
    comp.onSubmit();
    await fixture.whenStable();
    expect(authSpy.resetPassword).toHaveBeenCalled();
    expect(comp.done()).toBeTruthy();
  });

  it('onSubmit com erro define errorMessage', async () => {
    authSpy.resetPassword.mockReturnValue(throwError(() => new Error('invalid')));
    const fixture = TestBed.createComponent(ResetPassword);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.form.setValue({ newPassword: 'NovaSenha@1' });
    comp.onSubmit();
    await fixture.whenStable();
    expect(comp.errorMessage()).toBeTruthy();
  });
});
