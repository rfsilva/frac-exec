import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AdminCompanies } from './admin-companies';

const PAGE = {
  content: [
    { id: 'c1', legalName: 'Empresa A', cnpj: '11.222.333/0001-81',
      responsibleName: 'João', responsibleEmail: 'j@t.com', status: 'PENDING_ACTIVATION', createdAt: '2025-01-01' }
  ],
  totalElements: 1, totalPages: 1, number: 0, size: 20,
};

describe('AdminCompanies', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCompanies],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true).forEach(r => { if (!r.cancelled) r.flush(PAGE); });
    httpMock.verify();
  });

  function create() {
    const fixture = TestBed.createComponent(AdminCompanies);
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.includes('/api/v1/admin/companies')).flush(PAGE);
    return { fixture, comp: fixture.componentInstance };
  }

  it('deve criar o componente', () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('carrega empresas ao iniciar', () => {
    const { comp } = create();
    expect(comp.companies().length).toBe(1);
    expect(comp.loading()).toBeFalsy();
  });

  it('statusLabel retorna label correto', () => {
    const { comp } = create();
    expect(comp.statusLabel('PENDING_ACTIVATION')).toBe('Aguardando ativação');
    expect(comp.statusLabel('ACTIVE')).toBe('Ativo');
  });

  it('statusVariant retorna variant correta', () => {
    const { comp } = create();
    expect(comp.statusVariant('PENDING_ACTIVATION')).toBe('status-pending');
    expect(comp.statusVariant('ACTIVE')).toBe('status-active');
  });

  it('activate chama PATCH e atualiza lista', async () => {
    const { fixture, comp } = create();
    comp.activate(comp.companies()[0]);
    httpMock.expectOne('/api/v1/admin/companies/c1/activate')
      .flush({ ...PAGE.content[0], status: 'ACTIVE' });
    await fixture.whenStable();
    expect(comp.companies()[0].status).toBe('ACTIVE');
  });
});
