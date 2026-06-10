import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AdminPool } from './admin-pool';

const PAGE = {
  content: [
    { id: 'p1', userId: 'u1', email: 'exec@t.com', fullName: 'João', initials: 'JO',
      specialties: ['CFO'], sectors: ['Tech'], availabilityDaysPerMonth: 12,
      profileStatus: 'ACTIVE', isAvailable: true }
  ],
  totalElements: 1,
};

async function waitForDebounce() {
  await new Promise(r => setTimeout(r, 350));
}

describe('AdminPool', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPool],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'admin/pool/:id', component: class {} as any }]),
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true).forEach(r => { if (!r.cancelled) r.flush(PAGE); });
    httpMock.verify();
  });

  async function create() {
    const fixture = TestBed.createComponent(AdminPool);
    fixture.detectChanges();
    await waitForDebounce();
    httpMock.expectOne(r => r.url.includes('/api/v1/admin/pool')).flush(PAGE);
    return { fixture, comp: fixture.componentInstance };
  }

  it('deve criar o componente', async () => {
    const { comp } = await create();
    expect(comp).toBeTruthy();
  });

  it('carrega pool ao iniciar', async () => {
    const { comp } = await create();
    expect(comp.pool().length).toBe(1);
    expect(comp.loading()).toBeFalsy();
  });

  it('clearFilters recarrega pool', async () => {
    const { comp } = await create();
    comp.clearFilters();
    await waitForDebounce();
    httpMock.expectOne(r => r.url.includes('/api/v1/admin/pool')).flush(PAGE);
    expect(comp.pool().length).toBe(1);
  });

  it('onFilter com valor recarrega pool', async () => {
    const { comp } = await create();
    const event = { target: { value: 'CFO' } } as unknown as Event;
    comp.onFilter('specialty', event);
    await waitForDebounce();
    httpMock.expectOne(r => r.url.includes('/api/v1/admin/pool')).flush(PAGE);
  });
});
