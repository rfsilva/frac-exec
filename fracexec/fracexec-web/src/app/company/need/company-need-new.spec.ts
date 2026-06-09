import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CompanyNeedNew } from './company-need-new';
import { CompanyService } from '../company.service';

function makeSvcSpy() {
  return {
    getActiveNeed: vi.fn().mockReturnValue(of(null)),
    postNeed: vi.fn(),
    saveDraft: vi.fn(),
  };
}

const VALID_FORM = {
  scopeDaysPerMonth: '3-4',
  estimatedDuration: '6 meses',
  desiredStart: '2025-06-01',
  challengeDescription: 'Desafio de reestruturação financeira para captação de série A.',
  expectedResult: 'Empresa pronta para captação.',
  confidentialContext: '',
};

describe('CompanyNeedNew', () => {
  let svcSpy: ReturnType<typeof makeSvcSpy>;

  beforeEach(async () => {
    svcSpy = makeSvcSpy();
    await TestBed.configureTestingModule({
      imports: [CompanyNeedNew],
      providers: [
        { provide: CompanyService, useValue: svcSpy },
        provideRouter([{ path: 'company/dashboard', component: class {} as any }]),
      ],
    }).compileComponents();
  });

  it('deve criar o componente', () => {
    const fixture = TestBed.createComponent(CompanyNeedNew);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('redireciona se já tem necessidade ativa', async () => {
    svcSpy.getActiveNeed.mockReturnValue(of({ id: 'n1', status: 'RECEIVED' } as any));
    const fixture = TestBed.createComponent(CompanyNeedNew);
    fixture.detectChanges();
    await fixture.whenStable();
    // navegação acontece — sem erro
    expect(svcSpy.getActiveNeed).toHaveBeenCalled();
  });

  it('charsRemaining retorna 50 para campo vazio', () => {
    const fixture = TestBed.createComponent(CompanyNeedNew);
    expect(fixture.componentInstance.charsRemaining).toBe(50);
  });

  it('charsRemaining retorna 0 quando atingido mínimo', () => {
    const fixture = TestBed.createComponent(CompanyNeedNew);
    const comp = fixture.componentInstance;
    comp.form.get('challengeDescription')?.setValue('A'.repeat(60));
    expect(comp.charsRemaining).toBe(0);
  });

  it('selectCLevel define o c-level selecionado', () => {
    const fixture = TestBed.createComponent(CompanyNeedNew);
    const comp = fixture.componentInstance;
    comp.selectCLevel('CFO');
    expect(comp.selectedCLevel()).toBe('CFO');
  });

  it('onPost sem cLevel define apiError', async () => {
    const fixture = TestBed.createComponent(CompanyNeedNew);
    const comp = fixture.componentInstance;
    comp.onPost();
    await fixture.whenStable();
    expect(comp.apiError()).toBeTruthy();
    expect(svcSpy.postNeed).not.toHaveBeenCalled();
  });

  it('onPost com form inválido não chama service', async () => {
    const fixture = TestBed.createComponent(CompanyNeedNew);
    const comp = fixture.componentInstance;
    comp.selectCLevel('CFO');
    comp.onPost();
    await fixture.whenStable();
    expect(svcSpy.postNeed).not.toHaveBeenCalled();
  });

  it('onPost com form válido chama postNeed', async () => {
    svcSpy.postNeed.mockReturnValue(of({ id: 'n1' } as any));
    const fixture = TestBed.createComponent(CompanyNeedNew);
    const comp = fixture.componentInstance;
    comp.selectCLevel('CFO');
    comp.form.setValue(VALID_FORM);
    comp.onPost();
    await fixture.whenStable();
    expect(svcSpy.postNeed).toHaveBeenCalled();
  });

  it('onDraft chama saveDraft', async () => {
    svcSpy.saveDraft.mockReturnValue(of({ id: 'n1' } as any));
    const fixture = TestBed.createComponent(CompanyNeedNew);
    const comp = fixture.componentInstance;
    comp.selectCLevel('CFO');
    comp.form.setValue(VALID_FORM);
    comp.onDraft();
    await fixture.whenStable();
    expect(svcSpy.saveDraft).toHaveBeenCalled();
  });

  it('erro na API define apiError', async () => {
    svcSpy.postNeed.mockReturnValue(throwError(() => ({ status: 422, error: { detail: 'Erro.' } })));
    const fixture = TestBed.createComponent(CompanyNeedNew);
    const comp = fixture.componentInstance;
    comp.selectCLevel('CFO');
    comp.form.setValue(VALID_FORM);
    comp.onPost();
    await fixture.whenStable();
    expect(comp.apiError()).toBeTruthy();
  });
});
