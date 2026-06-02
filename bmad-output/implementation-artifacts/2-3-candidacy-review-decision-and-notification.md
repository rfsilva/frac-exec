---
baseline_commit: NO_VCS
---

# Story 2.3: Candidacy Review, Decision & Notification

Status: done

## Story

Como operador admin,
quero revisar o detalhe completo de uma candidatura, adicionar notas e decidir aprovação ou rejeição,
para que o executivo seja notificado com o resultado e o processo seja documentado.

## Acceptance Criteria

1. **Dado** `/admin/candidates/:id`, **então** exibe todos os dados: histórico C-Level, referências, motivação, status atual, notas internas (campo editável), seção de upload de documentos de suporte

2. **Dado** botão "Aprovar" clicado, **então** abre modal: "O executivo receberá e-mail com link para criar seu perfil." + botão Confirmar + Cancelar

3. **Dado** aprovação confirmada, **então** status → APPROVED, e-mail `application-approved` enviado ao candidato (com link para completar perfil), e conta de usuário com role EXECUTIVE criada no sistema vinculada à candidatura

4. **Dado** botão "Rejeitar" clicado, **então** abre modal com campo de motivo interno (não enviado ao candidato) + botão Danger "Confirmar rejeição"

5. **Dado** rejeição confirmada, **então** status → REJECTED, e-mail `application-rejected` enviado (motivo genérico, sem revelar o motivo interno), data de nova candidatura calculada para `createdAt + 6 meses`

6. **Dado** candidato com rejeição dentro do período de 6 meses tentar `POST /api/v1/applications`, **então** backend retorna 422: "Nova candidatura disponível a partir de [data ISO formatada]"

7. **Dado** documentos de suporte (upload pelo admin), **então** armazenados no MinIO bucket `fracexec-docs` e acessados apenas via URL pré-assinada com expiração (NFR-1 — acesso restrito a ADMIN)

8. **Dado** notas internas salvas pelo admin, **então** persistidas na tabela `executive_applications.admin_notes` — não visíveis ao candidato em nenhuma circunstância

## Tasks / Subtasks

- [x] **BACKEND: Flyway — adicionar colunas à tabela existente** (AC: 3, 5, 7, 8)
  - [x] Criar `V4__application_review_fields.sql` — adicionar em `executive_applications`: `admin_notes TEXT`, `support_document_key VARCHAR(500)` (chave MinIO), `user_id UUID REFERENCES users(id)` (FK para usuário EXECUTIVE criado na aprovação)
  - [x] Nenhuma tabela nova — apenas ALTER TABLE na existente

- [x] **BACKEND: Expandir ALLOWED_TRANSITIONS** (AC: 3, 5)
  - [x] Em `AdminApplicationServiceImpl.java`, adicionar: `put(ApplicationStatus.UNDER_REVIEW, Set.of(ApplicationStatus.APPROVED, ApplicationStatus.REJECTED))`

- [x] **BACKEND: Endpoint de notas internas** (AC: 1, 8)
  - [x] Criar `PATCH /api/v1/admin/applications/{id}/notes` com body `{ "adminNotes": "..." }` — role ADMIN
  - [x] Criar `UpdateNotesRequest.java` em `executive/dto/`
  - [x] Persistir em `executive_applications.admin_notes`
  - [x] Nunca retornar `adminNotes` em respostas públicas (`ApplicationSummaryResponse`, `ApplicationDetailResponse`) — criar `AdminApplicationDetailResponse.java` em `admin/dto/` que inclui `adminNotes` e `supportDocumentUrl`

- [x] **BACKEND: Endpoint de upload de documento** (AC: 7)
  - [x] Criar `POST /api/v1/admin/applications/{id}/documents` — `multipart/form-data`, role ADMIN
  - [x] Upload para MinIO bucket `fracexec-docs` com key `applications/{id}/{filename}`
  - [x] Armazenar a chave em `executive_applications.support_document_key`
  - [x] Criar `GET /api/v1/admin/applications/{id}/documents/url` — retorna URL pré-assinada com 1h de expiração via `MinioStorageService`

- [x] **BACKEND: Lógica de aprovação** (AC: 3, 6)
  - [x] Em `AdminApplicationServiceImpl.approve(id)`:
    - Verificar status UNDER_REVIEW
    - Criar `User` com role EXECUTIVE (email da candidatura, senha temporária gerada — `UUID.randomUUID()` + bcrypt)
    - Atualizar `executive_applications.user_id = user.id`
    - Status → APPROVED
    - Disparar e-mail `application-approved` com link `${fracexec.app.base-url}/executive/profile`
  - [x] Criar `ApproveRequest.java` — sem campos obrigatórios (apenas trigger)
  - [x] Endpoint: `POST /api/v1/admin/applications/{id}/approve` — role ADMIN

- [x] **BACKEND: Lógica de rejeição** (AC: 5, 6)
  - [x] Em `AdminApplicationServiceImpl.reject(id, reason)`:
    - Verificar status UNDER_REVIEW
    - Salvar `admin_notes` com motivo interno
    - Status → REJECTED
    - `can_reapply_after = createdAt + 6 meses`
    - Disparar e-mail `application-rejected` (motivo genérico — sem revelar razão)
  - [x] Criar `RejectRequest.java` em `executive/dto/` com `@NotBlank String rejectionReason`
  - [x] Endpoint: `POST /api/v1/admin/applications/{id}/reject` — role ADMIN

- [x] **BACKEND: Templates de e-mail** (AC: 3, 5)
  - [x] Atualizar `application-approved.html` — substituir placeholder por conteúdo real: nome do executivo, mensagem de parabéns, link para completar perfil
  - [x] Atualizar `application-rejected.html` — motivo genérico sem detalhes, data de nova candidatura se aplicável
  - [x] Expandir `EmailService` com: `sendApplicationApproved(email, name, profileLink)` e `sendApplicationRejected(email, name, reapplyDate)`

- [x] **BACKEND: Testes** (AC: 3, 5, 6)
  - [x] Criar testes em `AdminApplicationControllerTest`: aprovar UNDER_REVIEW → 200 + user criado, rejeitar UNDER_REVIEW → 200 + can_reapply_after definido, tentar recandidar dentro do período → 422

- [x] **FRONTEND: Página `/admin/candidates/:id`** (AC: 1, 2, 3, 4, 5, 7, 8)
  - [x] Criar `src/app/admin/candidates/candidate-detail/candidate-detail.ts`
  - [x] Adicionar rota `{ path: ':id', loadComponent: ... }` em `admin.routes.ts`
  - [x] Exibir detalhe completo via `GET /api/v1/admin/applications/{id}` (endpoint admin que inclui `adminNotes`)
  - [x] Campo de texto "Notas internas" com `PATCH` ao sair do foco (auto-save)
  - [x] Botões "Aprovar" e "Rejeitar" (apenas se status UNDER_REVIEW)
  - [x] Modal de confirmação de aprovação com botão Confirmar
  - [x] Modal de rejeição com campo de motivo interno obrigatório + botão Danger
  - [x] Seção de upload de documento (input file → POST multipart)
  - [x] Link para download via URL pré-assinada
  - [x] Navegar de volta para a lista após decisão

- [x] **VALIDAÇÃO FINAL**
  - [x] `./mvnw test` — todos os testes passam
  - [x] `ng build` — sem erros

## Dev Notes

### ⚠️ AVISOS CRÍTICOS

**1. Senha temporária do EXECUTIVE criado na aprovação**
Ao aprovar, cria-se um `User` com role EXECUTIVE. A senha deve ser gerada como `UUID.randomUUID().toString()` + bcrypt. O executivo precisará usar "esqueci minha senha" para definir uma senha real. O link no e-mail de aprovação vai para `/executive/profile` (após login). NÃO enviar a senha temporária por e-mail — apenas o link de acesso.

**2. V4 é apenas ALTER TABLE — não criar nova migration do zero**
V3 criou `executive_applications`. V4 adiciona colunas via `ALTER TABLE executive_applications ADD COLUMN`. Nenhuma tabela nova.

**3. `AdminApplicationDetailResponse` — separar de `ApplicationDetailResponse`**
`ApplicationDetailResponse` (usado na Story 2.2) NÃO deve incluir `adminNotes`. Criar `AdminApplicationDetailResponse` em `admin/dto/` que estende os campos com `adminNotes` e `supportDocumentUrl`. O endpoint `GET /api/v1/admin/applications/{id}` JÁ EXISTE (Story 2.2) — atualizar para retornar `AdminApplicationDetailResponse` em vez de `ApplicationDetailResponse`.

**4. ALLOWED_TRANSITIONS — já preparado para extensão**
`AdminApplicationServiceImpl.ALLOWED_TRANSITIONS` foi projetado na Story 2.2 para ser extensível. Esta story apenas adiciona a linha: `put(ApplicationStatus.UNDER_REVIEW, Set.of(ApplicationStatus.APPROVED, ApplicationStatus.REJECTED))`.

**5. MinIO: upload multipart**
```java
// Usar S3Client do MinioConfig para upload:
PutObjectRequest putRequest = PutObjectRequest.builder()
    .bucket(docsBucket)
    .key("applications/" + applicationId + "/" + filename)
    .contentType(contentType)
    .build();
s3Client.putObject(putRequest, RequestBody.fromInputStream(inputStream, contentLength));
```

**6. URL pré-assinada para download**
```java
// Usar MinioStorageService.generatePresignedDownloadUrl():
String url = minioStorageService.generatePresignedDownloadUrl(
    docsBucket, "applications/" + id + "/" + filename, Duration.ofHours(1));
```

---

### SQL V4 — ALTER TABLE

```sql
-- V4: Add review fields to executive_applications
-- Story 2.3 — Candidacy Review, Decision & Notification

ALTER TABLE executive_applications
    ADD COLUMN admin_notes          TEXT,
    ADD COLUMN support_document_key VARCHAR(500),
    ADD COLUMN user_id              UUID REFERENCES users(id);
```

---

### DTOs novos

```java
// admin/dto/AdminApplicationDetailResponse.java
public record AdminApplicationDetailResponse(
    UUID id, String fullName, String email, String linkedinUrl, String motivation,
    ApplicationStatus status, Instant createdAt,
    String adminNotes, String supportDocumentUrl,  // campos ADMIN-only
    List<ApplicationDetailResponse.PositionDetail> positions,
    List<ApplicationDetailResponse.ReferenceDetail> references
) {}

// executive/dto/RejectRequest.java
public record RejectRequest(@NotBlank String rejectionReason) {}

// executive/dto/UpdateNotesRequest.java
public record UpdateNotesRequest(String adminNotes) {}
```

---

### Padrões das Stories Anteriores

- `ALLOWED_TRANSITIONS` em `AdminApplicationServiceImpl` — apenas adicionar linha
- `takeUntilDestroyed(this.destroyRef)` — padrão de unsubscribe Angular
- `@if / @for` — template control flow nativo Angular 17+
- Testes com `@WithMockUser(roles = "ADMIN")` — padrão da Story 2.2
- `EmailService.loadTemplate()` + `String.replace()` para variáveis nos templates HTML
- `MinioStorageService.generatePresignedDownloadUrl()` já existe
- `S3Client` já é bean Spring configurado em `MinioConfig`

### References

- [Epics — Story 2.3 ACs](bmad-output/planning-artifacts/epics.md#story-23-candidacy-review-decision--notification)
- [Story 2.2 — padrão ALLOWED_TRANSITIONS e AdminApplicationServiceImpl](bmad-output/implementation-artifacts/2-2-admin-candidacy-queue-with-inline-expansion.md)
- [Story 2.1 — EmailService.loadTemplate()](bmad-output/implementation-artifacts/2-1-public-application-form-stepper.md)
- [PACKAGE_CONVENTIONS.md](fracexec/fracexec-api/PACKAGE_CONVENTIONS.md)

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- `app.getCreatedAt()` é `null` no H2 com `ddl-auto:create-drop` — fallback para `Instant.now()` no cálculo do cooldown.
- Template rejected usa `{{reapplyMessage}}` com conteúdo pré-formatado para evitar lógica condicional incompatível com `String.replace()`.

### Completion Notes List
- V4: ALTER TABLE apenas (3 colunas em `executive_applications`)
- `ALLOWED_TRANSITIONS` expandido: `UNDER_REVIEW → {APPROVED, REJECTED}`
- Aprovação cria User EXECUTIVE + senha temporária bcrypt — e-mail com link `/executive/profile`
- Rejeição define `can_reapply_after = base + 180 dias` — bloqueio em `ExecutiveApplicationServiceImpl`
- 29/29 testes passando; `ng build` limpo

### File List
**fracexec-api/**
- `db/migration/V4__application_review_fields.sql` (criado)
- `executive/model/ExecutiveApplication.java` (modificado)
- `executive/dto/RejectRequest.java` (criado)
- `executive/dto/UpdateNotesRequest.java` (criado)
- `admin/dto/AdminApplicationDetailResponse.java` (criado)
- `admin/dto/DocumentUrlResponse.java` (criado)
- `admin/service/AdminApplicationService.java` (modificado)
- `admin/service/AdminApplicationServiceImpl.java` (reescrito)
- `admin/AdminApplicationController.java` (modificado)
- `notification/service/EmailService.java` (modificado)
- `notification/service/EmailServiceImpl.java` (modificado)
- `templates/email/application-approved.html` (atualizado)
- `templates/email/application-rejected.html` (atualizado)
- `test/.../admin/AdminApplicationControllerTest.java` (modificado — 5 novos testes)

**fracexec-web/**
- `src/app/admin/candidates/candidate-detail/candidate-detail.ts` (criado)
- `src/app/admin/admin.routes.ts` (modificado)

## Senior Developer Review (AI)

**Data:** 2026-06-01
**Outcome:** Changes Requested
**Layers:** Blind Hunter · Acceptance Auditor (merged)
**Dismissados:** 6

### Action Items

#### Blockers (High)

- [x] [Review][Patch] Aprovação sem guard de email duplicado — segunda chamada retorna 500 (DataIntegrityViolationException); adicionar guard `userRepository.findByEmail()` antes de criar o User [AdminApplicationServiceImpl.java]
- [x] [Review][Patch] Cooldown check sem ORDER BY — `findFirstByEmailAndStatusIn` não garante o REJECTED mais recente; usar query explícita com `ORDER BY created_at DESC` [ExecutiveApplicationRepository.java]

#### Patches de Qualidade / AC (Med)

- [x] [Review][Patch] `sanitizeFilename` não previne path-traversal — usar UUID-based key: `applications/{id}/{UUID}.{ext}` [AdminApplicationServiceImpl.java]
- [x] [Review][Patch] AC-6 vs e-mail: data formatada diferente (ISO UTC vs dd/MM/yyyy) — padronizar [AdminApplicationServiceImpl.java]
- [x] [Review][Patch] `updateNotes` faz S3 presign desnecessário — front-end descarta a resposta; retornar 204 [AdminApplicationController.java / AdminApplicationServiceImpl.java]
- [x] [Review][Patch] `AdminApplicationDetailResponse` omite `rejectionReason` e `canReapplyAfter` [AdminApplicationDetailResponse.java]

#### Deferred

- [x] [Review][Defer] Documento único por candidatura — limitação MVP; PO ciente
- [x] [Review][Defer] Validação content-type/tamanho upload — acesso restrito a ADMIN; risco aceitável
- [x] [Review][Defer] Orphaned S3 object — consistência eventual aceitável no MVP
- [x] [Review][Defer] APPROVED reapplication não bloqueada — gap fora dos ACs
- [x] [Review][Defer] `@WithMockUser` em helper sem efeito — código morto sem impacto
- [x] [Review][Defer] Duplo-click "Aprovar" — UNDER_REVIEW guard no service é defesa suficiente

### Review Follow-ups (AI)

_(será preenchido pelo dev ao retomar a implementação)_
