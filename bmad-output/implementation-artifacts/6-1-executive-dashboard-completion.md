---
baseline_commit: b90c9133f3fc0c40c398a102c5ec891b6215982b
---

# Story 6.1: Executive Dashboard Completion

Status: done

## Story

Como executivo aprovado com engajamentos em andamento,
quero ter uma visão consolidada de todos os meus engajamentos, oportunidades e pagamentos em uma única tela,
para que eu gerencie minha agenda executiva sem navegar por múltiplas seções.

## Acceptance Criteria

1. **Dado** `/executive/dashboard`, **então** 4 stat cards: engajamentos ativos (count), dias comprometidos no mês (JetBrains Mono), próximo repasse (valor líquido JetBrains Mono), oportunidades pendentes (badge laranja se > 0)

2. **Dado** seção "Engajamentos ativos", **então** lista com empresa, função, dias/mês, `StatusBadgeComponent`, link `/executive/engagements/:id`

3. **Dado** `/executive/engagements`, **então** lista completa ACTIVE/PAUSED/COMPLETED/CANCELLED filtráveis por status

4. **Dado** seção "Oportunidades", **então** contagem + preview da mais recente; link "Ver todas →" para `/executive/opportunities`

5. **Dado** widgets carregando, **então** `LoadingSkeletonComponent` tipo `card` por widget — nunca tela cheia

6. **Dado** sem engajamentos, **então** "Nenhum engajamento ativo no momento."

7. **Dado** sem oportunidades, **então** "Nenhuma oportunidade aguardando resposta."

## Tasks / Subtasks

- [ ] **BACKEND: `GET /api/v1/executive/dashboard`** — role EXECUTIVE
  - [ ] `ExecutiveDashboardResponse`: `activeEngagementsCount`, `committedDaysMonth`, `nextTransferAmount`, `pendingOpportunitiesCount`, `activeEngagements: List<EngagementSummary>`, `recentOpportunity: OpportunityPreview?`
  - [ ] `EngagementSummary`: `id`, `companyName`, `cLevelType`, `scopeDaysPerMonth`, `status`
  - [ ] Buscar engagements do perfil do executivo via `EngagementRepository.findAllByExecutiveProfileAndStatus(ACTIVE)`
  - [ ] Buscar oportunidades AVAILABLE do executivo via `ExecutiveOpportunityRepository`
  - [ ] `committedDaysMonth` = soma `scopeDaysPerMonth` de engajamentos ACTIVE

- [ ] **BACKEND: `GET /api/v1/executive/engagements`** — role EXECUTIVE
  - [ ] Lista de todos engajamentos do executivo com filtro opcional por status
  - [ ] `ExecutiveEngagementResponse`: `id`, `companyName`, `cLevelType`, `scopeDaysPerMonth`, `monthlyValue`, `status`, `startedAt`

- [ ] **BACKEND: Testes**
  - [ ] `ExecutiveDashboardControllerTest`: com engagement ACTIVE → 4 stat cards corretos; sem engagement → counts = 0

- [ ] **FRONTEND: Reescrever `executive-dashboard.ts`**
  - [ ] GET `/executive/dashboard` no init
  - [ ] 4 stat cards com `LoadingSkeletonComponent` individual
  - [ ] Seção "Engajamentos ativos" com `StatusBadgeComponent`
  - [ ] Seção "Oportunidades" com link para `/executive/opportunities`
  - [ ] Widget de pagamentos com dados do `/executive/payments/summary` (já existe na Story 5.4)

- [ ] **FRONTEND: Criar `executive-engagements.ts`** (stub existe, implementar)
  - [ ] Lista com filtro por status; `StatusBadgeComponent`; link para detalhe

## Dev Notes

### Padrões existentes
- `LoadingSkeletonComponent` — importar de `../../shared/components/loading-skeleton/loading-skeleton`
- `StatusBadgeComponent` — importar de `../../shared/components/status-badge/status-badge`
- Padrão signal: `loading = signal(false)`, `data = signal<T | null>(null)`
- JetBrains Mono: usar classe CSS `.mono` ou `font-family: 'JetBrains Mono', monospace`

### Dependência
Requer `Engagement` e `Payment` do Epic 5 para retornar dados reais.

## Dev Agent Record
### Debug Log
_vazio_
### Completion Notes
_vazio_

## File List
_a preencher_

## Change Log
_a preencher_
