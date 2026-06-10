import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { MediationThread } from './mediation-thread';

const MESSAGES = [
  { id: 'm1', senderRole: 'ADMIN', senderLabel: 'FracExec', content: 'Olá!', createdAt: '2025-01-01T10:00:00Z', senderId: null },
  { id: 'm2', senderRole: 'PME', senderLabel: 'Empresa', content: 'Obrigado.', createdAt: '2025-01-01T11:00:00Z', senderId: null },
];

@Component({
  standalone: true,
  imports: [MediationThread],
  template: `<app-mediation-thread needId="n1" role="ADMIN" />`
})
class TestHostAdmin {}

@Component({
  standalone: true,
  imports: [MediationThread],
  template: `<app-mediation-thread needId="n1" role="PME" />`
})
class TestHostPme {}

@Component({
  standalone: true,
  imports: [MediationThread],
  template: `<app-mediation-thread needId="n1" role="EXECUTIVE" />`
})
class TestHostExec {}

describe('MediationThread', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediationThread],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true).forEach(r => { if (!r.cancelled) r.flush([]); });
    httpMock.verify();
  });

  function createDirect(role: 'ADMIN' | 'PME' | 'EXECUTIVE' = 'PME') {
    const fixture = TestBed.createComponent(MediationThread);
    fixture.componentInstance.needId = 'n1';
    fixture.componentInstance.role = role;
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance };
  }

  it('deve criar o componente', () => {
    const { comp } = createDirect();
    httpMock.expectOne('/api/v1/company/needs/n1/messages').flush(MESSAGES);
    expect(comp).toBeTruthy();
  });

  it('carrega mensagens ao iniciar — role PME', () => {
    const { comp } = createDirect('PME');
    httpMock.expectOne('/api/v1/company/needs/n1/messages').flush(MESSAGES);
    expect(comp.messages().length).toBe(2);
    expect(comp.loading()).toBeFalsy();
  });

  it('carrega mensagens — role ADMIN', () => {
    const { comp } = createDirect('ADMIN');
    httpMock.expectOne('/api/v1/admin/needs/n1/messages').flush(MESSAGES);
    expect(comp.messages().length).toBe(2);
  });

  it('carrega mensagens — role EXECUTIVE', () => {
    const { comp } = createDirect('EXECUTIVE');
    httpMock.expectOne('/api/v1/executive/needs/n1/messages').flush(MESSAGES);
    expect(comp.messages().length).toBe(2);
  });

  it('send com mensagem vazia não envia', () => {
    const { comp } = createDirect('ADMIN');
    httpMock.expectOne('/api/v1/admin/needs/n1/messages').flush([]);
    comp.newMessage = '';
    comp.send();
    httpMock.expectNone('/api/v1/admin/needs/n1/messages');
  });

  it('send com mensagem válida — ADMIN — chama POST', async () => {
    const { fixture, comp } = createDirect('ADMIN');
    httpMock.expectOne('/api/v1/admin/needs/n1/messages').flush([]);
    comp.newMessage = 'Nova mensagem';
    comp.send();
    const req = httpMock.expectOne('/api/v1/admin/needs/n1/messages');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'm3', senderRole: 'ADMIN', senderLabel: 'FracExec', content: 'Nova mensagem', createdAt: '', senderId: null });
    await fixture.whenStable();
    expect(comp.newMessage).toBe('');
    expect(comp.sending()).toBeFalsy();
  });

  it('contactAdmin — PME — chama contact-admin endpoint', async () => {
    const { fixture, comp } = createDirect('PME');
    httpMock.expectOne('/api/v1/company/needs/n1/messages').flush([]);
    comp.newMessage = 'Contato ao admin';
    comp.contactAdmin();
    const req = httpMock.expectOne('/api/v1/company/needs/n1/contact-admin');
    expect(req.request.method).toBe('POST');
    req.flush({});
    await fixture.whenStable();
    expect(comp.newMessage).toBe('');
  });

  it('contactAdmin — EXECUTIVE — chama contact-admin executive endpoint', async () => {
    const { fixture, comp } = createDirect('EXECUTIVE');
    httpMock.expectOne('/api/v1/executive/needs/n1/messages').flush([]);
    comp.newMessage = 'Msg exec';
    comp.contactAdmin();
    const req = httpMock.expectOne('/api/v1/executive/needs/n1/contact-admin');
    req.flush({});
    await fixture.whenStable();
  });

  it('contactAdmin com mensagem vazia não envia', () => {
    const { comp } = createDirect('PME');
    httpMock.expectOne('/api/v1/company/needs/n1/messages').flush([]);
    comp.newMessage = '  ';
    comp.contactAdmin();
    httpMock.expectNone('/api/v1/company/needs/n1/contact-admin');
  });
});
