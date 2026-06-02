---
baseline_commit: NO_VCS
---

# Story 2.1: Public Application Form (Stepper)

Status: done

## Story

Como executivo C-Level,
quero preencher um formulário público de candidatura em 3 etapas,
para que eu possa me candidatar ao FracExec e receber confirmação imediata.

## Acceptance Criteria

1. **Dado** `/apply` acessada sem autenticação, **então** a página é pública e renderiza o stepper com 3 etapas visíveis no topo

2. **Dado** Etapa 1, **então** contém: nome completo, e-mail, LinkedIn — com validação de URL do LinkedIn ao avançar

3. **Dado** Etapa 2, **então** contém blocos repetíveis de histórico C-Level: empresa (opcional — campo anota que será anonimizado), período (início/fim), tamanho de equipe, receita sob gestão; botão "Adicionar cargo" insere novo bloco; mínimo 1 bloco obrigatório

4. **Dado** Etapa 3, **então** contém: mínimo 2 referências (nome, cargo, contato) + texto livre de motivação + checkbox LGPD sem pré-preenchimento com link para política de privacidade (NFR-1)

5. **Dado** botão "Próxima etapa" clicado, **então** valida apenas os campos da etapa atual — não avança com campos obrigatórios vazios

6. **Dado** formulário submetido com todos os campos válidos e LGPD marcado, **então** cria candidatura com status PENDING (Flyway V3 — tabela `executive_applications`), exibe tela de confirmação: "Candidatura recebida. Retorno em até 10 dias úteis."

7. **Dado** candidatura criada, **então** e-mail de confirmação é enviado ao candidato (FR-1.3) usando template `application-received`

8. **Dado** formulário submetido, **então** nenhum PII é logado no backend

9. **Dado** POST `/api/v1/applications` com e-mail já existente em candidatura PENDING ou UNDER_REVIEW, **então** backend retorna 409: "Você já possui uma candidatura em análise."

10. **Dado** campo "receita sob gestão", **então** é opcional — não bloqueia submissão; placeholder: "Ex: R$50M (deixe em branco se não aplicável)"

11. **Dado** os e-mails do sistema, **então** existem 8 templates HTML: `application-received`, `application-approved`, `application-rejected`, `need-received`, `shortlist-sent`, `opportunity-available`, `contract-ready`, `payment-processed` — seguindo estrutura e tom definidos no EXPERIENCE.md

## Tasks / Subtasks

- [x] **BACKEND: Flyway V3 — tabela `executive_applications`** (AC: 6)
  - [x] Criar `V3__executive_applications.sql`
  - [x] Tabelas `executive_applications`, `application_positions`, `application_references` criadas
  - [x] Índices `idx_executive_applications_email` e `idx_executive_applications_status`

- [x] **BACKEND: Model, Repository, DTO** (AC: 6, 9)
  - [x] `ExecutiveApplication.java`, `ApplicationPosition.java`, `ApplicationReference.java`, `ApplicationStatus.java` em `executive/model/`
  - [x] `ApplicationRequest.java`, `ApplicationPositionDto.java`, `ApplicationReferenceDto.java`, `ApplicationResponse.java` em `executive/dto/`
  - [x] `ExecutiveApplicationRepository.java` em `executive/repository/`

- [x] **BACKEND: Service + Controller** (AC: 6, 7, 8, 9)
  - [x] `ExecutiveApplicationService.java` + `ExecutiveApplicationServiceImpl.java` em `executive/service/`
  - [x] `ExecutiveApplicationController.java` — `POST /api/v1/applications` público
  - [x] Duplicata PENDING/UNDER_REVIEW → `DuplicateResourceException` → 409
  - [x] Logs sem PII; e-mail capturado em try/catch sem propagação

- [x] **BACKEND: Templates de e-mail HTML** (AC: 7, 11)
  - [x] `application-received.html` com estrutura completa
  - [x] 7 templates placeholder criados
  - [x] `EmailService.java` + `EmailServiceImpl.java` em `notification/service/`

- [x] **BACKEND: Testes** (AC: 6, 9)
  - [x] `ExecutiveApplicationControllerTest.java` — 5 testes: 201 válido, 409 duplicado, 400 sem LGPD, 400 sem posições, 400 LinkedIn inválido

- [x] **FRONTEND: Rota pública `/apply`** (AC: 1)
  - [x] Rota `apply` adicionada ao `app.routes.ts`
  - [x] `src/app/shared/pages/apply/apply.ts` criado

- [x] **FRONTEND: ApplicationFormComponent (stepper 3 etapas)** (AC: 1, 2, 3, 4, 5)
  - [x] Stepper com indicadores de etapa (ativo/completo)
  - [x] Etapa 1: fullName, email, linkedinUrl com validações
  - [x] Etapa 2: FormArray de positions com add/remove
  - [x] Etapa 3: FormArray de references (mínimo 2), motivation, lgpdConsent
  - [x] AC-5: validação por etapa no `nextStep()`
  - [x] AC-10: placeholder "deixe em branco se não aplicável"

- [x] **FRONTEND: Tela de confirmação e erros** (AC: 6, 9)
  - [x] Estado de confirmação inline com StatusBadge status-pending
  - [x] Erro 409 exibe mensagem inline; outros erros exibem mensagem genérica

- [x] **VALIDAÇÃO FINAL**
  - [x] `./mvnw test` — 17/17 testes passando (11 auth + 5 application + 1 context)
  - [x] `ng build` — build Angular limpo
  - [x] Rota `/apply` pública confirmada no `app.routes.ts`

## Dev Notes

### ⚠️ AVISOS CRÍTICOS

**1. Flyway V3 — esta é a migration do Epic 2**
V1 = baseline (pgcrypto), V2 = users + auth, V3 = executive_applications. Nunca pular versão, nunca criar V4 nesta story.

**2. Pacotes seguem PACKAGE_CONVENTIONS.md**
O domínio `executive` segue a estrutura:
```
executive/
  ExecutiveApplicationController.java   ← raiz
  model/
    ExecutiveApplication.java
    ApplicationPosition.java
    ApplicationReference.java
    ApplicationStatus.java              ← enum
  dto/
    ApplicationRequest.java
    ApplicationPositionDto.java
    ApplicationReferenceDto.java
    ApplicationResponse.java
  service/
    ExecutiveApplicationService.java
    ExecutiveApplicationServiceImpl.java
  repository/
    ExecutiveApplicationRepository.java
```

**3. `POST /api/v1/applications` deve estar em `permitAll()`**
O endpoint é público — candidatos não têm conta no sistema. Verificar `SecurityConfig.java` e adicionar se não estiver lá.

**4. `notification/` já existe no package-scan — EmailService vai lá**
Criar `EmailServiceImpl` em `notification/service/` — o pacote `notification` já está no component scan da aplicação.

**5. MimeMessage para HTML — não SimpleMailMessage**
`SimpleMailMessage` só envia texto plano. Para HTML usar:
```java
MimeMessage message = mailSender.createMimeMessage();
MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
helper.setTo(toEmail);
helper.setSubject(subject);
helper.setText(htmlBody, true); // true = isHtml
mailSender.send(message);
```

**6. FormArray no Angular — padrão a seguir**
```typescript
// Para positions (FormArray de FormGroups)
positions = this.fb.array<FormGroup>([this.createPositionGroup()]);

createPositionGroup(): FormGroup {
  return this.fb.group({
    roleTitle:      ['', Validators.required],
    companyName:    [''],
    periodStart:    ['', Validators.required],
    periodEnd:      [''],
    teamSize:       [''],
    revenueManaged: [''],
  });
}

addPosition() { this.positions.push(this.createPositionGroup()); }
```

**7. Validação de URL do LinkedIn**
Pattern: `^https://(www\.)?linkedin\.com/in/.+` — validar via `Validators.pattern()`.

**8. Checkbox LGPD — sem pré-preenchimento**
```typescript
lgpdConsent: [false, Validators.requiredTrue]
// Validators.requiredTrue → inválido se false
```

---

### Schema V3 — SQL completo

```sql
-- V3: Executive application tables
-- Story 2.1 — Public Application Form

CREATE TABLE executive_applications (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name         VARCHAR(255)  NOT NULL,
    email             VARCHAR(255)  NOT NULL,
    linkedin_url      VARCHAR(500),
    motivation        TEXT,
    lgpd_consent      BOOLEAN       NOT NULL DEFAULT false,
    lgpd_consent_at   TIMESTAMPTZ,
    status            VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                          CHECK (status IN ('PENDING','UNDER_REVIEW','APPROVED','REJECTED')),
    rejection_reason  TEXT,
    can_reapply_after TIMESTAMPTZ,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE application_positions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID         NOT NULL REFERENCES executive_applications(id) ON DELETE CASCADE,
    role_title      VARCHAR(100) NOT NULL,
    company_name    VARCHAR(255),
    period_start    DATE         NOT NULL,
    period_end      DATE,
    team_size       VARCHAR(50),
    revenue_managed VARCHAR(100),
    position_order  INT          NOT NULL DEFAULT 0
);

CREATE TABLE application_references (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID         NOT NULL REFERENCES executive_applications(id) ON DELETE CASCADE,
    ref_name        VARCHAR(255) NOT NULL,
    ref_role        VARCHAR(100) NOT NULL,
    ref_contact     VARCHAR(255) NOT NULL
);

CREATE INDEX idx_executive_applications_email  ON executive_applications(email);
CREATE INDEX idx_executive_applications_status ON executive_applications(status);
```

---

### ApplicationRequest — validação completa

```java
public record ApplicationRequest(
    @NotBlank String fullName,
    @NotBlank @Email String email,
    @NotBlank @Pattern(regexp = "^https://(www\\.)?linkedin\\.com/in/.+",
                       message = "URL do LinkedIn inválida") String linkedinUrl,
    @NotEmpty @Size(min = 1) List<@Valid ApplicationPositionDto> positions,
    @NotEmpty @Size(min = 2, message = "Mínimo de 2 referências obrigatório")
              List<@Valid ApplicationReferenceDto> references,
    @NotBlank String motivation,
    @AssertTrue(message = "O consentimento LGPD é obrigatório") boolean lgpdConsent
) {}
```

---

### Template HTML de e-mail — estrutura padrão

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>FracExec</title></head>
<body style="margin:0;padding:0;background:#F2F7F4;font-family:'Inter',sans-serif;">
  <table width="600" align="center" style="background:#FFFFFF;border-radius:10px;overflow:hidden;">
    <tr>
      <td style="background:linear-gradient(135deg,#132A1E,#1F4A32);padding:32px 40px;">
        <p style="color:#4DC78A;font-size:24px;font-weight:700;margin:0;">✦ FracExec</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 40px;color:#0D1F15;font-size:14px;line-height:1.6;">
        <!-- CONTEÚDO AQUI -->
        <a href="#" style="display:inline-block;background:#132A1E;color:#4DC78A;
           padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;">
          <!-- CTA AQUI -->
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 40px;background:#EDF4F0;color:#8BA898;font-size:12px;">
        FracExec · <a href="#" style="color:#4DC78A;">Política de privacidade</a>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

### Padrões das Stories Anteriores (preservar)

- `SecurityConfig` — `POST /api/v1/applications` deve ser adicionado ao `permitAll()`; já tem `/api/v1/companies/register`
- Pacotes: `executive/model/`, `executive/dto/`, `executive/service/`, `executive/repository/` — conforme `PACKAGE_CONVENTIONS.md`
- Exceções: `DuplicateResourceException` → 409 via `GlobalExceptionHandler` (já implementado)
- Testes: `@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")` — padrão da Story 1.2
- `log.info("...", id)` — nunca logar PII (email, nome, telefone)
- H2 com `ddl-auto: create-drop` e `flyway.enabled: false` no profile test — as entidades JPA criam as tabelas

### References

- [Epics — Story 2.1 ACs](bmad-output/planning-artifacts/epics.md#story-21-public-application-form-stepper)
- [EXPERIENCE.md — Formulário de Candidatura + Voice and Tone](bmad-output/planning-artifacts/ux-designs/ux-FracExec-2026-05-29/EXPERIENCE.md#formulário-de-candidatura-público)
- [PACKAGE_CONVENTIONS.md](fracexec/fracexec-api/PACKAGE_CONVENTIONS.md)
- [Story 1.2 — padrão de testes e exceções](bmad-output/implementation-artifacts/1-2-user-authentication-and-role-system.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (anthropic.claude-4-6-sonnet)

### Debug Log References

- `EmailServiceImpl` capturava apenas `MessagingException` — `MailSendException` (RuntimeException) era propagada. Corrigido para `catch (Exception e)` com log apenas do tipo.
- `application-test.yml` precisava de `spring.mail.properties.mail.smtp.auth: false` para evitar autenticação SMTP nos testes.
- `DuplicateResourceException` (já existente em `shared/exception`) corretamente mapeada para 409 via `GlobalExceptionHandler`.

### Completion Notes List

- Flyway V3 cria 3 tabelas: `executive_applications`, `application_positions`, `application_references`
- Domínio `executive/` segue `PACKAGE_CONVENTIONS.md` com sub-pacotes `model/`, `dto/`, `service/`, `repository/`
- `POST /api/v1/applications` público; duplicata PENDING/UNDER_REVIEW → 409; cooldown de 6 meses para rejeitados
- `EmailService` em `notification/service/` — falhas de SMTP capturadas silenciosamente para não bloquear candidatura
- 8 templates HTML criados (1 completo + 7 placeholder)
- Angular: stepper 3 etapas com FormArray para posições e referências, validação por etapa, tela de confirmação inline

### File List

**fracexec-api/**
- `src/main/resources/db/migration/V3__executive_applications.sql` (criado)
- `src/main/java/com/fracexec/api/executive/model/ApplicationStatus.java` (criado)
- `src/main/java/com/fracexec/api/executive/model/ExecutiveApplication.java` (criado)
- `src/main/java/com/fracexec/api/executive/model/ApplicationPosition.java` (criado)
- `src/main/java/com/fracexec/api/executive/model/ApplicationReference.java` (criado)
- `src/main/java/com/fracexec/api/executive/dto/ApplicationRequest.java` (criado)
- `src/main/java/com/fracexec/api/executive/dto/ApplicationPositionDto.java` (criado)
- `src/main/java/com/fracexec/api/executive/dto/ApplicationReferenceDto.java` (criado)
- `src/main/java/com/fracexec/api/executive/dto/ApplicationResponse.java` (criado)
- `src/main/java/com/fracexec/api/executive/repository/ExecutiveApplicationRepository.java` (criado)
- `src/main/java/com/fracexec/api/executive/service/ExecutiveApplicationService.java` (criado)
- `src/main/java/com/fracexec/api/executive/service/ExecutiveApplicationServiceImpl.java` (criado)
- `src/main/java/com/fracexec/api/executive/ExecutiveApplicationController.java` (criado)
- `src/main/java/com/fracexec/api/notification/service/EmailService.java` (criado)
- `src/main/java/com/fracexec/api/notification/service/EmailServiceImpl.java` (criado)
- `src/main/resources/templates/email/application-received.html` (criado)
- `src/main/resources/templates/email/application-approved.html` (criado — placeholder)
- `src/main/resources/templates/email/application-rejected.html` (criado — placeholder)
- `src/main/resources/templates/email/need-received.html` (criado — placeholder)
- `src/main/resources/templates/email/shortlist-sent.html` (criado — placeholder)
- `src/main/resources/templates/email/opportunity-available.html` (criado — placeholder)
- `src/main/resources/templates/email/contract-ready.html` (criado — placeholder)
- `src/main/resources/templates/email/payment-processed.html` (criado — placeholder)
- `src/test/java/com/fracexec/api/executive/ExecutiveApplicationControllerTest.java` (criado)
- `src/test/resources/application-test.yml` (modificado — smtp auth false)

**fracexec-web/**
- `src/app/shared/pages/apply/apply.ts` (criado)
- `src/app/app.routes.ts` (modificado — rota /apply adicionada)

## Senior Developer Review (AI)

**Data:** 2026-06-01
**Outcome:** Changes Requested
**Layers:** Blind Hunter · Acceptance Auditor
**Dismissados:** 4 (baixo impacto / por design)

### Action Items

#### Blockers (violações de AC)

- [x] [Review][Patch] AC-7: `application-received.html` nunca carregado — corpo do e-mail está hardcoded em Java; o template HTML no classpath é código morto [EmailServiceImpl.java]
- [x] [Review][Patch] AC-4: link da política de privacidade é `href="#"` — substituir por URL real ou variável de configuração [apply.ts:199]

#### Patches de Segurança / Qualidade

- [x] [Review][Patch] TOCTOU race condition no duplicate check — duas queries separadas antes do save sem constraint de unicidade; adicionar `UNIQUE INDEX` em `executive_applications(email)` limitado a status PENDING/UNDER_REVIEW não é possível com índice parcial simples — alternativa: adicionar `@Column(unique = true)` ou tratar `DataIntegrityViolationException` [ExecutiveApplicationServiceImpl.java / V3__executive_applications.sql]
- [x] [Review][Patch] `findByEmailAndStatusIn` retorna `Optional` — se existir mais de 1 registro REJECTED, levanta `IncorrectResultSizeDataAccessException`; mudar para `findFirstByEmailAndStatusIn` [ExecutiveApplicationRepository.java]
- [x] [Review][Patch] `SecurityConfig` permite todos os métodos HTTP em `/api/v1/applications` — restringir para apenas `POST` com `.requestMatchers(HttpMethod.POST, "/api/v1/applications")` [SecurityConfig.java]
- [x] [Review][Patch] Angular: sem unsubscribe no POST — armazenar subscription ou usar `takeUntilDestroyed()` para evitar state mutation em componente destruído [apply.ts]
- [x] [Review][Patch] `@NotEmpty @Size(min=1)` redundante em `positions` — remover `@NotEmpty` ou `@Size(min=1)`, manter apenas um [ApplicationRequest.java:20-21]
- [x] [Review][Patch] `AtomicInteger` desnecessário para loop single-thread — substituir por `int` simples [ExecutiveApplicationServiceImpl.java:68]

#### Deferred

- [x] [Review][Defer] Confirmação em 2 elementos HTML vs. string única — visualmente equivalente; AC-6 satisfeito semanticamente — deferred
- [x] [Review][Defer] LinkedIn regex aceita slugs muito curtos — edge case improvável; validação server-side é a barreira real — deferred
- [x] [Review][Defer] LGPD false sem assert no service — Bean Validation protege a camada HTTP; service sem defensiva interna é aceitável no MVP — deferred
- [x] [Review][Defer] Double-click concurrent POST no frontend — edge case de UX; não afeta dados (duplicate check no backend) — deferred

### Review Follow-ups (AI)

_(será preenchido pelo dev ao retomar a implementação)_
