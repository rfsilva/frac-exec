---
baseline_commit: NO_VCS
---

# Story 2.6: Admin Executive Pool View

Status: done

## Story

Como operador admin,
quero visualizar a pool de executivos aprovados com filtros por especialidade, disponibilidade, setor e localização,
para que eu possa encontrar rapidamente o executivo certo para uma oportunidade e acessar seu perfil completo com dados internos.

## Acceptance Criteria

1. **Dado** admin acessa `/admin/pool`, **então** vê lista de executivos aprovados com: avatar de iniciais (background `brand.accent_light`), especialidade C-Level, setores, disponibilidade atual (dias/mês), e status como `StatusBadgeComponent` (Ativo / Pausado / Indisponível)

2. **Dado** a lista de pool, **então** aparecem apenas executivos com `executive_profiles.isComplete() = true` (bio não vazia + especialidades não vazias)

3. **Dado** filtros disponíveis, **então** o admin pode filtrar por: especialidade C-Level (CFO/CTO/CMO/COO/Outro), disponibilidade mínima (0, 5, 10, 20 dias/mês), setor, e status (`profileStatus`)

4. **Dado** executivo com `availability_days_per_month = 0` ou `profile_status = INACTIVE`, **então** exibido com badge cinza "Indisponível" e não pode ser adicionado a shortlist (botão desabilitado / ausente)

5. **Dado** filtros aplicados não retornam resultados, **então** exibe mensagem: "Nenhum executivo encontrado com esses critérios." com link "[Ajustar filtros]" que limpa os filtros ativos

6. **Dado** admin clica em um item da pool, **então** abre o perfil completo interno do executivo — exibe nomes reais das empresas (ignorando `company_visibility`), notas de verificação, e-mail, histórico C-Level completo

7. **Dado** o perfil interno do executivo, **então** exibe todos os campos: foto (URL pré-assinada), bio, especialidades, setores, disponibilidade, status, e-mail, experienceSummary, companyVisibility map com nomes reais e marcação de cada empresa como "Exibir" ou "Anonimizar" (read-only — visão admin)

## Tasks / Subtasks

- [ ] **BACKEND: DTO `ExecutivePoolItemResponse`** (AC: 1, 2, 3, 4)
  - [ ] Criar `admin/dto/ExecutivePoolItemResponse.java` — record com campos: `id UUID`, `userId UUID`, `email String`, `fullName String`, `initials String` (calculado: primeiras letras de nome + sobrenome), `specialties List<String>`, `sectors List<String>`, `availabilityDaysPerMonth int`, `profileStatus String`, `isAvailable boolean` (true se status ACTIVE e availability > 0)
  - [ ] `initials` gerado no mapeamento do service: `Arrays.stream(fullName.split(" ")).limit(2).map(w -> w.substring(0, 1).toUpperCase()).collect(joining())`

- [ ] **BACKEND: DTO `AdminExecutiveProfileResponse`** (AC: 6, 7)
  - [ ] Criar `admin/dto/AdminExecutiveProfileResponse.java` — record com: `id UUID`, `userId UUID`, `email String`, `fullName String`, `bio String`, `experienceSummary String`, `specialties List<String>`, `sectors List<String>`, `availabilityDaysPerMonth int`, `profileStatus String`, `photoUrl String` (pré-assinada), `companyVisibilityRaw Map<String, Boolean>` (nomes reais com flag de visibilidade), `verificationNotes String` (campo livre futuro — pode ser null/empty no MVP)
  - [ ] Diferença-chave vs `ExecutiveProfileResponse` do portal executive: retorna `companyVisibilityRaw` com nomes reais independente do flag de anonimização

- [ ] **BACKEND: Service — `AdminPoolService`** (AC: 1, 2, 3, 4, 5, 6, 7)
  - [ ] Criar interface `admin/service/AdminPoolService.java` com métodos: `listPool(AdminPoolFilter filter): Page<ExecutivePoolItemResponse>` e `getPoolDetail(UUID profileId): AdminExecutiveProfileResponse`
  - [ ] Criar `admin/service/AdminPoolServiceImpl.java` que implementa a interface
  - [ ] `listPool`: query em `executive_profiles` JOIN `users` JOIN `executive_specialties` JOIN `executive_sectors` WHERE `isComplete = true` (bio NOT NULL AND NOT EMPTY + specialties count > 0)
  - [ ] Aplicar filtros opcionais: `specialty` (match em `executive_specialties.specialty`), `minAvailability` (>= valor), `sector` (match em `executive_sectors.sector_name`), `profileStatus` (match em `executive_profiles.profile_status`)
  - [ ] `getPoolDetail`: busca `executive_profiles` por `id` + eager load de `users`, `executive_specialties`, `executive_sectors` + gera URL pré-assinada para `photo_key` via `MinioStorageService`
  - [ ] Criar `admin/dto/AdminPoolFilter.java` — record com: `String specialty`, `Integer minAvailability`, `String sector`, `String profileStatus`

- [ ] **BACKEND: Repositório com query customizada** (AC: 2, 3)
  - [ ] Em `ExecutiveProfileRepository.java` (já existe — Story 2.4), adicionar método: `findCompleteProfilesWithFilters(String specialty, Integer minAvailability, String sector, String profileStatus, Pageable pageable): Page<ExecutiveProfile>`
  - [ ] Usar `@Query` JPQL com `LEFT JOIN FETCH` para especialidades e setores; filtros condicionais com `:specialty IS NULL OR ...` pattern
  - [ ] Condição "completo": `ep.bio IS NOT NULL AND ep.bio != '' AND SIZE(ep.specialties) > 0`

- [ ] **BACKEND: Controller — `AdminPoolController`** (AC: 1, 2, 3, 4, 6)
  - [ ] Criar `admin/AdminPoolController.java` com `@RequestMapping("/api/v1/admin/pool")`, role ADMIN
  - [ ] `GET /api/v1/admin/pool` — query params: `specialty`, `minAvailability`, `sector`, `profileStatus`, `page` (default 0), `size` (default 20); retorna `Page<ExecutivePoolItemResponse>`
  - [ ] `GET /api/v1/admin/pool/{profileId}` — retorna `AdminExecutiveProfileResponse`
  - [ ] Ambos os endpoints protegidos por `@PreAuthorize("hasRole('ADMIN')")`

- [ ] **BACKEND: Testes** (AC: 1, 2, 3, 4, 5, 6, 7)
  - [ ] Criar `AdminPoolControllerTest.java` em `src/test/.../admin/`
  - [ ] Cenário: GET `/admin/pool` sem filtros → retorna apenas executivos com `isComplete = true`
  - [ ] Cenário: GET `/admin/pool?specialty=CFO` → retorna apenas CFOs completos
  - [ ] Cenário: GET `/admin/pool?minAvailability=10` → retorna apenas quem tem >= 10 dias
  - [ ] Cenário: GET `/admin/pool?profileStatus=INACTIVE` → inclui executivos inativos (filtro explícito)
  - [ ] Cenário: GET `/admin/pool` com nenhum executivo completo → retorna lista vazia (200, não 404)
  - [ ] Cenário: GET `/admin/pool/{profileId}` com perfil existente → retorna `AdminExecutiveProfileResponse` com `companyVisibilityRaw` contendo nomes reais
  - [ ] Cenário: GET `/admin/pool/{profileId}` com perfil inexistente → 404
  - [ ] Usar `@WithMockUser(roles = "ADMIN")` em todos os testes — padrão das Stories 2.2 e 2.3

- [ ] **FRONTEND: Reescrever `admin-pool.ts`** (AC: 1, 2, 3, 4, 5)
  - [ ] Reescrever `src/app/admin/pool/admin-pool.ts` — stub atual substituído por implementação real
  - [ ] Injetar `HttpClient` e `DestroyRef`; usar `takeUntilDestroyed(this.destroyRef)` para subscriptions
  - [ ] Estado: `pools = signal<ExecutivePoolItem[]>([])`, `loading = signal(false)`, `filters = signal<PoolFilters>({ specialty: null, minAvailability: null, sector: null, profileStatus: null })`
  - [ ] `loadPool()` — chama `GET /api/v1/admin/pool` com query params dos filtros ativos; atualiza `pools`
  - [ ] `clearFilters()` — reseta `filters` para todos null e chama `loadPool()`
  - [ ] Template: lista com `@for (exec of pools(); track exec.id)` — cada item: avatar de iniciais (div com `background-color: var(--accent-light)` ou classe CSS do design system), especialidades, setores, badge de disponibilidade, `StatusBadgeComponent`
  - [ ] Badge de disponibilidade (dias/mês): chip com cor verde se > 0, cinza se = 0
  - [ ] Executivo com `isAvailable = false`: aplicar classe CSS `pool-item--unavailable`, badge "Indisponível" cinza via `StatusBadgeComponent`
  - [ ] Painel de filtros: selects para specialty e profileStatus, input numérico para minAvailability, input texto para sector; filtros aplicados via `effect(() => loadPool())` quando `filters` muda
  - [ ] Empty state: `@if (pools().length === 0 && !loading())` → exibir "Nenhum executivo encontrado com esses critérios." + botão "[Ajustar filtros]" que chama `clearFilters()`
  - [ ] Clique em item → navegar para `detail` via rota filha ou abrir modal (ver tarefa abaixo)

- [ ] **FRONTEND: Perfil interno do executivo (detalhe admin)** (AC: 6, 7)
  - [ ] Criar `src/app/admin/pool/pool-detail/pool-detail.ts` — componente de detalhe
  - [ ] Adicionar rota filha `{ path: ':profileId', loadComponent: () => import('./pool-detail/pool-detail').then(m => m.PoolDetailComponent) }` em `admin.routes.ts` abaixo da rota `pool`
  - [ ] `pool-detail.ts` lê `profileId` do `ActivatedRoute.params`, chama `GET /api/v1/admin/pool/:profileId`
  - [ ] Exibe: foto (img com URL pré-assinada ou placeholder de iniciais), nome completo, e-mail, especialidades como chips, setores como chips, disponibilidade, status com `StatusBadgeComponent`, bio, experienceSummary
  - [ ] Seção "Empresas anteriores (visão admin)": lista os itens de `companyVisibilityRaw` mostrando nome real + flag "Exibir ao cliente" / "Anonimizado" — read-only nesta tela
  - [ ] Botão "← Voltar para pool" que navega para `/admin/pool` preservando filtros ativos (passar filtros via query params na navegação de volta)
  - [ ] Estado de loading: skeleton loader enquanto aguarda resposta
  - [ ] Erro 404: mensagem "Executivo não encontrado." com link de volta

- [ ] **VALIDAÇÃO FINAL**
  - [ ] `./mvnw test` — todos os testes passam (incluindo novos `AdminPoolControllerTest`)
  - [ ] `ng build` — sem erros de compilação TypeScript/Angular

## Dev Notes

### ⚠️ AVISOS CRÍTICOS

**1. Stub existente em `src/app/admin/pool/admin-pool.ts` — REESCREVER, não criar novo arquivo**
O arquivo `src/app/admin/pool/admin-pool.ts` já existe como stub. A tarefa de frontend é REESCREVER esse arquivo, não criar `admin-pool.component.ts` ou similar. Verificar o nome exato da classe exportada antes de reescrever para não quebrar a rota que já o referencia.

**2. `isComplete()` — lógica no backend, não no frontend**
O AC-2 exige que apenas perfis completos apareçam na pool. Essa filtragem DEVE ocorrer no backend (query SQL) e não no frontend. O frontend nunca recebe perfis incompletos em `GET /api/v1/admin/pool`.

**3. `company_visibility` JSONB — nomes reais sempre visíveis para admin**
O campo `company_visibility` em `executive_profiles` é um JSONB que mapeia `{ "Nome Real da Empresa": true/false }`. Para o admin, os NOMES REAIS são sempre exibidos independente do flag booleano. O flag apenas indica se o cliente final verá o nome ou "Empresa Confidencial". Em `AdminExecutiveProfileResponse`, retornar o map completo como `companyVisibilityRaw`.

**4. Não criar nova Flyway migration**
V5 já criou todas as tabelas necessárias (`executive_profiles`, `executive_specialties`, `executive_sectors`). Nenhuma coluna nova é necessária para esta story. NÃO criar V6 ou qualquer nova migration.

**5. `ExecutiveProfileRepository` já existe — apenas adicionar método**
O repositório foi criado na Story 2.4. Adicionar o método `findCompleteProfilesWithFilters` sem remover ou alterar métodos existentes (`findByUserId`).

**6. `AdminPoolController` é um controller NOVO — separado de `AdminApplicationController`**
Não adicionar os endpoints de pool ao `AdminApplicationController` existente. Criar `AdminPoolController.java` separado. Convenção de pacote: `admin/AdminPoolController.java`, `admin/service/AdminPoolService.java`, `admin/service/AdminPoolServiceImpl.java`.

**7. Paginação no endpoint de listagem**
`GET /api/v1/admin/pool` deve retornar `Page<ExecutivePoolItemResponse>` para suportar pools grandes. O frontend pode usar `size=50` por enquanto (não implementar paginação visual no MVP) mas o backend deve aceitar `page` e `size` como query params.

---

### JPQL para query de pool completa

```java
@Query("""
    SELECT ep FROM ExecutiveProfile ep
    LEFT JOIN FETCH ep.specialties s
    LEFT JOIN FETCH ep.sectors sec
    JOIN FETCH ep.user u
    WHERE ep.bio IS NOT NULL AND ep.bio <> ''
      AND SIZE(ep.specialties) > 0
      AND (:specialty IS NULL OR EXISTS (
            SELECT 1 FROM ExecutiveSpecialty es WHERE es.profile = ep AND es.specialty = :specialty))
      AND (:minAvailability IS NULL OR ep.availabilityDaysPerMonth >= :minAvailability)
      AND (:sector IS NULL OR EXISTS (
            SELECT 1 FROM ExecutiveSector esec WHERE esec.profile = ep AND esec.sectorName = :sector))
      AND (:profileStatus IS NULL OR ep.profileStatus = :profileStatus)
    """)
Page<ExecutiveProfile> findCompleteProfilesWithFilters(
    @Param("specialty") String specialty,
    @Param("minAvailability") Integer minAvailability,
    @Param("sector") String sector,
    @Param("profileStatus") String profileStatus,
    Pageable pageable);
```

---

### DTOs novos

```java
// admin/dto/ExecutivePoolItemResponse.java
public record ExecutivePoolItemResponse(
    UUID id,
    UUID userId,
    String email,
    String fullName,
    String initials,
    List<String> specialties,
    List<String> sectors,
    int availabilityDaysPerMonth,
    String profileStatus,
    boolean isAvailable
) {}

// admin/dto/AdminExecutiveProfileResponse.java
public record AdminExecutiveProfileResponse(
    UUID id,
    UUID userId,
    String email,
    String fullName,
    String bio,
    String experienceSummary,
    List<String> specialties,
    List<String> sectors,
    int availabilityDaysPerMonth,
    String profileStatus,
    String photoUrl,
    Map<String, Boolean> companyVisibilityRaw,
    String verificationNotes
) {}

// admin/dto/AdminPoolFilter.java
public record AdminPoolFilter(
    String specialty,
    Integer minAvailability,
    String sector,
    String profileStatus
) {}
```

---

### Mapeamento de iniciais no service

```java
private String computeInitials(String fullName) {
    if (fullName == null || fullName.isBlank()) return "?";
    return Arrays.stream(fullName.trim().split("\\s+"))
        .limit(2)
        .map(w -> String.valueOf(w.charAt(0)).toUpperCase())
        .collect(Collectors.joining());
}
```

---

### Frontend: interface TypeScript para pool item

```typescript
export interface ExecutivePoolItem {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  initials: string;
  specialties: string[];
  sectors: string[];
  availabilityDaysPerMonth: number;
  profileStatus: string;
  isAvailable: boolean;
}

export interface PoolFilters {
  specialty: string | null;
  minAvailability: number | null;
  sector: string | null;
  profileStatus: string | null;
}
```

---

### Padrões das Stories Anteriores

- `takeUntilDestroyed(this.destroyRef)` — padrão de unsubscribe Angular (Stories 2.2, 2.3, 2.4)
- `@if / @for` — template control flow nativo Angular 17+
- `signal()` + `effect()` para estado reativo — padrão confirmado no projeto
- `@WithMockUser(roles = "ADMIN")` — padrão de testes (Stories 2.2, 2.3)
- `MinioStorageService.generatePresignedDownloadUrl()` já existe — usar para `photoUrl`
- `StatusBadgeComponent` já existe (Story 1.3 — design system) — importar e usar
- `AdminApplicationDetailResponse` em `admin/dto/` como referência de estrutura de DTO admin

### References

- [Epics — Story 2.6 ACs](bmad-output/planning-artifacts/epics.md#story-26-admin-executive-pool-view)
- [Story 2.4 — tabelas V5 e ExecutiveProfileRepository](bmad-output/implementation-artifacts/2-4-executive-profile-completion.md)
- [Story 2.3 — AdminApplicationDetailResponse e padrão admin/dto/](bmad-output/implementation-artifacts/2-3-candidacy-review-decision-and-notification.md)
- [Story 2.2 — AdminApplicationController e padrão de controller admin](bmad-output/implementation-artifacts/2-2-admin-candidacy-queue-with-inline-expansion.md)
- [PACKAGE_CONVENTIONS.md](fracexec/fracexec-api/PACKAGE_CONVENTIONS.md)

## Dev Agent Record

### Agent Model Used
_A ser preenchido_

### Debug Log References
_A ser preenchido_

### Completion Notes List
_A ser preenchido_

### File List
_A ser preenchido_

## Senior Developer Review (AI)

**Data:** 2026-06-02
**Outcome:** Changes Requested
**Layers:** Blind Hunter · Acceptance Auditor (merged)

### Action Items

#### Blockers (High)

- [x] [Review][Patch] JPQL DISTINCT + LEFT JOIN dupla sobreconta `totalElements` — substituir filtros de coleção por EXISTS subquery ou separar em dois joins com OR [ExecutiveProfileRepository.java]
- [x] [Review][Patch] `isComplete` duplicado no JPQL — usar método Java em memória após query, ou query JPQL com EXISTS correta, para garantir consistência com `ExecutiveProfile.isComplete()` [ExecutiveProfileRepository.java / AdminPoolServiceImpl.java]

#### Patches de Qualidade / AC (Med)

- [x] [Review][Patch] Initials derivadas do email, não de nome real — `User` não tem `fullName`; usar email local-part (já feito) mas documentar limitação; derivar 2 primeiras letras de forma mais robusta [AdminPoolServiceImpl.java]
- [x] [Review][Patch] `getPoolDetail` sem filtro de completude — adicionar verificação `isComplete()` ou buscar via `findCompleteProfilesWithFilters` [AdminPoolServiceImpl.java]
- [x] [Review][Patch] Sector filter dispara GET a cada keystroke — substituir `(input)` por `(change)` ou adicionar debounce via Subject+switchMap [admin-pool.ts]
- [x] [Review][Patch] `companyVisibilityRaw` é mapa do executivo, não nomes reais da candidatura — usar `applicationRepository` para buscar nomes reais de `application_positions` [AdminPoolServiceImpl.java]
- [x] [Review][Patch] `CAST(ep.profileStatus AS string)` — substituir por parâmetro tipado como `ProfileStatus` enum [ExecutiveProfileRepository.java]

#### Deferred

- [x] [Review][Defer] Shortlist "cannot add" — feature não implementada ainda; badge "Indisponível" como indicador visual é suficiente no MVP

### Review Follow-ups (AI)
_(será preenchido pelo dev ao retomar)_
