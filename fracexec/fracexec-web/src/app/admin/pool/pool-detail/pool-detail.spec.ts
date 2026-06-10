import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { PoolDetail } from './pool-detail';

const PROFILE = {
  id: 'p1', fullName: 'João Exec', email: 'exec@t.com', initials: 'JO',
  photoUrl: null, bio: 'Bio.', specialties: ['CFO'], sectors: ['Tech'],
  availabilityDaysPerMonth: 12, profileStatus: 'ACTIVE', isAvailable: true,
  companyVisibilityRaw: { EmpA: true },
};
const CLIENTS = [
  { id: 'c1', cnae2digit: '62', regionState: 'SP', regionCity: 'São Paulo' }
];

// usa 'profileId' como key, não 'id'
const ROUTE = {
  snapshot: { paramMap: { get: (k: string) => k === 'profileId' ? 'p1' : null } }
};

describe('PoolDetail', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoolDetail],
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
    const fixture = TestBed.createComponent(PoolDetail);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/pool/p1').flush(PROFILE);
    httpMock.expectOne('/api/v1/admin/executives/p1/clients').flush(CLIENTS);
    return { fixture, comp: fixture.componentInstance };
  }

  it('deve criar o componente', () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('carrega perfil e clientes ao iniciar', () => {
    const { comp } = create();
    expect(comp.profile()?.fullName).toBe('João Exec');
    expect(comp.clients().length).toBe(1);
    expect(comp.loading()).toBeFalsy();
  });

  it('initials retorna 2 primeiras letras do nome', () => {
    const { comp } = create();
    expect(comp.initials).toBe('JO');
  });

  it('companyEntries retorna entradas de visibilidade', () => {
    const { comp } = create();
    expect(comp.companyEntries.length).toBe(1);
    expect(comp.companyEntries[0].name).toBe('EmpA');
    expect(comp.companyEntries[0].visible).toBe(true);
  });

  it('showAddClient toggle', () => {
    const { comp } = create();
    expect(comp.showAddClient()).toBeFalsy();
    comp.showAddClient.set(true);
    expect(comp.showAddClient()).toBeTruthy();
  });

  it('addClient chama POST /clients', async () => {
    const { fixture, comp } = create();
    comp.newCnae = '62';
    comp.newState = 'SP';
    comp.addClient();
    const req = httpMock.expectOne('/api/v1/admin/executives/p1/clients');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'c2', cnae2digit: '62', regionState: 'SP', regionCity: null });
    await fixture.whenStable();
    expect(comp.newCnae).toBe('');
  });

  it('addClient sem cnae ou state não chama API', () => {
    const { comp } = create();
    comp.newCnae = '';
    comp.newState = 'SP';
    comp.addClient();
    httpMock.expectNone('/api/v1/admin/executives/p1/clients');
  });

  it('removeClient chama DELETE', async () => {
    const { fixture, comp } = create();
    comp.removeClient('c1');
    const req = httpMock.expectOne('/api/v1/admin/executives/p1/clients/c1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
    await fixture.whenStable();
    expect(comp.clients().length).toBe(0);
  });

  it('back navega para /admin/pool', () => {
    const { comp } = create();
    const router = TestBed.inject(Router);
    comp.back();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/pool']);
  });
});
