import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CompanyRegistration } from './company-registration';
import { CompanyService } from '../company.service';

const ROUTES = [{ path: 'login', component: class DummyLogin {} }];

function makeServiceSpy() {
  return { register: vi.fn() };
}

const VALID_FORM = {
  legalName: 'Empresa Teste',
  cnpj: '11.222.333/0001-81',
  sector: 'Tecnologia',
  employeeRange: 'E_11_50',
  annualRevenueRange: 'R_1M_5M',
  responsibleName: 'João Silva',
  responsibleEmail: 'joao@empresa.com',
};

describe('CompanyRegistration', () => {
  let svcSpy: ReturnType<typeof makeServiceSpy>;

  beforeEach(async () => {
    svcSpy = makeServiceSpy();
    await TestBed.configureTestingModule({
      imports: [CompanyRegistration, ReactiveFormsModule],
      providers: [
        { provide: CompanyService, useValue: svcSpy },
        provideRouter(ROUTES),
      ],
    }).compileComponents();
  });

  it('deve criar o componente', () => {
    const fixture = TestBed.createComponent(CompanyRegistration);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('formulário inválido com campos vazios', () => {
    const fixture = TestBed.createComponent(CompanyRegistration);
    expect(fixture.componentInstance.form.invalid).toBeTruthy();
  });

  it('CNPJ inválido gera erro cnpjInvalid', () => {
    const fixture = TestBed.createComponent(CompanyRegistration);
    const control = fixture.componentInstance.form.get('cnpj');
    control?.setValue('11.111.111/1111-11');
    control?.markAsTouched();
    expect(control?.errors?.['cnpjInvalid']).toBeTruthy();
  });

  it('CNPJ válido não gera erro', () => {
    const fixture = TestBed.createComponent(CompanyRegistration);
    const control = fixture.componentInstance.form.get('cnpj');
    control?.setValue('11.222.333/0001-81');
    expect(control?.errors?.['cnpjInvalid']).toBeFalsy();
  });

  it('submitted é false inicialmente', () => {
    const fixture = TestBed.createComponent(CompanyRegistration);
    expect(fixture.componentInstance.submitted()).toBeFalsy();
  });

  it('submit com form inválido não chama service', async () => {
    const fixture = TestBed.createComponent(CompanyRegistration);
    fixture.componentInstance.onSubmit();
    await fixture.whenStable();
    expect(svcSpy.register).not.toHaveBeenCalled();
  });

  it('submit com sucesso marca submitted', async () => {
    svcSpy.register.mockReturnValue(of({ companyId: 'uuid-1', message: 'OK' }));
    const fixture = TestBed.createComponent(CompanyRegistration);
    const comp = fixture.componentInstance;

    comp.form.setValue(VALID_FORM);
    comp.onSubmit();
    await fixture.whenStable();

    expect(svcSpy.register).toHaveBeenCalled();
    expect(comp.submitted()).toBeTruthy();
  });

  it('submit com erro 409 CNPJ não marca submitted', async () => {
    svcSpy.register.mockReturnValue(
      throwError(() => ({ status: 409, error: { detail: 'CNPJ já cadastrado.' } }))
    );
    const fixture = TestBed.createComponent(CompanyRegistration);
    const comp = fixture.componentInstance;

    comp.form.setValue(VALID_FORM);
    comp.onSubmit();
    await fixture.whenStable();

    // Erro 409 com CNPJ: campo recebe erro OU apiError é definido — de qualquer forma, submitted é false
    expect(comp.submitted()).toBeFalsy();
    expect(comp.loading()).toBeFalsy();
  });

  it('submit com erro genérico define apiError', async () => {
    svcSpy.register.mockReturnValue(
      throwError(() => ({ status: 500, error: { detail: 'Erro interno.' } }))
    );
    const fixture = TestBed.createComponent(CompanyRegistration);
    const comp = fixture.componentInstance;

    comp.form.setValue(VALID_FORM);
    comp.onSubmit();
    await fixture.whenStable();

    expect(comp.apiError()).toBeTruthy();
    expect(comp.submitted()).toBeFalsy();
  });
});
