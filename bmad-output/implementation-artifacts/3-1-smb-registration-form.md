---
baseline_commit: c0d77dd
---

# Story 3.1: SMB Registration Form

Status: done

## Story

Como responsável por uma PME,
quero preencher um formulário de cadastro da minha empresa,
para que eu possa acessar a plataforma e postar necessidades de C-Level.

## Acceptance Criteria

1. **Dado** `/register` acessada sem autenticação, **então** a página é pública e exibe formulário com os campos: razão social, CNPJ (com máscara `XX.XXX.XXX/XXXX-XX` e validação de dígito verificador), setor (lista padronizada + campo livre), número de funcionários (faixas: 1–10, 11–50, 51–200, 201–500, 500+), faturamento anual (faixas: até R$1M, R$1–5M, R$5–20M, R$20M+), nome do responsável, e-mail do responsável

2. **Dado** CNPJ inválido submetido, **então** erro inline: "CNPJ inválido. Verifique e tente novamente."

3. **Dado** formulário submetido com dados válidos, **então**:
   - Backend cria registro em `companies` com `status = PENDING_ACTIVATION`
   - Backend cria `User` com `role = PME` vinculado à empresa
   - Frontend exibe tela de confirmação: "Cadastro recebido. O time FracExec ativará seu acesso em breve."

4. **Dado** e-mail já cadastrado, **então** retorna erro: "Este e-mail já possui cadastro. Acesse sua conta ou recupere a senha."

5. **Dado** o cadastro criado, **então** nenhum PII (nome, e-mail, CNPJ) é logado no backend

6. **Dado** usuário PME com empresa em status `PENDING_ACTIVATION` tenta fazer login, **então** autenticação retorna 403 com mensagem: "Seu cadastro está em análise. Você receberá um e-mail quando o acesso for ativado." — JWT não é emitido antes da ativação

## Tasks / Subtasks

- [x] **BACKEND: Flyway V6 — tabela `companies`** (AC: 3)
  - [ ] Criar `V6__companies.sql` com tabela `companies`: `id UUID PK`, `legal_name VARCHAR(255) NOT NULL`, `cnpj VARCHAR(18) NOT NULL UNIQUE`, `sector VARCHAR(100) NOT NULL`, `employee_range VARCHAR(20) NOT NULL`, `annual_revenue_range VARCHAR(20) NOT NULL`, `responsible_name VARCHAR(255) NOT NULL`, `responsible_email VARCHAR(255) NOT NULL`, `status VARCHAR(30) NOT NULL DEFAULT 'PENDING_ACTIVATION'`, `user_id UUID REFERENCES users(id)`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - [x] Índices: `idx_companies_cnpj`, `idx_companies_responsible_email`, `idx_companies_status`

- [x] **BACKEND: Entidade `Company`** (AC: 3)
  - [x] Criar `company/Company.java` — entidade JPA mapeada para tabela `companies`
  - [x] Campos: `UUID id`, `String legalName`, `String cnpj`, `String sector`, `String employeeRange`, `String annualRevenueRange`, `String responsibleName`, `String responsibleEmail`, `CompanyStatus status`, `User user`, `Instant createdAt`, `Instant updatedAt`
  - [x] Enum `CompanyStatus`: `PENDING_ACTIVATION`, `ACTIVE`, `SUSPENDED`
  - [x] `@OneToOne` para `User` (FK `user_id`)

- [x] **BACKEND: Repositório `CompanyRepository`** (AC: 3, 4)
  - [x] Criar `company/CompanyRepository.java` — interface JPA
  - [x] Métodos: `existsByCnpj(String cnpj): boolean`, `existsByResponsibleEmail(String email): boolean`, `findByUser(User user): Optional<Company>`

- [x] **BACKEND: DTOs** (AC: 1, 3)
  - [x] Criar `company/dto/CompanyRegistrationRequest.java` — record com Bean Validation
  - [x] Criar `company/dto/CompanyRegistrationResponse.java` — record: `UUID companyId`, `String message`
  - [x] Criar enums `EmployeeRange` e `AnnualRevenueRange` dentro do pacote `company/dto/`

- [x] **BACKEND: Service `CompanyService`** (AC: 3, 4, 5)
  - [x] Criar interface `company/CompanyService.java`
  - [x] Criar `company/CompanyServiceImpl.java` com validação CNPJ, check de duplicidade, criação de User PME e Company PENDING_ACTIVATION — sem logar PII

- [x] **BACKEND: Controller `CompanyController`** (AC: 1, 3, 4, 6)
  - [x] Criar `company/CompanyController.java` com `POST /api/v1/companies/register` público
  - [x] Retorna `201 Created` com `CompanyRegistrationResponse`

- [x] **BACKEND: Bloquear login de PME com PENDING_ACTIVATION** (AC: 6)
  - [x] Em `AuthServiceImpl.java`, após autenticar, verificar se PME tem empresa PENDING_ACTIVATION → lança `ForbiddenException` (403)
  - [x] Adicionada `ForbiddenException` + handler no `GlobalExceptionHandler`

- [x] **BACKEND: Testes de integração** (AC: 1–6)
  - [ ] Criar `src/test/java/com/fracexec/api/company/CompanyRegistrationControllerTest.java`
  - [ ] `POST /api/v1/companies/register` com dados válidos → 201 + company no banco com status PENDING_ACTIVATION
  - [ ] `POST` com CNPJ inválido → 400 com campo `errors.cnpj`
  - [ ] `POST` com e-mail já existente → 409
  - [ ] `POST` com CNPJ já existente → 409
  - [x] `POST /api/v1/auth/login` com PME PENDING_ACTIVATION → 403 com mensagem correta
  - [x] Usar `@SpringBootTest` + `@AutoConfigureMockMvc` + `@Transactional` — 7/7 testes passando

- [x] **FRONTEND: Configurar rota `/register` pública** (AC: 1)
  - [x] Em `app.routes.ts`, adicionada rota `{ path: 'register', loadComponent: ... CompanyRegistration }`

- [x] **FRONTEND: Criar `company-registration.ts`** (AC: 1, 2, 3, 4)
  - [x] Validador custom `cnpjValidator` (algoritmo módulo 11)
  - [x] Máscara CNPJ via `(input)` event
  - [x] Signals: `submitted`, `loading`, `apiError`
  - [x] Erros 409 mapeados inline por campo

- [x] **FRONTEND: Template HTML** (AC: 1, 2, 3)
  - [x] Seções empresa + responsável
  - [x] Tela de confirmação ao submeter com sucesso
  - [x] Link "Já tem conta? Entrar"

- [x] **FRONTEND: `company.service.ts`** (AC: 3)
  - [x] Criado com método `register()` via `HttpClient`

- [x] **FRONTEND: Adicionar link "Cadastrar empresa" na página de login** (AC: 1)
  - [x] Link "É uma empresa? Cadastre-se aqui" adicionado em `login.ts`

### Senior Developer Review (AI)

**Outcome:** Changes Requested | **Data:** 2026-06-03 | **Items:** 2 patch, 5 dismissed

#### Action Items

- [x] [Review][Patch] Import duplicado `LoginRequest` — remover linha duplicada [CompanyRegistrationControllerTest.java:8]
- [x] [Review][Patch] `@Lazy @Autowired` desnecessário em `AuthServiceImpl` — não há ciclo circular real; converter para constructor injection [AuthServiceImpl.java]

## Dev Notes

### Validação de CNPJ (algoritmo)

O CNPJ tem 14 dígitos. A validação dos dígitos verificadores:

```
1. Remove máscara: extrair apenas dígitos
2. Rejeitar CNPJs com todos os dígitos iguais (ex: 00000000000000)
3. Calcular 1º dígito verificador:
   - Pesos: [5,4,3,2,9,8,7,6,5,4,3,2] aplicados aos 12 primeiros dígitos
   - Soma = Σ(dígito * peso)
   - Resto = soma % 11
   - DV1 = (resto < 2) ? 0 : (11 - resto)
4. Calcular 2º dígito verificador:
   - Pesos: [6,5,4,3,2,9,8,7,6,5,4,3,2] aplicados aos 13 primeiros dígitos
   - Mesmo cálculo
5. DV1 e DV2 devem coincidir com os 2 últimos dígitos do CNPJ
```

Implementar TANTO no frontend (validador Angular) QUANTO no backend (método utilitário no service).

### Migrations existentes

As migrations V1–V5 já existem. A próxima deve ser **V6**:
- V1: baseline_schema (tabela `executives`)
- V2: users_and_auth
- V3: executive_applications
- V4: application_review_fields
- V5: executive_profiles
- **V6: companies** ← esta story
- V7–V9: RESERVADAS — nunca criar

### Pacote correto

```
com.fracexec.api.company/
  Company.java
  CompanyController.java        ← controller na raiz do pacote
  CompanyService.java
  CompanyServiceImpl.java
  CompanyRepository.java
  dto/
    CompanyRegistrationRequest.java
    CompanyRegistrationResponse.java
    EmployeeRange.java
    AnnualRevenueRange.java
```

### SecurityConfig — rota já liberada

`/api/v1/companies/register` já está no `permitAll()` do `SecurityConfig`. Não alterar.

### Padrão de erros RFC 7807

O `GlobalExceptionHandler` já trata:
- `MethodArgumentNotValidException` → 400 com `errors` map
- `ConflictException` (a criar, ou usar `BusinessRuleException` com status 409) → 409

### Login bloqueado para PME pendente

O bloqueio deve ocorrer em `AuthServiceImpl.login()`, **após** `authenticationManager.authenticate()` (que valida a senha), mas **antes** de gerar o JWT. Sequência:

```java
// 1. Autentica credenciais (lança exceção se inválido)
Authentication auth = authenticationManager.authenticate(...);
User user = (User) auth.getPrincipal();

// 2. Se PME, verificar status da empresa
if (user.getRole() == Role.PME) {
    Company company = companyRepository.findByUser(user)
        .orElseThrow(() -> new BusinessRuleException("Empresa não encontrada."));
    if (company.getStatus() == CompanyStatus.PENDING_ACTIVATION) {
        throw new BusinessRuleException(
            "Seu cadastro está em análise. Você receberá um e-mail quando o acesso for ativado.",
            HttpStatus.FORBIDDEN);
    }
}

// 3. Emitir JWT (só chega aqui se passou no check)
```

### Padrões Angular do projeto

- Signals para estado local: `signal<T>()` — padrão estabelecido nas stories 2.4, 2.5, 2.6
- `DestroyRef` + `takeUntilDestroyed` para subscriptions
- `Subject + switchMap` para cancelar requests in-flight (padrão story 2.2)
- CSS custom properties `--spacing-*` (não `--space-*`)
- Sem `app-` prefix nos seletores — padrão do projeto

### Frontend — pasta e arquivos novos

```
src/app/company/
  company.service.ts              ← NOVO
  registration/
    company-registration.ts       ← NOVO (reescrever stub se existir)
    company-registration.html     ← NOVO
    company-registration.scss     ← NOVO
```

Verificar se `app.routes.ts` já tem rota `/register` com stub antes de criar.

### Dependências da Story 3.4

A Story 3.4 (Admin Needs Queue) inclui a ativação de PMEs pelo admin (`/admin/companies`). Esta story 3.1 cria a base: a tabela `companies`, o status `PENDING_ACTIVATION`, e o bloqueio de login. A ativação pelo admin (mudar para `ACTIVE` + enviar e-mail) é responsabilidade da Story 3.4.

## Dev Agent Record

### Debug Log
- Teste `pmePendingActivation` inicialmente retornou 401 em vez de 403 porque o `@Transactional` do teste não commitava a senha antes da autenticação. Resolvido criando User e Company diretamente no setUp do teste com senha conhecida, sem passar pelo endpoint de registro.
- `environment.apiUrl` não existe no projeto — padrão é URL relativa `/api/v1/...`. Corrigido no `company.service.ts`.

### Completion Notes
✅ Backend completo: V6 migration, Company/CompanyStatus/CompanyRepository, CompanyServiceImpl com CNPJ algoritmo módulo 11, CompanyController (201), bloqueio PME PENDING_ACTIVATION (403 via ForbiddenException).
✅ Frontend completo: rota /register pública, CompanyRegistration com máscara CNPJ + validador custom, tela de confirmação, CompanyService, link no login.
✅ 49/49 testes passando, zero regressões, build Angular limpo.

## File List

**Backend — novos:**
- `fracexec/fracexec-api/src/main/resources/db/migration/V6__companies.sql`
- `fracexec/fracexec-api/src/main/java/com/fracexec/api/company/Company.java`
- `fracexec/fracexec-api/src/main/java/com/fracexec/api/company/CompanyStatus.java`
- `fracexec/fracexec-api/src/main/java/com/fracexec/api/company/CompanyRepository.java`
- `fracexec/fracexec-api/src/main/java/com/fracexec/api/company/CompanyService.java`
- `fracexec/fracexec-api/src/main/java/com/fracexec/api/company/CompanyServiceImpl.java`
- `fracexec/fracexec-api/src/main/java/com/fracexec/api/company/CompanyController.java`
- `fracexec/fracexec-api/src/main/java/com/fracexec/api/company/dto/EmployeeRange.java`
- `fracexec/fracexec-api/src/main/java/com/fracexec/api/company/dto/AnnualRevenueRange.java`
- `fracexec/fracexec-api/src/main/java/com/fracexec/api/company/dto/CompanyRegistrationRequest.java`
- `fracexec/fracexec-api/src/main/java/com/fracexec/api/company/dto/CompanyRegistrationResponse.java`
- `fracexec/fracexec-api/src/main/java/com/fracexec/api/shared/exception/ForbiddenException.java`
- `fracexec/fracexec-api/src/test/java/com/fracexec/api/company/CompanyRegistrationControllerTest.java`

**Backend — modificados:**
- `fracexec/fracexec-api/src/main/java/com/fracexec/api/shared/auth/service/AuthServiceImpl.java` (bloqueio PME PENDING_ACTIVATION)
- `fracexec/fracexec-api/src/main/java/com/fracexec/api/shared/exception/GlobalExceptionHandler.java` (handler ForbiddenException)

**Frontend — novos:**
- `fracexec/fracexec-web/src/app/company/company.service.ts`
- `fracexec/fracexec-web/src/app/company/registration/company-registration.ts`
- `fracexec/fracexec-web/src/app/company/registration/company-registration.html`
- `fracexec/fracexec-web/src/app/company/registration/company-registration.scss`

**Frontend — modificados:**
- `fracexec/fracexec-web/src/app/app.routes.ts` (rota `/register`)
- `fracexec/fracexec-web/src/app/shared/pages/login/login.ts` (link "Cadastre-se aqui")

## Change Log

- 2026-06-03: Implementação completa da Story 3.1. Backend: Flyway V6 (tabela companies), entidade Company + CompanyStatus, repositório, service com validação CNPJ algoritmo módulo 11, controller público, bloqueio de login PME PENDING_ACTIVATION (403). Frontend: rota /register pública, formulário com máscara CNPJ, validador custom, tela de confirmação, link no login. 49/49 testes passando, build Angular sem erros.
