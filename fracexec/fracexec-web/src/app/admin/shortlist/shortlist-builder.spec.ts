import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ShortlistBuilder } from './shortlist-builder';

const POOL_PAGE = {
  content: [
    { id: 'p1', fullName: 'Exec A', specialties: ['CFO'], availabilityDaysPerMonth: 12, profileStatus: 'ACTIVE', isAvailable: true }
  ],
  totalElements: 1,
};
const SHORTLIST = {
  id: 'sl1', needId: 'n1', status: 'DRAFT', canSend: false,
  executives: [
    { id: 'sl_e1', executiveProfileId: 'p1', fullName: 'Exec A', specialties: ['CFO'],
      availabilityDaysPerMonth: 12, conflictStatus: 'CLEAR', conflictDetail: null }
  ],
};
const ROUTE = {
  parent: { snapshot: { paramMap: { get: () => 'n1' } } },
  snapshot: { paramMap: { get: () => null } },
};

describe('ShortlistBuilder', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShortlistBuilder],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: ROUTE },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true).forEach(r => { if (!r.cancelled) r.flush({}); });
    httpMock.verify();
  });

  function create() {
    const fixture = TestBed.createComponent(ShortlistBuilder);
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.includes('/api/v1/admin/pool')).flush(POOL_PAGE);
    httpMock.expectOne('/api/v1/admin/needs/n1/shortlist').flush(SHORTLIST);
    return { fixture, comp: fixture.componentInstance };
  }

  it('deve criar o componente', () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('carrega pool e shortlist ao iniciar', () => {
    const { comp } = create();
    expect(comp.pool().length).toBe(1);
    expect(comp.shortlist()).toBeTruthy();
    expect(comp.loadingPool()).toBeFalsy();
    expect(comp.loadingShortlist()).toBeFalsy();
  });

  it('shortlistItems retorna executivos da shortlist', () => {
    const { comp } = create();
    expect(comp.shortlist()?.executives.length).toBe(1);
  });

  it('addExecutive chama POST e recarrega shortlist', async () => {
    const { fixture, comp } = create();
    comp.addExecutive('p1');
    httpMock.expectOne('/api/v1/admin/needs/n1/shortlist/executives').flush(
      { id: 'sl_e2', executiveProfileId: 'p2', fullName: 'Exec B', specialties: [],
        availabilityDaysPerMonth: 10, conflictStatus: 'CLEAR', conflictDetail: null });
    httpMock.expectOne('/api/v1/admin/needs/n1/shortlist').flush(SHORTLIST);
    await fixture.whenStable();
    expect(comp.adding()).toBeFalsy();
  });

  it('removeExecutive chama DELETE e recarrega shortlist', async () => {
    const { fixture, comp } = create();
    comp.removeExecutive('sl_e1');
    httpMock.expectOne('/api/v1/admin/needs/n1/shortlist/executives/sl_e1').flush({});
    httpMock.expectOne('/api/v1/admin/needs/n1/shortlist').flush({ ...SHORTLIST, executives: [] });
    await fixture.whenStable();
  });

  it('sendShortlist chama POST /send', async () => {
    const { fixture, comp } = create();
    comp.sendShortlist();
    httpMock.expectOne('/api/v1/admin/needs/n1/shortlist/send').flush({});
    await fixture.whenStable();
    expect(comp.sending()).toBeFalsy();
  });

  it('sendShortlist com erro define sendError', async () => {
    const { fixture, comp } = create();
    comp.sendShortlist();
    httpMock.expectOne('/api/v1/admin/needs/n1/shortlist/send')
      .flush({ detail: 'Mínimo 2 executivos.' }, { status: 422, statusText: 'Unprocessable' });
    await fixture.whenStable();
    expect(comp.sendError()).toBeTruthy();
  });
});
