---
baseline_commit: b09072710eea5300e9228f15d9d0a12ee736f5a9
---

# Story 4.3: Conflict Review & Admin Decision

Status: ready-for-dev

## Story

Como operador admin,
quero revisar os detalhes de um conflito detectado e decidir como tratá-lo,
para que eu possa enviar a shortlist com transparência sem bloquear o fluxo desnecessariamente.

## Acceptance Criteria

1. **Dado** link "Revisar conflito" clicado na shortlist, **então** navega para `/admin/conflicts/:shortlistExecutiveId` com: dados do executivo (CNAE + região do cliente), dados da necessidade (setor da PME + estado), banner laranja visual de sobreposição

2. **Dado** "Excluir da shortlist" clicado, **então** `conflict_status → EXCLUDED`, executivo removido sem notificação à PME, slot liberado

3. **Dado** "Apresentar com alerta" clicado, **então** `conflict_status → APPROVED_WITH_ALERT`; PME receberá texto padrão na visualização dos perfis

4. **Dado** todos conflitos resolvidos E shortlist com ≥ 2 executivos não-EXCLUDED, **então** "Enviar shortlist" fica ativo

5. **Dado** "Enviar shortlist" clicado, **então** modal de confirmação lista executivos e seus `conflict_status`

6. **Dado** envio confirmado, **então** `need.status → SHORTLIST_SENT`, e-mail disparado à PME ("Shortlist disponível"), funil da PME atualiza para "Shortlist enviada"

7. **Dado** decisão de conflito, **então** gravada com `conflict_decided_by` (UUID do admin) e `conflict_decided_at` (timestamp)

## Tasks / Subtasks

- [ ] **BACKEND: Endpoint de decisão de conflito** (AC: 2, 3, 7)
  - [ ] `PATCH /api/v1/admin/shortlist-executives/{itemId}/conflict-decision`
  - [ ] Body: `{ "decision": "EXCLUDE" | "APPROVE_WITH_ALERT" }`
  - [ ] Seta `conflictStatus`, `conflictDecidedBy` (userId do admin autenticado), `conflictDecidedAt`

- [ ] **BACKEND: Endpoint de envio de shortlist** (AC: 4, 5, 6)
  - [ ] `POST /api/v1/admin/needs/{needId}/shortlist/send`
  - [ ] Validações: nenhum `PENDING_REVIEW`, ≥ 2 executivos não-EXCLUDED
  - [ ] Atualiza `need.status → SHORTLIST_SENT`, `shortlist.status → SENT`
  - [ ] Dispara e-mail à PME via `EmailService.sendShortlistSent(responsibleEmail, companyName)`

- [ ] **BACKEND: Email `shortlist-sent.html`** (AC: 6)
  - [ ] Template placeholder já existe em `src/main/resources/templates/email/shortlist-sent.html`
  - [ ] Implementar com: saudação com `companyName`, confirmação de shortlist disponível, link para o dashboard, instruções para revisar perfis

- [ ] **BACKEND: Adicionar método ao `EmailService`** (AC: 6)
  - [ ] `sendShortlistSent(String toEmail, String companyName)`

- [ ] **BACKEND: Testes** (AC: 2–7)
  - [ ] `ConflictDecisionControllerTest`: EXCLUDE → conflict_status EXCLUDED; APPROVE_WITH_ALERT → APPROVED_WITH_ALERT; auditoria gravada
  - [ ] `ShortlistSendControllerTest`: envio com PENDING_REVIEW → 422; envio válido → need.status SHORTLIST_SENT

- [ ] **FRONTEND: Tela `/admin/conflicts/:shortlistExecutiveId`** (AC: 1–3)
  - [ ] Criar `src/app/admin/conflicts/conflict-review.ts`
  - [ ] Adicionar rota em `admin.routes.ts`
  - [ ] Exibir: dados do executivo cliente (CNAE + estado), dados da necessidade PME (setor + estado), banner laranja de sobreposição
  - [ ] Botões: "Excluir da shortlist" (danger) e "Apresentar com alerta" (warning)
  - [ ] Após decisão: retornar para `/admin/needs/:id` (shortlist builder)

- [ ] **FRONTEND: Botão "Enviar shortlist"** (AC: 4–6)
  - [ ] No shortlist builder (Story 4.2), habilitar botão quando todos `conflict_status ≠ PENDING_REVIEW` E count(não-EXCLUDED) ≥ 2
  - [ ] Abrir modal de confirmação com lista de executivos e badges de status
  - [ ] POST → atualiza status da necessidade no funil do dashboard PME

## Dev Notes

### Dependência
Requer Story 4.2 (shortlist com conflict_status) completamente implementada.

### Auditoria de decisão
Os campos `conflict_decided_by` e `conflict_decided_at` em `ShortlistExecutive` são críticos para compliance. Usar `Authentication.getName()` para resolver o userId do admin — mesmo padrão dos controllers anteriores.

### E-mail shortlist-sent
Diferente dos outros e-mails, este vai para a PME (não para o executivo). O endereço é `company.getResponsibleEmail()`. O link deve apontar para `/company/need/:id`.

### ConflictAlertComponent (UX-DR8)
Banner laranja não-bloqueante. Mostrar os dois segmentos sobrepostos:
- Executivo: CNAE "62 - TI/Software", estado "SP"
- Necessidade PME: setor "Tecnologia", estado "SP"

## Dev Agent Record
### Debug Log
_vazio_
### Completion Notes
_vazio_

## File List
_a preencher_

## Change Log
_a preencher_
