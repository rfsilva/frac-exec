import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { CandidateDetail } from './candidate-detail';

const DETAIL = {
  id: 'a1', fullName: 'João Silva', email: 'j@t.com', status: 'UNDER_REVIEW',
  createdAt: '2025-01-01', linkedinUrl: 'https://linkedin.com/in/joao',
  motivation: 'Motivação teste.', adminNotes: 'Notas admin.',
  positions: [{ roleTitle: 'CFO', companyName: 'Emp', periodStart: '2020-01',
    periodEnd: null, teamSize: null, revenueManaged: null }],
  references: [{ refName: 'Ref A', refRole: 'CEO', refContact: 'ref@t.com' }],
};

describe('CandidateDetail', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidateDetail],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'a1' } } }
        },
        {
          provide: Router,
          useValue: { navigate: vi.fn() }
        },
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true).forEach(r => { if (!r.cancelled) r.flush(DETAIL); });
    httpMock.verify();
  });

  function create() {
    const fixture = TestBed.createComponent(CandidateDetail);
    httpMock.expectOne('/api/v1/admin/applications/a1').flush(DETAIL);
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance };
  }

  it('deve criar o componente', () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('carrega detalhe da candidatura', () => {
    const { comp } = create();
    expect(comp.detail()?.fullName).toBe('João Silva');
    expect(comp.adminNotes()).toBe('Notas admin.');
    expect(comp.loading()).toBeFalsy();
  });

  it('showApproveModal inicia false', () => {
    const { comp } = create();
    expect(comp.showApproveModal()).toBeFalsy();
  });

  it('showRejectModal inicia false', () => {
    const { comp } = create();
    expect(comp.showRejectModal()).toBeFalsy();
  });

  it('onFileSelected define selectedFile', () => {
    const { comp } = create();
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file] } } as unknown as Event;
    comp.onFileSelected(event);
    expect(comp.selectedFile()).toBe(file);
  });

  it('saveNotes chama PATCH e marca notesSaved', async () => {
    const { fixture, comp } = create();
    comp.adminNotes.set('Novas notas.');
    comp.saveNotes();
    httpMock.expectOne('/api/v1/admin/applications/a1/notes').flush(DETAIL);
    await fixture.whenStable();
    expect(comp.notesSaved()).toBeTruthy();
  });

  it('approve chama POST /approve', async () => {
    const { fixture, comp } = create();
    comp.approve();
    httpMock.expectOne('/api/v1/admin/applications/a1/approve').flush({ status: 'APPROVED' });
    await fixture.whenStable();
    expect(comp.processing()).toBeFalsy();
  });

  it('reject sem motivo não chama API', () => {
    const { comp } = create();
    comp.rejectionReason = '';
    comp.reject();
    httpMock.expectNone('/api/v1/admin/applications/a1/reject');
  });

  it('reject com motivo chama POST /reject', async () => {
    const { fixture, comp } = create();
    comp.rejectionReason = 'Motivo teste';
    comp.reject();
    const req = httpMock.expectOne('/api/v1/admin/applications/a1/reject');
    expect(req.request.body).toMatchObject({ rejectionReason: 'Motivo teste' });
    req.flush({ status: 'REJECTED' });
    await fixture.whenStable();
  });
});
