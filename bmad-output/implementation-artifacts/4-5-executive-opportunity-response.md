---
baseline_commit: b09072710eea5300e9228f15d9d0a12ee736f5a9
---

# Story 4.5: Executive Opportunity Response

Status: ready-for-dev

## Story

Como executivo aprovado,
quero revisar um brief anonimizado de oportunidade e declarar interesse ou declinar,
para que eu possa decidir se o engajamento se encaixa na minha disponibilidade em até 3 dias úteis.

## Acceptance Criteria

1. **Dado** `/executive/opportunities`, **então** lista de oportunidades: setor da PME (tag), porte, escopo (dias/mês + duração), resumo do desafio — sem nome de empresa, sem CNPJ; status via `StatusBadgeComponent`

2. **Dado** oportunidade com status `AVAILABLE`, **então** prazo de resposta (3 dias úteis a partir do recebimento) e botões "Tenho interesse" e "Declinar"

3. **Dado** "Tenho interesse" clicado, **então** confirmação inline: "Interesse declarado."; status → `INTERESTED`

4. **Dado** "Declinar" clicado, **então** modal com motivo opcional; status → `DECLINED`

5. **Dado** prazo de 3 dias úteis expirado sem resposta, **então** job agendado atualiza para `EXPIRED`; vai para seção "Histórico"

6. **Dado** apenas 1 de 2 executivos declinar/expirar, **então** engajamento permanece `IN_MEDIATION` aguardando o outro

7. **Dado** ambos declinarem/expirarem, **então** e-mail ao ADMIN: "Ambos declinaram — necessidade [ID] requer novo ciclo"; `need.status → UNDER_ANALYSIS`

8. **Dado** oportunidade `INTERESTED` com contrato não gerado, **então** botão "Retratar interesse" disponível por 24h; após 24h ou geração de contrato, desaparece

9. **Dado** oportunidades `INTERESTED`/`DECLINED`/`EXPIRED`, **então** em seção "Histórico" com tags cinza

## Tasks / Subtasks

- [ ] **BACKEND: Tabela `executive_opportunities`** (via migration V9 extension ou nova coluna em `shortlist_executive_selections`)
  - [ ] Campos: `id UUID PK`, `shortlist_executive_selection_id UUID FK`, `executive_profile_id UUID FK`, `need_id UUID FK`, `status VARCHAR(20) DEFAULT 'AVAILABLE'`, `decline_reason TEXT`, `interested_at`, `declined_at`, `expires_at TIMESTAMPTZ` (= `selected_at + 3 dias úteis`), `retracted_at`, `created_at`
  - [ ] Índice: `idx_exec_opportunities_profile_status`
  - [ ] Calcular `expires_at` com `BusinessDayCalculator.addBusinessDays(selectedAt, 3)` (já implementado Story 3.3)

- [ ] **BACKEND: `OpportunityStatus` enum**
  - [ ] `AVAILABLE`, `INTERESTED`, `DECLINED`, `EXPIRED`, `RETRACTED`

- [ ] **BACKEND: DTOs**
  - [ ] `OpportunityResponse`: `id`, `needId`, `cLevelType`, `scopeDaysPerMonth`, `estimatedDuration`, `challengeSummary` (50 chars), `companySector`, `companyEmployeeRange`, `status`, `expiresAt`, `canRetract` (bool)
  - [ ] `DeclinerRequest`: `reason? String`

- [ ] **BACKEND: `ExecutiveOpportunityController`** — role EXECUTIVE
  - [ ] `GET /api/v1/executive/opportunities` — lista AVAILABLE separado de histórico
  - [ ] `POST /api/v1/executive/opportunities/{id}/interest` — status → INTERESTED
  - [ ] `POST /api/v1/executive/opportunities/{id}/decline` — status → DECLINED
  - [ ] `POST /api/v1/executive/opportunities/{id}/retract` — status → RETRACTED (só se < 24h e contrato não gerado)

- [ ] **BACKEND: Job de expiração** (AC: 5, 7)
  - [ ] `@Scheduled(fixedDelay = 3600000)` — verifica oportunidades `AVAILABLE` com `expires_at < now()`
  - [ ] Para cada expirada: status → `EXPIRED`, verificar se ambos declinaram/expiraram → `need.status → UNDER_ANALYSIS` + e-mail ao admin
  - [ ] E-mail: `EmailService.sendBothDeclined(adminEmail, needId)`

- [ ] **BACKEND: Lógica de "ambos declinaram"** (AC: 6, 7)
  - [ ] Após cada DECLINED/EXPIRED: contar quantas oportunidades da mesma `need_id` têm status DECLINED/EXPIRED
  - [ ] Se count = total de selecionados: triggera retorno para `UNDER_ANALYSIS`

- [ ] **BACKEND: Testes** (AC: 1–9)
  - [ ] `OpportunityControllerTest`: declare interest; decline; retract dentro de 24h; retract após 24h → 422
  - [ ] `ExpirationJobTest`: oportunidade expirada → EXPIRED; ambos expirados → need UNDER_ANALYSIS

- [ ] **FRONTEND: `/executive/opportunities`** (AC: 1–9)
  - [ ] Criar `src/app/executive/opportunities/executive-opportunities.ts`
  - [ ] Adicionar rota e link no sidebar executivo ("Oportunidades")
  - [ ] Lista principal: oportunidades AVAILABLE com countdown de prazo em JetBrains Mono
  - [ ] Botões "Tenho interesse" / "Declinar" (modal com textarea opcional)
  - [ ] Botão "Retratar" condicional (`canRetract = true`)
  - [ ] Seção "Histórico" colapsável: INTERESTED/DECLINED/EXPIRED com `StatusBadgeComponent` neutro

## Dev Notes

### `challengeSummary` — anonimização
Retornar apenas os primeiros 50 chars de `need.challengeDescription`. Nunca incluir `need.confidentialContext`.

### Countdown de prazo
`expiresAt - now()` em dias úteis usando `BusinessDayCalculator.businessDaysUntil(expiresAt)` (já implementado Story 3.3). Exibir "X dias úteis restantes" em JetBrains Mono.

### Job de expiração — produção
Em produção, o `@Scheduled` roda no pod da EC2. Em testes, usar `@SpyBean` para verificar a lógica sem aguardar o timer.

### Retratação — 24h
Calcular: `Instant.now().isBefore(opportunity.getInterestedAt().plus(24, ChronoUnit.HOURS))`. Backend valida, frontend apenas esconde o botão quando `canRetract = false`.

### Sidebar executivo — adicionar item
Adicionar em `executive-shell.ts`: `{ label: 'Oportunidades', route: '/executive/opportunities', icon: '◎' }`

## Dev Agent Record
### Debug Log
_vazio_
### Completion Notes
_vazio_

## File List
_a preencher_

## Change Log
_a preencher_
