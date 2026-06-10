import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ExecutiveShell } from './executive-shell';
import { AuthService } from '../../core/auth/auth.service';

const PROFILE_RESP = { profileStatus: 'ACTIVE', availabilityDaysPerMonth: 15, isComplete: true };

describe('ExecutiveShell', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExecutiveShell],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser: () => ({ email: 'u@t.com', role: 'EXECUTIVE' }) } },
        provideRouter([
          { path: 'executive/dashboard', component: class {} as any },
          { path: 'executive/profile',   component: class {} as any },
        ]),
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true).forEach(r => { if (!r.cancelled) r.flush(PROFILE_RESP); });
    httpMock.verify();
  });

  function create() {
    const fixture = TestBed.createComponent(ExecutiveShell);
    httpMock.expectOne('/api/v1/executive/profile').flush(PROFILE_RESP);
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance };
  }

  it('deve criar o componente', () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('carrega profileStatus via API', () => {
    const { comp } = create();
    expect(comp.profileStatus()).toBe('ACTIVE');
    expect(comp.availabilityDays()).toBe(15);
  });

  it('openDrawer abre o drawer', () => {
    const { comp } = create();
    comp.openDrawer();
    expect(comp.drawerOpen()).toBeTruthy();
  });

  it('onAvailabilitySaved chama PATCH e fecha drawer', async () => {
    const { fixture, comp } = create();
    comp.drawerOpen.set(true);
    comp.onAvailabilitySaved({ availabilityDaysPerMonth: 10, profileStatus: 'INACTIVE' });
    httpMock.expectOne('/api/v1/executive/profile/availability')
      .flush({ availabilityDaysPerMonth: 10, profileStatus: 'INACTIVE' });
    await fixture.whenStable();
    expect(comp.availabilityDays()).toBe(10);
    expect(comp.drawerOpen()).toBeFalsy();
  });
});
