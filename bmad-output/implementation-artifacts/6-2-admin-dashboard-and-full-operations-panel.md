---
baseline_commit: b90c9133f3fc0c40c398a102c5ec891b6215982b
---

# Story 6.2: Admin Dashboard & Full Operations Panel

Status: done

## Story

Como operador admin,
quero ter visibilidade operacional completa da plataforma em um painel centralizado,
para que eu monitore candidaturas, pool, necessidades, contratos e pipeline financeiro sem alternar entre múltiplas telas.

## Acceptance Criteria

1. **Dado** `/admin/dashboard`, **então** stat cards: candidaturas por status, executivos na pool, necessidades ativas, contratos ativos, volume de pagamentos do mês (JetBrains Mono)

2. **Dado** `/admin/engagements`, **então** lista todos engajamentos com empresa, executivo, status, próximo pagamento

3. **Dado** `/admin/engagements/:id`, **então** admin pode marcar PAUSED/COMPLETED/CANCELLED via modal com motivo; cada transição persiste

4. **Dado** pipeline de pagamentos, **então** total a receber, total em escrow, total repassado — valores em JetBrains Mono

5. **Dado** `/admin/dashboard`, **então** seção LGPD com contagem de solicitações pendentes (Story 6.3)

6. **Dado** listas vazias, **então** estado vazio contextual por seção

## Tasks / Subtasks

- [ ] **BACKEND: `GET /api/v1/admin/dashboard`**
  - [ ] `AdminDashboardResponse`: candidaturas (pending, under_review, approved, rejected), executivos na pool (active, inactive), necessidades ativas (received, under_analysis, shortlist_sent, in_mediation), contratos ativos, pagamento do mês (grossTotal, escrowTotal, transferredTotal), lgpdPendingCount
  - [ ] Queries eficientes por status sem carregar objetos completos (usar `count` queries)

- [ ] **BACKEND: `GET /api/v1/admin/engagements`**
  - [ ] Lista paginada de todos os engajamentos com: companyName, executiveName, status, monthlyValue, nextPaymentDue
  - [ ] `AdminEngagementSummaryResponse`

- [ ] **BACKEND: `PATCH /api/v1/admin/engagements/:id/status`**
  - [ ] Body: `{ "status": "PAUSED" | "COMPLETED" | "CANCELLED", "reason": string }`
  - [ ] Adicionar coluna `status_reason TEXT` e `status_updated_at TIMESTAMPTZ` à tabela `engagements` via Flyway V15

- [ ] **BACKEND: Testes**
  - [ ] `AdminDashboardControllerTest`: dashboard retorna contagens corretas; patch status funciona

- [ ] **FRONTEND: Reescrever `admin-dashboard.ts`**
  - [ ] GET `/admin/dashboard`; stat cards com LoadingSkeleton; seção LGPD com link para Story 6.3

- [ ] **FRONTEND: Criar `admin-engagements.ts`**
  - [ ] Lista de engajamentos com modal de mudança de status (PAUSED/COMPLETED/CANCELLED)
  - [ ] Adicionar rota `/admin/engagements` e `/admin/engagements/:id` ao `admin.routes.ts`
  - [ ] Adicionar "Engajamentos" ao sidebar admin

## Dev Notes

### Flyway V15
V14 = payments. V15 = `status_reason` + `status_updated_at` em `engagements`.

### Contagens eficientes
```java
// Usar JPQL COUNT em vez de findAll().size()
@Query("SELECT COUNT(a) FROM ExecutiveApplication a WHERE a.status = :status")
long countByStatus(@Param("status") ApplicationStatus status);
```

## Dev Agent Record
### Debug Log
_vazio_
### Completion Notes
_vazio_

## File List
_a preencher_

## Change Log
_a preencher_
