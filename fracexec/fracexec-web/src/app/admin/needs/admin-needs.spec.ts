import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AdminNeeds } from './admin-needs';

const PAGE = {
  content: [
    { id: 'n1', companyName: 'Empresa A', cLevelType: 'CFO', scopeDaysPerMonth: '3-4',
      status: 'RECEIVED', challengeDescription: 'Desafio.', createdAt: '2025-01-01', slaDeadline: '2025-01-10' }
  ],
  totalElements: 1, totalPages: 1, number: 0, size: 50,
};

describe('AdminNeeds', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminNeeds],
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
    const fixture = TestBed.createComponent(AdminNeeds);
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.includes('/api/v1/admin/needs')).flush(PAGE);
    return { fixture, comp: fixture.componentInstance };
  }

  it('deve criar o componente', () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('carrega necessidades ao iniciar', () => {
    const { comp } = create();
    expect(comp.needs().length).toBe(1);
    expect(comp.loading()).toBeFalsy();
  });

  it('toggle abre/fecha necessidade', () => {
    const { comp } = create();
    comp.toggle('n1');
    expect(comp.expandedId()).toBe('n1');
    comp.toggle('n1');
    expect(comp.expandedId()).toBeNull();
  });

  it('onFilter recarrega com novo filtro', () => {
    const { comp } = create();
    const event = { target: { value: 'UNDER_ANALYSIS' } } as unknown as Event;
    comp.onFilter('status', event);
    httpMock.expectOne(r => r.url.includes('/api/v1/admin/needs')).flush(PAGE);
    expect(comp.loading()).toBeFalsy();
  });

  it('onFilter com valor vazio remove filtro', () => {
    const { comp } = create();
    const event = { target: { value: '' } } as unknown as Event;
    comp.onFilter('status', event);
    httpMock.expectOne(r => r.url.includes('/api/v1/admin/needs')).flush(PAGE);
    expect(comp.needs().length).toBe(1);
  });

  it('startAnalysis chama PATCH e atualiza lista', async () => {
    const { fixture, comp } = create();
    const need = comp.needs()[0];
    comp.startAnalysis(need);
    const req = httpMock.expectOne(`/api/v1/admin/needs/${need.id}/status`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...need, status: 'UNDER_ANALYSIS' });
    await fixture.whenStable();
    expect(comp.needs()[0].status).toBe('UNDER_ANALYSIS');
  });
});
