---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - bmad-output/planning-artifacts/prds/prd-fracexec-2026-05-28/prd.md
  - bmad-output/planning-artifacts/architecture.md
  - bmad-output/planning-artifacts/ux-designs/ux-FracExec-2026-05-29/DESIGN.md
  - bmad-output/planning-artifacts/ux-designs/ux-FracExec-2026-05-29/EXPERIENCE.md
project_name: FracExec
date: 2026-05-29
---

# FracExec - Epic Breakdown

## Overview

Este documento contém o detalhamento completo de épicos e histórias do FracExec, decompondo os requisitos do PRD, DESIGN.md, EXPERIENCE.md e Architecture em histórias implementáveis para o agente desenvolvedor.

---

## Requirements Inventory

### Functional Requirements

FR-1.1: O sistema disponibiliza formulário de candidatura para executivos com: nome completo, e-mail, LinkedIn, cargos C-Level anteriores (empresa, período, tamanho da equipe, receita sob gestão), mínimo 2 referências (nome, cargo, contato), e motivação (texto livre).
FR-1.2: O time operacional acessa painel administrativo com fila de candidaturas em estados: Pendente → Em Análise → Aprovado / Rejeitado.
FR-1.3: O sistema envia e-mail de confirmação ao candidato com prazo estimado de resposta.
FR-1.4: [SUPOSIÇÃO] SLA de análise: 10 dias úteis a partir do recebimento.
FR-1.5: O time registra notas de verificação e pode anexar documentos de suporte.
FR-1.6: O sistema notifica o candidato por e-mail com resultado: aprovação (com link para perfil e Selo FracExec) ou rejeição (com motivo genérico).
FR-1.7: Executivos aprovados podem recandidatar-se após 6 meses em caso de rejeição.

FR-2.1: O executivo aprovado preenche perfil com: foto, especialidades C-Level, setores de experiência, disponibilidade em dias/mês, bio (máx. 300 palavras), resumo de experiência verificada.
FR-2.2: [SUPOSIÇÃO] Nomes de empresas anteriores são visíveis no perfil interno (admin), mas opcionalmente anonimizados no perfil enviado às PMEs.
FR-2.3: O executivo pode atualizar disponibilidade a qualquer momento (ativo, pausado, indisponível).
FR-2.4: O sistema impede que executivo com disponibilidade zero seja incluído em novas sugestões.

FR-3.1: Formulário de cadastro de PME: razão social, CNPJ, setor (lista + livre), número de funcionários (faixa), faturamento anual (faixa), nome e e-mail do responsável.
FR-3.2: Após cadastro aprovado, PME posta "Necessidade" com: tipo de C-Level, escopo (dias/mês + duração estimada), descrição do desafio, contexto confidencial (visível apenas ao time).
FR-3.3: O sistema notifica a PME com confirmação de recebimento e SLA de retorno.
FR-3.4: [SUPOSIÇÃO] SLA de retorno com shortlist: 5 dias úteis.
FR-3.5: PME pode ter apenas 1 necessidade ativa por vez no MVP.

FR-4.1: O time operacional acessa visão estruturada da necessidade da PME no painel admin, com filtros na pool: especialidade, disponibilidade, setor, localização.
FR-4.2: O time monta shortlist de 2–4 executivos por necessidade.
FR-4.3: Verificação de conflito de interesses é obrigatória antes de incluir executivo na shortlist.
FR-4.4: PME recebe perfis anonimizados dos executivos sugeridos (sem nome nem empresa).
FR-4.5: PME seleciona até 2 executivos de interesse.
FR-4.6: FracExec notifica executivos selecionados com brief anonimizado da PME.
FR-4.7: Executivo declara interesse ou declina dentro de 3 dias úteis.
FR-4.8: [SUPOSIÇÃO] Se ambos os executivos declinarem, FracExec realiza novo ciclo.
FR-4.9: Toda comunicação pré-contrato é mediada pelo time FracExec via thread de mensagens. Sem contato direto entre as partes até assinatura.
FR-4.10: O sistema mantém histórico completo de todas as mensagens mediadas por engajamento.

FR-5.1: O sistema mantém registro interno de clientes ativos de cada executivo: setor (CNAE 2 dígitos), faixa de porte (funcionários), e região (estado + cidade).
FR-5.2: Ao incluir executivo em shortlist, sistema verifica sobreposição com clientes ativos. Critério: mesmo CNAE (2 dígitos) e mesma região = alerta.
FR-5.3: O alerta é revisado pelo time FracExec antes de qualquer comunicação com a PME.
FR-5.4: Se o time confirmar o conflito, o executivo é excluído da shortlist sem notificação à PME.
FR-5.5: Se o time decidir apresentar o executivo mesmo com sobreposição, a PME é notificada com alerta genérico sem revelar nomes.
FR-5.6: A PME pode aceitar o risco ou solicitar substituição.
FR-5.7: Ao firmar contrato, o executivo declara formalmente os clientes atuais (setor/porte/região). Essa declaração alimenta o registro de FR-5.1.

FR-6.1: O time FracExec gera contrato padronizado pré-preenchido com: partes identificadas, escopo, valor, parcelas, confidencialidade, declaração de conflito, condições de rescisão.
FR-6.2: Assinatura via PDF enviado por e-mail com confirmação de aceite por resposta.
FR-6.3: Pagamento recorrente mensal configurado via PIX agendado ou cartão de crédito (Stripe).
FR-6.4: Após confirmação de entrega mensal — ou decorridos 5 dias úteis sem disputa — o sistema processa o repasse ao executivo com taxa já deduzida.
FR-6.5: Taxa da plataforma: 18% sobre o valor mensal do contrato, deduzida do repasse ao executivo.
FR-6.6: O sistema emite comprovante de pagamento para PME e extrato de repasse para o executivo.
FR-6.7: Disputas são resolvidas diretamente entre PME e executivo. FracExec não atua como árbitro.

FR-7.1: Dashboard do Executivo: engajamentos ativos (empresa anonimizada, escopo, próximas sessões), status de pagamentos e histórico de repasses, disponibilidade atual (com edição rápida), oportunidades abertas aguardando resposta.
FR-7.2: Dashboard da PME: necessidade ativa e seu status no funil, executivo(s) contratado(s), histórico de pagamentos e contratos, log de comunicações mediadas.
FR-7.3: Painel Admin: fila de candidaturas (busca e filtros), pool de executivos ativos (filtros), fila de necessidades de PMEs, registro de conflitos, contratos ativos e pipeline de pagamentos, métricas básicas.

FR-8.1: E-mail automático disparado em 8 eventos: candidatura recebida (executivo), candidatura aprovada/rejeitada (executivo), necessidade recebida (PME), shortlist enviada (PME), oportunidade disponível (executivo), nova mensagem mediada (PME ou executivo), contrato pronto para assinatura (ambos), pagamento processado (ambos).
FR-8.2: [SUPOSIÇÃO] Sem notificações push mobile no MVP.

### NonFunctional Requirements

NFR-1: LGPD — dados pessoais coletados com consentimento explícito. Direito de exclusão em até 30 dias. Documentos de verificação com acesso restrito ao time operacional. Nunca logar PII em texto plano.
NFR-2: Web app responsivo compatível com Chrome, Firefox, Edge e Safari (versões dos últimos 2 anos). Sem suporte a IE.
NFR-3: HTTPS obrigatório em todas as superfícies (terminação no Nginx). Autenticação com senha + e-mail + JWT. Documentos em cloud storage com URL pré-assinada.
NFR-4: Capacidade MVP: até 300 executivos e 150 PMEs simultâneas. Stack padrão sem requisitos especiais de escala.
NFR-5: 99% de uptime mensal. Janelas de manutenção comunicadas com 48h de antecedência.
NFR-6: Tempo de carregamento de páginas principais < 3 segundos em conexão 4G.

### Additional Requirements

- **Starter Template Backend:** Spring Initializr — `curl -G https://start.spring.io/starter.zip -d dependencies=web,data-jpa,security,validation,postgresql,flyway,actuator -d javaVersion=21 -d bootVersion=3.5.11 -d groupId=com.fracexec -d artifactId=fracexec-api -d packaging=jar -d type=maven-project -o fracexec-api.zip`
- **Starter Template Frontend:** `ng new fracexec-web --routing --style=scss --ssr=false`
- **Docker Compose:** serviços `api`, `web (nginx)`, `postgresql`, `minio`; override local com `mailpit`
- **JWT Auth:** access token 15min, refresh token 7 dias em tabela `refresh_tokens`, Spring Security 6, roles EXECUTIVE/PME/ADMIN
- **Banco de dados:** PostgreSQL 16+, Flyway migrations V1–V9, HikariCP connection pool
- **MinIO:** 3 buckets (`fracexec-docs`, `fracexec-profiles`, `fracexec-contracts`), AWS SDK v2, URLs pré-assinadas
- **E-mail:** JavaMailSender via SMTP — Mailpit local (porta 1025) / SendGrid prod (porta 587), 8 templates HTML
- **Stripe Connect:** modelo marketplace, 18% platform fee, PIX via Payment Intents, webhook `POST /api/v1/webhooks/stripe`
- **API:** REST `/api/v1/...`, Springdoc OpenAPI 3, RFC 7807 Problem Details, CORS restrito ao domínio frontend
- **Estrutura de pacotes:** feature-based — `executive/`, `company/`, `match/`, `contract/`, `notification/`, `admin/`, `shared/`
- **Padrões obrigatórios:** UUID como ID público, camelCase em JSON, snake_case em BD, Bean Validation em `*Request`, Signals no Angular, nunca logar PII
- **CI/CD:** GitHub Actions (build → test → deploy)
- **Monitoramento:** Spring Boot Actuator `/health`, `/metrics`; Logback JSON estruturado em produção

### UX Design Requirements

UX-DR1: Configurar Angular Material v3 com tema customizado FracExec — tokens de cor (brand.primary #132A1E, brand.accent #4DC78A), tipografia (Plus Jakarta Sans + Inter + JetBrains Mono via Google Fonts), e aplicar em `_theme.scss`.
UX-DR2: Implementar componente `SealBannerComponent` — banner persistente no topo do portal do executivo com estados Ativo/Inativo/Suspenso, ícone ✦ e badge de status; não dismissível.
UX-DR3: Implementar skeleton screens (`LoadingSkeletonComponent`) para todas as superfícies com carregamento de dados — variantes: card, lista, tabela. Nunca usar spinner bloqueante de tela cheia.
UX-DR4: Implementar componente de perfil anonimizado (`AnonProfileComponent`) — exibe especialidade, setores, disponibilidade e bio sem revelar nome/empresa; avatar com iniciais do setor.
UX-DR5: Implementar interface split-view para o Construtor de Shortlist — pool filtrada à esquerda, shortlist em construção à direita (máx. 4 posições); detecção de conflito automática ao adicionar executivo.
UX-DR6: Implementar componente `MediationThreadComponent` — histórico de mensagens agrupado por data, identificação de papel (FracExec/PME/Executivo) sem revelar nomes, campo de entrada apenas para ADMIN.
UX-DR7: Implementar `NeedFunnelComponent` — funil de status da necessidade com 5 estados (Recebida → Em análise → Shortlist enviada → Em mediação → Contratado) como stepper visual no dashboard da PME.
UX-DR8: Implementar `ConflictAlertComponent` — banner laranja não-bloqueante exibido acima do perfil anonimizado quando há sobreposição detectada; texto padrão conforme FR-5.5.
UX-DR9: Implementar formulário de candidatura pública como stepper multi-etapa (3 steps): dados pessoais, histórico C-Level (campos repetíveis), referências + motivação. Validação por etapa ao avançar.
UX-DR10: Criar set de tags semânticas reutilizáveis (`StatusBadgeComponent`): sector, status-active, status-pending, status-warning, neutral — usadas consistentemente em todas as listas e dashboards.
UX-DR11: Implementar expansão inline (acordeão) nas filas admin (`CandidateQueueComponent`, `NeedQueueComponent`) — expandir item exibe detalhes e ações sem navegação para página de detalhe.
UX-DR12: Implementar widget de disponibilidade com barra de progresso e CTA de edição rápida via drawer lateral — sem navegação completa para atualizar disponibilidade (FR-2.3).
UX-DR13: Garantir contraste WCAG AA mínimo em toda a plataforma. Verificados: brand.primary/#FFFFFF 14:1 ✅, brand.accent/brand.primary 7.2:1 ✅, text.secondary/#FFFFFF 5.1:1 ✅.
UX-DR14: Implementar outline de foco visível em todos os elementos interativos — `outline: 2px solid #4DC78A; outline-offset: 2px` — e `aria-label` em todos os ícones sem texto adjacente.

### FR Coverage Map

| Requisito | Épico |
|-----------|-------|
| FR-1.1 a FR-1.7 | Epic 2 — Candidatura pública + fila admin |
| FR-2.1 a FR-2.4 | Epic 2 — Perfil executivo + disponibilidade |
| FR-3.1 a FR-3.5 | Epic 3 — Cadastro PME + postagem de necessidade |
| FR-4.1 a FR-4.10 | Epic 4 — Match, shortlist, mediação |
| FR-5.1 a FR-5.6 | Epic 4 — Conflito de interesses |
| FR-5.7 | Epic 5 — Declaração no contrato |
| FR-6.1 a FR-6.7 | Epic 5 — Contrato e pagamentos |
| FR-7.1 | Epic 5 (pagamentos) + Epic 6 (completo) |
| FR-7.2 | Epic 3 (funil) + Epic 5 (pagamentos) + Epic 6 (completo) |
| FR-7.3 | Epic 6 — Painel admin completo |
| FR-8.1 eventos 1–3 | Epic 2 — Emails candidatura |
| FR-8.1 evento 4 | Epic 3 — Email necessidade |
| FR-8.1 eventos 5–6 | Epic 4 — Emails match/mediação |
| FR-8.1 eventos 7–8 | Epic 5 — Emails contrato/pagamento |
| FR-8.2 | Epic 6 — Sem push mobile MVP |
| NFR-1 (LGPD) | Epic 2 (consentimento) + Epic 6 (exclusão) |
| NFR-2, NFR-3, NFR-4 | Epic 1 — Infraestrutura base |
| NFR-5, NFR-6 | Epic 6 — Produção |
| UX-DR1, UX-DR3, UX-DR10, UX-DR13, UX-DR14 | Epic 1 — Theme + shared components |
| UX-DR2, UX-DR9, UX-DR11, UX-DR12 | Epic 2 — Executive portal UX |
| UX-DR7 | Epic 3 — SMB funnel UX |
| UX-DR4, UX-DR5, UX-DR6, UX-DR8 | Epic 4 — Match UX |
| Todos os requisitos de arquitetura | Epic 1 — Foundation |

## Epic List

### Epic 1: Foundation & Infrastructure
Ambiente de desenvolvimento funciona localmente; usuários podem se registrar e autenticar com os três roles (EXECUTIVE/PME/ADMIN); shells dos três portais acessíveis mas vazios; design system FracExec configurado.
**FRs cobertos:** NFR-2, NFR-3 (base), NFR-4 (base), todos os requisitos de arquitetura (starter templates, Docker Compose, PostgreSQL + Flyway, JWT, MinIO, JavaMailSender base, Stripe base, Springdoc, CORS, pacotes feature-based, CI/CD, Actuator base), UX-DR1, UX-DR3, UX-DR10, UX-DR13, UX-DR14

### Epic 2: Executive Application & Active Profile
Um executivo pode se candidatar publicamente via stepper multi-etapa; o time admin pode revisar na fila inline, aprovar ou rejeitar; o executivo aprovado cria e mantém seu perfil com disponibilidade gerenciada via drawer; emails de candidatura disparados automaticamente.
**FRs cobertos:** FR-1.1, FR-1.2, FR-1.3, FR-1.4, FR-1.5, FR-1.6, FR-1.7, FR-2.1, FR-2.2, FR-2.3, FR-2.4, FR-8.1 (eventos 1–3), NFR-1 (consentimento LGPD), UX-DR2, UX-DR9, UX-DR11, UX-DR12

### Epic 3: SMB Registration & Need Posting
Uma PME pode se cadastrar e postar uma necessidade com escopo, desafio e contexto confidencial; o time admin vê a fila de necessidades; a PME acompanha o funil de status (5 estados) no dashboard; e-mail de confirmação com SLA de 5 dias disparado.
**FRs cobertos:** FR-3.1, FR-3.2, FR-3.3, FR-3.4, FR-3.5, FR-7.2 (parcial — funil de status), FR-8.1 (evento 4), UX-DR7

### Epic 4: Match, Shortlist & Mediation
O time admin constrói shortlists no split-view com detecção automática de conflito de interesses (CNAE 2 dígitos + região); PMEs revisam perfis anonimizados e selecionam executivos; executivos declaram interesse ou declinam; toda comunicação pré-contrato é mediada via thread; histórico completo mantido.
**FRs cobertos:** FR-4.1, FR-4.2, FR-4.3, FR-4.4, FR-4.5, FR-4.6, FR-4.7, FR-4.8, FR-4.9, FR-4.10, FR-5.1, FR-5.2, FR-5.3, FR-5.4, FR-5.5, FR-5.6, FR-8.1 (eventos 5–6), UX-DR4, UX-DR5, UX-DR6, UX-DR8

### Epic 5: Contract, Payments & Engagements
Partes assinam contrato padronizado gerado pelo admin; pagamentos recorrentes processados via Stripe/PIX; repasse ao executivo com 18% deduzido após janela de 5 dias sem disputa; comprovantes e extratos emitidos; identidades reveladas após assinatura; declaração de conflito alimenta o registro.
**FRs cobertos:** FR-5.7, FR-6.1, FR-6.2, FR-6.3, FR-6.4, FR-6.5, FR-6.6, FR-6.7, FR-7.1 (parcial — pagamentos/repasses), FR-7.2 (parcial — pagamentos/contratos), FR-8.1 (eventos 7–8)

### Epic 6: Complete Dashboards, Admin Operations & Production Readiness
Todos os três portais têm dashboards completos com dados reais; admin tem visibilidade operacional completa (métricas, pipeline de pagamentos, pool com filtros); direito de exclusão LGPD em 30 dias implementado; CI/CD, Actuator e Logback JSON configurados para produção.
**FRs cobertos:** FR-7.1 (completo), FR-7.3 (completo), FR-8.2, NFR-1 (exclusão de dados), NFR-5, NFR-6, CI/CD GitHub Actions, Actuator `/health` e `/metrics`, Logback JSON estruturado

---

## Epic 1: Foundation & Infrastructure

Ambiente de desenvolvimento funciona localmente; usuários podem se registrar e autenticar com os três roles (EXECUTIVE/PME/ADMIN); shells dos três portais acessíveis mas vazios; design system FracExec configurado.

### Story 1.1: Project Bootstrap & Local Dev Environment

Como desenvolvedor,
quero um ambiente Docker Compose com todos os serviços rodando localmente,
para que eu possa desenvolver e testar funcionalidades em isolamento.

**Acceptance Criteria:**

**Dado** o repositório clonado, **quando** `docker-compose up` for executado, **então** todos os serviços sobem healthy: `api` (Spring Boot), `web` (Nginx + Angular), `postgresql`, `minio`, `mailpit`

**Dado** a API rodando, **quando** GET `/actuator/health` for chamado, **então** retorna `{"status":"UP"}`

**Dado** o banco inicializado, **quando** Flyway executar, **então** migration V1 (baseline do schema) completa sem erros

**Dado** o MinIO rodando, **então** os 3 buckets existem: `fracexec-docs`, `fracexec-profiles`, `fracexec-contracts`

**Dado** o Mailpit rodando, **então** SMTP está disponível na porta 1025 e web UI na porta 8025

**Dado** o projeto Spring Boot, **então** a estrutura feature-based existe: `com.fracexec.api.{executive, company, match, contract, notification, admin, shared}`

**Dado** o projeto Angular, **então** a estrutura `ng new fracexec-web --routing --style=scss --ssr=false` existe com módulos lazy-loaded para cada portal

**Dado** qualquer request ao backend, **então** o CORS aceita apenas o domínio frontend configurado

**Dado** a aplicação configurada, **então** todas as credenciais sensíveis (DB password, MinIO secret key, JWT secret, Stripe API key) são lidas de variáveis de ambiente — nunca hardcodadas no código ou em arquivos versionados; `.env.example` existe no repositório com as chaves necessárias sem valores reais

**Dado** as migrações Flyway, **então** V1–V6 são criadas pelos épicos 1–5 conforme especificado; V7–V9 são slots reservados para futuras extensões — não são criadas neste projeto; `flyway_schema_history` deve conter exatamente as versões V1–V6 ao final do Epic 5

---

### Story 1.2: User Authentication & Role System

Como usuário (executivo, PME ou admin),
quero me registrar, fazer login e acessar meu portal correspondente ao meu role,
para que apenas usuários autenticados com o role correto acessem os recursos protegidos.

**Acceptance Criteria:**

**Dado** um novo usuário, **quando** POST `/api/v1/auth/register` for chamado com `{email, password, role}`, **então** o usuário é criado e retorna access token (15min) + refresh token (7 dias)

**Dado** POST `/api/v1/auth/register` com `role = ADMIN`, **então** o backend retorna 400 — role ADMIN só pode ser criado via script de seed interno ou por outro ADMIN autenticado; nunca via endpoint público

**Dado** um usuário registrado, **quando** POST `/api/v1/auth/login` com credenciais válidas, **então** retorna JWT access token + refresh token gravado na tabela `refresh_tokens` (Flyway V2)

**Dado** um access token expirado, **quando** POST `/api/v1/auth/refresh` com refresh token válido, **então** retorna novo access token

**Dado** um refresh token inválido ou expirado, **quando** POST `/api/v1/auth/refresh`, **então** retorna 401

**Dado** request a `/api/v1/executive/**` sem JWT, **então** Spring Security retorna 401

**Dado** JWT com role PME, **quando** acessar `/api/v1/admin/**`, **então** retorna 403

**Dado** o schema do banco, **então** tabelas `users` e `refresh_tokens` existem (Flyway V2) com campos corretos

**Dado** qualquer fluxo de autenticação, **então** passwords são armazenadas como bcrypt — nunca texto plano, nunca logadas

**Dado** POST `/api/v1/auth/forgot-password` com e-mail cadastrado, **então** envia e-mail com link de redefinição (token único de uso único, validade 1 hora); se e-mail não encontrado, retorna 200 com a mesma mensagem genérica (sem enumerar usuários existentes)

**Dado** POST `/api/v1/auth/reset-password` com token válido e nova senha, **então** atualiza senha, invalida o token, invalida todos os refresh tokens ativos do usuário; retorna 200

**Dado** POST `/api/v1/auth/reset-password` com token expirado ou já utilizado, **então** retorna 400 com mensagem: "Link de redefinição inválido ou expirado. Solicite um novo."

**Dado** a tela `/forgot-password` no Angular, **então** é pública, sem autenticação; exibe campo de e-mail + botão "Enviar instruções"; após submissão, exibe mensagem: "Se o e-mail estiver cadastrado, você receberá as instruções em instantes." — independente de o e-mail existir ou não

---

### Story 1.3: FracExec Angular Design System

Como desenvolvedor,
quero Angular Material v3 configurado com tokens FracExec e componentes compartilhados,
para que todos os portais tenham identidade visual consistente com o design spec.

**Acceptance Criteria:**

**Dado** `_theme.scss`, **então** Angular Material tem `brand.primary: #132A1E` como paleta primária e `brand.accent: #4DC78A` como accent

**Dado** o carregamento da aplicação, **então** Plus Jakarta Sans (400–800), Inter (400–600) e JetBrains Mono (400–500) são carregadas via Google Fonts

**Dado** `StatusBadgeComponent` com input `variant`, **então** renderiza 5 variantes: `sector` (brand.accent_light/brand.deep), `status-active` (success), `status-pending` (warning), `status-warning` (warning), `neutral` (surface.muted/text.secondary) — todas com fonte bold 700 uppercase xs tracking

**Dado** `LoadingSkeletonComponent` com input `type`, **então** renderiza 3 variantes: `card`, `list`, `table` — com mesmas dimensões estruturais do conteúdo real

**Dado** qualquer elemento interativo, **então** o focus outline é `2px solid #4DC78A; outline-offset: 2px`

**Dado** os tokens de contraste, **então** `brand.primary #132A1E` sobre `#FFFFFF` ≥ 14:1 ✅ e `brand.accent #4DC78A` sobre `brand.primary` ≥ 7.2:1 ✅

**Dado** qualquer ícone de ação sem texto adjacente, **então** possui `aria-label` descritivo

---

### Story 1.4: Portal Shells & Navigation

Como usuário autenticado,
quero ver meu portal correspondente ao role com navegação lateral,
para que eu possa navegar entre seções após o login.

**Acceptance Criteria:**

**Dado** usuário com role EXECUTIVE logado, **então** é redirecionado para `/executive/dashboard` com sidebar: Dashboard, Engajamentos, Oportunidades, Pagamentos, Perfil

**Dado** usuário com role PME logado, **então** é redirecionado para `/company/dashboard` com sidebar: Dashboard, Necessidade ativa, Executivo contratado, Pagamentos, Mensagens

**Dado** usuário com role ADMIN logado, **então** é redirecionado para `/admin/dashboard` com sidebar: Dashboard, Candidaturas, Pool, Necessidades, Conflitos, Engajamentos, Contratos

**Dado** navegação para portal lazy-loaded pela primeira vez, **então** Angular carrega apenas o bundle daquele portal

**Dado** rota protegida acessada sem autenticação, **então** redirect para `/login`

**Dado** JWT de role PME tentando acessar `/admin/**`, **então** redirect para `/company/dashboard`

**Dado** qualquer dashboard ainda sem dados, **então** exibe `LoadingSkeletonComponent` adequado — nunca spinner bloqueante de tela cheia

**Dado** item de navegação ativo, **então** exibe `border-left: 3px solid #4DC78A; background: rgba(77,199,138,0.10); color: #4DC78A`

**Dado** o sidebar footer, **então** exibe avatar circular (brand.accent bg) com iniciais do usuário, nome e role

**Dado** qualquer chamada API retornar status 5xx, **então** o Angular exibe banner global não-obstrutivo no topo: "Serviço temporariamente indisponível. Tente novamente em instantes." — sem redirecionar ou travar a navegação; erros 401 redirecionam para `/login`

---

## Epic 2: Executive Application & Active Profile

Um executivo pode se candidatar publicamente; o time admin pode revisar, aprovar ou rejeitar; o executivo aprovado cria e mantém seu perfil com disponibilidade gerenciada; emails de candidatura disparados automaticamente.

### Story 2.1: Public Application Form (Stepper)

Como executivo C-Level,
quero preencher um formulário público de candidatura em 3 etapas,
para que eu possa me candidatar ao FracExec e receber confirmação imediata.

**Acceptance Criteria:**

**Dado** `/apply` acessada sem autenticação, **então** a página é pública e renderiza o stepper com 3 etapas visíveis no topo

**Dado** Etapa 1, **então** contém: nome completo, e-mail, LinkedIn — com validação de URL do LinkedIn ao avançar

**Dado** Etapa 2, **então** contém blocos repetíveis de histórico C-Level: empresa (opcional — campo anota que será anonimizado), período (início/fim), tamanho de equipe, receita sob gestão; botão "Adicionar cargo" insere novo bloco; mínimo 1 bloco obrigatório

**Dado** Etapa 3, **então** contém: mínimo 2 referências (nome, cargo, contato) + texto livre de motivação + checkbox LGPD sem pré-preenchimento com link para política de privacidade (NFR-1)

**Dado** botão "Próxima etapa" clicado, **então** valida apenas os campos da etapa atual — não avança com campos obrigatórios vazios

**Dado** o formulário submetido com todos os campos válidos e LGPD marcado, **então** cria candidatura com status PENDING (Flyway V3 — tabela `executive_applications`), exibe tela de confirmação: "Candidatura recebida. Retorno em até 10 dias úteis."

**Dado** a candidatura criada, **então** email de confirmação é enviado ao candidato (FR-1.3) com prazo estimado de 10 dias úteis

**Dado** o formulário submetido, **então** nenhum PII é logado no backend

**Dado** POST `/api/v1/applications` com e-mail já existente em candidatura com status PENDING ou UNDER_REVIEW, **então** backend retorna 409 com mensagem: "Você já possui uma candidatura em análise."

**Dado** campo "receita sob gestão" em bloco de histórico C-Level, **então** o campo é opcional — não bloqueia submissão se vazio; placeholder: "Ex: R$50M (deixe em branco se não aplicável)"

**Dado** os e-mails automáticos do sistema, **então** existem 8 templates HTML nomeados: `application-received`, `application-approved`, `application-rejected`, `need-received`, `shortlist-sent`, `opportunity-available`, `contract-ready`, `payment-processed`; cada template segue estrutura: header com gradiente brand.primary, logo FracExec, corpo em Inter 14px, botão CTA primário, rodapé com link para política de privacidade; tom segue EXPERIENCE.md Voice and Tone — direto, profissional, sem juridiquês

---

### Story 2.2: Admin Candidacy Queue with Inline Expansion

Como operador admin,
quero ver a fila de candidaturas com preview expansível inline,
para que eu possa triagem e iniciar análise sem sair da lista.

**Acceptance Criteria:**

**Dado** `/admin/candidates`, **então** exibe lista com colunas: nome, e-mail, data de entrada, status (tag colorida), ação principal

**Dado** item na lista, **quando** clicado para expandir (UX-DR11), **então** abre acordeão inline mostrando: LinkedIn, resumo de histórico C-Level, referências, motivação — sem navegação para outra página

**Dado** candidatura com status PENDING expandida, **então** exibe botão "Iniciar análise"

**Dado** "Iniciar análise" clicado, **então** status muda para UNDER_REVIEW e tag atualiza inline (tag azul "Em análise") — sem reload da página

**Dado** filtros disponíveis, **então** a fila pode ser filtrada por: status (PENDING/UNDER_REVIEW/APPROVED/REJECTED), data de entrada (intervalo), busca por nome

**Dado** filtros aplicados, **então** persistem via query params durante a sessão

**Dado** a fila vazia após filtros, **então** exibe estado vazio: "Nenhuma candidatura encontrada com esses critérios. [Ajustar filtros]"

---

### Story 2.3: Candidacy Review, Decision & Notification

Como operador admin,
quero revisar o detalhe completo de uma candidatura, adicionar notas e decidir aprovação ou rejeição,
para que o executivo seja notificado com o resultado e o processo seja documentado.

**Acceptance Criteria:**

**Dado** `/admin/candidates/:id`, **então** exibe: todos os dados do formulário, histórico C-Level completo, referências, motivação, status atual, notas internas (campo editável), upload de documentos de suporte (MinIO bucket `fracexec-docs`, URLs pré-assinadas FR-1.5)

**Dado** botão "Aprovar" clicado, **então** abre modal de confirmação: "O executivo receberá e-mail com link para criar seu perfil." + botão Confirmar + Cancelar

**Dado** aprovação confirmada, **então** status → APPROVED, e-mail FR-1.6 enviado (aprovação com link para completar perfil), usuário EXECUTIVE criado no sistema vinculado à candidatura

**Dado** botão "Rejeitar" clicado, **então** abre modal com campo de motivo interno (não enviado ao candidato) + botão Danger "Confirmar rejeição"

**Dado** rejeição confirmada, **então** status → REJECTED, e-mail FR-1.6 enviado (motivo genérico), data de nova candidatura calculada para +6 meses (FR-1.7)

**Dado** candidato com rejeição dentro do período de 6 meses tentar submeter novo formulário em `/apply`, **então** o backend retorna erro: "Nova candidatura disponível a partir de [data]"

**Dado** documentos de suporte, **então** acesso restrito ao role ADMIN via URLs pré-assinadas MinIO com expiração (NFR-1)

---

### Story 2.4: Executive Profile Completion

Como executivo aprovado,
quero completar meu perfil com especialidades, setores, bio e experiência verificada,
para que o time FracExec possa me incluir na pool de match.

**Acceptance Criteria:**

**Dado** executivo aprovado acessando `/executive/profile`, **então** vê formulário com: foto (upload MinIO `fracexec-profiles`), especialidades C-Level (multi-select: CFO, CTO, CMO, COO, outros), setores de experiência (lista + livre), bio (textarea máx. 300 palavras com contador), resumo de experiência verificada

**Dado** o campo de empresas anteriores, **então** o executivo pode marcar cada empresa como "Exibir nome" ou "Anonimizar" (FR-2.2); no perfil interno admin o nome é sempre visível

**Dado** o formulário salvo, **então** tabela `executive_profiles` (Flyway V3) é atualizada; disponibilidade inicial registrada

**Dado** foto enviada, **então** é armazenada no MinIO com URL pré-assinada; preview exibido no perfil

**Dado** o perfil incompleto (sem especialidades ou bio), **então** o executivo não aparece na pool do admin

**Dado** executivo aprovado que acessa qualquer rota `/executive/**` com perfil ainda não preenchido (nenhum campo de `executive_profiles` salvo), **então** é redirecionado para `/executive/profile` com banner informativo no topo: "Complete seu perfil para aparecer na pool de executivos." — o guard permite navegação livre após o perfil ser salvo pela primeira vez

**Dado** o perfil completo salvo, **então** exibe mensagem: "Perfil atualizado." — sem redirecionamento

---

### Story 2.5: Seal Banner & Availability Management

Como executivo aprovado,
quero ver meu Selo FracExec e gerenciar minha disponibilidade facilmente,
para que eu controle minha presença na pool sem navegação complexa.

**Acceptance Criteria:**

**Dado** qualquer página autenticada do portal executivo, **então** `SealBannerComponent` (UX-DR2) é exibido no topo: gradiente `brand.primary → brand.deep`, ícone ✦ em círculo brand.accent, nome do executivo, badge de status (Ativo/Inativo/Suspenso), data de verificação — não dismissível

**Dado** status Ativo no banner, **então** badge é verde (`state.success`); Inativo → laranja (`state.warning`) com CTA "Atualizar disponibilidade" inline; Suspenso → cinza

**Dado** widget de disponibilidade no dashboard, **então** exibe dias disponíveis/mês como barra de progresso + valor numérico em JetBrains Mono + botão "Editar"

**Dado** "Editar" clicado no widget (UX-DR12), **então** abre drawer lateral (não navegação completa) com selector de dias/mês (1–20) e selector de status (Ativo/Pausado/Indisponível)

**Dado** disponibilidade salva no drawer, **então** widget atualiza em tempo real, drawer fecha, mensagem inline: "Disponibilidade atualizada."

**Dado** disponibilidade definida como 0 dias, **então** FR-2.4: executivo não é incluído em novas sugestões de match — validado no backend ao montar shortlists

**Dado** o drawer de disponibilidade, **então** é acessível por teclado com `aria-label` nos controles

**Dado** drawer de disponibilidade com alterações não salvas, **quando** usuário clicar fora ou pressionar ESC, **então** exibe confirmação: "Descartar alterações?" com opções "Descartar" / "Continuar editando"

---

### Story 2.6: Admin Executive Pool View

Como operador admin,
quero ver e filtrar a pool de executivos aprovados,
para que eu possa identificar rapidamente candidatos para uma shortlist.

**Acceptance Criteria:**

**Dado** `/admin/pool`, **então** exibe lista de executivos aprovados com: avatar de iniciais do setor (brand.accent_light bg), especialidade C-Level, setores, disponibilidade atual (dias/mês), status (Ativo/Pausado/Indisponível) como `StatusBadgeComponent`

**Dado** filtros disponíveis, **então** a pool pode ser filtrada por: especialidade C-Level, disponibilidade, setor de experiência, localização (estado)

**Dado** executivo com disponibilidade 0 ou status Indisponível, **então** aparece na pool com badge cinza "Indisponível" e não pode ser adicionado a shortlist

**Dado** a pool vazia após filtros, **então** exibe: "Nenhum executivo encontrado com esses critérios. [Ajustar filtros]"

**Dado** item da pool clicado, **então** abre perfil completo do executivo incluindo dados internos (nome de empresa real, notas de verificação) — visível apenas ao ADMIN

---

## Epic 3: SMB Registration & Need Posting

Uma PME pode se cadastrar e postar uma necessidade com escopo, desafio e contexto confidencial; o time admin vê a fila de necessidades; a PME acompanha o funil de status (5 estados) no dashboard; e-mail de confirmação com SLA de 5 dias disparado.

### Story 3.1: SMB Registration Form

Como responsável por uma PME,
quero preencher um formulário de cadastro da minha empresa,
para que eu possa acessar a plataforma e postar necessidades de C-Level.

**Acceptance Criteria:**

**Dado** `/register` acessada sem autenticação, **então** a página é pública e exibe formulário com: razão social, CNPJ (com máscara e validação de dígito verificador), setor (lista padronizada + campo livre), número de funcionários (faixas: 1–10, 11–50, 51–200, 201–500, 500+), faturamento anual (faixas: até R$1M, R$1–5M, R$5–20M, R$20M+), nome do responsável, e-mail do responsável

**Dado** CNPJ inválido submetido, **então** erro inline: "CNPJ inválido. Verifique e tente novamente."

**Dado** formulário submetido com dados válidos, **então** cria empresa com status pendente de ativação (Flyway V4 — tabela `companies`), cria usuário PME vinculado, retorna tela de confirmação: "Cadastro recebido. O time FracExec ativará seu acesso em breve."

**Dado** e-mail já cadastrado, **então** retorna erro: "Este e-mail já possui cadastro. Acesse sua conta ou recupere a senha."

**Dado** o cadastro criado, **então** nenhum PII (nome, e-mail, CNPJ) é logado no backend

**Dado** aprovação do cadastro pelo admin, **então** usuário PME recebe e-mail com link de acesso e pode fazer login

**Dado** usuário PME com empresa em status `PENDING_ACTIVATION` tenta fazer login, **então** autenticação retorna 403 com mensagem: "Seu cadastro está em análise. Você receberá um e-mail quando o acesso for ativado." — o JWT não é emitido antes da ativação

**[LIMITAÇÃO MVP]** Não existe mecanismo para a PME cancelar ou arquivar uma necessidade ativa. Se a PME resolver o desafio internamente, o admin deve arquivar a necessidade manualmente via painel. Esta limitação é intencional no MVP.

---

### Story 3.2: SMB Need Posting Form

Como PME cadastrada e ativa,
quero postar uma necessidade descrevendo o desafio estratégico e o escopo desejado,
para que o time FracExec encontre o executivo certo e eu receba confirmação com prazo de retorno.

**Acceptance Criteria:**

**Dado** `/company/need/new` acessada por PME sem necessidade ativa, **então** exibe formulário com 3 seções: (1) tipo de C-Level (chips: CFO, CTO, CMO, COO, Outro), (2) escopo (grid de dias/mês: 1–2, 3–4, 5–8; duração estimada select; início desejado), (3) descrição do desafio (textarea obrigatória — visível anonimizada ao executivo), resultado esperado (textarea obrigatória), contexto confidencial (textarea opcional — visível apenas ao time FracExec)

**Dado** PME já com necessidade ativa (FR-3.5), **quando** tentar acessar `/company/need/new`, **então** é redirecionada para a necessidade existente com mensagem: "Você já possui uma necessidade ativa."

**Dado** formulário submetido com campos obrigatórios preenchidos, **então** necessidade criada com status RECEIVED (Flyway V4 — tabela `needs`), PME redirecionada para dashboard

**Dado** necessidade criada, **então** e-mail disparado à PME (FR-8.1 evento 4, FR-3.3) confirmando recebimento com SLA de 5 dias úteis

**Dado** contexto confidencial preenchido, **então** campo é armazenado separadamente e visível apenas a usuários ADMIN — nunca exposto em endpoints de executivo ou PME

**Dado** campo "descrição do desafio" submetido, **então** validação exige mínimo de 50 caracteres com contador regressivo visível abaixo do campo; mensagem de erro: "Descreva o desafio com pelo menos 50 caracteres ([N] restantes)"

**Dado** botão "Salvar rascunho", **então** salva dados sem alterar status para RECEIVED — PME pode retomar depois

---

### Story 3.3: SMB Company Dashboard with Need Funnel

Como PME ativa,
quero ver o status da minha necessidade no dashboard como um funil de progresso visual,
para que eu saiba exatamente em qual etapa do processo estou sem precisar entrar em contato.

**Acceptance Criteria:**

**Dado** `/company/dashboard` com necessidade ativa, **então** exibe `NeedFunnelComponent` (UX-DR7) como stepper horizontal com 5 estados: Recebida → Em análise → Shortlist enviada → Em mediação → Contratado — estado atual destacado

**Dado** cada estado do funil, **então** exibe: label do estado, descrição do que está acontecendo, próximo evento esperado (ex: "Retorno com shortlist em até 5 dias úteis")

**Dado** dashboard sem necessidade ativa, **então** exibe estado vazio: "Você ainda não postou uma necessidade." + CTA "Postar necessidade" que navega para `/company/need/new`

**Dado** o dashboard carregando dados, **então** `LoadingSkeletonComponent` tipo `card` é exibido — nunca spinner bloqueante

**Dado** stats de contexto no topo do dashboard, **então** exibe: status da necessidade, data de postagem, SLA restante (calculado a partir da data de criação + 5 dias úteis) em JetBrains Mono

**Dado** necessidade em estado CONTRACTED, **então** o funil exibe todos os passos como concluídos e o executivo contratado aparece com nome e foto (identidade revelada após assinatura)

**Dado** o cálculo do SLA exibido no funil, **então** o prazo de 5 dias úteis é contado a partir de `need.created_at` (data de submissão — FR-3.4), não da data de início de análise; o relógio inicia no momento em que a necessidade é criada, independente do status atual

---

### Story 3.4: Admin Needs Queue

Como operador admin,
quero ver a fila de necessidades das PMEs com acesso rápido ao contexto completo,
para que eu possa iniciar a análise e construir shortlists com eficiência.

**Acceptance Criteria:**

**Dado** `/admin/needs`, **então** exibe lista com colunas: empresa (razão social), tipo de C-Level, escopo (dias/mês + duração), status, data de entrada, ação principal

**Dado** item na lista clicado para expandir (padrão accordion UX-DR11), **então** abre inline mostrando: tipo de C-Level, escopo, início desejado, descrição do desafio (anonimizada) — sem navegação para outra página

**Dado** necessidade com status RECEIVED expandida, **então** exibe botão "Iniciar análise"

**Dado** "Iniciar análise" clicado, **então** status muda para UNDER_ANALYSIS e tag atualiza inline

**Dado** `/admin/needs/:id`, **então** exibe detalhe completo incluindo: contexto confidencial (campo destacado visualmente — disponível apenas ao ADMIN), histórico de status com timestamps, seção de shortlist (vazia até Epic 4)

**Dado** filtros disponíveis, **então** a fila pode ser filtrada por: status, tipo de C-Level, setor da empresa, data de entrada

**Dado** a fila vazia, **então** exibe: "Nenhuma necessidade no momento."

**Dado** `/admin/companies` (seção acessível a partir do menu admin ou do dashboard), **então** exibe lista de empresas com colunas: razão social, CNPJ, responsável, data de cadastro, status (PENDING_ACTIVATION / ACTIVE)

**Dado** empresa com status PENDING_ACTIVATION, **então** exibe botão "Ativar acesso"; ao clicar, status muda para ACTIVE e e-mail é disparado à PME com link de login — completando o fluxo iniciado na Story 3.1

---

## Epic 4: Match, Shortlist & Mediation

O time admin constrói shortlists no split-view com detecção automática de conflito de interesses (CNAE 2 dígitos + região); PMEs revisam perfis anonimizados e selecionam executivos; executivos declaram interesse ou declinam; toda comunicação pré-contrato é mediada via thread; histórico completo mantido.

### Story 4.1: Conflict of Interest Registry

Como operador admin,
quero manter o registro de clientes ativos de cada executivo,
para que o sistema possa detectar automaticamente sobreposições ao montar shortlists.

**Acceptance Criteria:**

**Dado** Flyway V5, **então** tabela `executive_clients` existe com campos: `executive_id`, `cnae_2digit` (2 caracteres), `region_state`, `region_city`, `company_size_range`

**Dado** GET `/api/v1/admin/executives/:id/clients`, **então** retorna lista de clientes ativos do executivo (somente role ADMIN)

**Dado** POST `/api/v1/admin/executives/:id/clients` com dados válidos, **então** cria entrada no registro

**Dado** DELETE `/api/v1/admin/executives/:id/clients/:clientId`, **então** remove entrada do registro

**Dado** `/admin/pool` — perfil do executivo, **então** exibe seção "Clientes ativos" (CNAE + região) editável pelo ADMIN — nunca visível a PME ou executivo

**Dado** o serviço de detecção de conflito chamado com `(executiveId, needCnae2, needRegionState)`, **então** retorna `CONFLICT` se existe entrada com mesmo `cnae_2digit` + mesmo `region_state`, ou `CLEAR` caso contrário

**Dado** o campo `cnae_2digit`, **então** armazena exatamente os 2 primeiros dígitos do código CNAE da empresa cliente (ex: `"47"` para comércio varejista, `"62"` para TI/software, `"49"` para transporte terrestre, `"86"` para saúde, `"41"` para construção civil); validação: aceita apenas 2 dígitos numéricos; seed de dados de teste inclui ao menos 5 CNAEs distintos para facilitar testes de conflito

---

### Story 4.2: Shortlist Builder (Split-View)

Como operador admin,
quero construir uma shortlist em interface split-view com verificação automática de conflito ao adicionar executivos,
para que eu monte shortlists qualificadas com rapidez e segurança.

**Acceptance Criteria:**

**Dado** `/admin/needs/:id` em tab "Construir shortlist", **então** interface split-view (UX-DR5) exibe: painel esquerdo — pool filtrada (FR-4.1: filtros specialty, disponibilidade, setor, localização); painel direito — shortlist em construção com 4 slots (máx. FR-4.2)

**Dado** executivo na pool clicado com "Adicionar", **então** move para o painel direito da shortlist e sistema chama serviço de detecção de conflito (FR-5.2) imediatamente

**Dado** conflito detectado (CNAE 2 dígitos + região), **então** exibe alerta inline amarelo no card do executivo na shortlist: "Sobreposição detectada — [setor], [estado]. Revisão necessária." — executivo permanece na shortlist mas marcado como pendente de revisão

**Dado** executivo sem conflito adicionado, **então** aparece na shortlist com badge verde "Sem conflito"

**Dado** shortlist com conflito pendente de revisão, **então** botão "Enviar shortlist" permanece desabilitado com tooltip: "Resolva os conflitos antes de enviar."

**Dado** Flyway V5 extension, **então** tabelas `shortlists` e `shortlist_executives` existem com campos: status, conflict_status (PENDING_REVIEW / APPROVED_WITH_ALERT / EXCLUDED / CLEAR)

**Dado** executivo removido da shortlist, **então** slot fica disponível e contagem atualiza

**Dado** pool filtrada após aplicação de filtros, **então** executivos com disponibilidade 0 aparecem como desabilitados — não podem ser adicionados à shortlist (FR-2.4)

**Dado** admin navega para `/admin/conflicts/:id` e retorna para a shortlist builder, **então** o estado do painel (executivos adicionados, posições na shortlist, filtros aplicados) é preservado — não é recalculado ou resetado

**Dado** necessidade com status SHORTLIST_SENT, IN_MEDIATION ou CONTRACTED, **então** a aba "Construir shortlist" exibe a shortlist como somente leitura — sem possibilidade de adicionar ou remover executivos; banner informativo: "Shortlist já enviada. Edição bloqueada."

**Dado** necessidade que retornou ao status UNDER_ANALYSIS após ambos os executivos declinarem (FR-4.8), **então** a aba "Construir shortlist" volta ao modo de edição completa — os executivos anteriores são exibidos com badge "Declinado" mas podem ser removidos e substituídos; o bloqueio de edição aplica-se apenas a SHORTLIST_SENT, IN_MEDIATION e CONTRACTED

---

### Story 4.3: Conflict Review & Admin Decision

Como operador admin,
quero revisar os detalhes de um conflito detectado e decidir como tratá-lo,
para que eu possa enviar a shortlist com transparência sem bloquear o fluxo desnecessariamente.

**Acceptance Criteria:**

**Dado** link "Revisar conflito" clicado no card do executivo na shortlist, **então** navega para `/admin/conflicts/:id` com: dados do executivo (CNAE + região do cliente ativo), dados da necessidade da PME (CNAE + região), visualização da sobreposição (`ConflictAlertComponent` UX-DR8 — banner laranja com os dois segmentos sobrepostos)

**Dado** botão "Excluir da shortlist" selecionado (FR-5.4), **então** executivo é removido da shortlist sem qualquer notificação à PME; slot fica disponível para outro executivo

**Dado** botão "Apresentar com alerta" selecionado (FR-5.5), **então** executivo permanece na shortlist marcado como `APPROVED_WITH_ALERT`; a PME receberá texto padrão: "Este executivo atua em empresa do mesmo segmento na sua região."

**Dado** todos os conflitos da shortlist resolvidos e shortlist com ≥ 2 executivos sem bloqueio, **então** botão "Enviar shortlist" fica ativo

**Dado** "Enviar shortlist" clicado, **então** abre modal de confirmação listando os executivos e status de conflito de cada um

**Dado** envio confirmado, **então** status da necessidade avança para SHORTLIST_SENT, e-mail FR-8.1 evento 4 disparado à PME ("Shortlist disponível"), funil da PME atualiza

**Dado** a decisão de conflito registrada, **então** é gravada com timestamp e ID do admin que decidiu — auditável

---

### Story 4.4: Anonymized Profiles & SMB Selection

Como PME,
quero revisar os perfis anonimizados da shortlist e selecionar os executivos de interesse,
para que eu possa tomar uma decisão informada sem conhecer as identidades antes do contrato.

**Acceptance Criteria:**

**Dado** `/company/need/:id` com status SHORTLIST_SENT, **então** exibe lista de 2–4 `AnonProfileComponent` (UX-DR4): avatar com iniciais do setor (não do nome), especialidade C-Level, setores de experiência, disponibilidade (dias/mês), bio resumida, resumo de experiência verificada — sem nome, sem empresa

**Dado** executivo com `conflict_status = APPROVED_WITH_ALERT`, **então** `ConflictAlertComponent` (UX-DR8) aparece acima do perfil: banner laranja não-bloqueante com texto: "Este executivo atua em empresa do mesmo segmento na sua região."

**Dado** banner de conflito exibido (FR-5.6), **então** PME pode selecionar ou ignorar o executivo — sem ação explícita de "aceitar risco" necessária

**Dado** PME selecionando executivos, **então** pode marcar até 2 perfis com checkbox; botão "Confirmar seleção" ativa apenas com ≥ 1 selecionado

**Dado** "Confirmar seleção" clicado, **então** abre modal: "FracExec notificará os executivos selecionados. Você receberá atualizações por e-mail."

**Dado** seleção confirmada, **então** status da necessidade avança para IN_MEDIATION; e-mail FR-8.1 evento 5 disparado a cada executivo selecionado com brief anonimizado da PME (FR-4.6): setor, porte, escopo, desafio estratégico — sem nome, sem CNPJ

**Dado** funil da PME no dashboard, **então** avança para "Em mediação" com mensagem: "FracExec notificou os executivos. Você receberá atualizações por e-mail."

---

### Story 4.5: Executive Opportunity Response

Como executivo aprovado,
quero revisar um brief anonimizado de oportunidade e declarar interesse ou declinar,
para que eu possa decidir se o engajamento se encaixa na minha disponibilidade em até 3 dias úteis.

**Acceptance Criteria:**

**Dado** `/executive/opportunities`, **então** exibe lista de oportunidades com: setor da PME (tag), porte (faixa de funcionários), escopo (dias/mês + duração), resumo do desafio estratégico — sem nome de empresa, sem CNPJ; status como `StatusBadgeComponent`

**Dado** oportunidade com status AVAILABLE, **então** exibe prazo de resposta (3 dias úteis a partir do recebimento) e botões: "Tenho interesse" e "Declinar"

**Dado** "Tenho interesse" clicado, **então** abre confirmação inline: "Interesse declarado. O time FracExec dará continuidade."; status atualiza para INTERESTED

**Dado** "Declinar" clicado, **então** abre modal com campo de motivo opcional; status atualiza para DECLINED

**Dado** prazo de 3 dias úteis expirado sem resposta (FR-4.7), **então** job agendado atualiza status para EXPIRED; oportunidade sai da lista principal e vai para histórico

**Dado** apenas 1 dos executivos selecionados declinar ou expirar, **então** o engajamento permanece em IN_MEDIATION aguardando resposta do outro; admin é notificado internamente para acompanhar o prazo restante

**Dado** ambos os executivos selecionados declinarem ou expirarem (FR-4.8), **então** sistema notifica o ADMIN por e-mail: "Ambos os executivos declinaram — necessidade [ID] requer novo ciclo"; status da necessidade volta para UNDER_ANALYSIS

**Dado** oportunidades com status INTERESTED/DECLINED/EXPIRED, **então** aparecem em seção "Histórico" abaixo da lista principal com tags cinza

**Dado** oportunidade com status INTERESTED e contrato ainda não gerado, **então** botão "Retratar interesse" fica disponível por 24h após a declaração; após 24h ou após geração de contrato, o botão desaparece e o status é bloqueado; retratação notifica o ADMIN internamente e status volta para AVAILABLE

---

### Story 4.6: Mediation Thread

Como admin, PME ou executivo,
quero que toda comunicação pré-contrato ocorra em uma thread mediada com identificação de papel sem revelar nomes,
para que ambas as partes se comuniquem com segurança e o histórico completo seja preservado.

**Acceptance Criteria:**

**Dado** Flyway V5 extension, **então** tabela `mediation_messages` existe com campos: `need_id` (FK para `needs.id` — disponível desde V4), `sender_role` (ADMIN/PME/EXECUTIVE), `content`, `created_at` — sem `sender_name` exposto; quando o `engagement` for criado em V6, a thread é acessível via join `engagement.need_id → mediation_messages.need_id`

**Dado** `MediationThreadComponent` (UX-DR6) acessado por qualquer role, **então** exibe mensagens agrupadas por data, com identificação de papel ("FracExec", "Empresa", "Executivo") — nunca nome real até assinatura do contrato

**Dado** usuário ADMIN visualizando a thread, **então** exibe campo de entrada de texto + botão "Enviar mensagem" — somente ADMIN pode escrever diretamente na thread

**Dado** usuário PME ou EXECUTIVE visualizando a thread, **então** campo de entrada é substituído por botão "Enviar mensagem ao FracExec" — cria notificação interna para o admin sem postar diretamente na thread

**Dado** nova mensagem postada pelo ADMIN, **então** e-mail FR-8.1 evento 6 disparado aos outros participantes do engajamento ("Nova mensagem no FracExec")

**Dado** a thread acessada via `/company/need/:id` (PME) ou `/executive/engagements/:id` (executivo), **então** exibe apenas as mensagens da thread daquele engajamento específico (FR-4.10)

**Dado** `/admin/engagements/:id`, **então** admin vê a thread completa + metadados internos (sender_id para auditoria — não exposto aos outros roles)

**Dado** thread carregando mensagens, **então** `LoadingSkeletonComponent` tipo `list` é exibido até os dados chegarem

---

## Epic 5: Contract, Payments & Engagements

Partes assinam contrato padronizado gerado pelo admin; pagamentos recorrentes processados via Stripe/PIX; repasse ao executivo com 18% deduzido após janela de 5 dias sem disputa; comprovantes e extratos emitidos; identidades reveladas após assinatura; declaração de conflito alimenta o registro.

### Story 5.1: Contract Generation & Signature

Como operador admin,
quero gerar um contrato padronizado pré-preenchido e registrar o aceite de ambas as partes,
para que o engajamento comece oficialmente com todos os termos documentados e identidades reveladas.

**Acceptance Criteria:**

**Dado** `/admin/contracts/new` com um engajamento em estado IN_MEDIATION, **então** formulário exibe template pré-preenchido com: partes identificadas (razão social PME + nome executivo), escopo (dias/mês + duração + valor mensal), parcelas, cláusula de confidencialidade, declaração de conflito de interesses (FR-5.7), condições de rescisão

**Dado** "Gerar contrato" clicado, **então** contrato é gerado como PDF, armazenado no MinIO bucket `fracexec-contracts`, e e-mail FR-8.1 evento 7 disparado a ambas as partes com o PDF anexado

**Dado** declaração de conflito (FR-5.7) preenchida no contrato, **então** os setores/porte/região declarados pelo executivo são gravados na tabela `executive_clients` — alimenta o registro de conflitos para engajamentos futuros

**Dado** e-mail de aceite por resposta recebido (FR-6.2), **então** admin registra o aceite via botão "Registrar assinatura" com checkbox de confirmação para cada parte

**Dado** assinatura registrada para ambas as partes, **então** Flyway V6 tabela `engagements` status → ACTIVE; PME vê nome e foto do executivo em `/company/need/:id` (identidades reveladas); executivo vê razão social da PME em `/executive/engagements/:id`

**Dado** assinatura registrada para ambas as partes, **então** além de `engagement.status → ACTIVE`, o sistema também seta `need.status → CONTRACTED`; o `NeedFunnelComponent` da PME exibe o último passo como concluído com o executivo revelado

**Dado** contrato gerado, **então** `/admin/contracts` exibe o contrato na lista com status, partes, valor mensal e data de início

**Dado** download do contrato solicitado, **então** retorna URL pré-assinada MinIO com expiração de 1 hora (NFR-1 — acesso controlado)

**Dado** tentativa de gerar contrato em `/admin/contracts/new`, **então** o backend valida que o engajamento está em status IN_MEDIATION com pelo menos 1 executivo com status INTERESTED — retorna 422 com mensagem descritiva caso o estado seja inválido

**Dado** a geração do contrato PDF, **então** utiliza iText 7 Community (licença AGPL) ou OpenPDF (fork livre do iText 2) para geração programática — a biblioteca escolhida deve constar como dependência explícita no `pom.xml` antes do início da implementação desta story

**Dado** o processo de aceite por e-mail (FR-6.2), **então** o sistema não implementa parsing automático de respostas de e-mail no MVP; o admin registra o aceite manualmente via botão "Registrar assinatura" após confirmar o aceite das partes por qualquer canal (e-mail, telefone, mensagem) — simplificação intencional do MVP

**Dado** a assinatura de contrato que compromete X dias/mês do executivo, **então** o backend verifica se `dias_comprometidos_atuais + X_novo_contrato ≤ disponibilidade_declarada`; se exceder, retorna aviso não-bloqueante ao admin: "Este contrato excede a disponibilidade declarada pelo executivo ([X] dias comprometidos de [Y] disponíveis). Confirmar mesmo assim?" — admin pode prosseguir com ciência

---

### Story 5.2: Stripe Integration & Recurring Payment

Como PME com contrato ativo,
quero pagar a mensalidade do engajamento via PIX integrado à plataforma,
para que o pagamento seja rastreado automaticamente sem transferências manuais.

**Acceptance Criteria:**

**Dado** Stripe Connect configurado no modo marketplace, **então** a plataforma retém 18% de platform fee automaticamente no repasse (FR-6.5); a conta Stripe utilizada é uma conta BR; o Payment Intent é criado com `payment_method_types: ['pix']` e `currency: 'brl'`; o prazo de expiração do QR Code PIX é configurado para 3600 segundos (1 hora)

**Dado** `/company/payments` com engajamento ativo, **então** exibe botão "Pagar mensalidade" com valor do mês corrente em JetBrains Mono

**Dado** "Pagar mensalidade" clicado, **então** cria Stripe Payment Intent com método PIX; PME vê QR Code + código PIX + prazo de validade

**Dado** pagamento PIX realizado, **então** webhook `payment_intent.succeeded` é recebido em POST `/api/v1/webhooks/stripe` e processado de forma idempotente (chave: `payment_intent_id`)

**Dado** webhook recebido com sucesso, **então** Flyway V6 extension tabela `payments` registra: `engagement_id`, `stripe_payment_intent_id`, `gross_amount`, `fee_amount` (18%), `net_amount`, `status = PAID`, `paid_at`

**Dado** webhook recebido com `payment_intent_id` já processado, **então** retorna 200 sem duplicar o registro

**Dado** o endpoint de webhook, **então** valida assinatura Stripe (`Stripe-Signature` header) — rejeita com 400 se inválida

**Dado** Payment Intent PIX não pago dentro do prazo de expiração configurado, **então** webhook `payment_intent.payment_failed` (ou `payment_intent.canceled`) atualiza status do pagamento para EXPIRED; PME pode gerar novo PIX sem criar registro de pagamento duplicado

---

### Story 5.3: Escrow Window & Executive Transfer

Como executivo com engajamento ativo,
quero receber automaticamente meu pagamento líquido após a janela de 5 dias sem disputa,
para que eu saiba exatamente quando e quanto vou receber sem precisar acionar ninguém.

**Acceptance Criteria:**

**Dado** pagamento com status PAID registrado, **então** job agendado inicia contagem de 5 dias úteis (FR-6.4) a partir de `paid_at`

**Dado** 5 dias úteis decorridos sem disputa registrada, **então** sistema processa repasse via Stripe Connect payout ao executivo com valor `net_amount` (gross − 18% fee); status do pagamento atualiza para TRANSFERRED

**Dado** repasse processado, **então** e-mail FR-8.1 evento 8 disparado a ambas as partes: PME recebe comprovante (valor bruto + data), executivo recebe extrato de repasse (valor bruto, taxa deduzida 18%, valor líquido — FR-6.6)

**Dado** o extrato do executivo, **então** exibe: valor bruto em JetBrains Mono, linha "Taxa FracExec (18%)" em text.secondary, valor líquido em destaque em JetBrains Mono bold — sem ambiguidade sobre o cálculo

**Dado** FR-6.7, **então** o sistema não fornece mecanismo de disputa formal — disputas são resolvidas diretamente entre as partes; nenhuma funcionalidade de arbitragem é implementada no MVP

**Dado** falha no payout Stripe, **então** status do pagamento atualiza para TRANSFER_FAILED; admin é notificado internamente; nenhum e-mail vai ao executivo ou PME até reprocessamento manual

**Dado** o cálculo de 5 dias úteis do escrow, **então** o sistema usa calendário de dias úteis brasileiro (exclui sábados, domingos e feriados nacionais definidos em configuração); a data estimada de repasse exibida ao executivo reflete esse cálculo — nunca dias corridos

---

### Story 5.4: Executive Payment Dashboard

Como executivo com engajamentos ativos ou históricos,
quero ver meu histórico completo de repasses com valores líquidos claramente apresentados,
para que eu acompanhe meus ganhos sem dúvidas sobre a dedução da taxa da plataforma.

**Acceptance Criteria:**

**Dado** `/executive/payments`, **então** exibe lista de repasses com colunas: mês de referência, empresa (razão social pós-contrato), valor bruto, taxa FracExec (18%), valor líquido — todos os valores monetários em JetBrains Mono

**Dado** repasse com status TRANSFERRED, **então** exibe data de crédito e badge verde "Creditado"

**Dado** repasse com status PAID (dentro da janela de 5 dias), **então** exibe badge laranja "Aguardando repasse" com data estimada

**Dado** `/executive/dashboard`, **então** widget de pagamentos exibe: próximo repasse esperado (data + valor líquido estimado em JetBrains Mono), total recebido no mês corrente, link "Ver histórico completo →" para `/executive/payments`

**Dado** executivo sem pagamentos ainda, **então** widget exibe estado vazio: "Nenhum repasse registrado ainda."

**Dado** qualquer valor monetário na interface, **então** usa JetBrains Mono — sem exceções

---

### Story 5.5: SMB Contract & Payment History

Como PME com engajamento ativo ou concluído,
quero acessar meu histórico de pagamentos e baixar os contratos,
para que eu tenha documentação financeira completa do engajamento.

**Acceptance Criteria:**

**Dado** `/company/payments`, **então** exibe lista de pagamentos com: mês de referência, valor pago, status (Pago/Aguardando), data de pagamento — valores em JetBrains Mono

**Dado** `/company/payments` — seção Contratos, **então** exibe lista de contratos com: data de assinatura, executivo (nome visível pós-contrato), valor mensal, duração, link "Baixar PDF"

**Dado** "Baixar PDF" clicado, **então** retorna URL pré-assinada MinIO com expiração de 1 hora para o arquivo do contrato

**Dado** `/company/need/:id` com engajamento ACTIVE, **então** exibe nome completo e foto do executivo (identidade revelada após assinatura — Story 5.1); thread de mediação permanece acessível como histórico

**Dado** dashboard da PME, **então** widget de pagamentos exibe: próximo vencimento (data + valor), último pagamento realizado, link "Ver histórico →" para `/company/payments`

**Dado** PME sem histórico de pagamentos, **então** widget exibe estado vazio: "Nenhum pagamento registrado ainda."

---

## Epic 6: Complete Dashboards, Admin Operations & Production Readiness

Todos os três portais têm dashboards completos com dados reais; admin tem visibilidade operacional completa (métricas, pipeline de pagamentos, pool com filtros); direito de exclusão LGPD em 30 dias implementado; CI/CD, Actuator e Logback JSON configurados para produção.

### Story 6.1: Executive Dashboard Completion

Como executivo aprovado com engajamentos em andamento,
quero ter uma visão consolidada de todos os meus engajamentos, oportunidades e pagamentos em uma única tela,
para que eu gerencie minha agenda executiva sem navegar por múltiplas seções.

**Acceptance Criteria:**

**Dado** `/executive/dashboard` com dados reais, **então** exibe 4 stat cards no topo: engajamentos ativos (contagem), dias comprometidos no mês (soma de dias/mês em JetBrains Mono), próximo repasse esperado (valor líquido em JetBrains Mono), oportunidades aguardando resposta (contagem com badge laranja se > 0)

**Dado** seção "Engajamentos ativos" no dashboard, **então** lista cada engajamento com: empresa (razão social pós-contrato), função contratada, dias/mês, status (ACTIVE/PAUSED) como `StatusBadgeComponent`, link "Ver detalhes →" para `/executive/engagements/:id` (FR-7.1)

**Dado** `/executive/engagements`, **então** exibe lista completa com todos os engajamentos — ACTIVE, PAUSED, COMPLETED, CANCELLED — filtráveis por status

**Dado** seção "Oportunidades" no dashboard, **então** exibe badge de contagem + preview da oportunidade mais recente aguardando resposta; link "Ver todas →" para `/executive/opportunities`

**Dado** dashboard com todos os widgets carregando, **então** cada widget usa `LoadingSkeletonComponent` tipo `card` individualmente — nunca tela cheia bloqueada

**Dado** executivo sem engajamentos ativos, **então** seção exibe: "Nenhum engajamento ativo no momento."

**Dado** executivo sem oportunidades pendentes, **então** seção exibe: "Nenhuma oportunidade aguardando resposta."

---

### Story 6.2: Admin Dashboard & Full Operations Panel

Como operador admin,
quero ter visibilidade operacional completa da plataforma em um painel centralizado,
para que eu monitore candidaturas, pool, necessidades, contratos e pipeline financeiro sem alternar entre múltiplas telas.

**Acceptance Criteria:**

**Dado** `/admin/dashboard`, **então** exibe métricas operacionais (FR-7.3): candidaturas por status, executivos na pool por status, necessidades ativas por status, contratos ativos, volume de pagamentos do mês corrente em JetBrains Mono — todos como stat cards

**Dado** `/admin/pool` completo, **então** filtros de especialidade, disponibilidade, setor e localização funcionam em combinação; resultado atualiza sem recarregar a página; contagem de resultados visível

**Dado** `/admin/engagements`, **então** exibe lista de todos os engajamentos ativos com: empresa, executivo, status, próximo pagamento esperado; acesso à thread de mediação de cada engajamento

**Dado** `/admin/contracts`, **então** exibe lista de contratos com: partes, valor mensal, status de pagamento do mês corrente (Pago/Pendente/Atrasado), link para download do PDF

**Dado** pipeline de pagamentos no dashboard admin, **então** exibe: total a receber no mês, total em janela de escrow, total já repassado — valores em JetBrains Mono

**Dado** qualquer lista do painel admin, **então** exibe `LoadingSkeletonComponent` tipo `table` durante carregamento

**Dado** listas vazias no painel admin, **então** cada seção exibe estado vazio contextual — nunca lista em branco sem mensagem

**Dado** `/admin/engagements/:id`, **então** admin pode marcar um engajamento como PAUSED (suspensão temporária), COMPLETED (encerramento natural ao fim do prazo contratual) ou CANCELLED (rescisão antecipada) via modal de confirmação descrevendo a consequência; cada transição registra timestamp e motivo

**Dado** `/admin/dashboard`, **então** inclui seção "LGPD — Solicitações de exclusão" com contagem de solicitações pendentes e link para a fila detalhada (implementada na Story 6.3)

---

### Story 6.3: LGPD Compliance & Data Deletion

Como usuário da plataforma (executivo, PME ou admin),
quero poder solicitar a exclusão dos meus dados pessoais,
para que a plataforma cumpra com o direito de exclusão garantido pela LGPD em até 30 dias.

**Acceptance Criteria:**

**Dado** `/executive/profile` ou `/company/profile`, **então** exibe seção "Privacidade e dados" com botão "Solicitar exclusão de conta" (Danger style)

**Dado** botão de exclusão clicado, **então** abre modal descritivo: "Seus dados pessoais serão removidos em até 30 dias. Engajamentos ativos serão encerrados. Contratos assinados são preservados por obrigação legal." + botão Danger "Confirmar exclusão" + Cancelar

**Dado** exclusão confirmada, **então** POST `/api/v1/account/deletion-request` cria registro de solicitação com prazo de 30 dias; usuário recebe e-mail confirmando a solicitação

**Dado** solicitação de exclusão processada (job agendado ≤ 30 dias), **então** dados pessoais são anonimizados: nome → "Usuário Removido", e-mail → hash irreversível, foto → removida do MinIO; contratos e histórico financeiro preservados para obrigação legal (NFR-1)

**Dado** solicitação de exclusão com engajamento ACTIVE ou pagamento com status PAID (em janela de escrow), **então** o modal exibe aviso adicional: "Você possui engajamentos ou pagamentos em andamento. A exclusão aguardará a conclusão desses processos."; solicitação criada com status PENDING_ENGAGEMENTS e processada automaticamente quando concluídos

**Dado** fila de solicitações de exclusão no painel admin (`/admin/dashboard` seção LGPD), **então** admin vê: ID anônimo do usuário, data da solicitação, prazo, status (Pendente/PENDING_ENGAGEMENTS/Processado)

**Dado** qualquer log do sistema, **então** PII nunca aparece em texto plano — somente IDs opacos (NFR-1)

---

### Story 6.4: Production Readiness & Observability

Como time de engenharia,
quero que a plataforma tenha CI/CD automatizado, observabilidade e performance validada,
para que deploys sejam seguros, incidentes detectáveis e os NFRs de performance e uptime sejam atendidos.

**Acceptance Criteria:**

**Dado** o repositório no GitHub, **então** GitHub Actions pipeline executa em todo PR e push para main: (1) build Spring Boot + Maven, (2) testes unitários e de integração, (3) build Angular, (4) build e push da imagem Docker — falha em qualquer etapa bloqueia o merge

**Dado** ambiente de produção, **então** Logback configurado com appender JSON estruturado: cada log contém `timestamp`, `level`, `logger`, `message`, `traceId` — sem PII em texto plano em nenhum campo

**Dado** GET `/actuator/health`, **então** retorna `{"status":"UP"}` com sub-checks: `db` (PostgreSQL), `diskSpace`, `ping` — HTTP 200 quando healthy, 503 quando degradado (NFR-5)

**Dado** GET `/actuator/metrics`, **então** retorna métricas de JVM, HTTP requests (latência, throughput), HikariCP connection pool — endpoint acessível apenas via rede interna

**Dado** páginas principais (/executive/dashboard, /company/dashboard, /admin/candidates) em conexão 4G simulada, **então** carregamento inicial < 3 segundos (NFR-6) — validado com análise de bundle size Angular

**Dado** HTTPS obrigatório, **então** configuração Nginx com terminação SSL documentada no `docker-compose.prod.yml`; redirect automático HTTP → HTTPS (NFR-3)

**Dado** NFR-2, **então** smoke tests manuais documentados para Chrome, Firefox, Edge e Safari (últimas 2 versões) — sem suporte a IE
