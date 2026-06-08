---
baseline_commit: bcd3616d51f6a489e6461458ec536ec7f573e746
---

# Story 5.1: Contract Generation & Signature

Status: done

## Story

Como operador admin,
quero gerar um contrato padronizado pré-preenchido e registrar o aceite de ambas as partes,
para que o engajamento comece oficialmente com todos os termos documentados e identidades reveladas.

## Acceptance Criteria

1. **Dado** `/admin/contracts/new` com necessidade em `IN_MEDIATION`, **então** formulário pré-preenchido com: razão social PME, nome executivo, escopo, valor mensal, duração, cláusula de confidencialidade

2. **Dado** "Gerar contrato" clicado, **então** PDF gerado via OpenPDF, armazenado em MinIO `fracexec-contracts`, e-mail com PDF disparado a ambas as partes

3. **Dado** declaração de conflito preenchida no contrato, **então** dados gravados em `executive_clients` — alimenta registro de conflitos futuros

4. **Dado** "Registrar assinatura" clicado com checkboxes de ambas as partes, **então** `engagement.status → ACTIVE`, `need.status → CONTRACTED`, identidades reveladas

5. **Dado** `/admin/contracts`, **então** lista contratos com status, partes, valor mensal, data de início

6. **Dado** download solicitado, **então** URL pré-assinada MinIO com expiração de 1 hora

7. **Dado** tentativa de gerar contrato sem executivo INTERESTED em IN_MEDIATION, **então** retorna 422

8. **Dado** contrato compromete X dias/mês que excede disponibilidade, **então** aviso não-bloqueante ao admin

## Tasks / Subtasks

- [ ] **DEPENDÊNCIA: Adicionar OpenPDF ao pom.xml**
  - [ ] Adicionar `com.github.librepdf:openpdf:1.3.43` ao `pom.xml`

- [ ] **BACKEND: Flyway V13 — tabelas `engagements` e `contracts`**
  - [ ] `engagements`: `id UUID PK`, `need_id UUID FK needs(id)`, `executive_profile_id UUID FK executive_profiles(id)`, `status VARCHAR(20) DEFAULT 'PENDING'`, `monthly_value NUMERIC(12,2)`, `scope_days_per_month INT`, `duration_months INT`, `started_at TIMESTAMPTZ`, `created_at TIMESTAMPTZ DEFAULT now()`
  - [ ] `contracts`: `id UUID PK`, `engagement_id UUID FK engagements(id)`, `storage_key VARCHAR(500)`, `signed_by_pme BOOLEAN DEFAULT FALSE`, `signed_by_executive BOOLEAN DEFAULT FALSE`, `generated_at TIMESTAMPTZ DEFAULT now()`, `fully_signed_at TIMESTAMPTZ`
  - [ ] Enums: `EngagementStatus`: `PENDING`, `ACTIVE`, `PAUSED`, `COMPLETED`, `CANCELLED`

- [ ] **BACKEND: Entidades `Engagement` + `Contract`**
  - [ ] `contract/Engagement.java`: `@OneToOne Need need`, `@ManyToOne ExecutiveProfile executiveProfile`, `EngagementStatus status`, campos financeiros
  - [ ] `contract/Contract.java`: `@OneToOne Engagement engagement`, `storageKey`, flags de assinatura

- [ ] **BACKEND: Serviço de geração PDF (OpenPDF)**
  - [ ] `contract/service/ContractPdfService.java`: gera PDF com dados do contrato
  - [ ] Campos do PDF: razão social PME, nome executivo, escopo, valor, duração, cláusula de confidencialidade, data
  - [ ] Upload para MinIO bucket `fracexec-contracts`

- [ ] **BACKEND: `ContractService` + `ContractController`**
  - [ ] `POST /api/v1/admin/contracts` — gera contrato para needId
  - [ ] `POST /api/vl/admin/contracts/:id/sign` — body `{ signedByPme, signedByExecutive }` → ativa engagement + need CONTRACTED
  - [ ] `GET /api/v1/admin/contracts` — lista contratos
  - [ ] `GET /api/v1/admin/contracts/:id/download` — URL pré-assinada

- [ ] **BACKEND: E-mails**
  - [ ] `EmailService.sendContractReady(String toEmail, String name, String downloadUrl)` para PME e executivo
  - [ ] Implementar template `contract-ready.html`

- [ ] **BACKEND: Testes**
  - [ ] `ContractControllerTest`: gerar contrato válido → 201; sem INTERESTED → 422; assinar → engagement ACTIVE + need CONTRACTED

- [ ] **FRONTEND: Tela `/admin/contracts`**
  - [ ] Lista de contratos com status, partes, valor, data
  - [ ] Link "Novo contrato" → formulário

- [ ] **FRONTEND: Tela `/admin/contracts/new`**
  - [ ] Selecionar necessidade IN_MEDIATION; formulário pré-preenchido
  - [ ] Botão "Gerar contrato" → POST → exibe link de download
  - [ ] Botão "Registrar assinatura" com checkboxes PME + Executivo

- [ ] **FRONTEND: Rotas admin** — adicionar `/admin/contracts` e `/admin/contracts/new`

## Dev Notes

### OpenPDF
```xml
<dependency>
    <groupId>com.github.librepdf</groupId>
    <artifactId>openpdf</artifactId>
    <version>1.3.43</version>
</dependency>
```

### Migration V13
V12 = `add_can_reapply_after`. V13 = `engagements` + `contracts`.

### Identidades reveladas após assinatura
- PME: `need.company.legalName` + executivo: `executiveProfile.user.email` (nome real virá via `fullName` da `ExecutiveApplication` aprovada)
- Endpoint `/company/need/:id` quando `need.status = CONTRACTED` deve retornar nome/email do executivo
- Endpoint `/executive/engagements/:id` deve retornar razão social da PME

## Dev Agent Record
### Debug Log
_vazio_
### Completion Notes
_vazio_

## File List
_a preencher_

## Change Log
_a preencher_
