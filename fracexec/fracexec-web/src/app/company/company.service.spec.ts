import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CompanyService, CompanyRegistrationRequest, NeedRequest } from './company.service';

describe('CompanyService', () => {
  let service: CompanyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CompanyService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(CompanyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('deve criar o serviço', () => {
    expect(service).toBeTruthy();
  });

  it('register envia POST para /api/v1/companies/register', () => {
    const req: CompanyRegistrationRequest = {
      legalName: 'Empresa Teste', cnpj: '12.345.678/0001-99',
      sector: 'Tecnologia', employeeRange: 'E_11_50',
      annualRevenueRange: 'R_1M_5M', responsibleName: 'João',
      responsibleEmail: 'joao@empresa.com',
    };
    service.register(req).subscribe(res => {
      expect(res.companyId).toBe('uuid-123');
    });
    const httpReq = httpMock.expectOne('/api/v1/companies/register');
    expect(httpReq.request.method).toBe('POST');
    expect(httpReq.request.body).toEqual(req);
    httpReq.flush({ companyId: 'uuid-123', message: 'Criado com sucesso' });
  });

  it('postNeed envia POST para /api/v1/company/needs', () => {
    const req: NeedRequest = {
      cLevelType: 'CFO', scopeDaysPerMonth: '3-4',
      challengeDescription: 'Captação de série A.', expectedResult: 'IPO em 3 anos.',
    };
    service.postNeed(req).subscribe(res => {
      expect(res.status).toBe('RECEIVED');
    });
    const httpReq = httpMock.expectOne('/api/v1/company/needs');
    expect(httpReq.request.method).toBe('POST');
    httpReq.flush({ id: 'need-1', cLevelType: 'CFO', scopeDaysPerMonth: '3-4',
      challengeDescription: 'Captação de série A.', expectedResult: 'IPO em 3 anos.',
      status: 'RECEIVED', createdAt: new Date().toISOString(), slaDeadline: '',
      estimatedDuration: null, desiredStart: null });
  });

  it('saveDraft envia POST para /api/v1/company/needs/draft', () => {
    const req: NeedRequest = {
      cLevelType: 'CTO', scopeDaysPerMonth: '5-8',
      challengeDescription: 'Modernização de stack.', expectedResult: 'Migração completa.',
    };
    service.saveDraft(req).subscribe();
    const httpReq = httpMock.expectOne('/api/v1/company/needs/draft');
    expect(httpReq.request.method).toBe('POST');
    httpReq.flush({ id: 'draft-1', status: 'DRAFT', cLevelType: 'CTO',
      scopeDaysPerMonth: '5-8', challengeDescription: 'Modernização de stack.',
      expectedResult: 'Migração completa.', createdAt: '', slaDeadline: '',
      estimatedDuration: null, desiredStart: null });
  });

  it('getDashboard envia GET para /api/v1/company/dashboard', () => {
    service.getDashboard().subscribe(res => {
      expect(res.companyName).toBe('Empresa Teste');
    });
    const httpReq = httpMock.expectOne('/api/v1/company/dashboard');
    expect(httpReq.request.method).toBe('GET');
    httpReq.flush({ companyName: 'Empresa Teste', companyStatus: 'ACTIVE', activeNeed: null });
  });

  it('getActiveNeed retorna null em erro', () => {
    service.getActiveNeed().subscribe(res => {
      expect(res).toBeNull();
    });
    const httpReq = httpMock.expectOne('/api/v1/company/needs/active');
    httpReq.flush('Not found', { status: 404, statusText: 'Not Found' });
  });

  it('getActiveNeed retorna need quando existe', () => {
    service.getActiveNeed().subscribe(res => {
      expect(res?.cLevelType).toBe('CFO');
    });
    const httpReq = httpMock.expectOne('/api/v1/company/needs/active');
    httpReq.flush({ id: 'n1', cLevelType: 'CFO', scopeDaysPerMonth: '3-4',
      challengeDescription: 'desc', expectedResult: 'res', status: 'RECEIVED',
      createdAt: '', slaDeadline: '', estimatedDuration: null, desiredStart: null });
  });
});
