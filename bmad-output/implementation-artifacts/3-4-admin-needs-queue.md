---
baseline_commit: 934e2bb4190d177c856982d18f40e385f00a8dee
---

# Story 3.4: Admin Needs Queue

Status: done

## Story

Como operador admin,
quero ver a fila de necessidades das PMEs com acesso rápido ao contexto completo,
para que eu possa iniciar a análise e construir shortlists com eficiência.

## Acceptance Criteria

1. **Dado** `/admin/needs`, **então** exibe lista com colunas: empresa (razão social), tipo de C-Level, escopo (dias/mês + duração), status, data de entrada, ação principal

2. **Dado** item clicado para expandir, **então** abre accordion inline: tipo C-Level, escopo, início desejado, descrição do desafio (anonimizada) — sem navegação

3. **Dado** necessidade RECEIVED expandida, **então** botão "Iniciar análise" visível

4. **Dado** "Iniciar análise" clicado, **então** status → `UNDER_ANALYSIS`, tag atualiza inline sem reload

5. **Dado** `/admin/needs/:id`, **então** detalhe completo incluindo `confidentialContext` (destacado — só ADMIN), histórico de status com timestamps, seção shortlist (vazia até Epic 4)

6. **Dado** filtros, **então** fila filtrável por: status, tipo de C-Level, setor da empresa, data de entrada

7. **Dado** fila vazia, **então** exibe: "Nenhuma necessidade no momento."

8. **Dado** `/admin/companies`, **então** lista empresas: razão social, CNPJ, responsável, data de cadastro, status (PENDING_ACTIVATION / ACTIVE)

9. **Dado** empresa PENDING_ACTIVATION, **então** botão "Ativar acesso"; ao clicar, status → ACTIVE e e-mail disparado à PME

## Tasks / Subtasks

- [ ] **BACKEND: `GET /api/v1/admin/needs`** (AC: 1, 6, 7)
  - [ ] `AdminNeedController.java` com `@RequestMapping("/api/v1/admin/needs")`
  - [ ] `AdminNeedSummaryResponse.java`: record com `id`, `companyLegalName`, `cLevelType`, `scopeDaysPerMonth`, `estimatedDuration`, `status`, `createdAt`
  - [ ] Query params: `status`, `cLevelType`, `sector`, `dateFrom`, `dateTo`, `page`, `size`
  - [ ] `NeedRepository`: adicionar `findWithFilters(...)` com boolean-flag JPQL pattern
  - [ ] `@PreAuthorize("hasRole('ADMIN')")`

- [ ] **BACKEND: `PATCH /api/v1/admin/needs/:id/status`** (AC: 4)
  - [ ] Body: `{ "status": "UNDER_ANALYSIS" }`
  - [ ] Validar transições válidas; atualizar `updated_at`

- [ ] **BACKEND: `GET /api/v1/admin/needs/:id`** (AC: 5)
  - [ ] `AdminNeedDetailResponse.java`: inclui `confidentialContext`, `challengeDescription`, `expectedResult`, histórico de status (por ora somente status atual + timestamps de created/updated)

- [ ] **BACKEND: `GET /api/v1/admin/companies`** (AC: 8)
  - [ ] `AdminCompanyController.java` com `GET /api/v1/admin/companies`
  - [ ] `AdminCompanySummaryResponse.java`: `id`, `legalName`, `cnpj`, `responsibleName`, `responsibleEmail`, `status`, `createdAt`
  - [ ] Filtro opcional por `status`

- [ ] **BACKEND: `PATCH /api/v1/admin/companies/:id/activate`** (AC: 9)
  - [ ] Muda `CompanyStatus` → `ACTIVE`
  - [ ] Dispara e-mail de ativação ao responsável (template `application-approved.html` adaptado, ou novo `company-activated.html`)
  - [ ] Reseta senha do usuário PME para uma aleatória e envia no e-mail com link de primeiro acesso (ou link `forgot-password`)

- [ ] **BACKEND: Testes** (AC: 1–9)
  - [ ] `AdminNeedControllerTest.java`: listagem, filtros, patch status, detalhe com confidentialContext
  - [ ] `AdminCompanyControllerTest.java`: listagem, ativação → status ACTIVE + e-mail

- [ ] **FRONTEND: `admin-needs.ts`** (AC: 1, 2, 3, 4, 6, 7)
  - [ ] Criar `src/app/admin/needs/admin-needs.ts` (novo componente)
  - [ ] Lista com accordion inline — mesma estrutura de `admin-candidates.ts`
  - [ ] Filtros: status select, C-Level select, setor input, data from/to
  - [ ] Botão "Iniciar análise" → PATCH + atualiza status inline via signal
  - [ ] `LoadingSkeletonComponent` tipo `table`

- [ ] **FRONTEND: `admin-companies.ts`** (AC: 8, 9)
  - [ ] Criar `src/app/admin/companies/admin-companies.ts`
  - [ ] Lista simples de empresas com badge de status
  - [ ] Botão "Ativar acesso" → PATCH + atualiza inline

- [ ] **FRONTEND: Rotas e navegação admin** (AC: 1, 8)
  - [ ] Adicionar em `admin.routes.ts`: rota `/admin/needs` e `/admin/companies`
  - [ ] Adicionar no sidebar do admin-shell: "Necessidades" e "Empresas"

## Dev Notes

### Dependência
Esta story depende das migrações e entidades criadas em Stories 3.1 (Company) e 3.2 (Need).

### Boolean-flag JPQL pattern
Mesmo padrão usado em `ExecutiveApplicationRepository` (Stories 2.2/2.3):
```java
@Query("""
  SELECT n FROM Need n JOIN n.company c
  WHERE (:filterStatus = false OR n.status = :status)
  AND (:filterCLevel = false OR n.cLevelType = :cLevelType)
  AND (:filterSector = false OR LOWER(c.sector) LIKE LOWER(CONCAT('%', CAST(:sector AS string), '%')))
  AND (:filterDateFrom = false OR n.createdAt >= :dateFrom)
  AND (:filterDateTo = false OR n.createdAt <= :dateTo)
  ORDER BY n.createdAt DESC""")
```

### Ativação de PME — e-mail
Usar `forgotPassword` flow para gerar link de primeiro acesso:
1. `companyActivationService.activate(companyId)` → status ACTIVE
2. Gerar token de reset de senha para o user PME
3. Enviar e-mail com link `/reset-password?token=...` e instruções de primeiro acesso

### Admin sidebar — itens a adicionar
```
Necessidades  → /admin/needs
Empresas      → /admin/companies
```

## Senior Developer Review (AI)

**Outcome:** Changes Requested | **Data:** 2026-06-03

#### Action Items
- [x] [Review][Patch] `AdminCompanyController.list()` usa `findAll()` em memória — adicionar `CompanyRepository.findAll(Pageable)` com filtro por status [AdminCompanyController.java:48]
- [x] [Review][Patch] `AdminCompanyController.activate()` swallows exception no e-mail sem log — adicionar `log.warn(...)` [AdminCompanyController.java:86]
- [x] [Review][Patch] `activate()` não invalida tokens anteriores do usuário PME antes de criar novo — chamar `invalidatePriorTokensByUserId` [AdminCompanyController.java:76]

## Dev Agent Record
### Debug Log
_vazio_
### Completion Notes
_vazio_

## File List
_a preencher_

## Change Log
_a preencher_
