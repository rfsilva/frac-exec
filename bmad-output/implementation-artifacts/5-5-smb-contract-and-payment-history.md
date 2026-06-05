---
baseline_commit: bcd3616d51f6a489e6461458ec536ec7f573e746
---

# Story 5.5: SMB Contract & Payment History

Status: done

## Story

Como PME com engajamento ativo ou concluído,
quero acessar meu histórico de pagamentos e baixar os contratos,
para que eu tenha documentação financeira completa do engajamento.

## Acceptance Criteria

1. **Dado** `/company/payments`, **então** lista de pagamentos: mês de referência, valor pago, status (Pago/Aguardando), data — valores em JetBrains Mono

2. **Dado** seção Contratos em `/company/payments`, **então** lista de contratos: data de assinatura, executivo (nome visível pós-contrato), valor mensal, duração, link "Baixar PDF"

3. **Dado** "Baixar PDF" clicado, **então** URL pré-assinada MinIO com expiração de 1 hora

4. **Dado** `/company/need/:id` com engajamento ACTIVE, **então** exibe nome completo e foto do executivo (identidade revelada)

5. **Dado** dashboard PME, **então** widget de pagamentos: próximo vencimento (data + valor), último pagamento realizado, link "Ver histórico →"

6. **Dado** sem histórico, **então** estado vazio: "Nenhum pagamento registrado ainda."

## Tasks / Subtasks

- [ ] **BACKEND: `GET /api/v1/company/payments`** — role PME
  - [ ] Buscar pagamentos do `engagement.need.company` autenticado
  - [ ] `CompanyPaymentResponse`: `id`, `referenceMonth`, `grossAmount`, `status`, `paidAt`
  - [ ] Incluir seção `contracts`: lista contratos com `executiveName`, `monthlyValue`, `durationMonths`, `signedAt`

- [ ] **BACKEND: `GET /api/v1/company/contracts/:id/download`** — gera URL pré-assinada MinIO
  - [ ] Validar que o contrato pertence à empresa da PME autenticada

- [ ] **BACKEND: `GET /api/v1/company/payments/summary`** — widget dashboard
  - [ ] `nextDue`: próxima mensalidade a vencer (baseado em `started_at` + meses)
  - [ ] `lastPayment`: último pagamento PAID

- [ ] **BACKEND: Testes**
  - [ ] `CompanyPaymentControllerTest`: lista retorna pagamentos da PME; download URL retorna 200; PME de outra empresa → 403

- [ ] **FRONTEND: Reescrever `company-payments.ts`**
  - [ ] GET `/company/payments` no init — exibir pagamentos + contratos
  - [ ] Valores em JetBrains Mono; status badges
  - [ ] Botão "Baixar PDF" → GET download → abrir URL

- [ ] **FRONTEND: Widget de pagamentos no `company-dashboard.ts`**
  - [ ] GET `/company/payments/summary` no init
  - [ ] Exibir próximo vencimento e último pagamento

- [ ] **FRONTEND: `/company/need/:id` — revelar identidade quando CONTRACTED**
  - [ ] Quando `need.status = CONTRACTED`: mostrar nome e foto do executivo no detalhe da necessidade

## Dev Notes

### URL pré-assinada MinIO — reutilizar
Usar `MinioStorageService.generatePresignedDownloadUrl(contractsBucket, storageKey, Duration.ofHours(1))` — mesmo padrão das Stories 2.3 e 5.1.

### Foto do executivo
`ExecutiveProfile.photoKey` → gerar URL pré-assinada do bucket `fracexec-profiles`.

## Dev Agent Record
### Debug Log
_vazio_
### Completion Notes
_vazio_

## File List
_a preencher_

## Change Log
_a preencher_
