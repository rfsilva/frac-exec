---
baseline_commit: 934e2bb4190d177c856982d18f40e385f00a8dee
---

# Story 3.2: SMB Need Posting Form

Status: done

## Story

Como PME cadastrada e ativa,
quero postar uma necessidade descrevendo o desafio estratégico e o escopo desejado,
para que o time FracExec encontre o executivo certo e eu receba confirmação com prazo de retorno.

## Acceptance Criteria

1. **Dado** `/company/need/new` acessada por PME ACTIVE sem necessidade ativa, **então** exibe formulário com 3 seções: (1) tipo de C-Level (chips: CFO, CTO, CMO, COO, Outro), (2) escopo (dias/mês: 1–2, 3–4, 5–8; duração estimada select; início desejado), (3) descrição do desafio (textarea obrigatória), resultado esperado (textarea obrigatória), contexto confidencial (textarea opcional — ADMIN only)

2. **Dado** PME já com necessidade ativa, **quando** tentar acessar `/company/need/new`, **então** é redirecionada para dashboard com mensagem: "Você já possui uma necessidade ativa."

3. **Dado** formulário submetido com campos obrigatórios preenchidos, **então** necessidade criada com status `RECEIVED` (tabela `needs`), PME redirecionada para `/company/dashboard`

4. **Dado** necessidade criada, **então** e-mail de confirmação disparado à PME com SLA de 5 dias úteis

5. **Dado** contexto confidencial preenchido, **então** campo visível apenas para ADMIN — nunca retornado em endpoints de PME ou executivo

6. **Dado** campo "descrição do desafio", **então** mínimo 50 caracteres com contador regressivo; erro: "Descreva o desafio com pelo menos 50 caracteres ([N] restantes)"

7. **Dado** botão "Salvar rascunho", **então** salva com status `DRAFT` sem enviar e-mail; PME pode retomar depois

## Tasks / Subtasks

- [ ] **BACKEND: Flyway V7 — tabela `needs`** (AC: 3)
  - [ ] Criar `V7__needs.sql`: tabela `needs` com campos: `id UUID PK`, `company_id UUID FK companies(id)`, `clevel_type VARCHAR(20) NOT NULL`, `scope_days_per_month VARCHAR(10) NOT NULL`, `estimated_duration VARCHAR(50)`, `desired_start DATE`, `challenge_description TEXT NOT NULL`, `expected_result TEXT NOT NULL`, `confidential_context TEXT`, `status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'`, `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()`
  - [ ] Índices: `idx_needs_company_id`, `idx_needs_status`

- [ ] **BACKEND: Entidade `Need` + enum `NeedStatus`** (AC: 3, 7)
  - [ ] `NeedStatus`: `DRAFT`, `RECEIVED`, `UNDER_ANALYSIS`, `SHORTLIST_SENT`, `IN_MEDIATION`, `CONTRACTED`
  - [ ] `Need.java`: entidade JPA com `@ManyToOne Company company`, todos os campos, `@CreationTimestamp`, `@UpdateTimestamp`

- [ ] **BACKEND: DTOs** (AC: 1, 3, 5)
  - [ ] `NeedRequest.java`: record com validators — `@NotBlank cLevelType`, `@NotBlank scopeDaysPerMonth`, `@NotBlank @Size(min=50) challengeDescription`, `@NotBlank expectedResult`, `confidentialContext` (nullable), `estimatedDuration`, `desiredStart`
  - [ ] `NeedResponse.java`: record com campos públicos (sem `confidentialContext`)
  - [ ] `NeedAdminResponse.java`: record que inclui `confidentialContext` (uso admin)

- [ ] **BACKEND: `NeedRepository`** (AC: 2, 3)
  - [ ] `existsByCompanyAndStatusIn(Company company, List<NeedStatus> statuses): boolean`
  - [ ] `findByCompanyAndStatusIn(Company company, List<NeedStatus> statuses): List<Need>`

- [ ] **BACKEND: `NeedService` + `NeedServiceImpl`** (AC: 2, 3, 4, 5, 7)
  - [ ] `postNeed(NeedRequest req, UUID userId): NeedResponse` — verifica se PME tem necessidade ativa (RECEIVED/UNDER_ANALYSIS/SHORTLIST_SENT/IN_MEDIATION), lança `BusinessRuleException` se sim
  - [ ] `saveDraft(NeedRequest req, UUID userId): NeedResponse` — salva com status DRAFT
  - [ ] Ao criar com status RECEIVED: disparar `NeedReceivedEvent` via `ApplicationEventPublisher`
  - [ ] `NeedReceivedEvent` + listener no `NotificationServiceImpl` que envia e-mail `need-received.html`

- [ ] **BACKEND: `NeedController`** (AC: 1, 2, 3, 7)
  - [ ] `POST /api/v1/company/needs` — cria com status RECEIVED (role PME)
  - [ ] `POST /api/v1/company/needs/draft` — salva rascunho (role PME)
  - [ ] `GET /api/v1/company/needs/active` — retorna necessidade ativa ou 404
  - [ ] Todos com `@PreAuthorize("hasRole('PME')")`

- [ ] **BACKEND: Testes** (AC: 1–7)
  - [ ] `NeedControllerTest.java`: POST com dados válidos → 201 + status RECEIVED; PME com necessidade ativa → 422; campos obrigatórios faltando → 400; rascunho → 201 status DRAFT

- [ ] **FRONTEND: `company.service.ts` — adicionar métodos de Need**
  - [ ] `postNeed(req): Observable<NeedResponse>`
  - [ ] `saveDraft(req): Observable<NeedResponse>`
  - [ ] `getActiveNeed(): Observable<NeedResponse | null>`

- [ ] **FRONTEND: Reescrever `company-need-new.ts`** (AC: 1, 2, 6, 7)
  - [ ] Verificar necessidade ativa no `ngOnInit` — redirecionar para `/company/dashboard` se existir
  - [ ] Formulário com 3 seções: chips de C-Level, escopo (selects), textos
  - [ ] Contador regressivo no campo `challengeDescription` (mínimo 50 chars)
  - [ ] Botões: "Salvar rascunho" e "Postar necessidade"
  - [ ] Submit → redireciona para `/company/dashboard`

## Dev Notes

### Migration V7 (próxima disponível)
V6 foi criado na Story 3.1 (tabela `companies`). V7 = `needs`. V8 e V9 RESERVADOS — nunca criar.

### Verificação de necessidade ativa
Status que bloqueiam nova postagem: `RECEIVED`, `UNDER_ANALYSIS`, `SHORTLIST_SENT`, `IN_MEDIATION`.
`DRAFT` e `CONTRACTED` não bloqueiam (rascunho pode ser descartado; contrato encerrado libera nova necessidade).

### Email template
`need-received.html` já existe como placeholder em `src/main/resources/templates/email/`. Implementar com: saudação com `legalName`, confirmação de recebimento, SLA de 5 dias úteis, link para dashboard.

### Pacote
```
com.fracexec.api.company/
  Need.java
  NeedStatus.java
  NeedRepository.java
  NeedService.java
  NeedServiceImpl.java
  NeedController.java        ← controller na raiz do pacote
  dto/
    NeedRequest.java
    NeedResponse.java
    NeedAdminResponse.java
```

### Frontend — padrões
- Chips de C-Level: array de strings selecionadas como `signal<string[]>([])`
- `challengeDescription` contador: `get charsRemaining(): number { return Math.max(0, 50 - this.f.challengeDescription.value?.length ?? 0); }`
- Subject+switchMap para cancelar requests in-flight (padrão admin-candidates)

## Senior Developer Review (AI)

**Outcome:** Changes Requested | **Data:** 2026-06-03

#### Action Items
- [x] [Review][Patch] `company-need-new.ts` não verifica necessidade ativa no `ngOnInit` — AC2 exige redirect para dashboard se PME já tem necessidade ativa [company-need-new.ts]

## Dev Agent Record
### Debug Log
_vazio_
### Completion Notes
_vazio_

## File List
_a preencher_

## Change Log
_a preencher_
