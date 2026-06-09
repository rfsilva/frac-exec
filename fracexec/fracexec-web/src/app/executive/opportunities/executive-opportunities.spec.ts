import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ExecutiveOpportunities } from './executive-opportunities';

const OPP_RESP = {
  active: [
    { id: 'o1', needId: 'n1', cLevelType: 'CFO', scopeDaysPerMonth: '3-4',
      estimatedDuration: '6m', challengeSummary: 'Desafio.', companySector: 'Tech',
      companyEmployeeRange: 'E_11_50', status: 'AVAILABLE', expiresAt: '2025-12-31', canRetract: false }
  ],
  history: [],
};

describe('ExecutiveOpportunities', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExecutiveOpportunities],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true).forEach(r => { if (!r.cancelled) r.flush(OPP_RESP); });
    httpMock.verify();
  });

  function create() {
    const fixture = TestBed.createComponent(ExecutiveOpportunities);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/executive/opportunities').flush(OPP_RESP);
    return { fixture, comp: fixture.componentInstance };
  }

  it('deve criar o componente', () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('carrega oportunidades ao iniciar', () => {
    const { comp } = create();
    expect(comp.active().length).toBe(1);
    expect(comp.history().length).toBe(0);
    expect(comp.loading()).toBeFalsy();
  });

  it('statusLabel retorna label correto', () => {
    const { comp } = create();
    expect(comp.statusLabel('INTERESTED')).toBe('Interesse declarado');
    expect(comp.statusLabel('DECLINED')).toBe('Declinado');
    expect(comp.statusLabel('EXPIRED')).toBe('Expirado');
    expect(comp.statusLabel('RETRACTED')).toBe('Retratado');
    expect(comp.statusLabel('AVAILABLE')).toBe('AVAILABLE');
  });

  it('interest chama POST e recarrega', async () => {
    const { fixture, comp } = create();
    comp.interest('o1');
    httpMock.expectOne('/api/v1/executive/opportunities/o1/interest').flush({});
    httpMock.expectOne('/api/v1/executive/opportunities').flush(OPP_RESP);
    await fixture.whenStable();
    expect(comp.acting()).toBeFalsy();
  });

  it('decline chama POST e recarrega', async () => {
    const { fixture, comp } = create();
    comp.decline('o1');
    httpMock.expectOne('/api/v1/executive/opportunities/o1/decline').flush({});
    httpMock.expectOne('/api/v1/executive/opportunities').flush(OPP_RESP);
    await fixture.whenStable();
    expect(comp.acting()).toBeFalsy();
  });

  it('retract chama POST e recarrega', async () => {
    const { fixture, comp } = create();
    comp.retract('o1');
    httpMock.expectOne('/api/v1/executive/opportunities/o1/retract').flush({});
    httpMock.expectOne('/api/v1/executive/opportunities').flush(OPP_RESP);
    await fixture.whenStable();
  });
});
