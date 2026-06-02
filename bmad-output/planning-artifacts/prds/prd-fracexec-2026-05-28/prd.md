---
title: "FracExec — Marketplace de Executivos Fracionados"
status: final
created: 2026-05-28
updated: 2026-05-28
---

# PRD: FracExec

## Visão do Produto

FracExec é um marketplace web curado que conecta executivos C-Level verificados a pequenas e médias empresas (PMEs) que precisam de liderança estratégica fracionada — sem o custo de uma contratação em tempo integral. O diferencial não é tecnológico: é a curadoria rigorosa de quem pode entrar na plataforma como executivo e a gestão proativa de conflitos de interesse. Juntos, esses dois elementos entregam às PMEs um nível de confiança que não existe hoje no mercado brasileiro.

O FracExec atua como mediador em todas as etapas pré-contrato, preservando confidencialidade, neutralidade e qualidade do processo.

---

## Problema

**PMEs** com 20–200 funcionários precisam de direção estratégica em finanças, tecnologia, marketing ou operações, mas não têm orçamento para um C-Level em tempo integral (R$25k–80k/mês). As alternativas disponíveis — consultorias caras ou profissionais sem histórico verificável — são arriscadas e frequentemente frustrantes.

**Executivos sêniores** com 10+ anos de experiência real querem manter relevância, renda e diversidade de projetos sem o compromisso de uma posição exclusiva. Hoje esse mercado é completamente informal: sem estrutura contratual, sem proteção e sem visibilidade.

**O mercado de "C-Levels"** é inflado e sem mecanismo de verificação: PMEs não conseguem distinguir quem realmente exerceu a função de quem apenas carrega o título.

---

## Usuários

### Primário: A PME

Empresa com 20–200 funcionários e faturamento entre R$2M e R$50M/ano. O CEO ou fundador reconhece a lacuna estratégica mas não tem orçamento para preenchê-la com contratação full-time. Sente a dor do "não sei o que não sei" em pelo menos uma das áreas: finanças, tecnologia, marketing ou operações.

**Representante:** Renata, CEO de empresa de logística com 60 funcionários. Sabe que precisa de um CFO, mas não consegue justificar o salário. Quer alguém que entenda o problema dela de verdade.

### Secundário: O Executivo Sênior

Profissional com 10+ anos de experiência comprovada em cargo C-Level real (não consultoria, não título honorífico). Busca renda complementar, diversidade de desafios ou transição gradual de carreira. Valoriza estrutura, proteção contratual e uma rede curada de pares.

**Representante:** Marcus, 52 anos, ex-CFO de rede varejista com faturamento de R$300M. Quer continuar relevante e impactar empresas menores com o que aprendeu.

### Interno: Time Operacional FracExec

Equipe responsável por verificações, matches, mediação de comunicação e gestão de contratos. Usa o painel administrativo como ferramenta principal de trabalho.

---

## Jornadas do Usuário

### UJ-1: Executivo — Da Candidatura ao Primeiro Engajamento

**Marcus** descobre o FracExec e se candidata pelo site. Preenche formulário com histórico de cargos C-Level, referências e motivação.

→ Recebe confirmação automática com prazo estimado de resposta.
→ Time FracExec analisa candidatura, verifica referências e histórico.
→ Se aprovado, recebe e-mail com "Selo FracExec" e link para criar seu perfil público.
→ Preenche perfil: especialidades, setores de experiência, disponibilidade em dias/mês, bio resumida.
→ Fica visível na pool interna (não indexado publicamente de forma ativa).
→ Recebe notificação quando o time identifica uma oportunidade compatível.
→ Analisa brief anonimizado da PME e declara interesse ou declina.
→ FracExec verifica ausência de conflito de interesse.
→ Se aprovado, FracExec media a introdução formal.
→ Contrato padronizado gerado e enviado para assinatura de ambas as partes.
→ Acessa dashboard com detalhes do engajamento, agenda e histórico de pagamentos.

### UJ-2: PME — Da Necessidade ao Primeiro Dia do Executivo

**Renata** descobre o FracExec, cadastra a empresa e posta uma "Necessidade": precisa de um CFO por 4 dias/mês durante 6 meses para estruturar o financeiro antes de uma rodada de captação.

→ Time FracExec recebe a necessidade, analisa e pesquisa na pool de executivos verificados.
→ Verifica conflitos de interesse para cada candidato em consideração.
→ Renata recebe 2–4 perfis anonimizados (sem nome ou empresa) com resumo de experiência e disponibilidade.
→ Seleciona até 2 executivos de interesse.
→ FracExec notifica os executivos selecionados com brief anonimizado da PME.
→ Executivo(s) aceita(m) ou declina(m).
→ FracExec media toda comunicação pré-contrato (perguntas, alinhamento de expectativas) — sem contato direto entre as partes ainda.
→ Aprovado o alinhamento, FracExec revela identidades e emite contrato padronizado.
→ Ambas as partes assinam. Pagamento recorrente configurado.
→ Renata acessa dashboard com dados do engajamento, histórico de sessões e pagamentos.

---

## Funcionalidades e Requisitos

### F1 — Candidatura e Verificação de Executivos

**FR-1.1** O sistema disponibiliza formulário de candidatura para executivos com os campos: nome completo, e-mail, LinkedIn, cargos C-Level anteriores (empresa, período, tamanho da equipe, receita sob gestão), mínimo 2 referências (nome, cargo, contato), e motivação (texto livre).

**FR-1.2** O time operacional acessa painel administrativo com fila de candidaturas em estados: Pendente → Em Análise → Aprovado / Rejeitado.

**FR-1.3** O sistema envia e-mail de confirmação ao candidato com prazo estimado de resposta.

`[SUPOSIÇÃO]` FR-1.4 SLA de análise: 10 dias úteis a partir do recebimento da candidatura.

**FR-1.5** O time registra notas de verificação e pode anexar documentos de suporte (comprovantes de cargo, carta de referência).

**FR-1.6** O sistema notifica o candidato por e-mail com o resultado: aprovação (com link para criação de perfil e Selo FracExec) ou rejeição (com motivo genérico).

**FR-1.7** Executivos aprovados podem recandidar-se após 6 meses em caso de rejeição.

---

### F2 — Perfil do Executivo

**FR-2.1** O executivo aprovado preenche perfil com: foto, especialidades C-Level (CTO / CFO / CMO / COO / outro), setores de experiência, disponibilidade em dias/mês, bio resumida (máx. 300 palavras), e resumo de experiência verificada.

`[SUPOSIÇÃO]` FR-2.2 Nomes de empresas anteriores são visíveis no perfil interno (time FracExec), mas opcionalmente anonimizados no perfil enviado às PMEs — executivo decide o nível de disclosure.

**FR-2.3** O executivo pode atualizar disponibilidade a qualquer momento (ativo, pausado, indisponível temporariamente).

**FR-2.4** O sistema impede que executivo com disponibilidade zero seja incluído em novas sugestões.

---

### F3 — Cadastro de PME e Postagem de Necessidade

**FR-3.1** Formulário de cadastro de PME: razão social, CNPJ, setor (lista + livre), número de funcionários (faixa), faturamento anual (faixa), nome e e-mail do responsável.

**FR-3.2** Após cadastro aprovado, PME posta uma "Necessidade" com: tipo de C-Level desejado, escopo (dias/mês + duração estimada), descrição do desafio estratégico (texto livre), contexto confidencial (campo adicional visível apenas ao time FracExec).

**FR-3.3** O sistema notifica a PME com confirmação de recebimento e SLA de retorno.

`[SUPOSIÇÃO]` FR-3.4 SLA de retorno com shortlist: 5 dias úteis.

**FR-3.5** PME pode ter apenas 1 necessidade ativa por vez no MVP.

---

### F4 — Match e Mediação

**FR-4.1** O time operacional acessa visão estruturada da necessidade da PME no painel admin, com filtros de busca na pool: especialidade, disponibilidade, setor, localização.

**FR-4.2** O time monta shortlist de 2–4 executivos por necessidade.

**FR-4.3** Verificação de conflito de interesses é obrigatória antes de incluir um executivo na shortlist (ver F5).

**FR-4.4** PME recebe perfis anonimizados dos executivos sugeridos (sem nome nem empresa — apenas especialidade, setor e resumo de experiência).

**FR-4.5** PME seleciona até 2 executivos de interesse.

**FR-4.6** FracExec notifica os executivos selecionados com brief anonimizado da PME (sem nome da empresa — apenas setor, porte, desafio).

**FR-4.7** Executivo declara interesse ou declina dentro de 3 dias úteis.

`[SUPOSIÇÃO]` FR-4.8 Se ambos os executivos declinarem, FracExec realiza novo ciclo de busca e informa a PME.

**FR-4.9** Toda comunicação pré-contrato entre PME e executivo é mediada pelo time FracExec via plataforma, em thread de mensagens com o time como intermediário. Não há troca direta de contato entre as partes até a assinatura do contrato.

**FR-4.10** O sistema mantém histórico completo de todas as mensagens mediadas por engajamento.

---

### F5 — Gestão de Conflito de Interesses

**FR-5.1** O sistema mantém registro interno de clientes ativos de cada executivo: setor (CNAE 2 dígitos), faixa de porte (funcionários), e região (estado + cidade).

**FR-5.2** Ao incluir um executivo em uma shortlist, o sistema verifica automaticamente sobreposição com seus clientes ativos. Critério de conflito: mesmo CNAE (2 dígitos) e mesma região = alerta de conflito.

**FR-5.3** O alerta é revisado pelo time FracExec antes de qualquer comunicação com a PME.

**FR-5.4** Se o time confirmar o conflito, o executivo é excluído da shortlist sem notificação à PME.

**FR-5.5** Se o time decidir apresentar o executivo mesmo com sobreposição (ex: mercados distintos dentro do mesmo setor), a PME é notificada com alerta genérico: *"Este executivo atua em empresa do mesmo segmento na sua região."* — sem revelar nomes.

**FR-5.6** A PME pode aceitar o risco ou solicitar substituição.

**FR-5.7** Ao firmar contrato, o executivo declara formalmente os clientes atuais (identificados por setor/porte/região). Essa declaração alimenta o registro de F5.1.

---

### F6 — Contrato e Pagamento

**FR-6.1** O time FracExec gera contrato padronizado pré-preenchido com: partes identificadas, escopo do engajamento (papel, dias/mês, duração), valor total e parcelas, cláusula de confidencialidade, declaração de conflito de interesses, e condições de rescisão.

**FR-6.2** Assinatura via PDF enviado por e-mail com confirmação de aceite por resposta. Solução de e-signature formal (ClickSign ou similar) avaliada para Fase 2.

**FR-6.3** Pagamento recorrente mensal configurado via PIX agendado ou cartão de crédito.

**FR-6.4** Após confirmação de entrega mensal — ou decorridos 5 dias úteis sem disputa registrada — o sistema processa o repasse ao executivo com a taxa da plataforma já deduzida.

**FR-6.5** Taxa da plataforma: 18% sobre o valor mensal do contrato, deduzida do repasse ao executivo. Valor bruto cobrado da PME; executivo recebe o líquido.

**FR-6.6** O sistema emite comprovante de pagamento para PME e extrato de repasse para o executivo.

**FR-6.7** Disputas (não entrega, qualidade abaixo do acordado) são resolvidas diretamente entre PME e executivo, nos termos definidos no contrato padronizado. A FracExec não atua como mediador ou árbitro em disputas contratuais.

---

### F7 — Dashboards

**FR-7.1 Dashboard do Executivo:**
- Engajamentos ativos (empresa anonimizada, escopo, próximas sessões)
- Status de pagamentos e histórico de repasses
- Disponibilidade atual (com edição rápida)
- Oportunidades abertas aguardando resposta

**FR-7.2 Dashboard da PME:**
- Necessidade ativa e seu status no funil (recebida / em análise / shortlist enviada / em mediação / contratado)
- Executivo(s) contratado(s): papel, dias/mês, próximas sessões
- Histórico de pagamentos e contratos
- Log de comunicações mediadas

**FR-7.3 Painel Admin (Time FracExec):**
- Fila de candidaturas de executivos (com busca e filtros)
- Pool de executivos ativos (filtros por especialidade, disponibilidade, setor)
- Fila de necessidades de PMEs
- Registro de conflitos de interesse
- Contratos ativos e pipeline de pagamentos
- Métricas básicas: candidaturas recebidas/aprovadas, necessidades ativas, contratos firmados, NPS

---

### F8 — Notificações

**FR-8.1** E-mail automático disparado nos seguintes eventos:

| Evento | Destinatário |
|--------|-------------|
| Candidatura recebida | Executivo |
| Candidatura aprovada / rejeitada | Executivo |
| Necessidade recebida | PME |
| Shortlist enviada | PME |
| Oportunidade disponível | Executivo |
| Nova mensagem mediada | PME ou Executivo |
| Contrato pronto para assinatura | PME e Executivo |
| Pagamento processado | PME e Executivo |

`[SUPOSIÇÃO]` FR-8.2 Sem notificações push mobile no MVP (plataforma web only).

---

## Requisitos Não-Funcionais

**NFR-1 — LGPD:** Dados pessoais de executivos e contatos de PMEs coletados com consentimento explícito. Direito de exclusão atendido em até 30 dias mediante solicitação. Dados de verificação (documentos, referências) armazenados com acesso restrito ao time operacional.

**NFR-2 — Compatibilidade:** Web app responsivo compatível com Chrome, Firefox, Edge e Safari (versões dos últimos 2 anos). Sem suporte a IE.

**NFR-3 — Segurança:** HTTPS obrigatório em todas as superfícies. Autenticação com senha + e-mail. Documentos armazenados em cloud storage seguro com acesso por URL assinada.

`[SUPOSIÇÃO]` NFR-4 — Capacidade MVP: até 300 executivos e 150 PMEs simultâneas sem requisitos especiais de escala. Infraestrutura padrão de cloud (ex: Vercel + Supabase ou equivalente).

**NFR-5 — Disponibilidade:** 99% de uptime mensal (SLA padrão de hospedagem em nuvem). Janelas de manutenção comunicadas com 48h de antecedência.

**NFR-6 — Performance:** Tempo de carregamento de páginas principais < 3 segundos em conexão 4G.

---

## Critérios de Sucesso

| Métrica | Meta | Horizonte |
|---------|------|-----------|
| Executivos verificados e ativos | 30 | 6 meses |
| Contratos firmados | 15 | 6 meses |
| NPS executivos | ≥ 70 | 6 meses |
| NPS PMEs | ≥ 70 | 6 meses |
| Taxa de renovação de contratos | > 60% | Ao fim do 1º período |
| Tempo médio: cadastro PME → 1º contrato | < 15 dias | Contínuo |
| Conflitos de interesse não mapeados | 0 | Contínuo |

**Contra-métrica:** Taxa de churn de executivos por falta de oportunidades — sinal de desequilíbrio no marketplace (oferta > demanda).

---

## Fora do Escopo (MVP)

- Match automático por IA
- Avaliação automatizada de executivos (testes, entrevistas estruturadas)
- App mobile nativo
- Integração com sistemas de RH, ERP ou CRM das empresas
- Sistema de reputação público com ratings detalhados
- Expansão internacional
- Chat em tempo real (substituído por thread mediada assíncrona)
- Gestão de NDA separada do contrato principal
- Emissão de nota fiscal automatizada

---

## Questões em Aberto

| # | Questão | Impacto | Decisão necessária até |
|---|---------|---------|----------------------|
| OQ-5 | Engajamento mínimo: a plataforma impõe valor ou duração mínima de contrato? | Baixo — proteção operacional | Antes de escalar |
