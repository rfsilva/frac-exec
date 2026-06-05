---
baseline_commit: b09072710eea5300e9228f15d9d0a12ee736f5a9
---

# Story 4.1: Conflict of Interest Registry

Status: done

## Story

Como operador admin,
quero manter o registro de clientes ativos de cada executivo,
para que o sistema possa detectar automaticamente sobreposições ao montar shortlists.

## Acceptance Criteria

1. **Dado** Flyway V8, **então** tabela `executive_clients` existe com campos: `id UUID PK`, `executive_profile_id UUID FK executive_profiles(id)`, `cnae_2digit CHAR(2) NOT NULL`, `region_state CHAR(2) NOT NULL`, `region_city VARCHAR(100)`, `company_size_range VARCHAR(20)`, `created_at TIMESTAMPTZ DEFAULT now()`

2. **Dado** GET `/api/v1/admin/executives/:profileId/clients`, **então** retorna lista de clientes ativos do executivo (somente role ADMIN)

3. **Dado** POST `/api/v1/admin/executives/:profileId/clients` com dados válidos, **então** cria entrada no registro

4. **Dado** DELETE `/api/v1/admin/executives/:profileId/clients/:clientId`, **então** remove entrada do registro

5. **Dado** `/admin/pool` — perfil do executivo (pool-detail), **então** exibe seção "Clientes ativos" (CNAE + região) editável pelo ADMIN — nunca visível a PME ou executivo

6. **Dado** serviço `ConflictDetectionService.check(profileId, needCnae2, needRegionState)`, **então** retorna `CONFLICT` se existe entrada com mesmo `cnae_2digit` + mesmo `region_state`, ou `CLEAR` caso contrário

7. **Dado** `cnae_2digit`, **então** aceita apenas 2 dígitos numéricos (`"00"`–`"99"`); seed de teste inclui ≥ 5 CNAEs distintos: `"47"` (varejo), `"62"` (TI), `"49"` (transporte), `"86"` (saúde), `"41"` (construção)

## Tasks / Subtasks

- [ ] **BACKEND: Flyway V8 — tabela `executive_clients`** (AC: 1)
  - [ ] Criar `V8__executive_clients.sql`: tabela com `id`, `executive_profile_id` FK, `cnae_2digit CHAR(2)`, `region_state CHAR(2)`, `region_city`, `company_size_range`, `created_at`
  - [ ] Índice: `idx_executive_clients_profile_id`, `idx_executive_clients_cnae_region`

- [ ] **BACKEND: Entidade `ExecutiveClient`** (AC: 1)
  - [ ] `match/ExecutiveClient.java` com `@ManyToOne ExecutiveProfile executiveProfile`
  - [ ] Validação: `@Pattern(regexp="[0-9]{2}") String cnaeDigit` e `@Size(min=2,max=2) String regionState`

- [ ] **BACKEND: `ExecutiveClientRepository`** (AC: 2, 4, 6)
  - [ ] `findAllByExecutiveProfile(ExecutiveProfile p): List<ExecutiveClient>`
  - [ ] `existsByExecutiveProfileAndCnae2digitAndRegionState(...)`: boolean para detecção de conflito

- [ ] **BACKEND: DTOs** (AC: 2, 3)
  - [ ] `ExecutiveClientRequest`: `cnae2digit`, `regionState`, `regionCity`, `companySizeRange`
  - [ ] `ExecutiveClientResponse`: todos os campos + `id`

- [ ] **BACKEND: `ConflictDetectionService`** (AC: 6)
  - [ ] Interface + Impl em `match/service/`
  - [ ] `check(UUID profileId, String cnae2digit, String regionState): ConflictResult` — enum `CONFLICT` | `CLEAR`

- [ ] **BACKEND: `AdminExecutiveClientController`** (AC: 2, 3, 4)
  - [ ] `GET /api/v1/admin/executives/{profileId}/clients` — `@PreAuthorize("hasRole('ADMIN')")`
  - [ ] `POST /api/v1/admin/executives/{profileId}/clients`
  - [ ] `DELETE /api/v1/admin/executives/{profileId}/clients/{clientId}`

- [ ] **BACKEND: Seed de dados de teste** (AC: 7)
  - [ ] Em `DataInitializer` (profile `local`): inserir 5 entradas de `executive_clients` com CNAEs distintos para o executivo seed

- [ ] **BACKEND: Testes** (AC: 1–7)
  - [ ] `ExecutiveClientControllerTest`: CRUD completo, validação de `cnae_2digit` inválido → 400
  - [ ] `ConflictDetectionServiceTest`: CONFLICT quando mesmo CNAE+estado; CLEAR quando diferente

- [ ] **FRONTEND: Seção "Clientes ativos" no `pool-detail`** (AC: 5)
  - [ ] Em `src/app/admin/pool/pool-detail/pool-detail.ts`: adicionar seção colapsável "Clientes ativos"
  - [ ] GET ao montar o componente; lista de chips (CNAE + estado)
  - [ ] Formulário inline para adicionar: inputs cnae_2digit, region_state, region_city, company_size_range
  - [ ] Botão "×" em cada chip para remover (DELETE)

## Dev Notes

### Pacote backend correto
```
com.fracexec.api.match/
  ExecutiveClient.java
  ExecutiveClientRepository.java
  service/
    ConflictDetectionService.java
    ConflictDetectionServiceImpl.java
  dto/
    ExecutiveClientRequest.java
    ExecutiveClientResponse.java
```
Controllers ficam em `com.fracexec.api.admin/`

### Migration V8
V7 = `needs` (Story 3.2). V8 = `executive_clients`. V9 RESERVADO — nunca criar.

### Dependência crítica das stories seguintes
`ConflictDetectionService` é chamado pela Story 4.2 (Shortlist Builder) ao adicionar cada executivo. Deve estar completamente funcional antes de iniciar 4.2.

### ExecutiveProfile — chave de acesso
O endpoint usa `profileId` (UUID do `executive_profiles.id`), não o `userId`. O pool-detail já recebe e exibe o perfil via `GET /api/v1/admin/pool/{profileId}`.

## Dev Agent Record
### Debug Log
_vazio_
### Completion Notes
_vazio_

## File List
_a preencher_

## Change Log
_a preencher_
