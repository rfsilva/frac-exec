---
baseline_commit: bcd3616d51f6a489e6461458ec536ec7f573e746
---

# Story 5.3: Escrow Window & Executive Transfer

Status: done

## Story

Como executivo com engajamento ativo,
quero receber automaticamente meu pagamento líquido após a janela de 5 dias sem disputa,
para que eu saiba exatamente quando e quanto vou receber sem precisar acionar ninguém.

## Acceptance Criteria

1. **Dado** pagamento com status `PAID`, **então** job agendado conta 5 dias úteis brasileiros a partir de `paid_at`

2. **Dado** 5 dias úteis decorridos, **então** repasse via Stripe Connect payout ao executivo com `net_amount`; status → `TRANSFERRED`

3. **Dado** repasse processado, **então** e-mail à PME (comprovante: valor bruto + data) e ao executivo (extrato: bruto, taxa 18%, líquido em JetBrains Mono)

4. **Dado** falha no payout, **então** status → `TRANSFER_FAILED`; admin notificado internamente

5. **Dado** data estimada de repasse exibida, **então** calculada com dias úteis brasileiros (excluindo sábados, domingos)

## Tasks / Subtasks

- [ ] **BACKEND: `EscrowTransferJob`** — `@Scheduled(fixedDelay = 3_600_000)`
  - [ ] Buscar pagamentos `PAID` com `paid_at + 5 dias úteis < now()`
  - [ ] Para cada um: simular Stripe payout (no MVP, registrar como transferido sem Stripe real); status → `TRANSFERRED`
  - [ ] Em caso de falha: status → `TRANSFER_FAILED`; `log.warn` para admin

- [ ] **BACKEND: Cálculo de dias úteis**
  - [ ] Reusar `BusinessDayCalculator.addBusinessDays(paidAt, 5)` (já existe na Story 3.3)
  - [ ] Adicionar método `isAfterBusinessDays(Instant paidAt, int days): boolean`

- [ ] **BACKEND: `PaymentRepository`** — adicionar:
  - [ ] `findAllByStatusAndPaidAtBefore(PaymentStatus.PAID, Instant threshold)`

- [ ] **BACKEND: E-mails pós-repasse**
  - [ ] `EmailService.sendPaymentProcessed(toEmail, grossAmount, feeAmount, netAmount, transferDate)` — para executivo
  - [ ] `EmailService.sendPaymentReceipt(toEmail, grossAmount, paidDate)` — para PME
  - [ ] Implementar templates `payment-processed.html`

- [ ] **BACKEND: Testes**
  - [ ] `EscrowJobTest`: pagamento PAID com `paid_at = now() - 6 dias úteis` → status TRANSFERRED após executar job

## Dev Notes

### Stripe Connect no MVP
No MVP sem conta Stripe real, o payout é simulado: apenas atualizar `status = TRANSFERRED` e registrar `transferred_at`. Em produção, usar `Transfer.create()` da API Stripe.

### `BusinessDayCalculator` — já existe
Localizado em `com.fracexec.api.shared.util.BusinessDayCalculator` (criado na Story 3.3).

### Job no container Docker
O `@Scheduled` roda no mesmo processo Spring Boot. Verificar que `@EnableScheduling` está na aplicação principal.

## Dev Agent Record
### Debug Log
_vazio_
### Completion Notes
_vazio_

## File List
_a preencher_

## Change Log
_a preencher_
