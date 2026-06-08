---
baseline_commit: b09072710eea5300e9228f15d9d0a12ee736f5a9
---

# Story 4.4: Anonymized Profiles & SMB Selection

Status: ready-for-dev

## Story

Como PME,
quero revisar os perfis anonimizados da shortlist e selecionar os executivos de interesse,
para que eu possa tomar uma decisão informada sem conhecer as identidades antes do contrato.

## Acceptance Criteria

1. **Dado** `/company/need/:id` com status `SHORTLIST_SENT`, **então** exibe 2–4 cards anonimizados: avatar com iniciais do setor (não do nome), especialidade C-Level, setores, disponibilidade (dias/mês), bio resumida — sem nome, sem empresa

2. **Dado** executivo com `conflict_status = APPROVED_WITH_ALERT`, **então** banner laranja acima do card: "Este executivo atua em empresa do mesmo segmento na sua região."

3. **Dado** PME selecionando, **então** pode marcar até 2 perfis com checkbox; "Confirmar seleção" ativa apenas com ≥ 1 selecionado

4. **Dado** "Confirmar seleção" clicado, **então** modal: "FracExec notificará os executivos selecionados. Você receberá atualizações por e-mail."

5. **Dado** seleção confirmada, **então** `need.status → IN_MEDIATION`; e-mail disparado a cada executivo selecionado com brief anonimizado da PME (setor, porte, escopo, desafio — sem nome/CNPJ)

6. **Dado** funil da PME, **então** avança para "Em mediação" com mensagem: "FracExec notificou os executivos. Você receberá atualizações por e-mail."

## Tasks / Subtasks

- [ ] **BACKEND: Endpoint de perfis anonimizados** (AC: 1, 2)
  - [ ] `GET /api/v1/company/needs/{needId}/shortlist` — role PME
  - [ ] Retorna `AnonShortlistResponse`: lista de `AnonExecutiveProfile` (sem nome, sem empresa)
  - [ ] `AnonExecutiveProfile`: `shortlistExecutiveId`, `sectorInitials` (iniciais da especialidade principal), `cLevelType`, `sectors`, `availabilityDaysPerMonth`, `bioSummary` (primeiros 150 chars da bio), `conflictStatus`
  - [ ] Somente visível quando `need.status = SHORTLIST_SENT`; retorna 403 se outra PME ou status diferente

- [ ] **BACKEND: Endpoint de seleção** (AC: 3–6)
  - [ ] `POST /api/v1/company/needs/{needId}/shortlist/select`
  - [ ] Body: `{ "selectedExecutiveIds": [UUID, UUID] }` — máx 2
  - [ ] Validações: need.status = SHORTLIST_SENT, IDs pertencem à shortlist desta need
  - [ ] `need.status → IN_MEDIATION`
  - [ ] Para cada `selectedExecutiveId`: criar `Engagement` (tabela do Epic 5 — mock por ora) OU criar registro em `shortlist_executive_selections`
  - [ ] Disparar `EmailService.sendOpportunityAvailable(executiveEmail, briefData)` para cada selecionado

- [ ] **BACKEND: Email `opportunity-available.html`** (AC: 5)
  - [ ] Template já existe como placeholder
  - [ ] Conteúdo: setor da PME, porte (employee_range), escopo (dias/mês + duração), trecho do desafio estratégico — sem nome da PME, sem CNPJ
  - [ ] Adicionar `sendOpportunityAvailable(String toEmail, String executiveName, OpportunityBriefData brief)` ao `EmailService`

- [ ] **BACKEND: Testes** (AC: 1–6)
  - [ ] `AnonShortlistControllerTest`: GET retorna perfis anonimizados; APPROVED_WITH_ALERT aparece no response; PME de outra empresa recebe 403
  - [ ] `SelectionControllerTest`: seleção válida → need IN_MEDIATION; mais de 2 selecionados → 400

- [ ] **FRONTEND: Tela `/company/need/:id` quando SHORTLIST_SENT** (AC: 1–6)
  - [ ] Atualizar `company.routes.ts` com rota `/company/need/:id`
  - [ ] Criar `src/app/company/need/need-shortlist.ts`
  - [ ] Cards anonimizados: avatar com inicial do `cLevelType`, especialidade, setores como chips, disponibilidade em JetBrains Mono
  - [ ] Banner laranja condicional para `APPROVED_WITH_ALERT`
  - [ ] Checkboxes com limite de 2 selecionados (desabilitar os demais quando 2 já marcados)
  - [ ] Modal de confirmação → POST → redirecionar para dashboard

## Dev Notes

### Anonimização obrigatória
O backend NUNCA deve retornar `fullName`, `email`, `photoKey`, `companyVisibility` nem qualquer dado de identificação pessoal no endpoint PME de shortlist. O `AnonExecutiveProfile` é um DTO completamente separado do `AdminExecutiveProfileResponse`.

### `sectorInitials`
Calcular como primeiras letras do `cLevelType`: "CFO" → "CF", "CTO" → "CT". Usar como texto do avatar circular com `background: var(--color-primary)`.

### Engagement mock para Story 4.5
A Story 4.5 depende de um `Engagement` ou equivalente para rastrear oportunidades por executivo. Criar tabela `shortlist_executive_selections` com `shortlist_executive_id`, `need_id`, `selected_at` para desacoplar da tabela `engagements` do Epic 5.

### `company/need/:id` — necessidade de routing
A PME acessa `/company/need/:id` para ver o status da necessidade. O componente deve ramificar o conteúdo baseado em `need.status`:
- `RECEIVED` / `UNDER_ANALYSIS` → mostrar funil (já implementado no dashboard)
- `SHORTLIST_SENT` → mostrar perfis anonimizados (esta story)
- `IN_MEDIATION` / `CONTRACTED` → mostrar thread de mediação (Story 4.6)

## Dev Agent Record
### Debug Log
_vazio_
### Completion Notes
_vazio_

## File List
_a preencher_

## Change Log
_a preencher_
