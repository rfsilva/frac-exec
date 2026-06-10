import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ExecutivePayments } from './executive-payments';

const PAYMENTS = [
  { id: 'p1', referenceMonth: '2025-01', grossAmount: 10000, feeAmount: 1800, netAmount: 8200,
    status: 'TRANSFERRED', paidAt: '2025-01-10', estimatedTransferAt: null, transferredAt: '2025-01-20' },
];

describe('ExecutivePayments', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExecutivePayments],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true).forEach(r => { if (!r.cancelled) r.flush([]); });
    httpMock.verify();
  });

  function create() {
    const fixture = TestBed.createComponent(ExecutivePayments);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/executive/payments').flush(PAYMENTS);
    return { fixture, comp: fixture.componentInstance };
  }

  it('deve criar o componente', () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('carrega pagamentos ao iniciar', () => {
    const { comp } = create();
    expect(comp.payments().length).toBe(1);
    expect(comp.loading()).toBeFalsy();
  });

  it('statusLabel retorna labels corretos', () => {
    const { comp } = create();
    expect(comp.statusLabel('TRANSFERRED')).toBe('Creditado');
    expect(comp.statusLabel('PAID')).toBe('Aguardando repasse');
    expect(comp.statusLabel('TRANSFER_FAILED')).toBe('Falhou');
    expect(comp.statusLabel('PENDING')).toBe('PENDING');
  });

  it('loading inicia true e vai para false após carga', async () => {
    const fixture = TestBed.createComponent(ExecutivePayments);
    const comp = fixture.componentInstance;
    expect(comp.loading()).toBeTruthy();
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/executive/payments').flush(PAYMENTS);
    await fixture.whenStable();
    expect(comp.loading()).toBeFalsy();
  });

  it('loading vai para false em erro de API', async () => {
    const fixture = TestBed.createComponent(ExecutivePayments);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/executive/payments')
      .flush({}, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    expect(comp.loading()).toBeFalsy();
    expect(comp.payments().length).toBe(0);
  });

  it('lista vazia exibe estado vazio', async () => {
    const fixture = TestBed.createComponent(ExecutivePayments);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/executive/payments').flush([]);
    await fixture.whenStable();
    expect(fixture.componentInstance.payments().length).toBe(0);
  });
});
