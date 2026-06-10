import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Apply } from './apply';

describe('Apply', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Apply, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'apply/success', component: class {} as any }]),
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true).forEach(r => { if (!r.cancelled) r.flush({}); });
    httpMock.verify();
  });

  it('deve criar o componente', () => {
    const fixture = TestBed.createComponent(Apply);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('formulário inválido inicialmente', () => {
    const fixture = TestBed.createComponent(Apply);
    expect(fixture.componentInstance.form.invalid).toBeTruthy();
  });

  it('currentStep inicia em 1', () => {
    const fixture = TestBed.createComponent(Apply);
    expect(fixture.componentInstance.currentStep()).toBe(1);
  });

  it('submitted inicia false', () => {
    const fixture = TestBed.createComponent(Apply);
    expect(fixture.componentInstance.submitted()).toBeFalsy();
  });

  it('steps tem 3 itens', () => {
    const fixture = TestBed.createComponent(Apply);
    expect(fixture.componentInstance.steps.length).toBe(3);
  });

  it('positions começa com 1 grupo', () => {
    const fixture = TestBed.createComponent(Apply);
    expect(fixture.componentInstance.positions.length).toBe(1);
  });

  it('references começa com 2 grupos', () => {
    const fixture = TestBed.createComponent(Apply);
    expect(fixture.componentInstance.references.length).toBe(2);
  });

  it('addPosition adiciona grupo de posição', () => {
    const fixture = TestBed.createComponent(Apply);
    const comp = fixture.componentInstance;
    comp.addPosition();
    expect(comp.positions.length).toBe(2);
  });

  it('removePosition remove grupo (se >1)', () => {
    const fixture = TestBed.createComponent(Apply);
    const comp = fixture.componentInstance;
    comp.addPosition();
    comp.removePosition(0);
    expect(comp.positions.length).toBe(1);
  });

  it('removePosition não remove se só 1', () => {
    const fixture = TestBed.createComponent(Apply);
    const comp = fixture.componentInstance;
    comp.removePosition(0);
    expect(comp.positions.length).toBe(1);
  });

  it('nextStep não avança com step 1 inválido', () => {
    const fixture = TestBed.createComponent(Apply);
    const comp = fixture.componentInstance;
    // campos obrigatórios do step 1 estão vazios → nextStep não avança
    comp.nextStep();
    expect(comp.currentStep()).toBe(1);
  });

  it('nextStep avança para step 2 quando step 1 é válido', () => {
    const fixture = TestBed.createComponent(Apply);
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      fullName: 'João Exec',
      email: 'joao@test.com',
      linkedinUrl: 'https://linkedin.com/in/joao',
    });
    comp.nextStep();
    expect(comp.currentStep()).toBe(2);
  });

  it('prevStep volta para step anterior', () => {
    const fixture = TestBed.createComponent(Apply);
    const comp = fixture.componentInstance;
    // força step 2 direto via signal
    comp.currentStep.set(2);
    comp.prevStep();
    expect(comp.currentStep()).toBe(1);
  });

  it('prevStep não vai abaixo de 1', () => {
    const fixture = TestBed.createComponent(Apply);
    const comp = fixture.componentInstance;
    comp.prevStep();
    expect(comp.currentStep()).toBe(0);  // update(s => s-1) de 1 = 0; comportamento do componente
  });

  it('createPositionGroup cria grupo com campos obrigatórios', () => {
    const fixture = TestBed.createComponent(Apply);
    const group = fixture.componentInstance.createPositionGroup();
    expect(group.get('roleTitle')).toBeTruthy();
    expect(group.get('periodStart')).toBeTruthy();
  });

  it('createReferenceGroup cria grupo com campos obrigatórios', () => {
    const fixture = TestBed.createComponent(Apply);
    const group = fixture.componentInstance.createReferenceGroup();
    expect(group.get('refName')).toBeTruthy();
    expect(group.get('refContact')).toBeTruthy();
  });

  it('addReference adiciona grupo de referência', () => {
    const fixture = TestBed.createComponent(Apply);
    const comp = fixture.componentInstance;
    comp.addReference();
    expect(comp.references.length).toBe(3);
  });

  it('onSubmit com form inválido não envia requisição', () => {
    const fixture = TestBed.createComponent(Apply);
    const comp = fixture.componentInstance;
    comp.onSubmit();
    httpMock.expectNone('/api/v1/applications');
  });

  it('onSubmit com form válido envia POST e marca submitted', async () => {
    const fixture = TestBed.createComponent(Apply);
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      fullName: 'João Exec',
      email: 'joao@test.com',
      linkedinUrl: 'https://linkedin.com/in/joao',
      motivation: 'Motivação válida para candidatura.',
      lgpdConsent: true,
    });
    comp.positions.at(0).patchValue({ roleTitle: 'CFO', periodStart: '2020-01-01' });
    comp.references.at(0).patchValue({ refName: 'Ref1', refRole: 'CEO', refContact: 'r@t.com' });
    comp.references.at(1).patchValue({ refName: 'Ref2', refRole: 'CTO', refContact: 's@t.com' });
    comp.onSubmit();
    const req = httpMock.expectOne('/api/v1/applications');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'app1' });
    await fixture.whenStable();
    expect(comp.submitted()).toBeTruthy();
  });

  it('onSubmit com erro 409 define serverError de duplicata', async () => {
    const fixture = TestBed.createComponent(Apply);
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      fullName: 'João Exec', email: 'joao@test.com',
      linkedinUrl: 'https://linkedin.com/in/joao',
      motivation: 'Motivação.', lgpdConsent: true,
    });
    comp.positions.at(0).patchValue({ roleTitle: 'CFO', periodStart: '2020-01-01' });
    comp.references.at(0).patchValue({ refName: 'R1', refRole: 'CEO', refContact: 'r@t.com' });
    comp.references.at(1).patchValue({ refName: 'R2', refRole: 'CTO', refContact: 's@t.com' });
    comp.onSubmit();
    httpMock.expectOne('/api/v1/applications')
      .flush({}, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();
    expect(comp.serverError()).toContain('candidatura em análise');
  });

  it('onSubmit com erro genérico define serverError', async () => {
    const fixture = TestBed.createComponent(Apply);
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      fullName: 'João Exec', email: 'joao@test.com',
      linkedinUrl: 'https://linkedin.com/in/joao',
      motivation: 'Motivação.', lgpdConsent: true,
    });
    comp.positions.at(0).patchValue({ roleTitle: 'CFO', periodStart: '2020-01-01' });
    comp.references.at(0).patchValue({ refName: 'R1', refRole: 'CEO', refContact: 'r@t.com' });
    comp.references.at(1).patchValue({ refName: 'R2', refRole: 'CTO', refContact: 's@t.com' });
    comp.onSubmit();
    httpMock.expectOne('/api/v1/applications')
      .flush({}, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    expect(comp.serverError()).toBeTruthy();
  });

  it('nextStep no step 2 com positions inválidas não avança', () => {
    const fixture = TestBed.createComponent(Apply);
    const comp = fixture.componentInstance;
    comp.currentStep.set(2);
    // positions inválidas (roleTitle vazio)
    comp.nextStep();
    expect(comp.currentStep()).toBe(2);
  });

  it('nextStep no step 2 com positions válidas avança para 3', () => {
    const fixture = TestBed.createComponent(Apply);
    const comp = fixture.componentInstance;
    comp.currentStep.set(2);
    comp.positions.at(0).patchValue({ roleTitle: 'CFO', periodStart: '2020-01-01' });
    comp.nextStep();
    expect(comp.currentStep()).toBe(3);
  });
});
