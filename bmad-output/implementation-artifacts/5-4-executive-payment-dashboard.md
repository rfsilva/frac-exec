---
baseline_commit: bcd3616d51f6a489e6461458ec536ec7f573e746
---

# Story 5.4: Executive Payment Dashboard

Status: done

## Story

Como executivo com engajamentos ativos ou históricos,
quero ver meu histórico completo de repasses com valores líquidos claramente apresentados,
para que eu acompanhe meus ganhos sem dúvidas sobre a dedução da taxa da plataforma.

## Acceptance Criteria

1. **Dado** `/executive/payments`, **então** lista de repasses: mês de referência, empresa (razão social pós-contrato), valor bruto, taxa 18%, valor líquido — todos em JetBrains Mono

2. **Dado** repasse `TRANSFERRED`, **então** badge verde "Creditado" + data de crédito

3. **Dado** repasse `PAID` (dentro da janela de 5 dias), **então** badge laranja "Aguardando repasse" + data estimada

4. **Dado** `/executive/dashboard`, **então** widget de pagamentos: próximo repasse (data + valor líquido), total recebido no mês corrente, link "Ver histórico completo →"

5. **Dado** sem pagamentos, **então** estado vazio: "Nenhum repasse registrado ainda."

6. **Dado** qualquer valor monetário, **então** obrigatoriamente em JetBrains Mono

## Tasks / Subtasks

- [ ] **BACKEND: `GET /api/v1/executive/payments`** — role EXECUTIVE
  - [ ] Buscar pagamentos pelo `engagement.executiveProfile` do usuário autenticado
  - [ ] `ExecutivePaymentResponse`: `id`, `referenceMonth`, `companyName` (razão social PME), `grossAmount`, `feeAmount`, `netAmount`, `status`, `paidAt`, `estimatedTransferAt`, `transferredAt`
  - [ ] Calcular `estimatedTransferAt = BusinessDayCalculator.addBusinessDays(paidAt, 5)`

- [ ] **BACKEND: `GET /api/v1/executive/payments/summary`** — para widget do dashboard
  - [ ] `nextTransfer`: próximo pagamento PAID com estimatedTransferAt mais próximo
  - [ ] `monthTotal`: soma de net_amount de pagamentos TRANSFERRED no mês corrente

- [ ] **BACKEND: Testes**
  - [ ] `ExecutivePaymentControllerTest`: lista retorna pagamentos do executivo; sumário retorna próximo repasse

- [ ] **FRONTEND: Reescrever `executive-payments.ts`**
  - [ ] GET `/executive/payments` no init
  - [ ] Tabela com colunas: mês, empresa, bruto, taxa (18%), líquido — todos em `.mono` class
  - [ ] `StatusBadge` verde "Creditado" / laranja "Aguardando repasse"
  - [ ] Estado vazio quando lista vazia

- [ ] **FRONTEND: Widget de pagamentos no `executive-dashboard.ts`**
  - [ ] GET `/executive/payments/summary` no init
  - [ ] Exibir próximo repasse com data e valor em JetBrains Mono
  - [ ] Link para `/executive/payments`

## Dev Notes

### JetBrains Mono — obrigatório para valores
Usar classe CSS `.mono` ou `font-family: 'JetBrains Mono', monospace` em todos os valores monetários.

### `referenceMonth`
Calcular a partir de `paidAt`: `YearMonth.from(paidAt.atZone(ZoneId.of("America/Sao_Paulo")))`

### Dependência
Requer `Payment` com status PAID ou TRANSFERRED (Story 5.2 e 5.3).

## Dev Agent Record
### Debug Log
_vazio_
### Completion Notes
_vazio_

## File List
_a preencher_

## Change Log
_a preencher_
