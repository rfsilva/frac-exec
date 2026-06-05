---
baseline_commit: b09072710eea5300e9228f15d9d0a12ee736f5a9
---

# Story 4.6: Mediation Thread

Status: ready-for-dev

## Story

Como admin, PME ou executivo,
quero que toda comunicação pré-contrato ocorra em uma thread mediada com identificação de papel sem revelar nomes,
para que ambas as partes se comuniquem com segurança e o histórico completo seja preservado.

## Acceptance Criteria

1. **Dado** Flyway V10, **então** tabela `mediation_messages` existe com: `id UUID PK`, `need_id UUID FK needs(id)`, `sender_role VARCHAR(20) NOT NULL` (ADMIN/PME/EXECUTIVE), `sender_id UUID` (para auditoria — nunca exposto na API), `content TEXT NOT NULL`, `created_at TIMESTAMPTZ DEFAULT now()`

2. **Dado** `MediationThreadComponent` acessado por qualquer role, **então** mensagens agrupadas por data com rótulo de papel ("FracExec", "Empresa", "Executivo") — nunca nome real

3. **Dado** usuário ADMIN, **então** campo de texto + botão "Enviar mensagem" — só ADMIN posta diretamente

4. **Dado** PME ou EXECUTIVE, **então** botão "Enviar mensagem ao FracExec" — cria notificação interna sem postar na thread pública

5. **Dado** nova mensagem do ADMIN, **então** e-mail `FR-8.1 evento 6` aos outros participantes do engajamento ("Nova mensagem no FracExec")

6. **Dado** thread via `/company/need/:id` (PME) ou `/executive/engagements/:id` (executivo), **então** exibe apenas mensagens do `need_id` daquele engajamento

7. **Dado** `/admin/engagements/:id`, **então** admin vê thread completa + `sender_id` para auditoria (não exposto a outros roles)

8. **Dado** thread carregando, **então** `LoadingSkeletonComponent` tipo `list`

## Tasks / Subtasks

- [ ] **BACKEND: Flyway V10 — tabela `mediation_messages`** (AC: 1)
  - [ ] `mediation_messages`: `id UUID PK`, `need_id UUID FK needs(id)`, `sender_role VARCHAR(20)`, `sender_id UUID` (nullable — para mensagens do sistema), `content TEXT`, `created_at TIMESTAMPTZ DEFAULT now()`
  - [ ] Índice: `idx_mediation_messages_need_id`

- [ ] **BACKEND: Entidade `MediationMessage`** (AC: 1)
  - [ ] `match/MediationMessage.java`: `@ManyToOne Need need`, `SenderRole senderRole`, `UUID senderId`, `String content`, `Instant createdAt`
  - [ ] `SenderRole` enum: `ADMIN`, `PME`, `EXECUTIVE`

- [ ] **BACKEND: DTOs**
  - [ ] `MediationMessagePublicResponse`: `id`, `senderRole`, `senderLabel` ("FracExec"/"Empresa"/"Executivo"), `content`, `createdAt` — sem `senderId`
  - [ ] `MediationMessageAdminResponse`: extends public + `senderId`
  - [ ] `SendMessageRequest`: `content String @NotBlank`
  - [ ] `ContactAdminRequest`: `content String @NotBlank` — para PME/EXECUTIVE

- [ ] **BACKEND: `MediationController`** (AC: 2–7)
  - [ ] `GET /api/v1/admin/needs/{needId}/messages` — admin, retorna `MediationMessageAdminResponse`
  - [ ] `POST /api/v1/admin/needs/{needId}/messages` — admin posta diretamente; dispara e-mail aos participantes
  - [ ] `GET /api/v1/company/needs/{needId}/messages` — PME, retorna `MediationMessagePublicResponse` (sem senderId)
  - [ ] `POST /api/v1/company/needs/{needId}/contact-admin` — PME envia mensagem ao FracExec (cria notificação interna, não posta na thread)
  - [ ] `GET /api/v1/executive/needs/{needId}/messages` — EXECUTIVE (acessa pelo needId do engajamento)
  - [ ] `POST /api/v1/executive/needs/{needId}/contact-admin` — EXECUTIVE envia ao FracExec

- [ ] **BACKEND: E-mail "nova mensagem"** (AC: 5)
  - [ ] `EmailService.sendNewMediationMessage(String toEmail, String senderLabel, String contentPreview)`
  - [ ] Template `mediation-message.html` (novo, implementar com header brand, "Nova mensagem do FracExec", preview de 100 chars)

- [ ] **BACKEND: Testes** (AC: 1–8)
  - [ ] `MediationControllerTest`: admin posta → aparece na thread; PME tenta postar diretamente → 403; GET da PME não inclui senderId
  - [ ] `ContactAdminTest`: PME/EXECUTIVE contacta → cria notificação interna (log ou entidade futura)

- [ ] **FRONTEND: `MediationThreadComponent`** (AC: 2–8)
  - [ ] Criar `src/app/shared/components/mediation-thread/mediation-thread.ts`
  - [ ] Input: `@Input() needId: string`, `@Input() role: 'ADMIN' | 'PME' | 'EXECUTIVE'`
  - [ ] GET ao montar; `LoadingSkeletonComponent` tipo `list` durante carregamento
  - [ ] Mensagens agrupadas por data (separador com label "Hoje", "Ontem", etc.)
  - [ ] Avatar com inicial do `senderLabel`; balão de mensagem com timestamp
  - [ ] ADMIN: textarea + botão "Enviar mensagem"
  - [ ] PME/EXECUTIVE: botão "Enviar mensagem ao FracExec" (abre modal com textarea → POST contact-admin)

- [ ] **FRONTEND: Integração nas telas existentes** (AC: 6, 7)
  - [ ] `/company/need/:id` — renderizar `MediationThreadComponent` quando `need.status = IN_MEDIATION` ou `CONTRACTED`
  - [ ] `/admin/needs/:id` — adicionar aba "Thread" com o componente em modo ADMIN
  - [ ] `/executive/opportunities` — ao clicar em oportunidade INTERESTED: navegar para `/executive/engagements/:id` (stub por ora, thread visível)

## Dev Notes

### Migration V10
V9 = shortlists. V10 = mediation_messages. Este é o último migration do Epic 4. V11+ para Epic 5.

### `senderLabel` — lógica de mapeamento
```java
String senderLabel = switch (message.getSenderRole()) {
    case ADMIN      -> "FracExec";
    case PME        -> "Empresa";
    case EXECUTIVE  -> "Executivo";
};
```
Nunca expor o nome real nem o ID.

### Notificação interna (contact-admin)
No MVP, a "notificação interna" é apenas um log estruturado (`log.info("Contato recebido de {} para need {}: {}", role, needId, content)`). O painel de notificações do admin é escopo do Epic 6. Não implementar agora.

### Thread vs. engajamento
A thread é vinculada ao `need_id` (disponível desde V7). Quando o Epic 5 criar a tabela `engagements`, o join será `engagement.need_id → mediation_messages.need_id`. Por ora, usar `needId` diretamente — sem breaking change futuro.

### Agrupamento por data no frontend
```typescript
groupByDate(messages: MediationMessage[]): { date: string; messages: MediationMessage[] }[] {
  // agrupar por toLocaleDateString('pt-BR')
}
```

## Dev Agent Record
### Debug Log
_vazio_
### Completion Notes
_vazio_

## File List
_a preencher_

## Change Log
_a preencher_
