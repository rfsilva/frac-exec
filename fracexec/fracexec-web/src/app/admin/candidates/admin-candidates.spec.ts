import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AdminCandidates } from './admin-candidates';

const PAGE_RESPONSE = {
  content: [
    { id: 'a1', fullName: 'João Silva', email: 'joao@t.com', status: 'PENDING', createdAt: '2025-01-01' },
  ],
  totalElements: 1, totalPages: 1, number: 0, size: 20,
};

describe('AdminCandidates', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCandidates],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true).forEach(r => { if (!r.cancelled) r.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 }); });
    httpMock.verify();
  });

  function create() {
    const fixture = TestBed.createComponent(AdminCandidates);
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.includes('/api/v1/admin/applications')).flush(PAGE_RESPONSE);
    return { fixture, comp: fixture.componentInstance };
  }

  it('deve criar o componente', () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('carrega lista de candidaturas ao iniciar', () => {
    const { comp } = create();
    expect(comp.applications().length).toBe(1);
    expect(comp.applications()[0].fullName).toBe('João Silva');
  });

  it('loading vai para false após carga', () => {
    const { comp } = create();
    expect(comp.loading()).toBeFalsy();
  });

  it('toggleExpand abre detalhe da candidatura', async () => {
    const { fixture, comp } = create();
    comp.toggleExpand('a1');
    expect(comp.expandedId()).toBe('a1');

    const detailReq = httpMock.expectOne('/api/v1/admin/applications/a1');
    detailReq.flush({
      id: 'a1', fullName: 'João', email: 'j@t.com', status: 'PENDING',
      createdAt: '2025-01-01', linkedinUrl: null, motivation: 'Motivação',
      positions: [], references: [],
    });
    await fixture.whenStable();
    expect(comp.detail()?.id).toBe('a1');
  });

  it('toggleExpand fecha detalhe se já aberto', () => {
    const { comp } = create();
    comp.toggleExpand('a1');
    httpMock.match(() => true).forEach(r => { if (!r.cancelled) r.flush({}); });
    comp.toggleExpand('a1');
    expect(comp.expandedId()).toBeNull();
  });

  it('clearFilters limpa todos os filtros', () => {
    const { comp } = create();
    comp.filters.status = 'PENDING';
    comp.filters.name = 'João';
    comp.clearFilters();
    expect(comp.filters.status).toBe('');
    expect(comp.filters.name).toBe('');
  });

  it('onStatusChange atualiza filtro status', () => {
    const { comp } = create();
    const event = { target: { value: 'APPROVED' } } as unknown as Event;
    comp.onStatusChange(event);
    httpMock.match(() => true).forEach(r => { if (!r.cancelled) r.flush(PAGE_RESPONSE); });
    expect(comp.filters.status).toBe('APPROVED');
  });
});
