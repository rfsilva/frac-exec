import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthResponse, Role } from '../models/user.model';

const MOCK_TOKEN = btoa(JSON.stringify({ alg: 'HS256' })) + '.' +
  btoa(JSON.stringify({ sub: 'user@test.com', role: 'EXECUTIVE', exp: Math.floor(Date.now() / 1000) + 3600 })) +
  '.sig';

const EXPIRED_TOKEN = btoa(JSON.stringify({ alg: 'HS256' })) + '.' +
  btoa(JSON.stringify({ sub: 'user@test.com', role: 'EXECUTIVE', exp: Math.floor(Date.now() / 1000) - 100 })) +
  '.sig';

const MOCK_RESPONSE: AuthResponse = {
  accessToken: MOCK_TOKEN,
  refreshToken: 'refresh_token_mock',
  email: 'user@test.com',
  role: 'EXECUTIVE' as Role,
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login',     component: class {} as any },
          { path: 'executive', component: class {} as any },
          { path: 'company',   component: class {} as any },
          { path: 'admin',     component: class {} as any },
        ]),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('deve criar o serviço', () => {
    expect(service).toBeTruthy();
  });

  it('isAuthenticated retorna false sem token', () => {
    expect(service.isAuthenticated()).toBeFalsy();
  });

  it('login armazena sessão e atualiza currentUser', () => {
    service.login('user@test.com', 'password').subscribe(res => {
      expect(res.email).toBe('user@test.com');
    });
    const req = httpMock.expectOne('/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(MOCK_RESPONSE);

    expect(localStorage.getItem('fracexec_access_token')).toBe(MOCK_TOKEN);
    expect(service.currentUser()?.email).toBe('user@test.com');
    expect(service.isAuthenticated()).toBeTruthy();
  });

  it('register armazena sessão', () => {
    service.register('user@test.com', 'password', 'EXECUTIVE' as Role).subscribe();
    const req = httpMock.expectOne('/api/v1/auth/register');
    expect(req.request.method).toBe('POST');
    req.flush(MOCK_RESPONSE);

    expect(service.isAuthenticated()).toBeTruthy();
  });

  it('logout remove tokens e limpa currentUser', () => {
    localStorage.setItem('fracexec_access_token', MOCK_TOKEN);
    localStorage.setItem('fracexec_refresh_token', 'rt');
    localStorage.setItem('fracexec_profile_complete', 'true');

    service.logout();

    expect(localStorage.getItem('fracexec_access_token')).toBeNull();
    expect(localStorage.getItem('fracexec_profile_complete')).toBeNull();
    expect(service.currentUser()).toBeNull();
  });

  it('getAccessToken retorna token armazenado', () => {
    localStorage.setItem('fracexec_access_token', MOCK_TOKEN);
    expect(service.getAccessToken()).toBe(MOCK_TOKEN);
  });

  it('getRefreshToken retorna refresh token', () => {
    localStorage.setItem('fracexec_refresh_token', 'rt_abc');
    expect(service.getRefreshToken()).toBe('rt_abc');
  });

  it('refreshToken lança erro se não há refresh token', () => {
    expect(() => service.refreshToken()).toThrow();
  });

  it('loadUserFromStorage ignora token expirado', () => {
    localStorage.setItem('fracexec_access_token', EXPIRED_TOKEN);
    const freshService = TestBed.inject(AuthService);
    expect(freshService.currentUser()).toBeNull();
  });

  it('loadUserFromStorage retorna usuário com token válido', () => {
    localStorage.setItem('fracexec_access_token', MOCK_TOKEN);
    // Recria o módulo para forçar nova instância do serviço lendo o localStorage
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login',     component: class {} as any },
          { path: 'executive', component: class {} as any },
          { path: 'company',   component: class {} as any },
          { path: 'admin',     component: class {} as any },
        ]),
      ],
    });
    const fresh = TestBed.inject(AuthService);
    expect(fresh.currentUser()?.email).toBe('user@test.com');
  });

  it('redirectToPortal não lança exceção para nenhum role', () => {
    // Smoke test — router.navigate chamado sem erros
    service.redirectToPortal('EXECUTIVE' as Role);
    service.redirectToPortal('PME' as Role);
    service.redirectToPortal('ADMIN' as Role);
    expect(true).toBeTruthy();
  });
});
