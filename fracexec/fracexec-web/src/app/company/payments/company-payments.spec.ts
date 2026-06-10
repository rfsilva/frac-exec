import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CompanyPayments } from './company-payments';

describe('CompanyPayments', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyPayments],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true).forEach(r => r.flush([]));
    httpMock.verify();
  });

  it('deve criar o componente', () => {
    const fixture = TestBed.createComponent(CompanyPayments);
    httpMock.match(() => true).forEach(r => r.flush([]));
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('carrega pagamentos via API', () => {
    const fixture = TestBed.createComponent(CompanyPayments);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    const paymentsReq = httpMock.expectOne('/api/v1/company/payments');
    paymentsReq.flush([
      { id: '1', referenceMonth: '2025-01', grossAmount: 10000, status: 'PAID', paidAt: '2025-01-10' }
    ]);
    httpMock.match(() => true).forEach(r => r.flush([]));

    expect(comp.payments().length).toBe(1);
    expect(comp.payments()[0].status).toBe('PAID');
  });

  it('carrega contratos via API — array direto', () => {
    const fixture = TestBed.createComponent(CompanyPayments);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    httpMock.expectOne('/api/v1/company/payments').flush([]);
    const contractsReq = httpMock.expectOne('/api/v1/company/contracts');
    // Backend retorna array direto
    contractsReq.flush([
      { id: 'c1', executiveEmail: 'exec@t.com', monthlyValue: 10000, durationMonths: 6, signedAt: null }
    ]);

    expect(comp.contracts().length).toBe(1);
  });

  it('carrega contratos via API — objeto com content', () => {
    const fixture = TestBed.createComponent(CompanyPayments);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    httpMock.expectOne('/api/v1/company/payments').flush([]);
    const contractsReq = httpMock.expectOne('/api/v1/company/contracts');
    // Backend retorna objeto paginado
    contractsReq.flush({
      content: [
        { id: 'c2', executiveEmail: 'exec2@t.com', monthlyValue: 8000, durationMonths: 3, signedAt: '2025-01-01' }
      ]
    });

    expect(comp.contracts().length).toBe(1);
    expect(comp.contracts()[0].id).toBe('c2');
  });

  it('loading inicia true e vai para false após carga', async () => {
    const fixture = TestBed.createComponent(CompanyPayments);
    const comp = fixture.componentInstance;
    expect(comp.loading()).toBeTruthy();

    fixture.detectChanges();
    httpMock.expectOne('/api/v1/company/payments').flush([]);
    httpMock.expectOne('/api/v1/company/contracts').flush([]);
    await fixture.whenStable();

    expect(comp.loading()).toBeFalsy();
  });

  it('loading vai para false em erro de API', async () => {
    const fixture = TestBed.createComponent(CompanyPayments);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/company/payments')
      .flush({}, { status: 500, statusText: 'Server Error' });
    httpMock.expectOne('/api/v1/company/contracts').flush([]);
    await fixture.whenStable();
    expect(comp.loading()).toBeFalsy();
  });

  it('statusLabel retorna labels corretos', async () => {
    const fixture = TestBed.createComponent(CompanyPayments);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    httpMock.match(() => true).forEach(r => r.flush([]));
    expect(comp.statusLabel('PENDING')).toBe('Aguardando');
    expect(comp.statusLabel('PAID')).toBe('Pago');
    expect(comp.statusLabel('TRANSFERRED')).toBe('Repassado');
    expect(comp.statusLabel('EXPIRED')).toBe('Expirado');
    expect(comp.statusLabel('OUTRO')).toBe('OUTRO');
  });

  it('downloadContract chama GET e abre URL', async () => {
    const fixture = TestBed.createComponent(CompanyPayments);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    httpMock.match(() => true).forEach(r => r.flush([]));
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    comp.downloadContract('c1');
    httpMock.expectOne('/api/v1/company/contracts/c1/download').flush({ url: 'https://example.com/doc.pdf' });
    await fixture.whenStable();
    expect(openSpy).toHaveBeenCalledWith('https://example.com/doc.pdf', '_blank');
    openSpy.mockRestore();
  });
});
