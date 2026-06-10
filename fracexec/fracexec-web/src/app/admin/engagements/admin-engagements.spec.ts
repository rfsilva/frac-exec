import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AdminEngagements } from './admin-engagements';

const ENGAGEMENTS = [
  { id: 'e1', companyName: 'Empresa A', executiveEmail: 'exec@t.com',
    cLevelType: 'CFO', monthlyValue: 10000, status: 'ACTIVE', startedAt: '2025-01-01' },
];

describe('AdminEngagements', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEngagements],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true).forEach(r => { if (!r.cancelled) r.flush([]); });
    httpMock.verify();
  });

  function create() {
    const fixture = TestBed.createComponent(AdminEngagements);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/engagements').flush(ENGAGEMENTS);
    return { fixture, comp: fixture.componentInstance };
  }

  it('deve criar o componente', () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('carrega engajamentos ao iniciar', () => {
    const { comp } = create();
    expect(comp.engagements().length).toBe(1);
    expect(comp.loading()).toBeFalsy();
  });

  it('openModal define modalEngagement', () => {
    const { comp } = create();
    comp.openModal(ENGAGEMENTS[0]);
    expect(comp.modalEngagement()?.id).toBe('e1');
    expect(comp.modalStatus).toBe('PAUSED');
  });

  it('closeModal limpa modalEngagement', () => {
    const { comp } = create();
    comp.openModal(ENGAGEMENTS[0]);
    comp.closeModal();
    expect(comp.modalEngagement()).toBeNull();
  });

  it('saveStatus chama PATCH e atualiza lista', async () => {
    const { fixture, comp } = create();
    comp.openModal(ENGAGEMENTS[0]);
    comp.modalStatus = 'PAUSED';
    comp.modalReason = 'Férias';
    comp.saveStatus();
    const req = httpMock.expectOne('/api/v1/admin/engagements/e1/status');
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...ENGAGEMENTS[0], status: 'PAUSED' });
    await fixture.whenStable();
    expect(comp.engagements()[0].status).toBe('PAUSED');
    expect(comp.modalEngagement()).toBeNull();
  });

  it('saveStatus sem engagement aberto não faz nada', () => {
    const { comp } = create();
    comp.saveStatus();
    httpMock.expectNone('/api/v1/admin/engagements/e1/status');
  });
});
