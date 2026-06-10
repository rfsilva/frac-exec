import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ExecutiveDashboard } from './executive-dashboard';
import type { BadgeVariant } from '../../shared/components/status-badge/status-badge';

describe('ExecutiveDashboard', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExecutiveDashboard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Flush qualquer request pendente
    httpMock.match(() => true).forEach(r => r.flush({}));
    httpMock.verify();
  });

  it('deve criar o componente', () => {
    const fixture = TestBed.createComponent(ExecutiveDashboard);
    httpMock.match(() => true).forEach(r => r.flush({ availabilityDaysPerMonth: 10, profileStatus: 'ACTIVE' }));
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('engStatus ACTIVE retorna status-active', () => {
    const fixture = TestBed.createComponent(ExecutiveDashboard);
    httpMock.match(() => true).forEach(r => r.flush({ availabilityDaysPerMonth: 10, profileStatus: 'ACTIVE' }));
    const result: BadgeVariant = fixture.componentInstance.engStatus('ACTIVE');
    expect(result).toBe('status-active');
  });

  it('engStatus PAUSED retorna status-warning', () => {
    const fixture = TestBed.createComponent(ExecutiveDashboard);
    httpMock.match(() => true).forEach(r => r.flush({ availabilityDaysPerMonth: 10, profileStatus: 'ACTIVE' }));
    const result: BadgeVariant = fixture.componentInstance.engStatus('PAUSED');
    expect(result).toBe('status-warning');
  });

  it('engStatus outro retorna neutral', () => {
    const fixture = TestBed.createComponent(ExecutiveDashboard);
    httpMock.match(() => true).forEach(r => r.flush({ availabilityDaysPerMonth: 10, profileStatus: 'ACTIVE' }));
    const result: BadgeVariant = fixture.componentInstance.engStatus('COMPLETED');
    expect(result).toBe('neutral');
  });

  it('progressPct calcula percentual correto', () => {
    const fixture = TestBed.createComponent(ExecutiveDashboard);
    httpMock.match(() => true).forEach(r => r.flush({ availabilityDaysPerMonth: 10, profileStatus: 'ACTIVE' }));
    const comp = fixture.componentInstance;
    comp.availabilityDays.set(10);
    expect(comp.progressPct).toBe(50);
  });

  it('progressPct com 20 dias retorna 100', () => {
    const fixture = TestBed.createComponent(ExecutiveDashboard);
    httpMock.match(() => true).forEach(r => r.flush({ availabilityDaysPerMonth: 20, profileStatus: 'ACTIVE' }));
    const comp = fixture.componentInstance;
    comp.availabilityDays.set(20);
    expect(comp.progressPct).toBe(100);
  });

  it('ngOnInit carrega dashboard e define dash', async () => {
    const fixture = TestBed.createComponent(ExecutiveDashboard);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    // constructor GET profile
    httpMock.expectOne('/api/v1/executive/profile').flush({ availabilityDaysPerMonth: 15, profileStatus: 'ACTIVE' });
    // ngOnInit GET dashboard
    const dashData = {
      activeEngagementsCount: 2, committedDaysMonth: 8,
      nextTransferAmount: 5000, pendingOpportunitiesCount: 1,
      activeEngagements: [{ id: 'e1', companyName: 'Emp', cLevelType: 'CFO', scopeDaysPerMonth: 8, status: 'ACTIVE' }],
      recentOpportunity: { id: 'o1', cLevelType: 'CFO', companySector: 'Tech', status: 'PENDING' },
    };
    httpMock.expectOne('/api/v1/executive/dashboard').flush(dashData);
    await fixture.whenStable();
    expect(comp.dash()).toBeTruthy();
    expect(comp.dashLoading()).toBeFalsy();
    expect(comp.availabilityDays()).toBe(15);
  });

  it('constructor trata erro de profile sem lançar', async () => {
    const fixture = TestBed.createComponent(ExecutiveDashboard);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/executive/profile')
      .flush({}, { status: 500, statusText: 'Server Error' });
    httpMock.expectOne('/api/v1/executive/dashboard').flush({
      activeEngagementsCount: 0, committedDaysMonth: 0, nextTransferAmount: 0,
      pendingOpportunitiesCount: 0, activeEngagements: [], recentOpportunity: null,
    });
    await fixture.whenStable();
    expect(fixture.componentInstance.profileStatus()).toBe('ACTIVE');
  });

  it('onSaved atualiza availability e fecha drawer', async () => {
    const fixture = TestBed.createComponent(ExecutiveDashboard);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/executive/profile').flush({ availabilityDaysPerMonth: 10, profileStatus: 'ACTIVE' });
    httpMock.expectOne('/api/v1/executive/dashboard').flush({
      activeEngagementsCount: 0, committedDaysMonth: 0, nextTransferAmount: 0,
      pendingOpportunitiesCount: 0, activeEngagements: [], recentOpportunity: null,
    });
    await fixture.whenStable();

    comp.onSaved({ availabilityDaysPerMonth: 12, profileStatus: 'ACTIVE' });
    httpMock.expectOne('/api/v1/executive/profile/availability').flush({ availabilityDaysPerMonth: 12, profileStatus: 'ACTIVE' });
    await fixture.whenStable();
    expect(comp.availabilityDays()).toBe(12);
    expect(comp.drawerOpen()).toBeFalsy();
    expect(comp.savedMsg()).toBeTruthy();
  });
});
