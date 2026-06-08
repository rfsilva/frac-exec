---
title: "FracExec — Experience Design"
status: final
created: 2026-05-29
updated: 2026-05-29
project: FracExec
sources:
  - bmad-output/planning-artifacts/prds/prd-fracexec-2026-05-28/prd.md
  - bmad-output/planning-artifacts/briefs/brief-fraccto-2026-05-28/brief.md
  - bmad-output/planning-artifacts/architecture.md
---

# FracExec — Experience Design

_Os padrões comportamentais, arquitetura de informação, fluxos e estados da plataforma. Identidade visual e tokens em `DESIGN.md`._

---

## Foundation

**Form-factor:** Web app desktop-first. Responsivo até tablet (768px+); mobile fora do escopo MVP (documentado como restrição técnica — NFR conforme PRD).

**UI System:** Angular Material v3 com tema customizado FracExec. Os tokens de `DESIGN.md` sobrepõem os defaults do Material: paleta primária = `brand.primary`, paleta accent = `brand.accent`. Componentes Material usados como base estrutural; todos os ajustes visuais declarados em `DESIGN.md.Components`.

**Portais e Contexto:**
O FracExec é uma plataforma de três portais isolados, cada um com contexto de role distinto:

| Portal | Prefixo de rota | Role | Contexto principal |
|--------|----------------|------|-------------------|
| Portal do Executivo | `/executive/**` | EXECUTIVE | Gerir engajamentos, disponibilidade, oportunidades, pagamentos |
| Portal da PME | `/company/**` | PME | Postar necessidade, acompanhar funil, ver contratado |
| Painel Admin | `/admin/**` | ADMIN | Operações: candidaturas, pool, match, conflitos, contratos |
| Público | `/apply`, `/register` | — | Candidatura de executivo, cadastro de PME |

**Referência de identidade visual:** `DESIGN.md`

---

## Information Architecture

### Mapa de Superfícies

```
FracExec
├── Público
│   ├── /apply                    Formulário de candidatura (executivo)
│   └── /register                 Cadastro de PME
│
├── /executive/**  (role: EXECUTIVE)
│   ├── /executive/dashboard      Visão geral: engajamentos, oportunidades, repasses, disponibilidade
│   ├── /executive/profile        Edição de perfil: foto, especialidades, setores, disponibilidade, bio
│   ├── /executive/engagements    Lista de engajamentos ativos e histórico
│   ├── /executive/opportunities  Oportunidades aguardando resposta (brief anonimizado)
│   └── /executive/payments       Histórico de repasses e extratos
│
├── /company/**  (role: PME)
│   ├── /company/dashboard        Status do funil, executivo contratado, pagamentos, mensagens mediadas
│   ├── /company/need/new         Postagem de nova necessidade
│   ├── /company/need/:id         Detalhe da necessidade ativa (shortlist, mensagens)
│   └── /company/payments         Histórico de pagamentos e contratos
│
└── /admin/**  (role: ADMIN)
    ├── /admin/dashboard          Métricas: candidaturas, contratos, NPS, pipeline
    ├── /admin/candidates         Fila de candidaturas (PENDING → UNDER_REVIEW → APPROVED/REJECTED)
    ├── /admin/candidates/:id     Detalhe da candidatura + notas + documentos
    ├── /admin/pool               Pool de executivos aprovados (filtros: especialidade, disponibilidade, setor)
    ├── /admin/needs              Fila de necessidades de PMEs
    ├── /admin/needs/:id          Detalhe da necessidade + construtor de shortlist
    ├── /admin/conflicts/:id      Revisão de conflito de interesse detectado
    ├── /admin/engagements        Engajamentos ativos (mensagens mediadas)
    └── /admin/contracts          Contratos ativos, pagamentos pendentes
```

### Princípios de IA

1. **Contexto sempre visível.** Cada tela exibe o estado atual do recurso principal sem exigir navegação extra — o dashboard não é só links, é informação.
2. **Anonimização consistente.** Nomes de empresas são ocultados para executivos e perfis de executivos são ocultados para PMEs até assinatura de contrato. A UI reforça isso com avatars de iniciais de setor, não de nome.
3. **Funil como linguagem.** Status de candidatura e necessidade são sempre exibidos no vocabulário do funil (Recebida / Em análise / Shortlist enviada / Em mediação / Contratado) — não em estados técnicos internos.
4. **Admin é ferramenta operacional.** O painel admin prioriza densidade de informação e velocidade de ação — filtros sempre visíveis, filas com preview inline, ações em 1 clique.

---

## Voice and Tone

**Voz:** Direta, profissional e respeitosa. Fala com adultos que já sabem o que é C-Level — não precisa explicar o óbvio nem usar linguagem de startup.

**Ton por contexto:**

| Contexto | Tom | Exemplo |
|----------|-----|---------|
| Confirmações | Factual, breve | "Candidatura recebida. Retorno em até 10 dias úteis." |
| Oportunidades | Informativo, respeitoso | "PME do setor de Varejo, São Paulo. 3 dias/mês, 4 meses." |
| Alertas de conflito | Claro, neutro, sem alarmismo | "Este executivo atua em empresa do mesmo segmento na sua região." |
| Erros | Orientado à ação, sem jargão | "Não foi possível enviar. Verifique sua conexão e tente novamente." |
| Sucesso de ação | Factual | "Disponibilidade atualizada." / "Interesse declarado." |
| LGPD / privacidade | Preciso, sem juridiquês excessivo | "Seus dados serão usados exclusivamente para verificação e match. Saiba mais." |

**Regras de microcopy:**
- Português brasileiro padrão. Sem "você" no imperativo — preferir infinitivo ou substantivo: "Atualizar disponibilidade", não "Atualize sua disponibilidade".
- Rótulos de botão: verbo + objeto quando há ação concreta ("Declarar interesse", "Enviar candidatura"). Sem "OK", "Confirmar" genérico.
- Labels de estado: sempre no vocabulário do negócio — "Em análise", "Aprovado", "Oportunidade disponível". Nunca: "PENDING", "SUCCESS", códigos.
- Mensagens de erro: 1 frase. O que aconteceu + o que fazer. Sem stack trace.

---

## Component Patterns

_Padrões comportamentais. Especificações visuais em `{DESIGN.md#components}`._

### Seal Banner

Presente em toda sessão autenticada do portal Executive. Exibe nome do executivo, status do Selo (Ativo / Inativo / Suspenso) e data de verificação. Não é dismissível — é informação de contexto permanente. Estado "Inativo" exibe CTA "Atualizar disponibilidade" inline.

### Fila Admin (Candidate Queue / Need Queue)

Layout de lista com preview inline expansível. Cada item mostra: identificador, estado atual, data de entrada, e ação principal disponível. Expansão inline (acordeão) exibe detalhes sem navegação — reduz cliques para ações de triagem rápida. Filtros persistem durante a sessão via query params.

### Construtor de Shortlist

Tela split: à esquerda, pool filtrada de executivos; à direita, shortlist em construção (máx. 4 posições). Arrastar ou clicar "Adicionar" move executivo para a shortlist. Verificação de conflito de interesse dispara automaticamente ao adicionar — exibe alerta inline se detectado. Botão "Enviar shortlist" só ativa quando há ao menos 2 executivos sem conflito bloqueante.

### Thread de Mediação

Visão de conversa com identificação de papel (FracExec / PME / Executivo) sem revelar nomes até assinatura. Mensagens agrupadas por data. Campo de entrada apenas para usuário ADMIN. PME e Executivo veem as mensagens mas não digitam diretamente — interagem via "Enviar mensagem ao FracExec" que cria um ticket interno.

### Perfil Anonimizado

Exibido para PME durante fase de shortlist: especialidade, setores de experiência, disponibilidade, bio resumida, resumo de experiência verificada. Nome e empresa substituídos por avatar de iniciais do setor. Alerta de conflito aparece como banner laranja não-bloqueante acima do perfil quando aplicável (FR-5.5).

### Formulário de Candidatura (Público)

Formulário longo em etapas (Stepper). 3 etapas: (1) Dados pessoais + LinkedIn, (2) Histórico C-Level (campos repetíveis: empresa anonimizada, período, porte, receita sob gestão), (3) Referências + Motivação. Progresso visível no topo. Botão "Próxima etapa" valida apenas os campos da etapa atual. Submissão cria estado PENDING e dispara FR-1.3 (e-mail de confirmação).

### Dashboard Cards

Cada portal tem um conjunto de stat cards no topo: valor em JetBrains Mono + label + delta contextual. Abaixo: seções de conteúdo em cards com header/body. Nenhuma tela de dashboard exige scroll para ver o estado mais importante do usuário.

---

## State Patterns

### Estados de Candidatura (Executive)

```
PENDING → UNDER_REVIEW → APPROVED
                       ↘ REJECTED
```

| Estado | UI | Ação disponível |
|--------|-----|----------------|
| PENDING | Tag amarela "Aguardando análise" | Nenhuma |
| UNDER_REVIEW | Tag azul "Em análise" | Nenhuma |
| APPROVED | Seal Banner ativo | Completar perfil |
| REJECTED | Banner informativo com motivo genérico + data de nova candidatura | Nenhuma até 6 meses |

### Estados de Necessidade (PME)

```
RECEIVED → UNDER_ANALYSIS → SHORTLIST_SENT → IN_MEDIATION → CONTRACTED
```

Cada estado exibe: label no funil, descrição do que está acontecendo, e próximo evento esperado. O funil é visível no dashboard da PME como uma barra de progresso com steps nomeados.

### Estados de Oportunidade (Executive)

| Estado | UI | Prazo |
|--------|-----|-------|
| AVAILABLE | Badge laranja "Aguardando resposta" | 3 dias úteis |
| INTERESTED | Badge verde "Interesse declarado" | — |
| DECLINED | Tag cinza "Declinado" | — |
| EXPIRED | Tag cinza "Prazo encerrado" | — |

Oportunidades com prazo expirado desaparecem da lista principal e vão para histórico.

### Estados de Engajamento

ACTIVE · PAUSED · COMPLETED · CANCELLED

Exibidos como tags coloridas em todos os contextos onde o engajamento aparece (dashboard, listas, admin).

### Estados de Loading

Skeleton screens em toda superfície que carrega dados do servidor. Nunca spinner bloqueante de tela cheia. Skeleton deve ter a mesma estrutura visual do conteúdo real — evita layout shift.

Formato: `isLoading` signal por componente. Componentes compartilhados (`loading-skeleton`) renderizam baseados no tipo de conteúdo (card, lista, tabela).

### Estados de Erro

Erros de API renderizados no nível do componente relevante, não em toast global — exceto erros de autenticação (401 → redirect login) e erros de servidor (5xx → banner global não-obstrutivo). Mensagens sempre em português sem termos técnicos. CTA de retry quando a operação é repetível.

### Estados Vazios

Cada lista/fila tem um estado vazio designado: ícone contextual (não genérico) + título + descrição de 1 linha + CTA quando há ação disponível. Exemplos:
- Pool de executivos vazia após filtros: "Nenhum executivo encontrado com esses critérios. [Ajustar filtros]"
- Oportunidades sem pendências: "Nenhuma oportunidade aguardando resposta."
- Dashboard PME sem necessidade ativa: "Você ainda não postou uma necessidade. [Postar necessidade]"

---

## Interaction Primitives

### Navegação

- **Angular Router** com guards por role. Acesso a rota sem role → redirect para login.
- **Lazy-load por portal.** Cada portal carrega seu bundle independente.
- **Back navigation:** botão voltar sempre presente em telas de detalhe (`:id`). Breadcrumb não necessário no MVP — hierarquia é flat (lista → detalhe).
- **Links de ação inline:** nas listas, "Ver todos →" navega para a tela completa — não abre modal.

### Formulários

- **Reactive Forms** com validação no submit (não on-blur no MVP — menos noise).
- Campos obrigatórios marcados com asterisco + mensagem de erro por campo após tentativa de submit.
- Formulários multi-etapa (candidatura): validação por etapa no avanço.
- LGPD: checkbox de consentimento sem pré-preenchimento, obrigatório para submissão. Label deve conter link para política de privacidade.

### Ações Destrutivas

Modal de confirmação para: rejeitar candidatura, cancelar engajamento, excluir conta. Título descritivo + resumo do que será afetado + botão Danger + botão Cancelar. Sem "Are you sure?" genérico — descreve a consequência real.

### Upload de Documentos

Área de drop + clique. Preview do nome do arquivo após seleção. Progresso de upload em barra inline (não modal). Erro de upload exibido inline com opção de retentar. Máx. de arquivo e formatos aceitos visíveis antes do upload.

### Notificações

Sem notificações push in-app no MVP (e-mail apenas — NFR-8.2). O ícone de sino na topbar é visual mas não funcional no MVP — pode exibir badge estático para itens como oportunidades pendentes (replicando dado do dashboard).

### Disponibilidade Rápida

Widget de disponibilidade no dashboard do executivo tem CTA "Editar" que abre um drawer lateral (não navegação completa) para alterar dias disponíveis — FR-2.3 exige atualização a qualquer momento com baixo atrito.

---

## Accessibility Floor

- **Contraste mínimo:** AA (4.5:1) para texto base; AAA para textos críticos (valores monetários, alertas).
  - `brand.primary` (#132A1E) sobre `surface.card` (#FFFFFF): ~14:1 ✅
  - `brand.accent` (#4DC78A) sobre `brand.primary` (#132A1E): ~7.2:1 ✅
  - `text.secondary` (#4A6358) sobre `surface.card`: ~5.1:1 ✅
- **Foco:** Outline de foco visível em todos os elementos interativos — `brand.accent 2px` com offset 2px.
- **ARIA:** Labels em todos os ícones de ação (ícones sem texto). `aria-live` em regiões que atualizam automaticamente (loading states, contadores).
- **Teclado:** Tab order lógico. Modais focam o primeiro elemento interativo ao abrir e retornam foco ao trigger ao fechar.
- **Formulários:** `<label>` associado a cada `<input>`. Mensagens de erro associadas via `aria-describedby`.
- **Motion:** Sem animações essenciais para compreensão. Transições de estado abaixo de 200ms.

---

## Key Flows

### KF-1 — Marcus candidata-se ao FracExec

**Marcus**, 52 anos, ex-CFO. Chegou ao FracExec por indicação. Abre `/apply` em desktop.

1. Vê página pública limpa: proposta de valor em 2 linhas, o Selo FracExec em destaque, botão "Candidatar-se".
2. Inicia stepper de 3 etapas. Etapa 1: dados pessoais. Preenche nome, e-mail, LinkedIn. Avança — validação inline confirma LinkedIn.
3. Etapa 2: histórico. Adiciona 3 posições C-Level com formulário repetível. Para cada: empresa (sem revelar nomes na plataforma), período, porte da equipe, receita sob gestão.
4. Etapa 3: referências + motivação. 2 referências com nome, cargo, contato. Campo de texto livre para motivação.
5. **Clímax:** Checkbox LGPD. Marcus lê o texto de consentimento — é direto, sem juridiquês. Marca, submete.
6. Tela de confirmação: "Candidatura recebida. Você receberá um e-mail de confirmação em instantes. Retorno em até 10 dias úteis." — sem noise, sem confete.

_Critério de sucesso: Marcus sabe exatamente o que acontece a seguir sem precisar perguntar._

---

### KF-2 — Time FracExec aprova Marcus

**Ana** (ADMIN), analisa a fila de candidaturas.

1. Acessa `/admin/candidates`. Vê lista com Marcus em estado PENDING.
2. Expande o item inline: preview de experiência, LinkedIn, referências.
3. Clica "Iniciar análise" → estado muda para UNDER_REVIEW.
4. Abre detalhe `/admin/candidates/:id`. Lê motivação, verifica LinkedIn, adiciona nota interna "Experiência validada — 3 posições CFO em varejo e logística".
5. Clica "Aprovar". Modal de confirmação: "Marcus receberá e-mail com acesso para criar seu perfil."
6. **Clímax:** Confirma. Estado muda para APPROVED. E-mail FR-1.6 disparado.

_Critério de sucesso: Ana realiza a análise e aprovação sem sair da fila de candidaturas._

---

### KF-3 — Renata posta necessidade e recebe shortlist

**Renata**, CEO de empresa de logística. Já cadastrada como PME.

1. Acessa `/company/dashboard`. Vê estado atual: sem necessidade ativa. CTA "Postar necessidade".
2. Abre formulário de necessidade. Preenche: tipo (CFO), escopo (4 dias/mês, 6 meses), descrição do desafio, contexto confidencial para o time.
3. Submete. Estado do funil: "Recebida". E-mail FR-3.3 confirmando SLA de 5 dias úteis.
4. 3 dias depois, recebe e-mail "Shortlist disponível". Acessa dashboard.
5. Funil avança: "Shortlist enviada". Vê 3 perfis anonimizados com especialidade, setores, disponibilidade.
6. Um dos perfis tem banner laranja: "Este executivo atua em empresa do mesmo segmento na sua região." — Renata lê a descrição, decide aceitar o risco.
7. Seleciona 2 executivos de interesse. Clica "Confirmar seleção".
8. **Clímax:** Funil avança para "Em mediação". Mensagem: "FracExec notificou os executivos. Você receberá atualizações por e-mail."

_Critério de sucesso: Renata toma decisão informada sobre conflito sem saber nomes — e sem ansiedade sobre o próximo passo._

---

### KF-4 — Executivo recebe e responde oportunidade

**Marcus** (agora aprovado, perfil completo).

1. Recebe e-mail "Nova oportunidade disponível". Acessa `/executive/dashboard`.
2. Widget "Oportunidades" exibe badge laranja "2 aguardando resposta".
3. Abre `/executive/opportunities`. Vê brief anonimizado: setor, porte, desafio estratégico. Sem nome da empresa.
4. Analisa o escopo. 4 dias/mês, 6 meses — compatível com disponibilidade atual (6 dias livres).
5. **Clímax:** Clica "Tenho interesse". Confirmação inline: "Interesse declarado. O time FracExec dará continuidade." Estado atualiza para INTERESTED.

_Critério de sucesso: Marcus decide em menos de 2 minutos sem precisar pedir mais informação._

---

### KF-5 — Admin faz match e constrói shortlist

**Ana** (ADMIN). Necessidade de Renata em estado UNDER_ANALYSIS.

1. Acessa `/admin/needs/:id`. Vê detalhes completos da necessidade de Renata, incluindo contexto confidencial.
2. Clica "Construir shortlist". Interface split aparece: pool filtrada por CFO + disponível à esquerda, shortlist vazia à direita.
3. Adiciona Marcus. Sistema verifica conflito automaticamente — Marcus tem cliente em logística. Alerta inline amarelo: "Sobreposição de setor detectada — Logística, São Paulo. Revisão necessária."
4. Ana acessa `/admin/conflicts/:id`. Lê os detalhes. Decide: regiões distintas dentro do setor, não é conflito efetivo.
5. Marca "Apresentar com alerta" — Renata será informada sem ver os nomes.
6. Adiciona mais 2 executivos sem conflito.
7. **Clímax:** Shortlist com 3 executivos montada. Clica "Enviar shortlist". Funil avança, e-mail FR-3.3 disparado para Renata.

_Critério de sucesso: Ana gerencia o conflito com controle total, sem expor nomes e sem bloquear o fluxo desnecessariamente._

---

### KF-6 — Contrato e primeiro pagamento

**Contexto:** Renata selecionou Marcus. FracExec mediou comunicação pré-contrato. Ambos alinhados.

1. Ana gera contrato em `/admin/contracts/new` — template pré-preenchido com partes, escopo, valor, taxa 18%.
2. E-mail FR-6.1 enviado para Marcus e Renata com PDF do contrato.
3. Ambos respondem e-mail confirmando aceite (FR-6.2).
4. Ana registra assinatura no sistema. Estado do engajamento: ACTIVE. Identidades reveladas.
5. Marcus e Renata passam a ter visão completa um do outro nos respectivos portais.
6. Mês 1: Renata paga via PIX (Stripe Payment Intent). Webhook `payment_intent.succeeded` recebido.
7. **Clímax:** Após 5 dias úteis sem disputa, Stripe processa repasse a Marcus. E-mail FR-8.1 "Pagamento processado" para ambos. Dashboard de Marcus atualiza com novo repasse.

_Critério de sucesso: Marcus recebe o extrato com valor líquido (após 18%) sem confusão sobre o cálculo._
