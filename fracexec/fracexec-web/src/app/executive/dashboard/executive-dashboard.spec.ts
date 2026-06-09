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
});
