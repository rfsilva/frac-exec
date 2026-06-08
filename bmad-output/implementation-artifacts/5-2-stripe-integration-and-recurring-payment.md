---
baseline_commit: bcd3616d51f6a489e6461458ec536ec7f573e746
---

# Story 5.2: Stripe Integration & Recurring Payment

Status: done

## Story

Como PME com contrato ativo,
quero pagar a mensalidade do engajamento via PIX integrado à plataforma,
para que o pagamento seja rastreado automaticamente sem transferências manuais.

## Acceptance Criteria

1. **Dado** `/company/payments` com engajamento ACTIVE, **então** exibe botão "Pagar mensalidade" com valor do mês em JetBrains Mono

2. **Dado** "Pagar mensalidade" clicado, **então** cria Stripe Payment Intent PIX (`payment_method_types: ['pix']`, `currency: 'brl'`, expira em 3600s); PME vê QR Code + código PIX + prazo

3. **Dado** webhook `payment_intent.succeeded` recebido, **então** tabela `payments` registra: `engagement_id`, `stripe_payment_intent_id`, `gross_amount`, `fee_amount` (18%), `net_amount`, `status = PAID`, `paid_at` — idempotente

4. **Dado** `payment_intent_id` já processado, **então** retorna 200 sem duplicar registro

5. **Dado** webhook com assinatura inválida, **então** retorna 400

6. **Dado** PIX expirado, **então** status → `EXPIRED`; PME pode gerar novo sem duplicar

## Tasks / Subtasks

- [ ] **BACKEND: Flyway V14 — tabela `payments`**
  - [ ] `payments`: `id UUID PK`, `engagement_id UUID FK engagements(id)`, `stripe_payment_intent_id VARCHAR(255) UNIQUE`, `gross_amount NUMERIC(12,2)`, `fee_amount NUMERIC(12,2)`, `net_amount NUMERIC(12,2)`, `status VARCHAR(20) DEFAULT 'PENDING'`, `paid_at TIMESTAMPTZ`, `created_at TIMESTAMPTZ DEFAULT now()`
  - [ ] `PaymentStatus`: `PENDING`, `PAID`, `EXPIRED`, `TRANSFERRED`, `TRANSFER_FAILED`

- [ ] **BACKEND: Entidade `Payment`** — `contract/Payment.java`

- [ ] **BACKEND: `PaymentService` — criar Payment Intent PIX**
  - [ ] `createPaymentIntent(UUID engagementId): PaymentIntentResponse` — retorna `clientSecret`, `pixCode`, `expiresAt`
  - [ ] Usar `Stripe.apiKey` da config; `PaymentIntent.create()` com PIX + BRL
  - [ ] Calcular `feeAmount = grossAmount * 0.18`, `netAmount = grossAmount - feeAmount`

- [ ] **BACKEND: `StripeWebhookController`**
  - [ ] `POST /api/v1/webhooks/stripe` — sem autenticação JWT (público)
  - [ ] Validar `Stripe-Signature` com `WebhookSignature.constructEvent()`
  - [ ] Handler `payment_intent.succeeded` → salvar Payment PAID
  - [ ] Handler `payment_intent.canceled` → salvar Payment EXPIRED
  - [ ] Idempotência: `paymentRepository.existsByStripePaymentIntentId(id)`

- [ ] **BACKEND: `PaymentController`** — role PME
  - [ ] `POST /api/v1/company/engagements/:engagementId/payments` — cria Payment Intent
  - [ ] `GET /api/v1/company/payments` — lista pagamentos da PME

- [ ] **BACKEND: Adicionar `/api/v1/webhooks/**` ao `SecurityConfig.permitAll()`**

- [ ] **BACKEND: Testes**
  - [ ] `PaymentControllerTest`: criar payment intent → retorna clientSecret; webhook idempotente → 200 sem duplicar

- [ ] **FRONTEND: Reescrever `company-payments.ts`**
  - [ ] GET `/company/payments` no init
  - [ ] Para cada engajamento ACTIVE: botão "Pagar mensalidade" com valor em JetBrains Mono
  - [ ] Ao clicar: POST → exibir QR Code + código PIX + countdown de expiração
  - [ ] Lista de pagamentos históricos com status badge

## Dev Notes

### Stripe — modo teste
`STRIPE_API_KEY=sk_test_...` no `application-local.yml`. No ambiente de testes E2E, usar `STRIPE_API_KEY=''` e mockar o endpoint de webhook.

### Webhook sem JWT
O endpoint de webhook da Stripe não pode ter autenticação JWT. Adicionar ao `SecurityConfig`:
```java
.requestMatchers("/api/v1/webhooks/**").permitAll()
```

### Cálculo de taxa
```java
BigDecimal fee = grossAmount.multiply(BigDecimal.valueOf(0.18)).setScale(2, RoundingMode.HALF_UP);
BigDecimal net = grossAmount.subtract(fee);
```

### Dependência Story 5.1
Requer `Engagement` com status `ACTIVE` e `monthly_value` preenchido.

## Dev Agent Record
### Debug Log
_vazio_
### Completion Notes
_vazio_

## File List
_a preencher_

## Change Log
_a preencher_
