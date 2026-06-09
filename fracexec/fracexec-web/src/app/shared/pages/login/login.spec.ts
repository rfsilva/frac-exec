import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Login } from './login';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthResponse, Role } from '../../../core/models/user.model';

const MOCK_RESPONSE: AuthResponse = {
  accessToken: 'tok', refreshToken: 'rt',
  email: 'user@test.com', role: 'EXECUTIVE' as Role,
};

const ROUTES = [
  { path: 'executive', component: class DummyExec {} },
  { path: 'forgot-password', component: class DummyForgot {} },
  { path: 'register', component: class DummyReg {} },
];

function makeAuthSpy() {
  return {
    login: vi.fn(),
    redirectToPortal: vi.fn(),
  };
}

describe('Login', () => {
  let authSpy: ReturnType<typeof makeAuthSpy>;

  beforeEach(async () => {
    authSpy = makeAuthSpy();
    await TestBed.configureTestingModule({
      imports: [Login, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        provideRouter(ROUTES),
      ],
    }).compileComponents();
  });

  it('deve criar o componente', () => {
    const fixture = TestBed.createComponent(Login);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('formulário inválido com campos vazios', () => {
    const fixture = TestBed.createComponent(Login);
    expect(fixture.componentInstance.form.invalid).toBeTruthy();
  });

  it('formulário válido com e-mail e senha', () => {
    const fixture = TestBed.createComponent(Login);
    const comp = fixture.componentInstance;
    comp.form.setValue({ email: 'user@test.com', password: 'senha123' });
    expect(comp.form.valid).toBeTruthy();
  });

  it('formulário inválido com e-mail malformado', () => {
    const fixture = TestBed.createComponent(Login);
    const comp = fixture.componentInstance;
    comp.form.setValue({ email: 'invalido', password: 'senha123' });
    expect(comp.form.invalid).toBeTruthy();
  });

  it('onSubmit com form inválido não chama auth.login', () => {
    const fixture = TestBed.createComponent(Login);
    const comp = fixture.componentInstance;
    comp.onSubmit();
    expect(authSpy.login).not.toHaveBeenCalled();
  });

  it('onSubmit com sucesso chama redirectToPortal', async () => {
    authSpy.login.mockReturnValue(of(MOCK_RESPONSE));
    const fixture = TestBed.createComponent(Login);
    const comp = fixture.componentInstance;
    comp.form.setValue({ email: 'user@test.com', password: 'senha123' });

    comp.onSubmit();
    await fixture.whenStable();

    expect(authSpy.login).toHaveBeenCalledWith('user@test.com', 'senha123');
    expect(authSpy.redirectToPortal).toHaveBeenCalledWith('EXECUTIVE');
    expect(comp.loading()).toBeFalsy();
  });

  it('onSubmit com erro define errorMessage', async () => {
    authSpy.login.mockReturnValue(throwError(() => new Error('401')));
    const fixture = TestBed.createComponent(Login);
    const comp = fixture.componentInstance;
    comp.form.setValue({ email: 'user@test.com', password: 'errada' });

    comp.onSubmit();
    await fixture.whenStable();

    expect(comp.errorMessage()).toBe('E-mail ou senha inválidos.');
    expect(comp.loading()).toBeFalsy();
  });

  it('loading false após erro', async () => {
    authSpy.login.mockReturnValue(throwError(() => new Error('401')));
    const fixture = TestBed.createComponent(Login);
    const comp = fixture.componentInstance;
    comp.form.setValue({ email: 'user@test.com', password: 'senha123' });

    comp.onSubmit();
    await fixture.whenStable();

    expect(comp.loading()).toBeFalsy();
    expect(comp.errorMessage()).not.toBe('');
  });
});
