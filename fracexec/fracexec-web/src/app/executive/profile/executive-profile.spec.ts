import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ExecutiveProfile } from './executive-profile';

const PROFILE_RESPONSE = {
  id: 'p1', bio: 'Bio teste', experienceSummary: 'Exp',
  photoUrl: null, specialties: ['CFO'], sectors: ['Tecnologia'],
  companyVisibility: { 'EmpA': true }, applicationCompanies: ['EmpA'],
  availabilityDaysPerMonth: 12, profileStatus: 'ACTIVE', isComplete: true,
};

describe('ExecutiveProfile', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExecutiveProfile],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'executive/profile', component: class {} as any }]),
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true).forEach(r => { if (!r.cancelled) r.flush({}); });
    httpMock.verify();
  });

  function create() {
    const fixture = TestBed.createComponent(ExecutiveProfile);
    httpMock.expectOne('/api/v1/executive/profile').flush(PROFILE_RESPONSE);
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance };
  }

  it('deve criar o componente', () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('loading inicia true e vai para false após carregar', () => {
    const fixture = TestBed.createComponent(ExecutiveProfile);
    expect(fixture.componentInstance.loading()).toBeTruthy();
    httpMock.expectOne('/api/v1/executive/profile').flush(PROFILE_RESPONSE);
    expect(fixture.componentInstance.loading()).toBeFalsy();
  });

  it('popula form com dados do perfil', () => {
    const { comp } = create();
    expect(comp.form.get('bio')?.value).toBe('Bio teste');
    expect(comp.selectedSpecialties()).toContain('CFO');
    expect(comp.sectors()).toContain('Tecnologia');
  });

  it('isSelected retorna true para especialidade selecionada', () => {
    const { comp } = create();
    expect(comp.isSelected('CFO')).toBeTruthy();
    expect(comp.isSelected('CTO')).toBeFalsy();
  });

  it('toggleSpecialty adiciona especialidade não selecionada', () => {
    const { comp } = create();
    comp.toggleSpecialty('CTO');
    expect(comp.isSelected('CTO')).toBeTruthy();
    expect(comp.specialtiesTouched()).toBeTruthy();
  });

  it('toggleSpecialty remove especialidade selecionada', () => {
    const { comp } = create();
    comp.toggleSpecialty('CFO');
    expect(comp.isSelected('CFO')).toBeFalsy();
  });

  it('addSector adiciona setor novo', () => {
    const { comp } = create();
    comp.newSector = 'Saúde';
    comp.addSector();
    expect(comp.sectors()).toContain('Saúde');
    expect(comp.newSector).toBe('');
  });

  it('addSector não duplica setor existente', () => {
    const { comp } = create();
    comp.newSector = 'Tecnologia';
    comp.addSector();
    expect(comp.sectors().filter(s => s === 'Tecnologia').length).toBe(1);
  });

  it('removeSector remove setor', () => {
    const { comp } = create();
    comp.removeSector('Tecnologia');
    expect(comp.sectors()).not.toContain('Tecnologia');
  });

  it('getVisibility retorna valor de visibilidade', () => {
    const { comp } = create();
    expect(comp.getVisibility('EmpA')).toBe(true);
    expect(comp.getVisibility('EmpB')).toBeUndefined();
  });

  it('setVisibility atualiza visibilidade', () => {
    const { comp } = create();
    comp.setVisibility('EmpA', false);
    expect(comp.getVisibility('EmpA')).toBe(false);
  });

  it('wordCount calcula palavras corretamente', () => {
    const { comp } = create();
    // form já carregado com 'Bio teste' (2 palavras)
    expect(comp.wordCount()).toBe(2);
  });

  it('wordCount retorna 2 para bio com 2 palavras', () => {
    const { comp } = create();
    comp.form.get('bio')?.setValue('Bio teste');
    expect(comp.wordCount()).toBe(2);
  });

  it('deleteConfirm inicia false', () => {
    const { comp } = create();
    expect((comp as any).deleteConfirm()).toBeFalsy();
  });

  it('requestDeletion chama POST /api/v1/account/deletion-request', async () => {
    const { fixture, comp } = create();
    (comp as any).requestDeletion();
    const req = httpMock.expectOne('/api/v1/account/deletion-request');
    expect(req.request.method).toBe('POST');
    req.flush({});
    await fixture.whenStable();
    // Não lança exceção e a requisição foi feita corretamente
    expect(true).toBeTruthy();
  });
});
