---
baseline_commit: NO_VCS
---

# Story 2.4: Executive Profile Completion

Status: done

## Story

Como executivo aprovado,
quero completar meu perfil com especialidades, setores, bio e experiência verificada,
para que o time FracExec possa me incluir na pool de match.

## Acceptance Criteria

1. **Dado** executivo aprovado acessando `/executive/profile`, **então** vê formulário com: foto (upload MinIO `fracexec-profiles`), especialidades C-Level (multi-select: CFO, CTO, CMO, COO, Outro), setores de experiência (lista + campo livre), bio (textarea máx. 300 palavras com contador), resumo de experiência verificada

2. **Dado** o campo de empresas anteriores no histórico C-Level, **então** o executivo pode marcar cada empresa como "Exibir nome" ou "Anonimizar" (FR-2.2); no perfil interno admin o nome real é sempre visível

3. **Dado** o formulário salvo, **então** tabela `executive_profiles` (Flyway **V5**) é persistida/atualizada; disponibilidade inicial registrada como 20 dias/mês

4. **Dado** foto enviada, **então** armazenada no MinIO bucket `fracexec-profiles` com URL pré-assinada; preview exibido no formulário

5. **Dado** perfil incompleto (sem especialidades ou bio preenchidos), **então** executivo NÃO aparece na pool do admin

6. **Dado** executivo APPROVED acessando `/executive/**` com `executive_profiles` ainda não salvo, **então** é redirecionado para `/executive/profile` com banner: "Complete seu perfil para aparecer na pool de executivos." — guard libera navegação após o primeiro save

7. **Dado** perfil salvo com sucesso, **então** exibe mensagem inline: "Perfil atualizado." — sem redirecionamento

## Tasks / Subtasks

- [x] **BACKEND: Flyway V5 — tabela `executive_profiles`** (AC: 3)
  - [x] Criar `V5__executive_profiles.sql`
  - [x] Tabela `executive_profiles`: `id UUID PK DEFAULT gen_random_uuid()`, `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `photo_key VARCHAR(500)`, `bio TEXT`, `experience_summary TEXT`, `availability_days_per_month INT NOT NULL DEFAULT 20`, `profile_status VARCHAR(20) NOT NULL DEFAULT 'INACTIVE' CHECK (profile_status IN ('ACTIVE','INACTIVE','SUSPENDED'))`, `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - [x] Tabela `executive_specialties`: `id UUID PK DEFAULT gen_random_uuid()`, `profile_id UUID NOT NULL REFERENCES executive_profiles(id) ON DELETE CASCADE`, `specialty VARCHAR(50) NOT NULL` — valores: `CFO`, `CTO`, `CMO`, `COO`, `OUTRO`
  - [x] Tabela `executive_sectors`: `id UUID PK DEFAULT gen_random_uuid()`, `profile_id UUID NOT NULL REFERENCES executive_profiles(id) ON DELETE CASCADE`, `sector_name VARCHAR(100) NOT NULL`
  - [x] Índices: `idx_executive_profiles_user_id UNIQUE`, `idx_executive_profiles_status`

- [x] **BACKEND: Model, Repository, DTO** (AC: 1, 2, 3, 5)
  - [x] Criar entidades em `executive/model/`: `ExecutiveProfile.java`, `ExecutiveSpecialty.java` (enum: CFO/CTO/CMO/COO/OUTRO), `ExecutiveSector.java`, `ProfileStatus.java` (enum: ACTIVE/INACTIVE/SUSPENDED)
  - [x] Criar `ExecutiveProfileRepository.java` em `executive/repository/` — `findByUserId(UUID): Optional<ExecutiveProfile>`
  - [x] Criar `SaveProfileRequest.java` em `executive/dto/` — com campos: `bio`, `experienceSummary`, `specialties: List<String>`, `sectors: List<String>`, `companyVisibility: Map<String, Boolean>` (empresa → visível sim/não)
  - [x] Criar `ExecutiveProfileResponse.java` em `executive/dto/` — inclui `photoUrl` (pré-assinada), `isComplete` (boolean), todos os campos
  - [x] `isComplete` = `!bio.isBlank() && !specialties.isEmpty()`

- [x] **BACKEND: Service + Controller** (AC: 1, 2, 3, 4, 5, 6, 7)
  - [x] Criar `ExecutiveProfileService.java` + `ExecutiveProfileServiceImpl.java` em `executive/service/`
  - [x] `getProfile(userId)` — busca ou cria stub vazio para o executivo atual
  - [x] `saveProfile(userId, request)` — persiste especialidades (delete + insert), setores, bio, summary
  - [x] `uploadPhoto(userId, file)` — upload para MinIO `fracexec-profiles` com UUID-based key; retorna URL pré-assinada
  - [x] Criar `ExecutiveProfileController.java` — `@RequestMapping("/api/v1/executive/profile")`, role EXECUTIVE
  - [x] Endpoints: `GET /api/v1/executive/profile`, `PUT /api/v1/executive/profile`, `POST /api/v1/executive/profile/photo`
  - [x] AC-6: endpoint `GET /api/v1/executive/profile/complete` — retorna `{ complete: boolean }` usado pelo guard Angular

- [x] **BACKEND: Testes** (AC: 3, 5, 6)
  - [x] Criar `ExecutiveProfileControllerTest.java` — GET sem perfil → 200 com `complete: false`, PUT com bio+specialties → 200, GET após save → `complete: true`

- [x] **FRONTEND: Guard de perfil incompleto** (AC: 6)
  - [x] Criar `src/app/core/auth/profile.guard.ts` — `CanActivateFn` que chama `GET /api/v1/executive/profile/complete`; se `complete: false`, redireciona para `/executive/profile` com query param `?banner=true`
  - [x] Aplicar `profileGuard` às rotas filhas do portal executive (exceto `/executive/profile` em si)

- [x] **FRONTEND: Reescrever `ExecutiveProfile`** (AC: 1, 2, 3, 4, 6, 7)
  - [x] Reescrever `src/app/executive/profile/executive-profile.ts` — stub atual substituído por formulário completo
  - [x] Formulário com Reactive Forms: bio (textarea com contador de palavras), specialties (checkboxes multi-select), sectors (chips com campo livre), experienceSummary (textarea)
  - [x] Banner condicional quando `?banner=true` na URL: "Complete seu perfil para aparecer na pool de executivos."
  - [x] Seção de upload de foto: input file → `POST /api/v1/executive/profile/photo` → preview com URL pré-assinada
  - [x] Botão "Salvar perfil" → `PUT /api/v1/executive/profile` → mensagem inline "Perfil atualizado."
  - [x] Após primeiro save bem-sucedido, remover `?banner=true` da URL

- [x] **VALIDAÇÃO FINAL**
  - [x] `./mvnw test` — todos os testes passam
  - [x] `ng build` — sem erros

## Dev Notes

### ⚠️ AVISOS CRÍTICOS

**1. Flyway V5 — NÃO V3**
O epic.md menciona "Flyway V3" para `executive_profiles`, mas V3 já foi usada para `executive_applications` e V4 para `application_review_fields`. A próxima migration disponível é **V5**. Criar `V5__executive_profiles.sql`.

**2. `userId` no contexto de segurança**
O executivo autenticado acessa seu próprio perfil. Obter o `userId` do Spring Security context:
```java
@AuthenticationPrincipal UserDetails userDetails
// userDetails é uma instância de User (com getId())
```
No controller, extrair assim:
```java
private UUID getCurrentUserId(UserDetails userDetails) {
    return ((User) userDetails).getId();
}
```

**3. Especialidades: delete + insert**
Ao salvar especialidades, apagar as antigas e inserir as novas (simpler than merge):
```java
profile.getSpecialties().clear();
request.specialties().forEach(s ->
    profile.getSpecialties().add(new ExecutiveSpecialty(profile, SpecialtyType.valueOf(s))));
```

**4. MinIO photo key: UUID-based (lição da Story 2.3)**
```java
String ext = extractExtension(file.getOriginalFilename());
String key = "profiles/" + userId + "/" + UUID.randomUUID() + ext;
```

**5. `isComplete` determina visibilidade na pool**
```java
boolean isComplete = profile.getBio() != null && !profile.getBio().isBlank()
    && !profile.getSpecialties().isEmpty();
```
Esse flag é verificado na Story 2.6 (pool do admin) para filtrar executivos.

**6. `companyVisibility` no histórico C-Level**
Esse campo mapeia `companyName → visible (boolean)` da candidatura original. Como a tabela `application_positions` já existe (Story 2.1), este campo é armazenado em `executive_profiles` como JSON ou em tabela auxiliar. Para MVP: adicionar coluna `company_visibility JSONB` em `executive_profiles` no V5.

**7. Guard Angular: cache do status de completude**
O `profileGuard` deve verificar o endpoint apenas na primeira navegação dentro da sessão (usar Signal/localStorage para cachear `profileComplete: true` após o primeiro save). Caso contrário, toda navegação entre rotas do portal faz uma chamada HTTP.

---

### Schema V5

```sql
-- V5: Executive profiles
-- Story 2.4 — Executive Profile Completion

CREATE TABLE executive_profiles (
    id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_key               VARCHAR(500),
    bio                     TEXT,
    experience_summary      TEXT,
    company_visibility      JSONB        DEFAULT '{}',
    availability_days_per_month INT      NOT NULL DEFAULT 20,
    profile_status          VARCHAR(20)  NOT NULL DEFAULT 'INACTIVE'
                                CHECK (profile_status IN ('ACTIVE','INACTIVE','SUSPENDED')),
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE executive_specialties (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id  UUID         NOT NULL REFERENCES executive_profiles(id) ON DELETE CASCADE,
    specialty   VARCHAR(50)  NOT NULL
);

CREATE TABLE executive_sectors (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id  UUID         NOT NULL REFERENCES executive_profiles(id) ON DELETE CASCADE,
    sector_name VARCHAR(100) NOT NULL
);

CREATE UNIQUE INDEX idx_executive_profiles_user_id ON executive_profiles(user_id);
CREATE        INDEX idx_executive_profiles_status  ON executive_profiles(profile_status);
```

---

### Padrões das Stories Anteriores

- UUID-based key para upload MinIO: `"profiles/" + userId + "/" + UUID.randomUUID() + ext` (lição Story 2.3 P1)
- `@AuthenticationPrincipal UserDetails` para obter usuário autenticado
- `takeUntilDestroyed(this.destroyRef)` para subscriptions Angular
- `@if / @for` — template control flow nativo Angular 17+
- Testes: `@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test") @Transactional @WithMockUser`
- `PACKAGE_CONVENTIONS.md`: controller na raiz, model/dto/service/repository em sub-pacotes

### References

- [Epics — Story 2.4 ACs](bmad-output/planning-artifacts/epics.md#story-24-executive-profile-completion)
- [Story 2.3 — upload MinIO, UUID key, AuthenticationPrincipal](bmad-output/implementation-artifacts/2-3-candidacy-review-decision-and-notification.md)
- [Story 1.2 — User model e UserRepository](bmad-output/implementation-artifacts/1-2-user-authentication-and-role-system.md)

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- `FormsModule` necessário para `[(ngModel)]` no campo de setores — adicionado aos imports.

### Completion Notes List
- Flyway V5: `executive_profiles` + `executive_specialties` + `executive_sectors` com JSONB para `company_visibility`
- `profileGuard` usa cache `localStorage` para evitar chamada HTTP em cada navegação
- `isComplete = !bio.blank && !specialties.empty` — flag para pool do admin (Story 2.6)
- 34/34 testes; `ng build` limpo

### File List
**fracexec-api/**
- `db/migration/V5__executive_profiles.sql` (criado)
- `executive/model/SpecialtyType.java`, `ProfileStatus.java`, `ExecutiveProfile.java`, `ExecutiveSpecialty.java`, `ExecutiveSector.java` (criados)
- `executive/repository/ExecutiveProfileRepository.java` (criado)
- `executive/dto/SaveProfileRequest.java`, `ExecutiveProfileResponse.java`, `ProfileCompleteResponse.java` (criados)
- `executive/service/ExecutiveProfileService.java`, `ExecutiveProfileServiceImpl.java` (criados)
- `executive/ExecutiveProfileController.java` (criado)
- `test/.../executive/ExecutiveProfileControllerTest.java` (criado — 4 testes)

**fracexec-web/**
- `src/app/core/auth/profile.guard.ts` (criado)
- `src/app/executive/executive.routes.ts` (modificado — profileGuard nas rotas filhas)
- `src/app/executive/profile/executive-profile.ts` (reescrito)

## Senior Developer Review (AI)

**Data:** 2026-06-02
**Outcome:** Changes Requested
**Layers:** Blind Hunter · Acceptance Auditor (merged)
**Dismissados:** 4

### Action Items

#### Blockers (High)

- [x] [Review][Patch] AC-2: UI de visibilidade de empresa ausente — frontend envia sempre `companyVisibility: {}` sobrescrevendo o campo; implementar toggle por empresa ou deferir com PO [executive-profile.ts:314]
- [x] [Review][Patch] `@Transactional` em método `private` é ignorado pelo Spring AOP — tornar `createAndSaveEmptyProfile` package-private ou inlinar nos callers [ExecutiveProfileServiceImpl.java:createAndSaveEmptyProfile]
- [x] [Review][Patch] Cache `localStorage` nunca invalidado — `profileGuard` nunca volta a verificar após o primeiro save; limpar cache no logout e tratar 401 no catchError [profile.guard.ts]

#### Patches de Qualidade / AC (Med)

- [x] [Review][Patch] AC-1: bio limitada em caracteres (@Size 2000), não em palavras; sem bloqueio de submit quando > 300 palavras — adicionar validação de palavra na submissão [SaveProfileRequest.java / executive-profile.ts]
- [x] [Review][Patch] `wordCount` getter retorna função em vez de número — substituir por `computed()` signal [executive-profile.ts:257]
- [x] [Review][Patch] `catchError(() => of(true))` concede acesso em qualquer erro — distinguir 401/403 (→ login) de erros transientes [profile.guard.ts:27]
- [x] [Review][Patch] Specialty inválida silenciosamente descartada sem feedback — retornar 400 se valor inválido [ExecutiveProfileServiceImpl.java:72]
- [x] [Review][Patch] `uploadPhoto` usa `RuntimeException` — substituir por exceção de domínio mapeada pelo GlobalExceptionHandler [ExecutiveProfileServiceImpl.java:109]

#### Deferred

- [x] [Review][Defer] Presigned URL expira em 1h — MVP aceitável; refrescar na próxima navegação
- [x] [Review][Defer] `executive_specialties` sem UNIQUE constraint — delete+insert previne duplicatas; deferred
- [x] [Review][Defer] `getProfile` retorna entidade sem `id` — sem consumidores downstream que usam o id do perfil; deferred
- [x] [Review][Defer] Validação de tipo/tamanho do arquivo de foto — acesso restrito a EXECUTIVE autenticado; deferred para MVP

### Review Follow-ups (AI)

_(será preenchido pelo dev ao retomar a implementação)_
