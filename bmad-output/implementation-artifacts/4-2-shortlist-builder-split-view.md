---
baseline_commit: b09072710eea5300e9228f15d9d0a12ee736f5a9
---

# Story 4.2: Shortlist Builder (Split-View)

Status: ready-for-dev

## Story

Como operador admin,
quero construir uma shortlist em interface split-view com verificação automática de conflito ao adicionar executivos,
para que eu monte shortlists qualificadas com rapidez e segurança.

## Acceptance Criteria

1. **Dado** `/admin/needs/:id` em tab "Construir shortlist", **então** interface split-view exibe: painel esquerdo — pool filtrada (specialty, disponibilidade, setor); painel direito — shortlist em construção com até 4 slots

2. **Dado** executivo na pool clicado com "Adicionar", **então** entra na shortlist e sistema verifica conflito via `ConflictDetectionService` imediatamente

3. **Dado** conflito detectado, **então** badge amarelo inline: "Sobreposição detectada — [setor], [estado]. Revisão necessária." — executivo fica com `conflict_status = PENDING_REVIEW`

4. **Dado** executivo sem conflito, **então** badge verde "Sem conflito" (`conflict_status = CLEAR`)

5. **Dado** shortlist com `PENDING_REVIEW`, **então** botão "Enviar shortlist" desabilitado com tooltip "Resolva os conflitos antes de enviar."

6. **Dado** Flyway V9, **então** tabelas `shortlists` e `shortlist_executives` existem

7. **Dado** executivo removido, **então** slot liberado, shortlist atualiza sem reload

8. **Dado** pool filtrada, **então** executivos com `availability_days_per_month = 0` aparecem desabilitados

9. **Dado** necessidade com status `SHORTLIST_SENT`, `IN_MEDIATION` ou `CONTRACTED`, **então** shortlist em modo somente leitura com banner "Shortlist já enviada. Edição bloqueada."

10. **Dado** necessidade voltou para `UNDER_ANALYSIS` (ambos declinaram), **então** shortlist volta ao modo de edição; executivos anteriores com badge "Declinado" mas removíveis

## Tasks / Subtasks

- [ ] **BACKEND: Flyway V9 — tabelas `shortlists` e `shortlist_executives`** (AC: 6)
  - [ ] `shortlists`: `id UUID PK`, `need_id UUID FK needs(id) UNIQUE`, `status VARCHAR(20) DEFAULT 'DRAFT'`, `created_at`, `updated_at`
  - [ ] `shortlist_executives`: `id UUID PK`, `shortlist_id UUID FK shortlists(id)`, `executive_profile_id UUID FK executive_profiles(id)`, `conflict_status VARCHAR(20) DEFAULT 'CLEAR'`, `conflict_decided_by UUID`, `conflict_decided_at TIMESTAMPTZ`, `created_at`
  - [ ] Índices: `idx_shortlists_need_id`, `idx_shortlist_executives_shortlist_id`
  - [ ] Constraint: max 4 executivos por shortlist (enforced no service)

- [ ] **BACKEND: Entidades `Shortlist` + `ShortlistExecutive`** (AC: 6)
  - [ ] `match/Shortlist.java`: `@OneToOne Need need`, `ShortlistStatus status`, `@OneToMany List<ShortlistExecutive> executives`
  - [ ] `match/ShortlistExecutive.java`: `@ManyToOne Shortlist shortlist`, `@ManyToOne ExecutiveProfile executiveProfile`, `ConflictStatus conflictStatus`, auditoria de decisão
  - [ ] `ShortlistStatus` enum: `DRAFT`, `SENT`
  - [ ] `ConflictStatus` enum: `CLEAR`, `PENDING_REVIEW`, `APPROVED_WITH_ALERT`, `EXCLUDED`

- [ ] **BACKEND: Repositórios** (AC: 1, 2, 7)
  - [ ] `ShortlistRepository`: `findByNeed(Need n): Optional<Shortlist>`
  - [ ] `ShortlistExecutiveRepository`: `countByShortlist(Shortlist s): long`

- [ ] **BACKEND: DTOs**
  - [ ] `ShortlistResponse`: `id`, `needId`, `status`, `executives: List<ShortlistExecutiveItem>`
  - [ ] `ShortlistExecutiveItem`: `executiveProfileId`, `fullName`, `specialties`, `availabilityDaysPerMonth`, `conflictStatus`, `conflictDetail?`
  - [ ] `AddExecutiveRequest`: `executiveProfileId UUID`

- [ ] **BACKEND: `ShortlistService` + `ShortlistServiceImpl`** (AC: 1–10)
  - [ ] `getOrCreate(UUID needId): ShortlistResponse` — cria shortlist se não existe
  - [ ] `addExecutive(UUID shortlistId, UUID profileId): ShortlistExecutiveItem` — verifica max 4, chama `ConflictDetectionService`, seta `conflictStatus`
  - [ ] `removeExecutive(UUID shortlistId, UUID executiveItemId): void`
  - [ ] Injetar `ConflictDetectionService` (Story 4.1) e `NeedRepository`

- [ ] **BACKEND: `AdminShortlistController`** (AC: 1–10)
  - [ ] `GET /api/v1/admin/needs/{needId}/shortlist` — busca ou cria
  - [ ] `POST /api/v1/admin/needs/{needId}/shortlist/executives` — adiciona com verificação de conflito
  - [ ] `DELETE /api/v1/admin/needs/{needId}/shortlist/executives/{itemId}` — remove

- [ ] **BACKEND: Testes** (AC: 1–10)
  - [ ] `ShortlistControllerTest`: adicionar executivo → conflito detectado → conflict_status PENDING_REVIEW; remover executivo; max 4 slots

- [ ] **FRONTEND: Split-view na página de detalhe de necessidade** (AC: 1–10)
  - [ ] Criar `src/app/admin/needs/need-detail/need-detail.ts` com duas abas: "Detalhes" e "Construir shortlist"
  - [ ] Adicionar rota `/admin/needs/:id` em `admin.routes.ts`
  - [ ] Split-view: painel esquerdo = pool filtrada (reusar `AdminPool` ou chamar `/admin/pool` com filtros), painel direito = shortlist slots
  - [ ] Botão "Adicionar" em cada card da pool → POST → atualiza painel direito com badge de conflito
  - [ ] Botão "×" em cada executivo da shortlist → DELETE → atualiza slots
  - [ ] Botão "Enviar shortlist" desabilitado se há `PENDING_REVIEW`

## Dev Notes

### Dependência crítica
Requer `ConflictDetectionService` da Story 4.1 completamente funcional.

### Migration V9
V8 = `executive_clients`. V9 = `shortlists` + `shortlist_executives`. V10+ RESERVADOS.

### Pacote backend
```
com.fracexec.api.match/
  Shortlist.java
  ShortlistExecutive.java
  ShortlistStatus.java (enum)
  ConflictStatus.java  (enum)
  ShortlistRepository.java
  ShortlistExecutiveRepository.java
  service/
    ShortlistService.java
    ShortlistServiceImpl.java
  dto/
    ShortlistResponse.java
    ShortlistExecutiveItem.java
    AddExecutiveRequest.java
```
Controller em `com.fracexec.api.admin/`

### Pool filtrada no split-view
Chamar `GET /api/v1/admin/pool` (já implementado Story 2.6) com filtros de specialty e minAvailability. Reusar o serviço existente — não reimplementar.

### Estado preservado ao navegar para conflicts
O estado do split-view (executivos na shortlist, filtros ativos) deve ser mantido em signal local e não recalculado ao voltar de `/admin/conflicts/:id`. Usar `signal<ShortlistState>()` persistido no componente pai.

## Dev Agent Record
### Debug Log
_vazio_
### Completion Notes
_vazio_

## File List
_a preencher_

## Change Log
_a preencher_
