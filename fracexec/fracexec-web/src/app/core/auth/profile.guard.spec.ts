import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { profileGuard } from './profile.guard';

function makeToken(exp: number): string {
  return btoa('{}') + '.' +
    btoa(JSON.stringify({ sub: 'u@t.com', role: 'EXECUTIVE', exp })) +
    '.sig';
}

function runGuard(): ReturnType<typeof profileGuard> {
  return TestBed.runInInjectionContext(() =>
    profileGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
  );
}

describe('profileGuard', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('redireciona para /login se não autenticado', () => {
    const result = runGuard();
    expect(result instanceof UrlTree || typeof result === 'boolean').toBeTruthy();
    expect(result).not.toBe(true);
  });

  it('retorna true diretamente se cache indica perfil completo', () => {
    localStorage.setItem('fracexec_profile_complete', 'true');
    localStorage.setItem('fracexec_access_token',
      makeToken(Math.floor(Date.now() / 1000) + 3600));

    const result = runGuard();
    expect(result).toBe(true);
    httpMock.expectNone('/api/v1/executive/profile/complete');
  });

  it('chama API quando não há cache — perfil completo retorna true', async () => {
    localStorage.setItem('fracexec_access_token',
      makeToken(Math.floor(Date.now() / 1000) + 3600));

    const result$ = runGuard() as Observable<unknown>;
    const promise = new Promise<unknown>(resolve => result$.subscribe(resolve));
    httpMock.expectOne('/api/v1/executive/profile/complete').flush({ complete: true });

    const val = await promise;
    expect(val).toBe(true);
    expect(localStorage.getItem('fracexec_profile_complete')).toBe('true');
  });

  it('redireciona para /executive/profile quando perfil incompleto', async () => {
    localStorage.setItem('fracexec_access_token',
      makeToken(Math.floor(Date.now() / 1000) + 3600));

    const result$ = runGuard() as Observable<unknown>;
    const promise = new Promise<unknown>(resolve => result$.subscribe(resolve));
    httpMock.expectOne('/api/v1/executive/profile/complete').flush({ complete: false });

    const val = await promise;
    expect(val instanceof UrlTree).toBeTruthy();
    expect((val as UrlTree).toString()).toContain('executive/profile');
  });

  it('fail open em erro de rede (5xx)', async () => {
    localStorage.setItem('fracexec_access_token',
      makeToken(Math.floor(Date.now() / 1000) + 3600));

    const result$ = runGuard() as Observable<unknown>;
    const promise = new Promise<unknown>(resolve => result$.subscribe(resolve));
    httpMock.expectOne('/api/v1/executive/profile/complete')
      .flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    const val = await promise;
    expect(val).toBe(true);
  });
});
