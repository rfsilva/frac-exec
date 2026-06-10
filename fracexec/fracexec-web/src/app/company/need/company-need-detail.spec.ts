import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyNeedDetail } from './company-need-detail';

const DASHBOARD_NO_NEED = { companyName: 'Emp', companyStatus: 'ACTIVE', activeNeed: null };
const DASHBOARD_SHORTLIST = {
  companyName: 'Emp', companyStatus: 'ACTIVE',
  activeNeed: { id: 'n1', status: 'SHORTLIST_SENT', cLevelType: 'CFO', scopeDaysPerMonth: '3-4',
    challengeDescription: 'Desc', expectedResult: 'Res', createdAt: '', slaDeadline: '',
    estimatedDuration: null, desiredStart: null },
};
const PROFILES = [
  { shortlistExecutiveId: 'se1', sectorInitials: 'CF', cLevelType: 'CFO',
    sectors: ['Tech'], availabilityDaysPerMonth: 12, bioSummary: 'Bio.', conflictStatus: 'CLEAR' },
  { shortlistExecutiveId: 'se2', sectorInitials: 'CT', cLevelType: 'CTO',
    sectors: ['Tech'], availabilityDaysPerMonth: 10, bioSummary: 'Bio 2.', conflictStatus: 'CLEAR' },
];

describe('CompanyNeedDetail', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyNeedDetail],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'n1' } } }
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
    httpMock.match(() => true).forEach(r => { if (!r.cancelled) r.flush({}); });
    httpMock.verify();
  });

  it('deve criar o componente — status não SHORTLIST_SENT', async () => {
    const fixture = TestBed.createComponent(CompanyNeedDetail);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/company/dashboard').flush(DASHBOARD_NO_NEED);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.loading()).toBeFalsy();
  });

  it('carrega shortlist quando status SHORTLIST_SENT', async () => {
    const fixture = TestBed.createComponent(CompanyNeedDetail);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/company/dashboard').flush(DASHBOARD_SHORTLIST);
    httpMock.expectOne('/api/v1/company/needs/n1/shortlist').flush(PROFILES);
    await fixture.whenStable();
    expect(fixture.componentInstance.profiles().length).toBe(2);
    expect(fixture.componentInstance.needStatus()).toBe('SHORTLIST_SENT');
  });

  it('isSelected retorna false inicialmente', async () => {
    const fixture = TestBed.createComponent(CompanyNeedDetail);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/company/dashboard').flush(DASHBOARD_SHORTLIST);
    httpMock.expectOne('/api/v1/company/needs/n1/shortlist').flush(PROFILES);
    await fixture.whenStable();
    expect(fixture.componentInstance.isSelected('se1')).toBeFalsy();
  });

  it('toggleSelect adiciona e remove da seleção', async () => {
    const fixture = TestBed.createComponent(CompanyNeedDetail);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/company/dashboard').flush(DASHBOARD_SHORTLIST);
    httpMock.expectOne('/api/v1/company/needs/n1/shortlist').flush(PROFILES);
    await fixture.whenStable();
    const comp = fixture.componentInstance;
    comp.toggleSelect('se1');
    expect(comp.selected()).toContain('se1');
    comp.toggleSelect('se1');
    expect(comp.selected()).not.toContain('se1');
  });

  it('toggleSelect limita a 2 seleções', async () => {
    const fixture = TestBed.createComponent(CompanyNeedDetail);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/company/dashboard').flush(DASHBOARD_SHORTLIST);
    httpMock.expectOne('/api/v1/company/needs/n1/shortlist').flush([
      ...PROFILES,
      { shortlistExecutiveId: 'se3', sectorInitials: 'CM', cLevelType: 'CMO',
        sectors: [], availabilityDaysPerMonth: 8, bioSummary: 'Bio3.', conflictStatus: 'CLEAR' }
    ]);
    await fixture.whenStable();
    const comp = fixture.componentInstance;
    comp.toggleSelect('se1');
    comp.toggleSelect('se2');
    comp.toggleSelect('se3');
    expect(comp.selected().length).toBe(2);
    expect(comp.selected()).not.toContain('se3');
  });

  it('confirmSelection chama POST quando há selecionados', async () => {
    const fixture = TestBed.createComponent(CompanyNeedDetail);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/company/dashboard').flush(DASHBOARD_SHORTLIST);
    httpMock.expectOne('/api/v1/company/needs/n1/shortlist').flush(PROFILES);
    await fixture.whenStable();
    const comp = fixture.componentInstance;
    comp.toggleSelect('se1');
    comp.confirmSelection();
    const req = httpMock.expectOne('/api/v1/company/needs/n1/shortlist/select');
    expect(req.request.method).toBe('POST');
    req.flush({});
    await fixture.whenStable();
    expect(comp.needStatus()).toBe('IN_MEDIATION');
  });
});
