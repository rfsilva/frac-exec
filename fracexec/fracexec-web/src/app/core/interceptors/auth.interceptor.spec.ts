import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../auth/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authSpy: { getAccessToken: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authSpy = { getAccessToken: vi.fn().mockReturnValue(null) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('não adiciona header se não há token', () => {
    authSpy.getAccessToken.mockReturnValue(null);
    http.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBeFalsy();
    req.flush({});
  });

  it('adiciona Bearer token se autenticado', () => {
    authSpy.getAccessToken.mockReturnValue('tok_abc');
    http.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok_abc');
    req.flush({});
  });
});
