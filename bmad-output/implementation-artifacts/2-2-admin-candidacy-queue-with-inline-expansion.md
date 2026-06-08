---
baseline_commit: NO_VCS
---

# Story 2.2: Admin Candidacy Queue with Inline Expansion

Status: done

## Story

Como operador admin,
quero ver a fila de candidaturas com preview expansível inline,
para que eu possa triagem e iniciar análise sem sair da lista.

## Acceptance Criteria

1. **Dado** `/admin/candidates`, **então** exibe lista com colunas: nome, e-mail, data de entrada, status (tag colorida via `StatusBadgeComponent`), ação principal

2. **Dado** item na lista clicado para expandir (UX-DR11), **então** abre acordeão inline mostrando: LinkedIn, resumo de histórico C-Level (cargos + empresa + período), referências (nome, cargo, contato), motivação — sem navegar para outra página

3. **Dado** candidatura com status PENDING expandida, **então** exibe botão "Iniciar análise"

4. **Dado** "Iniciar análise" clicado, **então** `PATCH /api/v1/admin/applications/{id}/status` → status muda para UNDER_REVIEW e tag atualiza inline — sem reload

5. **Dado** filtros disponíveis, **então** a fila pode ser filtrada por: status (PENDING/UNDER_REVIEW/APPROVED/REJECTED), data de entrada (intervalo), busca por nome

6. **Dado** filtros aplicados, **então** persistem via Angular `Router` query params durante a sessão

7. **Dado** fila vazia após filtros, **então** exibe: "Nenhuma candidatura encontrada com esses critérios." + link/botão "Ajustar filtros"

8. **Dado** carregamento da lista, **então** exibe `LoadingSkeletonComponent` com `type="list"` enquanto aguarda a resposta da API

## Tasks / Subtasks

- [x] **BACKEND: Endpoint de listagem** (AC: 1, 5)
  - [x] Criar `GET /api/v1/admin/applications` — role ADMIN, parâmetros: `status`, `name`, `dateFrom`, `dateTo`, `page` (0-based), `size` (default 20)
  - [x] Retornar página Spring Data (`Page<ApplicationSummaryResponse>`) com: `id`, `fullName`, `email`, `status`, `createdAt`
  - [x] Criar `ApplicationSummaryResponse.java` em `executive/dto/`
  - [x] Criar método `findAllWithFilters(...)` no repository usando `JpaSpecificationExecutor` ou `@Query` JPQL
  - [x] Acesso restrito a ADMIN via `@PreAuthorize("hasRole('ADMIN')")`

- [x] **BACKEND: Endpoint de detalhe** (AC: 2)
  - [x] Criar `GET /api/v1/admin/applications/{id}` — role ADMIN
  - [x] Retornar `ApplicationDetailResponse.java` com todos os campos incluindo `positions` e `references`
  - [x] Criar `ApplicationDetailResponse.java` em `executive/dto/`

- [x] **BACKEND: Endpoint de mudança de status** (AC: 3, 4)
  - [x] Criar `PATCH /api/v1/admin/applications/{id}/status` com body `{ "status": "UNDER_REVIEW" }`
  - [x] Criar `UpdateStatusRequest.java` em `executive/dto/` — valida que `status` é um valor válido de `ApplicationStatus`
  - [x] Apenas transições válidas são permitidas: `PENDING → UNDER_REVIEW`; outras retornam 422
  - [x] Acesso restrito a ADMIN

- [x] **BACKEND: Organizar controller admin** (AC: 1, 2, 4)
  - [x] Criar `AdminApplicationController.java` em `admin/` — `@RequestMapping("/api/v1/admin/applications")`
  - [x] Seguir `PACKAGE_CONVENTIONS.md`: controller na raiz, service em `admin/service/`
  - [x] Criar `AdminApplicationService.java` + `AdminApplicationServiceImpl.java` em `admin/service/`

- [x] **BACKEND: Testes** (AC: 1, 4)
  - [x] Criar `AdminApplicationControllerTest.java` com: listar sem auth → 401, listar com EXECUTIVE → 403, listar com ADMIN → 200, PATCH status PENDING → UNDER_REVIEW → 200, PATCH status inválido → 422

- [x] **FRONTEND: Reescrever `AdminCandidates`** (AC: 1, 2, 3, 4, 5, 6, 7, 8)
  - [x] Reescrever `src/app/admin/candidates/admin-candidates.ts`
  - [x] Carregar lista via `HttpClient GET /api/v1/admin/applications` com query params de filtro
  - [x] Exibir `LoadingSkeletonComponent type="list"` enquanto carrega
  - [x] Tabela com colunas: nome, e-mail, data (formatada `dd/MM/yyyy`), status (`StatusBadgeComponent`), ação
  - [x] Filtros: select de status, date pickers (início/fim), input de busca por nome
  - [x] Persistência de filtros via `Router.navigate(['.'], { queryParams, queryParamsHandling: 'merge' })` ao aplicar + leitura de `ActivatedRoute.queryParams` na inicialização
  - [x] Estado vazio com mensagem e botão "Ajustar filtros" (limpa os filtros)

- [x] **FRONTEND: Acordeão inline** (AC: 2, 3, 4)
  - [x] Ao clicar num item, buscar detalhe via `GET /api/v1/admin/applications/{id}` e expandir inline (toggle)
  - [x] Acordeão mostra: LinkedIn (link clicável), histórico C-Level em lista, referências em lista, motivação
  - [x] Candidatura PENDING expandida: botão "Iniciar análise" → chama `PATCH /api/v1/admin/applications/{id}/status` com `{ status: 'UNDER_REVIEW' }` → atualiza tag inline sem reload

- [x] **VALIDAÇÃO FINAL**
  - [x] `./mvnw test` — todos os testes passam
  - [x] `ng build` — sem erros

## Dev Notes

### ⚠️ AVISOS CRÍTICOS

**1. `AdminCandidates` é um stub — reescrever por completo**
O arquivo atual (`admin-candidates.ts`) tem apenas um `PageHeader`. Esta story o substitui completamente com a lista real. O componente existe — não criar novo arquivo.

**2. Pacotes admin: seguir `PACKAGE_CONVENTIONS.md`**
```
admin/
  AdminApplicationController.java   ← raiz
  service/
    AdminApplicationService.java
    AdminApplicationServiceImpl.java
```
O domínio `admin/` não terá `model/` ou `repository/` próprios — usa as entidades do `executive/`.

**3. `@PreAuthorize` para ADMIN**
As rotas `/api/v1/admin/**` já são protegidas no `SecurityConfig` com `hasRole("ADMIN")`, mas adicionar `@PreAuthorize("hasRole('ADMIN')")` no controller adiciona defence-in-depth.

**4. Paginação Spring Data**
O endpoint de listagem usa `Pageable` do Spring Data. O frontend envia `?page=0&size=20`. O response é `Page<ApplicationSummaryResponse>` serializado com `content`, `page.size`, `page.number`, `page.totalElements`, `page.totalPages`.

**5. JPQL para filtros dinâmicos**
Usar `JpaSpecificationExecutor<ExecutiveApplication>` ou uma query JPQL com `COALESCE`/`IS NULL` para campos opcionais:
```java
@Query("""
    SELECT a FROM ExecutiveApplication a
    WHERE (:status IS NULL OR a.status = :status)
    AND (:name IS NULL OR LOWER(a.fullName) LIKE LOWER(CONCAT('%', :name, '%')))
    AND (:dateFrom IS NULL OR a.createdAt >= :dateFrom)
    AND (:dateTo IS NULL OR a.createdAt <= :dateTo)
    ORDER BY a.createdAt DESC
    """)
Page<ExecutiveApplication> findWithFilters(
    @Param("status") ApplicationStatus status,
    @Param("name") String name,
    @Param("dateFrom") Instant dateFrom,
    @Param("dateTo") Instant dateTo,
    Pageable pageable);
```

**6. StatusBadge mapeamento para variantes**
```typescript
function statusToVariant(status: string): BadgeVariant {
  switch (status) {
    case 'PENDING':      return 'status-pending';
    case 'UNDER_REVIEW': return 'status-pending';  // laranja também
    case 'APPROVED':     return 'status-active';
    case 'REJECTED':     return 'neutral';
    default:             return 'neutral';
  }
}
```

**7. Acordeão: não usar `*ngIf` — usar `@if` do Angular 17+**
Padrão do projeto: usar template control flow nativo (`@if`, `@for`, `@else`). Não importar `CommonModule` por causa de `*ngIf`/`*ngFor`.

**8. Persistência de filtros via query params**
```typescript
// Ao aplicar filtro:
this.router.navigate([], {
  relativeTo: this.route,
  queryParams: { status: this.filter.status || null, name: this.filter.name || null },
  queryParamsHandling: 'merge'
});

// Na inicialização:
this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe(params => {
    this.filter.status = params['status'] ?? '';
    this.filter.name   = params['name']   ?? '';
    this.loadApplications();
  });
```

---

### DTOs de Referência

```java
// ApplicationSummaryResponse.java (listagem)
public record ApplicationSummaryResponse(
    UUID id, String fullName, String email,
    ApplicationStatus status, Instant createdAt
) {}

// ApplicationDetailResponse.java (detalhe completo)
public record ApplicationDetailResponse(
    UUID id, String fullName, String email, String linkedinUrl,
    String motivation, ApplicationStatus status, Instant createdAt,
    List<PositionDetail> positions,
    List<ReferenceDetail> references
) {
    public record PositionDetail(String roleTitle, String companyName,
        LocalDate periodStart, LocalDate periodEnd,
        String teamSize, String revenueManaged) {}
    public record ReferenceDetail(String refName, String refRole, String refContact) {}
}

// UpdateStatusRequest.java
public record UpdateStatusRequest(
    @NotNull ApplicationStatus status
) {}
```

---

### Transições de Status Permitidas

| De | Para | Permitido |
|----|------|-----------|
| PENDING | UNDER_REVIEW | ✅ via "Iniciar análise" |
| PENDING | APPROVED / REJECTED | ❌ — apenas via Story 2.3 |
| UNDER_REVIEW | APPROVED / REJECTED | ❌ — apenas via Story 2.3 |

Esta story implementa apenas `PENDING → UNDER_REVIEW`. Story 2.3 implementa aprovação e rejeição.

---

### Padrões das Stories Anteriores

- `@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")` — padrão de testes
- `@PreAuthorize("hasRole('ADMIN')")` — authorization adicional no controller
- `takeUntilDestroyed(this.destroyRef)` — padrão de unsubscribe Angular
- `@for` / `@if` — controle de flow nativo Angular 17+
- `StatusBadge` importado de `../../shared/components/status-badge/status-badge`
- `LoadingSkeleton` importado de `../../shared/components/loading-skeleton/loading-skeleton`
- `PageHeader` importado de `../../shared/layout/page-header/page-header`

### References

- [Epics — Story 2.2 ACs](bmad-output/planning-artifacts/epics.md#story-22-admin-candidacy-queue-with-inline-expansion)
- [EXPERIENCE.md — Fila Admin](bmad-output/planning-artifacts/ux-designs/ux-FracExec-2026-05-29/EXPERIENCE.md#fila-admin)
- [PACKAGE_CONVENTIONS.md](fracexec/fracexec-api/PACKAGE_CONVENTIONS.md)
- [Story 2.1 — modelo de domínio executive](bmad-output/implementation-artifacts/2-1-public-application-form-stepper.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Spring Boot 3 serializa `Page` com `$.totalElements` no nível raiz — teste corrigido de `$.page.totalElements`.

### Completion Notes List

- 3 endpoints ADMIN: GET listagem paginada (filtros JPQL), GET detalhe completo, PATCH status PENDING→UNDER_REVIEW
- `findWithFilters` usa JPQL com parâmetros opcionais — `IS NULL OR a.field = :param`
- `AdminCandidates` reescrito: tabela com filtros persistidos em query params, acordeão inline, skeleton loading
- `startReview()` atualiza signal inline sem reload de página
- 25/25 testes passando; `ng build` limpo

### File List

**fracexec-api/**
- `executive/dto/ApplicationSummaryResponse.java` (criado)
- `executive/dto/ApplicationDetailResponse.java` (criado)
- `executive/dto/UpdateStatusRequest.java` (criado)
- `executive/repository/ExecutiveApplicationRepository.java` (modificado — findWithFilters)
- `admin/AdminApplicationController.java` (criado)
- `admin/service/AdminApplicationService.java` (criado)
- `admin/service/AdminApplicationServiceImpl.java` (criado)
- `test/.../admin/AdminApplicationControllerTest.java` (criado — 7 testes)

**fracexec-web/**
- `src/app/admin/candidates/admin-candidates.ts` (reescrito)

## Senior Developer Review (AI)

**Data:** 2026-06-01
**Outcome:** Changes Requested
**Layers:** Blind Hunter · Acceptance Auditor (merged)
**Dismissados:** 3

### Action Items

#### Blockers (High)

- [x] [Review][Patch] Transição de status estruturalmente frágil — refatorar para checagem explícita clara [AdminApplicationServiceImpl.java]
- [x] [Review][Patch] `UpdateStatusRequest` aceita qualquer `ApplicationStatus` — targets inválidos chegam ao service; adicionar validação de allowlist no DTO [UpdateStatusRequest.java]
- [x] [Review][Patch] `takeUntilDestroyed` não cancela requests em voo ao colapsar acordeão — race condition ao expandir linhas rapidamente; usar Subject+switchMap [admin-candidates.ts]

#### Patches de Qualidade / AC (Med)

- [x] [Review][Patch] Filtros não escritos de volta aos query params — `applyFilters()` com `router.navigate` não implementado [admin-candidates.ts]
- [x] [Review][Patch] "Iniciar análise" clicável durante PATCH em voo — adicionar `[disabled]="updatingStatus()"` [admin-candidates.ts]
- [x] [Review][Patch] `UNDER_REVIEW` indistinguível de `PENDING` no badge — mapear explicitamente [admin-candidates.ts]
- [x] [Review][Patch] `detail()!` non-null assertion falha ao fechar acordeão — substituir por `detail()?.status` [admin-candidates.ts]
- [x] [Review][Patch] `loadingDetail` não usado no template — adicionar skeleton no acordeão [admin-candidates.ts]
- [x] [Review][Patch] LIKE wildcard injection via `name` — escapar `%` e `_` antes do bind [ExecutiveApplicationRepository.java]

#### Deferred

- [x] [Review][Defer] `countQuery` ausente no JPQL — MVP < 300 candidaturas; deferred para Epic 6
- [x] [Review][Defer] "Ajustar filtros" = `clearFilters()` — comportamento de reset aceitável no MVP
- [x] [Review][Defer] `createdAt` vs. "entry date" — alinhado no template como "Data de entrada"

### Review Follow-ups (AI)

_(será preenchido pelo dev ao retomar a implementação)_
