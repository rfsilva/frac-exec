import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { errorInterceptor } from './error.interceptor';
import { AuthService } from '../auth/auth.service';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authSpy: { logout: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authSpy = { logout: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: class {} as any }]),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('propaga erros não-401 sem logout', () => {
    let err: any;
    http.get('/api/test').subscribe({ error: e => { err = e; } });
    httpMock.expectOne('/api/test').flush('Not found', { status: 404, statusText: 'Not Found' });
    expect(err.status).toBe(404);
    expect(authSpy.logout).not.toHaveBeenCalled();
  });

  it('chama logout em erro 401', () => {
    http.get('/api/test').subscribe({ error: () => {} });
    httpMock.expectOne('/api/test').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(authSpy.logout).toHaveBeenCalled();
  });

  it('propaga o erro mesmo após logout', () => {
    let err: any;
    http.get('/api/test').subscribe({ error: e => { err = e; } });
    httpMock.expectOne('/api/test').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(err.status).toBe(401);
  });
});
