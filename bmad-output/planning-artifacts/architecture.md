---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-05-29'
inputDocuments:
  - bmad-output/planning-artifacts/prds/prd-fracexec-2026-05-28/prd.md
  - bmad-output/planning-artifacts/briefs/brief-fraccto-2026-05-28/brief.md
workflowType: 'architecture'
project_name: 'FracExec'
user_name: 'Rodrigo'
date: '2026-05-28'
---

# Architecture Decision Document — FracExec

_Este documento é construído colaborativamente passo a passo. As seções são adicionadas conforme as decisões arquiteturais são tomadas em conjunto._

---

## Análise de Contexto do Projeto

### Visão Geral dos Requisitos

**Requisitos Funcionais:**
35+ FRs em 8 clusters: Verificação de Executivos, Perfil, Cadastro de PME, Match & Mediação, Conflito de Interesses, Contrato & Pagamento, Dashboards e Notificações. O núcleo do sistema é operacional (máquinas de estado + workflows gerenciados pelo time interno) com portais de self-service para executivos e PMEs.

**Requisitos Não-Funcionais:**
LGPD (consentimento explícito, exclusão em 30 dias), HTTPS obrigatório, autenticação email + senha, documentos em storage seguro com URL assinada, 99% de uptime, carregamento < 3s, capacidade MVP: 300 executivos + 150 PMEs.

**Escala & Complexidade:**
- Domínio primário: Full-stack web (Angular SPA + Spring Boot REST API)
- Complexidade: Média
- Componentes arquiteturais estimados: 8–10

### Restrições e Dependências Técnicas

- Backend: Java 21 + Spring Boot 3 (definido)
- Frontend: Angular 21 (definido)
- Integração obrigatória: gateway de pagamento brasileiro (PIX + cartão)
- Integração obrigatória: serviço de e-mail transacional
- Integração obrigatória: cloud storage com suporte a URL assinada
- LGPD: tratamento de dados pessoais com consentimento explícito e direito de exclusão

### Preocupações Transversais Identificadas

1. Autenticação & Autorização multi-papel (Executive / PME / Admin)
2. LGPD — consentimento, minimização de dados, direito de exclusão
3. Anonimização de dados em respostas de API por papel
4. Trilha de auditoria para decisões de conflito e transições de estado
5. Sistema de notificações orientado a eventos (8 tipos de e-mail)
6. Armazenamento de documentos com controle de acesso por papel e URL assinada
7. Split de pagamentos com janela de escrow de 5 dias úteis

---

## Avaliação de Starter Templates

### Domínio Primário

Full-stack web: REST API (Spring Boot) + SPA (Angular). Repositórios separados no MVP.

### Backend — Spring Boot 3.5.11 + Java 21

**Inicialização via Spring Initializr:**
```bash
curl -G https://start.spring.io/starter.zip \
  -d dependencies=web,data-jpa,security,validation,postgresql,flyway,actuator \
  -d javaVersion=21 \
  -d bootVersion=3.5.11 \
  -d groupId=com.fracexec \
  -d artifactId=fracexec-api \
  -d name=fracexec-api \
  -d packaging=jar \
  -d type=maven-project \
  -o fracexec-api.zip
```

**Decisões estabelecidas pelo starter:**
- Build: Maven
- Persistência: Spring Data JPA + Hibernate 6
- Banco: PostgreSQL Driver
- Segurança: Spring Security 6
- Migrações: Flyway
- Virtual Threads (Project Loom) disponíveis para I/O-intensivo (pagamentos, e-mail)
- Documentação: Springdoc OpenAPI 3 (adicionar manualmente)
- Monitoramento: Spring Boot Actuator

### Frontend — Angular 21.2.4

**Inicialização via Angular CLI:**
```bash
ng new fracexec-web --routing --style=scss --ssr=false
```

**Decisões estabelecidas pelo Angular 21:**
- Change detection: Zoneless (padrão — sem Zone.js)
- Componentes: Standalone (sem NgModules)
- Reatividade: Signals como padrão
- Change detection strategy: OnPush em todos os componentes
- Testes: Vitest (substitui Karma)
- TypeScript: modo strict

### Estrutura de Repositórios

```
fracexec-api/     ← Spring Boot 3.5 + Java 21
fracexec-web/     ← Angular 21
```

> **Nota de implementação:** A inicialização dos dois projetos deve ser a primeira história de implementação.

---

## Decisões Arquiteturais Centrais

### Prioridade das Decisões

**Críticas (bloqueiam implementação):**
- Autenticação JWT — desbloqueia todos os endpoints protegidos
- PostgreSQL + Flyway — desbloqueia modelo de dados
- Stripe Connect — desbloqueia fluxo de pagamento

**Importantes (moldam a arquitetura):**
- MinIO para armazenamento de arquivos
- JavaMailSender + SMTP (Mailpit local / SendGrid produção)
- Angular Material para UI

**Diferidas (pós-MVP):**
- Caching (Redis) — escala do MVP não justifica
- CDN para assets estáticos
- Escalabilidade horizontal

### Arquitetura de Dados

- SGBD: PostgreSQL 16+
- ORM: Spring Data JPA + Hibernate 6
- Migrações: Flyway (versionadas, aplicadas no startup)
- Connection pool: HikariCP (padrão Spring Boot)
- Modelagem: relacional com colunas de estado para máquinas de estado (candidatura, necessidade, engajamento)
- Caching: nenhum no MVP

### Autenticação & Segurança

- Método: JWT Stateless via Spring Security 6
- Roles: EXECUTIVE, PME, ADMIN
- Autorização: `@PreAuthorize` por endpoint
- Access token: 15 minutos
- Refresh token: 7 dias, armazenado em tabela `refresh_tokens`
- Logout: invalidação do refresh token no banco
- Senhas: BCrypt (padrão Spring Security)
- HTTPS: obrigatório — terminação no reverse proxy (Nginx)

### API & Comunicação

- Estilo: REST
- Versionamento: `/api/v1/...`
- Documentação: Springdoc OpenAPI 3 (Swagger UI em `/swagger-ui`)
- Error handling: RFC 7807 Problem Details
- CORS: permitido apenas para domínio do frontend
- Upload: `multipart/form-data` → MinIO

### Armazenamento de Arquivos

- Solução: MinIO (self-hosted, API S3-compatible)
- Integração Java: AWS SDK v2 (compatível com MinIO)
- Buckets:
  - `fracexec-docs` → documentos de verificação de executivos
  - `fracexec-profiles` → fotos de perfil
  - `fracexec-contracts` → contratos PDF gerados
- Acesso: URLs pré-assinadas com expiração configurável

### E-mail Transacional

- Integração: `JavaMailSender` via SMTP (mesma implementação em todos os ambientes)
- **Local (dev):** Mailpit em Docker (`axllent/mailpit`) — SMTP em `localhost:1025`, UI em `localhost:8025`
- **Produção:** SendGrid SMTP relay (`smtp.sendgrid.net:587`)
- Troca de ambiente via `application-{profile}.yml` — zero mudança de código
- 8 templates HTML (um por tipo de evento — conforme FR-8.1)
- Disparo via eventos de domínio publicados internamente

```yaml
# application-local.yml
spring.mail.host: localhost
spring.mail.port: 1025

# application-prod.yml
spring.mail.host: smtp.sendgrid.net
spring.mail.port: 587
spring.mail.username: apikey
spring.mail.password: ${SENDGRID_API_KEY}
```

### Gateway de Pagamento

- Serviço: Stripe Connect (modelo marketplace)
- Fluxo: PME paga valor bruto → Stripe retém 18% (platform fee) → transfere líquido ao executivo após delay de 5 dias úteis
- PIX: suportado nativamente via Stripe Payment Intents no Brasil
- Webhook: `POST /api/v1/webhooks/stripe`
  - Eventos: `payment_intent.succeeded`, `transfer.created`, `payment_intent.payment_failed`

### Arquitetura Frontend (Angular 21)

- UI Library: Angular Material (com tema customizado FracExec)
- State management: Angular Signals (nativo)
- HTTP: `HttpClient` + interceptors (auth token, error global)
- Forms: Reactive Forms (Signal Forms diferido — ainda experimental no Angular 21)
- Routing: Angular Router com guards por role
- Portais isolados por prefixo de rota: `/executive/**` | `/company/**` | `/admin/**`

### Infraestrutura & Deploy

- Containerização: Docker + Docker Compose
- Serviços no Compose: `api`, `web` (nginx), `postgresql`, `minio`, `mailpit` (apenas local)
- CI/CD: GitHub Actions (build → test → deploy)
- Logs: Logback com JSON estruturado em produção
- Monitoramento: Spring Boot Actuator (`/health`, `/metrics`)
- `[SUPOSIÇÃO]` Hospedagem produção: VPS ou instância cloud (a definir)

### Sequência de Implementação Recomendada

1. Setup de projetos + Docker Compose + CI/CD
2. Auth (JWT + roles) — desbloqueia todos os endpoints
3. Modelo de dados + migrações Flyway
4. APIs core (candidatura, perfil, PME, match)
5. Conflito de interesses (lógica CNAE)
6. Contrato + Stripe Connect + webhooks
7. MinIO (uploads de documentos)
8. E-mail (JavaMailSender + templates)
9. Dashboards (Executive, PME, Admin)

### Dependências Entre Decisões

- Stripe webhooks exigem endpoint público antes de testar pagamentos em produção
- MinIO precisa de volume Docker persistente em produção
- Refresh tokens no banco são dados pessoais → cobertos pela política LGPD
- Angular Guards dependem do serviço de auth JWT estar implementado

---

## Padrões de Implementação & Regras de Consistência

### Nomenclatura — Backend

**Pacotes (estrutura por feature):**
```
com.fracexec.api.executive/     # candidatura, perfil, verificação
com.fracexec.api.company/       # cadastro PME, necessidades
com.fracexec.api.match/         # match, mediação, conflito
com.fracexec.api.contract/      # contrato, pagamento
com.fracexec.api.notification/  # eventos, e-mail
com.fracexec.api.admin/         # painel operacional
com.fracexec.api.shared/        # auth, exceções, utils
```

**Classes:**

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Entidade JPA | `{Noun}` | `Executive`, `Company` |
| DTO entrada | `{Noun}Request` | `ExecutiveApplicationRequest` |
| DTO saída | `{Noun}Response` | `ExecutiveProfileResponse` |
| Service | interface + `{Noun}ServiceImpl` | `MatchService` / `MatchServiceImpl` |
| Controller | `{Noun}Controller` | `ExecutiveController` |
| Repository | `{Noun}Repository` | `ExecutiveRepository` |
| Exception | `{Noun}Exception` | `ConflictOfInterestException` |

**Banco de dados:**
```
Tabelas:     snake_case plural      executives, companies, engagements
Colunas:     snake_case             created_at, executive_id
FKs:         {table}_id             executive_id (não fk_executive)
Índices:     idx_{table}_{column}   idx_executives_email
Migrations:  V{N}__{desc}.sql       V1__create_executives_table.sql
```

**API REST:**
```
Recursos:     plural kebab-case    /api/v1/executives
IDs:          UUID                 /api/v1/executives/{id}
Query params: camelCase            ?pageSize=20&sortBy=createdAt
```

### Nomenclatura — Frontend (Angular 21)

```
Componentes:  {feature}.component.ts    executive-profile.component.ts
Services:     {noun}.service.ts         executive.service.ts
Guards:       {noun}.guard.ts           auth.guard.ts
Models:       {noun}.model.ts           executive.model.ts
Pipes:        {noun}.pipe.ts            date-br.pipe.ts
```

### Estrutura de Projeto

**Backend — dentro de cada feature package:**
```
executive/
  ExecutiveController.java
  ExecutiveService.java
  ExecutiveServiceImpl.java
  ExecutiveRepository.java
  Executive.java                       # entidade JPA
  ExecutiveApplicationRequest.java
  ExecutiveProfileResponse.java
```

**Frontend — por portal:**
```
src/app/
  executive/    # portal do executivo
  company/      # portal da PME
  admin/        # painel admin
  shared/       # componentes, pipes, services compartilhados
  core/         # auth, interceptors, guards, models base
```

### Padrões de Formato de API

**Sucesso — recurso único:**
```json
{ "id": "uuid", "name": "Marcus Silva", "createdAt": "2026-05-28T10:30:00Z" }
```

**Sucesso — lista paginada:**
```json
{
  "content": [...],
  "page": { "size": 20, "number": 0, "totalElements": 47, "totalPages": 3 }
}
```

**Erro — RFC 7807 Problem Details:**
```json
{
  "type": "https://fracexec.com.br/errors/conflict-of-interest",
  "title": "Conflito de interesse detectado",
  "status": 409,
  "detail": "O executivo já atua em empresa do mesmo segmento na região.",
  "instance": "/api/v1/matches/abc123"
}
```

**Regras de formato:**
- JSON fields: `camelCase`
- Datas: ISO 8601 com timezone — `2026-05-28T10:30:00Z` (nunca timestamp numérico)
- IDs: UUID em todas as entidades públicas (nunca integer sequencial exposto)
- Nulos: `@JsonInclude(NON_NULL)` — campos nulos não enviados na resposta

### Padrões de Comunicação

**Eventos de domínio (backend):**
```java
// Naming: {Noun}{PastTense}Event
ExecutiveApprovedEvent, NeedPostedEvent,
ConflictDetectedEvent, ContractSignedEvent, PaymentProcessedEvent
```

**Estado no Angular:**
```typescript
// Signals nativos — sem NgRx no MVP
executiveProfile = signal<ExecutiveProfile | null>(null);
isLoading = signal<boolean>(false);
```

**HTTP Interceptors obrigatórios (Angular):**
- `AuthInterceptor` — adiciona `Authorization: Bearer {token}` em toda request
- `ErrorInterceptor` — captura erros HTTP globalmente, redireciona 401 para login

### Padrões de Processo

**Erros — Backend:** `@RestControllerAdvice` global; toda exceção de negócio vira Problem Details; nunca expor stack trace em produção.

**Erros — Frontend:** componentes não tratam erros HTTP diretamente; `ErrorInterceptor` trata globalmente; mensagens ao usuário em português sem termos técnicos.

**Loading states:** signal `isLoading` local no componente; skeleton screens para listagens; nunca bloquear UI global para operações parciais.

**Validação:** Bean Validation nas classes `*Request` (backend); Reactive Forms com validação no submit (frontend); nunca confiar apenas na validação frontend.

**Logging:** SLF4J em todo service/controller; **nunca logar PII** (nome, e-mail, CPF, dados financeiros) em plaintext; INFO em produção, DEBUG em dev; JSON estruturado via Logback.

### Regras Mandatórias para Todos os Agentes

1. Estrutura de pacotes por **feature** (não por layer)
2. **UUID** como ID público em todas as entidades
3. Erros no formato **RFC 7807 Problem Details**
4. Datas como **ISO 8601 com timezone**
5. **camelCase** nos campos JSON da API
6. Tabelas e colunas em **snake_case plural**
7. **Migration Flyway** para qualquer mudança de schema
8. **Nunca logar PII** em texto plano
9. **Bean Validation** nas classes `*Request`
10. **Signals** para estado no Angular — não criar Subjects/BehaviorSubjects desnecessários

---

## Estrutura de Projeto & Fronteiras

### Backend — fracexec-api (Spring Boot)

```
fracexec-api/
├── src/main/java/com/fracexec/api/
│   ├── FracExecApiApplication.java
│   ├── executive/                         # F1 + F2
│   │   ├── Executive.java                 # entidade JPA
│   │   ├── ExecutiveController.java
│   │   ├── ExecutiveService.java
│   │   ├── ExecutiveServiceImpl.java
│   │   ├── ExecutiveRepository.java
│   │   ├── ExecutiveApplicationRequest.java
│   │   ├── ExecutiveProfileRequest.java
│   │   └── ExecutiveProfileResponse.java
│   ├── company/                           # F3
│   │   ├── Company.java
│   │   ├── CompanyController.java
│   │   ├── CompanyService.java
│   │   ├── CompanyServiceImpl.java
│   │   ├── CompanyRepository.java
│   │   ├── Need.java
│   │   ├── NeedController.java
│   │   ├── NeedService.java
│   │   ├── NeedServiceImpl.java
│   │   ├── NeedRepository.java
│   │   ├── CompanyRegistrationRequest.java
│   │   ├── NeedRequest.java
│   │   └── NeedResponse.java
│   ├── match/                             # F4 + F5
│   │   ├── Engagement.java
│   │   ├── EngagementController.java
│   │   ├── EngagementService.java
│   │   ├── EngagementServiceImpl.java
│   │   ├── EngagementRepository.java
│   │   ├── ConflictCheck.java
│   │   ├── ConflictCheckService.java
│   │   ├── ConflictCheckServiceImpl.java
│   │   ├── ConflictCheckRepository.java
│   │   ├── MediationMessage.java
│   │   ├── MediationMessageController.java
│   │   ├── MediationMessageService.java
│   │   ├── MediationMessageServiceImpl.java
│   │   ├── MediationMessageRepository.java
│   │   └── ShortlistRequest.java
│   ├── contract/                          # F6
│   │   ├── Contract.java
│   │   ├── ContractController.java
│   │   ├── ContractService.java
│   │   ├── ContractServiceImpl.java
│   │   ├── ContractRepository.java
│   │   ├── Payment.java
│   │   ├── PaymentController.java
│   │   ├── PaymentService.java
│   │   ├── PaymentServiceImpl.java
│   │   ├── PaymentRepository.java
│   │   ├── StripeWebhookController.java
│   │   └── ContractRequest.java
│   ├── notification/                      # F8
│   │   ├── NotificationService.java
│   │   ├── NotificationServiceImpl.java
│   │   ├── EmailTemplateService.java
│   │   └── events/
│   │       ├── ExecutiveApprovedEvent.java
│   │       ├── ExecutiveRejectedEvent.java
│   │       ├── NeedReceivedEvent.java
│   │       ├── ShortlistSentEvent.java
│   │       ├── OpportunityAvailableEvent.java
│   │       ├── MediatedMessageEvent.java
│   │       ├── ContractReadyEvent.java
│   │       └── PaymentProcessedEvent.java
│   ├── admin/                             # F7 (painel admin)
│   │   ├── AdminDashboardController.java
│   │   ├── AdminDashboardService.java
│   │   └── AdminDashboardServiceImpl.java
│   └── shared/
│       ├── auth/
│       │   ├── AuthController.java
│       │   ├── AuthService.java
│       │   ├── AuthServiceImpl.java
│       │   ├── JwtUtil.java
│       │   ├── JwtAuthenticationFilter.java
│       │   ├── RefreshToken.java
│       │   └── RefreshTokenRepository.java
│       ├── exception/
│       │   ├── GlobalExceptionHandler.java
│       │   ├── ResourceNotFoundException.java
│       │   ├── ConflictOfInterestException.java
│       │   └── BusinessRuleException.java
│       ├── storage/
│       │   └── MinioStorageService.java
│       └── config/
│           ├── SecurityConfig.java
│           ├── MinioConfig.java
│           └── OpenApiConfig.java
├── src/main/resources/
│   ├── application.yml
│   ├── application-local.yml
│   ├── application-prod.yml
│   ├── db/migration/
│   │   ├── V1__create_executives_table.sql
│   │   ├── V2__create_companies_table.sql
│   │   ├── V3__create_needs_table.sql
│   │   ├── V4__create_engagements_table.sql
│   │   ├── V5__create_conflict_checks_table.sql
│   │   ├── V6__create_mediation_messages_table.sql
│   │   ├── V7__create_contracts_table.sql
│   │   ├── V8__create_payments_table.sql
│   │   └── V9__create_refresh_tokens_table.sql
│   └── templates/email/
│       ├── application-received.html
│       ├── application-approved.html
│       ├── application-rejected.html
│       ├── need-received.html
│       ├── shortlist-sent.html
│       ├── opportunity-available.html
│       ├── contract-ready.html
│       └── payment-processed.html
└── src/test/java/com/fracexec/api/
    └── (espelha estrutura main — testes de integração por feature)
```

### Frontend — fracexec-web (Angular 21)

```
fracexec-web/
├── src/
│   ├── app/
│   │   ├── app.routes.ts                  # rotas raiz + lazy load por portal
│   │   ├── app.component.ts
│   │   ├── core/
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── role.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts    # Bearer token em toda request
│   │   │   │   └── error.interceptor.ts   # redireciona 401, trata erros globais
│   │   │   └── models/
│   │   │       ├── user.model.ts
│   │   │       └── api-response.model.ts
│   │   ├── executive/                     # portal /executive/**  (F1, F2, F7.1)
│   │   │   ├── executive.routes.ts
│   │   │   ├── application/
│   │   │   │   └── executive-application.component.ts
│   │   │   ├── profile/
│   │   │   │   └── executive-profile.component.ts
│   │   │   ├── dashboard/
│   │   │   │   └── executive-dashboard.component.ts
│   │   │   └── executive.service.ts
│   │   ├── company/                       # portal /company/**  (F3, F7.2)
│   │   │   ├── company.routes.ts
│   │   │   ├── registration/
│   │   │   │   └── company-registration.component.ts
│   │   │   ├── need/
│   │   │   │   └── need-form.component.ts
│   │   │   ├── dashboard/
│   │   │   │   └── company-dashboard.component.ts
│   │   │   └── company.service.ts
│   │   ├── admin/                         # portal /admin/**  (F7.3 + ops F1-F6)
│   │   │   ├── admin.routes.ts
│   │   │   ├── candidates/
│   │   │   │   └── candidate-queue.component.ts
│   │   │   ├── pool/
│   │   │   │   └── executive-pool.component.ts
│   │   │   ├── needs/
│   │   │   │   └── need-queue.component.ts
│   │   │   ├── match/
│   │   │   │   └── shortlist-builder.component.ts
│   │   │   ├── conflicts/
│   │   │   │   └── conflict-review.component.ts
│   │   │   ├── contracts/
│   │   │   │   └── contract-management.component.ts
│   │   │   └── admin.service.ts
│   │   └── shared/
│   │       ├── components/
│   │       │   ├── page-header.component.ts
│   │       │   ├── loading-skeleton.component.ts
│   │       │   └── status-badge.component.ts
│   │       └── pipes/
│   │           └── date-br.pipe.ts
│   ├── styles/
│   │   ├── _theme.scss                    # tema Angular Material FracExec
│   │   └── styles.scss
│   └── environments/
│       ├── environment.ts
│       └── environment.prod.ts
└── nginx.conf                             # proxy reverso + SPA fallback
```

### Docker Compose

**`docker-compose.yml` (base — todos os ambientes):**
```yaml
services:
  api:
    build: ./fracexec-api
    ports: ["8080:8080"]
    environment:
      - SPRING_PROFILES_ACTIVE=${SPRING_PROFILE:-local}
    depends_on: [postgresql, minio]

  web:
    build: ./fracexec-web
    ports: ["80:80"]
    depends_on: [api]

  postgresql:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: fracexec
      POSTGRES_USER: fracexec
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes: [pg_data:/var/lib/postgresql/data]

  minio:
    image: minio/minio:latest
    ports: ["9000:9000", "9001:9001"]
    command: server /data --console-address ":9001"
    volumes: [minio_data:/data]

volumes:
  pg_data:
  minio_data:
```

**`docker-compose.local.yml` (override local — apenas dev):**
```yaml
services:
  mailpit:
    image: axllent/mailpit:latest
    ports: ["1025:1025", "8025:8025"]
```

### Mapeamento FR → Estrutura

| Cluster FR | Package Backend | Portal Frontend | Migrações Flyway |
|------------|----------------|-----------------|-----------------|
| F1 — Candidatura/Verificação | `executive/` | `admin/candidates/` | V1 |
| F2 — Perfil Executivo | `executive/` | `executive/profile/` | V1 |
| F3 — Cadastro PME + Necessidade | `company/` | `company/` | V2, V3 |
| F4 — Match & Mediação | `match/` | `admin/match/`, `admin/needs/` | V4, V6 |
| F5 — Conflito de Interesses | `match/` | `admin/conflicts/` | V5 |
| F6 — Contrato & Pagamento | `contract/` | `admin/contracts/` | V7, V8 |
| F7 — Dashboards | `executive/`, `company/`, `admin/` | todos os portais | — |
| F8 — Notificações | `notification/` | — (e-mail apenas) | — |

### Fronteiras de Integração

```
Browser
  └─► Nginx :80
        ├─► Angular SPA (assets estáticos)
        └─► /api/** → Spring Boot :8080
              ├─► PostgreSQL :5432   (JPA/Flyway)
              ├─► MinIO :9000        (AWS SDK v2 — pre-signed URLs)
              ├─► SMTP :1025/:587    (JavaMailSender)
              └─► Stripe API         (SDK + webhook POST /api/v1/webhooks/stripe)
```

**Fluxos críticos:**
- **Auth:** `POST /api/v1/auth/login` → JWT (15min) + refresh token (7d em DB)
- **Upload de documentos:** Angular solicita pre-signed URL → upload direto ao MinIO (sem passar pela API)
- **Pagamento:** PME paga via Stripe → webhook `payment_intent.succeeded` → Spring processa repasse
- **E-mail:** evento de domínio publicado no Spring → `NotificationServiceImpl` consome → `JavaMailSender` envia via SMTP

---

## Resultados da Validação da Arquitetura

### Validação de Coerência ✅

**Compatibilidade das Decisões:**
Todas as 10 combinações críticas de tecnologia validadas sem conflitos. Stack coerente do banco ao browser: PostgreSQL → JPA/Flyway → Spring Security 6 JWT → REST RFC 7807 → Angular 21 Signals/Material → Nginx. Virtual Threads (Loom) disponíveis para I/O intensivo sem alteração de padrão de código.

**Consistência de Padrões:**
Nomenclatura uniforme em todos os 6 packages de feature (Request/Response/ServiceImpl/Repository). Eventos de domínio com 8 tipos cobrindo exatamente os 8 disparadores de e-mail do FR-8.1. UUID em todas as entidades públicas; sem integer sequencial exposto.

**Alinhamento da Estrutura:**
Feature packages espelham os clusters do PRD. Portais Angular isolados por prefixo de rota com lazy-load. Fronteira Nginx → `/api/**` → Spring Boot separa SPA de API com clareza.

### Validação de Cobertura de Requisitos ✅

**Cobertura Funcional:**
Todos os 35+ FRs dos 8 clusters (F1–F8) têm suporte arquitetural direto: entidade JPA + repository + service + controller no backend, componente dedicado no portal Angular correto, e migration Flyway correspondente.

**Cobertura de Requisitos Não-Funcionais:**
NFR-1 (LGPD): sem PII em logs, URLs pré-assinadas para documentos. NFR-3 (Segurança): TLS no Nginx, BCrypt, JWT stateless. NFR-4 (Capacidade): stack padrão adequado para 300 exec + 150 PMEs. NFR-6 (Performance): OnPush + lazy-load + Nginx cache.

### Validação de Prontidão para Implementação ✅

**Completude das Decisões:**
Tecnologias com versões explícitas, sequência de 9 etapas com dependências mapeadas, exemplos concretos para todos os padrões. 10 regras mandatórias para agentes de IA.

**Completude da Estrutura:**
Árvore de diretórios completa com nomes de arquivo definidos. 9 migrations Flyway nomeadas. 8 templates de e-mail mapeados ao FR-8.1. Docker Compose base + override local.

**Completude dos Padrões:**
Tratamento de erros (RFC 7807 + ErrorInterceptor), loading states (Signals + skeleton), logging (SLF4J JSON sem PII) e validação (Bean Validation + Reactive Forms) completamente especificados.

### Análise de Lacunas

**Lacunas Importantes (não bloqueantes):**
- Pipeline CI/CD (GitHub Actions): jobs de build/test/deploy não detalhados — agente de setup inferirá.
- Criação inicial dos buckets MinIO: mecanismo (startup bean vs. script) não especificado.

**Lacunas Menores:**
- `nginx.conf` referenciado mas não exemplificado.
- Estratégia de testes de integração (Testcontainers) deferida para Story de setup.

### Checklist de Completude da Arquitetura

**Análise de Requisitos**
- [x] Contexto do projeto analisado em profundidade
- [x] Escala e complexidade avaliados
- [x] Restrições técnicas identificadas
- [x] Preocupações transversais mapeadas

**Decisões Arquiteturais**
- [x] Decisões críticas documentadas com versões
- [x] Stack tecnológico completamente especificado
- [x] Padrões de integração definidos
- [x] Considerações de performance abordadas

**Padrões de Implementação**
- [x] Convenções de nomenclatura estabelecidas
- [x] Padrões de estrutura definidos
- [x] Padrões de comunicação especificados
- [x] Padrões de processo documentados

**Estrutura de Projeto**
- [x] Estrutura de diretórios completa definida
- [x] Fronteiras de componentes estabelecidas
- [x] Pontos de integração mapeados
- [x] Mapeamento de requisitos para estrutura completo

### Avaliação de Prontidão da Arquitetura

**Status Geral:** PRONTO PARA IMPLEMENTAÇÃO

**Nível de Confiança:** Alto — todas as 16 verificações do checklist confirmadas; nenhuma lacuna crítica encontrada.

**Pontos Fortes:**
- Separação limpa de portais por role (Executive / PME / Admin) com lazy-load
- Estratégia de e-mail sem mudança de código entre ambientes (Mailpit local → SendGrid prod)
- Conflito de interesses como feature estruturada (CNAE 2 dígitos + região), não tratamento manual
- Stripe Connect resolve automaticamente a janela de escrow de 5 dias e o split de 18%
- 10 regras mandatórias explícitas garantem consistência entre múltiplos agentes de IA

**Áreas para Evolução Futura:**
- Pipeline CI/CD detalhado (fases de build, test, staging, prod)
- Testcontainers para testes de integração com banco real
- Configuração explícita de Nginx (`nginx.conf`)
- Observabilidade avançada (Prometheus + Grafana) pós-MVP

### Handoff para Implementação

**Diretrizes para Agentes de IA:**
- Seguir todas as decisões arquiteturais exatamente como documentadas
- Usar os padrões de implementação consistentemente em todos os componentes
- Respeitar a estrutura de projeto e as fronteiras definidas
- Consultar este documento para todas as decisões arquiteturais

**Primeira Prioridade de Implementação:**
Inicialização dos dois projetos + Docker Compose (Etapa 1 da sequência recomendada):
```bash
# Backend
curl -G https://start.spring.io/starter.zip \
  -d dependencies=web,data-jpa,security,validation,postgresql,flyway,actuator \
  -d javaVersion=21 -d bootVersion=3.5.11 \
  -d groupId=com.fracexec -d artifactId=fracexec-api \
  -d packaging=jar -d type=maven-project \
  -o fracexec-api.zip

# Frontend
ng new fracexec-web --routing --style=scss --ssr=false
```
