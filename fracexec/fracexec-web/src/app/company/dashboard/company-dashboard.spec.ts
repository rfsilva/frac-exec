import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CompanyDashboard } from './company-dashboard';
import { CompanyService } from '../company.service';

const DASHBOARD = { companyName: 'Empresa Teste', companyStatus: 'ACTIVE', activeNeed: null };
const DASHBOARD_WITH_NEED = {
  companyName: 'Empresa Teste', companyStatus: 'ACTIVE',
  activeNeed: { id: 'n1', cLevelType: 'CFO', scopeDaysPerMonth: '3-4', status: 'RECEIVED',
    challengeDescription: 'Desc', expectedResult: 'Res', createdAt: '2025-01-01',
    slaDeadline: '2025-01-15', estimatedDuration: null, desiredStart: null },
};

describe('CompanyDashboard', () => {
  let svcSpy: { getDashboard: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    svcSpy = { getDashboard: vi.fn().mockReturnValue(of(DASHBOARD)) };
    await TestBed.configureTestingModule({
      imports: [CompanyDashboard],
      providers: [
        { provide: CompanyService, useValue: svcSpy },
        provideRouter([{ path: 'company/need/new', component: class {} as any }]),
      ],
    }).compileComponents();
  });

  it('deve criar o componente', () => {
    const fixture = TestBed.createComponent(CompanyDashboard);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('carrega dashboard ao iniciar', () => {
    const fixture = TestBed.createComponent(CompanyDashboard);
    fixture.detectChanges();
    expect(fixture.componentInstance.dashboard()?.companyName).toBe('Empresa Teste');
    expect(fixture.componentInstance.loading()).toBeFalsy();
  });

  it('statusLabel retorna labels corretos', () => {
    const fixture = TestBed.createComponent(CompanyDashboard);
    const comp = fixture.componentInstance;
    expect(comp.statusLabel('RECEIVED')).toBe('Recebida');
    expect(comp.statusLabel('UNDER_ANALYSIS')).toBe('Em análise');
    expect(comp.statusLabel('SHORTLIST_SENT')).toBe('Shortlist enviada');
    expect(comp.statusLabel('IN_MEDIATION')).toBe('Em mediação');
    expect(comp.statusLabel('CONTRACTED')).toBe('Contratado');
    expect(comp.statusLabel('OUTRO')).toBe('OUTRO');
  });

  it('slaLabel retorna prazo formatado', () => {
    const fixture = TestBed.createComponent(CompanyDashboard);
    fixture.detectChanges();
    const result = fixture.componentInstance.slaLabel('2025-12-31');
    expect(result).toBeTruthy();
  });

  it('com needAtiva mostra need', () => {
    svcSpy.getDashboard.mockReturnValue(of(DASHBOARD_WITH_NEED));
    const fixture = TestBed.createComponent(CompanyDashboard);
    fixture.detectChanges();
    expect(fixture.componentInstance.dashboard()?.activeNeed?.cLevelType).toBe('CFO');
  });
});
