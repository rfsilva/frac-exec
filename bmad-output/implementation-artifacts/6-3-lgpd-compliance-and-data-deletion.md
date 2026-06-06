---
baseline_commit: b90c9133f3fc0c40c398a102c5ec891b6215982b
---

# Story 6.3: LGPD Compliance & Data Deletion

Status: done

## Story

Como usuário da plataforma (executivo, PME ou admin),
quero poder solicitar a exclusão dos meus dados pessoais,
para que a plataforma cumpra com o direito de exclusão garantido pela LGPD em até 30 dias.

## Acceptance Criteria

1. **Dado** `/executive/profile` ou `/company/payments` (seção perfil), **então** botão "Solicitar exclusão de conta" (estilo Danger)

2. **Dado** botão clicado, **então** modal: "Seus dados pessoais serão removidos em até 30 dias. Contratos assinados são preservados por obrigação legal." + confirmação

3. **Dado** confirmação, **então** `POST /api/v1/account/deletion-request` cria solicitação; e-mail confirmando à PME/executivo

4. **Dado** solicitação processada por job agendado, **então** anonimiza: nome → "Usuário Removido", e-mail → SHA-256 hash, foto → removida do MinIO; contratos e pagamentos preservados

5. **Dado** engajamento ACTIVE ou pagamento PAID no momento da solicitação, **então** status = `PENDING_ENGAGEMENTS`; processa automaticamente ao concluir

6. **Dado** painel admin, **então** fila de solicitações com ID anônimo, data, prazo, status

## Tasks / Subtasks

- [ ] **BACKEND: Flyway V16 — tabela `deletion_requests`**
  - [ ] `id UUID PK`, `user_id UUID FK users(id)`, `status VARCHAR(30) DEFAULT 'PENDING'`, `requested_at TIMESTAMPTZ DEFAULT now()`, `process_after TIMESTAMPTZ`, `processed_at TIMESTAMPTZ`
  - [ ] `DeletionStatus`: `PENDING`, `PENDING_ENGAGEMENTS`, `PROCESSED`

- [ ] **BACKEND: `POST /api/v1/account/deletion-request`** — autenticado, qualquer role
  - [ ] Verifica engajamentos ACTIVE ou pagamentos PAID → status `PENDING_ENGAGEMENTS` ou `PENDING`
  - [ ] `process_after = now() + 30 days`
  - [ ] E-mail de confirmação ao usuário

- [ ] **BACKEND: `DeletionProcessorJob`** — `@Scheduled(fixedDelay = 86_400_000)` (1x/dia)
  - [ ] Processar solicitações `PENDING` com `process_after < now()`
  - [ ] Verificar se não há mais bloqueios (`PENDING_ENGAGEMENTS` → checar engajamentos)
  - [ ] Anonimizar: `user.email = SHA-256(email)`, `user.passwordHash = "DELETED"`, remover photo do MinIO
  - [ ] Preservar contratos e pagamentos (não deletar — apenas anonimizar dados pessoais)

- [ ] **BACKEND: `GET /api/v1/admin/deletion-requests`** — role ADMIN
  - [ ] Lista com ID anônimo (hash do userId), data, prazo, status

- [ ] **BACKEND: Testes**
  - [ ] `DeletionRequestControllerTest`: criar solicitação → 201; com engajamento ACTIVE → PENDING_ENGAGEMENTS

- [ ] **FRONTEND: Botão de exclusão no perfil executivo**
  - [ ] Em `executive-profile.ts`: seção "Privacidade e dados" com botão Danger + modal de confirmação

- [ ] **FRONTEND: Botão de exclusão no perfil PME**
  - [ ] Em `company-payments.ts` ou nova seção: mesmo padrão

## Dev Notes

### PII nunca em logs
Usar log.info("Solicitação de exclusão criada para user ID [{}]", userId) — nunca email ou nome.

### SHA-256 do e-mail
```java
import java.security.MessageDigest;
String hashedEmail = HexFormat.of().formatHex(
    MessageDigest.getInstance("SHA-256").digest(user.getEmail().getBytes(StandardCharsets.UTF_8)));
```

### Migration V16
V15 = status_reason em engagements. V16 = deletion_requests.

## Dev Agent Record
### Debug Log
_vazio_
### Completion Notes
_vazio_

## File List
_a preencher_

## Change Log
_a preencher_
