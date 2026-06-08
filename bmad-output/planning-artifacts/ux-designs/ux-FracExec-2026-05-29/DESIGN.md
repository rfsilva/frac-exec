---
title: "FracExec — Design System"
status: final
created: 2026-05-29
updated: 2026-05-29
project: FracExec
ui_system: Angular Material (custom FracExec theme)
direction: "Verified Growth — Verde floresta + Menta vibrante"

colors:
  brand:
    primary: "#132A1E"
    deep: "#1F4A32"
    accent: "#4DC78A"
    accent_light: "#DCEEE4"
  surface:
    bg: "#F2F7F4"
    card: "#FFFFFF"
    muted: "#EDF4F0"
    subtle: "#F7FAF8"
  text:
    primary: "#0D1F15"
    secondary: "#4A6358"
    muted: "#8BA898"
    inverse: "#EAF2EE"
    on_accent: "#132A1E"
  border:
    default: "#C8E0D2"
    strong: "#9FC4B0"
  state:
    success: "#27AE60"
    success_bg: "#E8F8EE"
    warning: "#E67E22"
    warning_bg: "#FEF3E2"
    error: "#E74C3C"
    error_bg: "#FDECEA"
    info: "#2980B9"
    info_bg: "#E8F4FD"
  seal: "#4DC78A"

typography:
  family:
    display: "'Plus Jakarta Sans', system-ui, sans-serif"
    body: "'Inter', system-ui, sans-serif"
    mono: "'JetBrains Mono', monospace"
  scale:
    xs: "12px / 1.5"
    sm: "13px / 1.5"
    base: "14px / 1.6"
    md: "16px / 1.5"
    lg: "18px / 1.4"
    xl: "20px / 1.3"
    "2xl": "24px / 1.2"
    "3xl": "30px / 1.15"
    "4xl": "36px / 1.1"
    "5xl": "48px / 1.05"
  weight:
    regular: 400
    medium: 500
    semibold: 600
    bold: 700
    extrabold: 800

rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "20px"
  "2xl": "28px"
  full: "9999px"

spacing:
  base: "4px"
  scale: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96]

components:
  button:
    primary: "bg brand.primary · text brand.accent · font display semibold · radius md · px 18 py 9"
    secondary: "border 1.5px brand.primary · text brand.primary · bg transparent · radius md"
    ghost: "text text.secondary · bg transparent · no border · hover bg surface.muted"
    danger: "bg state.error_bg · text state.error · border state.error"
    size_sm: "font sm · px 12 py 5 · radius sm"
    size_md: "font base · px 18 py 9 · radius md"
    size_lg: "font md · px 24 py 12 · radius md"
  seal_badge:
    default: "bg brand.accent_light · text brand.deep · border 1px brand.accent 40% · font display bold · radius full · px 14 py 6 · uppercase tracking-wide"
    verified_hero: "bg brand.primary gradient-to-deep · text brand.accent · border brand.accent 20% · icon ✦"
  card:
    default: "bg surface.card · border border.default · radius lg · shadow-sm"
    elevated: "bg surface.card · border border.default · radius lg · shadow-md"
    muted: "bg surface.muted · border border.default · radius lg"
  tag:
    sector: "bg brand.accent_light · text brand.deep · font bold · radius sm · px 8 py 3"
    status: "bg state.{status}_bg · text state.{status} · font bold · radius sm"
    neutral: "bg surface.muted · text text.secondary · radius sm"
  input:
    default: "border border.default · radius md · focus border brand.accent · bg surface.card · text text.primary"
    label: "font sm medium · text text.secondary · mb 6"
    error: "border state.error · helper text state.error"
  nav_sidebar:
    bg: "brand.primary"
    item_default: "text text.inverse 65% · border-left 3px transparent"
    item_active: "text brand.accent · border-left 3px brand.accent · bg brand.accent 10%"
    item_hover: "text text.inverse · bg brand.accent 7%"
  avatar:
    default: "bg brand.accent_light · text brand.deep · font display extrabold · radius md"
    user: "bg brand.accent · text brand.primary · font display extrabold · radius full"
  stat_card:
    value: "font mono · text text.primary · size 3xl"
    label: "font body sm · text text.secondary · tracking-sm"
    delta_up: "text state.success · font bold sm"
    delta_warn: "text state.warning · font bold sm"
---

# FracExec — Design System

_Direção visual: Verified Growth. O Selo FracExec como identidade central — verde floresta como âncora de confiança e autoridade; menta vibrante como sinal de verificação ativa e crescimento._

---

## Brand & Style

**Posicionamento visual:** FracExec não é uma startup de recrutamento — é uma curadoria de talento sênior. O visual deve transmitir rigor, confiança e a sensação de que cada executivo na plataforma foi verdadeiramente verificado. Nenhum elemento decorativo que não carregue significado.

**Tom visual:** Sério sem ser frio. Verde floresta profundo ancora autoridade e permanência. Menta vibrante (#4DC78A) é reservada para sinais de verificação, ação confirmada e status ativo — nunca usado como cor decorativa genérica.

**O Selo FracExec** é o elemento de marca mais importante. Deve aparecer proeminente no perfil do executivo e no banner de boas-vindas do portal. Ícone: ✦ (estrela sólida estilizada). Cor: sempre brand.accent sobre brand.primary.

**Linguagem visual:** Limpa, densa de informação sem parecer congestionada. Cada tela tem uma hierarquia clara: um elemento âncora (o Seal Banner, o stat principal, o card de ação), conteúdo secundário, e ações. Sem hero images no MVP — a credibilidade vem dos dados e da estrutura, não de fotografias de stock.

**Fonte display: Plus Jakarta Sans** — moderna, com personalidade, legível em qualquer peso. Usada em logotipo, títulos, nomes de seções e botões primários. **Inter** para corpo de texto e labels. **JetBrains Mono** exclusivamente para valores monetários e dados numéricos — reforça precisão.

---

## Colors

### Paleta Principal

| Token | Hex | Uso |
|-------|-----|-----|
| `brand.primary` | `#132A1E` | Sidebar, nav principal, botões primários, hero banners |
| `brand.deep` | `#1F4A32` | Gradientes, hover states, títulos em destaque |
| `brand.accent` | `#4DC78A` | Selo FracExec, CTAs de confirmação, status ativo, ícones de verificação |
| `brand.accent_light` | `#DCEEE4` | Backgrounds de tags sector, avatar backgrounds, highlights suaves |

### Superfícies

| Token | Hex | Uso |
|-------|-----|-----|
| `surface.bg` | `#F2F7F4` | Background geral da aplicação |
| `surface.card` | `#FFFFFF` | Cards, modais, panels |
| `surface.muted` | `#EDF4F0` | Separadores internos, linhas de lista, backgrounds de inputs |
| `surface.subtle` | `#F7FAF8` | Hover em itens de lista |

### Texto

| Token | Hex | Uso |
|-------|-----|-----|
| `text.primary` | `#0D1F15` | Títulos, nomes, valores principais |
| `text.secondary` | `#4A6358` | Labels, descrições, metadados |
| `text.muted` | `#8BA898` | Placeholders, datas secundárias, contadores |
| `text.inverse` | `#EAF2EE` | Texto sobre brand.primary |
| `text.on_accent` | `#132A1E` | Texto sobre brand.accent |

### Estados

Success `#27AE60` · Warning `#E67E22` · Error `#E74C3C` · Info `#2980B9`

Cada estado tem um `*_bg` correspondente (10% opacity) para backgrounds de alertas e badges.

---

## Typography

### Hierarquia de Fontes

**Plus Jakarta Sans** (display) — carregada via Google Fonts weights 400/500/600/700/800
**Inter** (body) — carregada via Google Fonts weights 400/500/600
**JetBrains Mono** (mono) — carregada via Google Fonts weights 400/500

### Escala Tipográfica

| Nome | Tamanho | Line-height | Uso principal |
|------|---------|-------------|---------------|
| `xs` | 12px | 1.5 | Badges, timestamps, labels de swatch |
| `sm` | 13px | 1.5 | Labels de campo, metadados, nav items |
| `base` | 14px | 1.6 | Corpo de texto padrão, descrições de card |
| `md` | 16px | 1.5 | Texto de importância média, botões grandes |
| `lg` | 18px | 1.4 | Subtítulos de seção |
| `xl` | 20px | 1.3 | Títulos de página |
| `2xl` | 24px | 1.2 | Títulos de painel |
| `3xl` | 30px | 1.15 | Valores monetários em mono |
| `4xl` | 36px | 1.1 | Stats principais |
| `5xl` | 48px | 1.05 | Hero headlines (landing/public) |

### Regras de Aplicação

- **Logotipo:** Plus Jakarta Sans 800, brand.accent sobre brand.primary
- **Títulos de página:** Plus Jakarta Sans 700, text.primary
- **Labels de seção:** Plus Jakarta Sans 700, size lg
- **Valores monetários:** JetBrains Mono 500, text.primary
- **Corpo/descrições:** Inter 400, text.secondary, size base
- **Botões:** Plus Jakarta Sans 600, size sm (small) / base (default)
- **Tags/badges:** Plus Jakarta Sans 700, uppercase, tracking 0.06em, size xs

---

## Layout & Spacing

**Sistema:** múltiplos de 4px. Grid de 12 colunas com gutter de 24px.

**Layouts por portal:**

| Portal | Layout | Sidebar | Conteúdo |
|--------|--------|---------|----------|
| Executive, Company | Sidebar fixa 240px + main scrollável | brand.primary | surface.bg |
| Admin | Sidebar fixa 240px + main scrollável | brand.primary | surface.bg |
| Público (candidatura) | Centralizado, max-width 640px | — | surface.bg |

**Breakpoints:**
- `lg` (≥ 1280px): layout sidebar + conteúdo completo
- `md` (768–1279px): sidebar colapsada em ícones
- `sm` (< 768px): drawer mobile (fora do escopo MVP — apenas documentado)

**Escala de espaçamento (px):**
`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96`

---

## Elevation & Depth

O FracExec usa elevação com parcimônia — profundidade não é decoração, é hierarquia.

| Nível | Token | Aplicação |
|-------|-------|-----------|
| 0 | flat | Itens de lista, backgrounds |
| 1 | `shadow-sm`: `0 1px 4px rgba(19,42,30,.06)` | Cards padrão, stat cards |
| 2 | `shadow-md`: `0 4px 16px rgba(19,42,30,.09)` | Cards elevados, dropdowns |
| 3 | `shadow-lg`: `0 8px 32px rgba(19,42,30,.13)` | Modais, drawers, tooltips |

Sombras usam a cor brand.primary (não preto puro) para integrar com a paleta verde.

---

## Shapes

| Token | Valor | Uso |
|-------|-------|-----|
| `radius.sm` | 6px | Tags, badges menores, inputs small |
| `radius.md` | 10px | Botões, inputs, avatars quadrados, nav items |
| `radius.lg` | 16px | Cards, panels, section containers |
| `radius.xl` | 20px | Modais, drawers, banners |
| `radius.2xl` | 28px | Hero cards, splash surfaces |
| `radius.full` | 9999px | Badges de status, avatars circulares, pills de tag |

---

## Components

### Botões

**Primary:** `bg brand.primary · text brand.accent · font display semibold · radius md`
Uso: ação principal de cada tela (máx. 1 por viewport sem scroll).

**Secondary:** `border 1.5px brand.primary · text brand.primary · bg transparent · radius md`
Uso: ação secundária, sempre ao lado de um Primary.

**Ghost:** `text text.secondary · no border · hover bg surface.muted`
Uso: ações terciárias, links de navegação inline.

**Danger:** `bg state.error_bg · text state.error · border state.error`
Uso: ações destrutivas irreversíveis — confirmar rejeição, excluir conta.

### Selo FracExec

O componente mais importante da plataforma. Duas variantes:

**Hero (Seal Banner):** Banner full-width no topo do portal do executivo. Background `linear-gradient(brand.primary → brand.deep)`, ícone ✦ em círculo brand.accent, texto brand.accent, badge "Ativo/Inativo" em pill.

**Inline Badge:** `bg brand.accent_light · text brand.deep · border brand.accent 40% · radius full · uppercase tracking-wide`. Usado em cards de perfil e listas.

### Cards

**Default:** `bg surface.card · border border.default · radius lg · shadow-sm`
**Seção com header:** Header com `border-bottom border.default`, body com `padding 18px 24px`.
**Stat Card:** Valor em JetBrains Mono tamanho 3xl + label sm + delta colorizado.

### Navigation Sidebar

Background `brand.primary`. Largura 240px.
- Logo: Plus Jakarta Sans 800, brand.accent
- Section labels: 10px uppercase tracking-wide, text.inverse 35%
- Nav items: 13.5px medium, text.inverse 65% padrão; `border-left 3px brand.accent · bg brand.accent 10% · text brand.accent` no estado ativo
- Badge numérico: pill brand.accent, text brand.primary, font bold 10px
- Footer: user avatar + nome + role separados por `border-top brand.accent 12%`

### Avatar

**Quadrado (empresa/contexto):** `bg brand.accent_light · text brand.deep · radius md · font display extrabold` — exibe iniciais do setor/empresa
**Circular (usuário):** `bg brand.accent · text brand.primary · radius full · font display extrabold`

### Tags & Status Pills

**Setor:** `bg brand.accent_light · text brand.deep`
**Status ativo:** `bg state.success_bg · text state.success`
**Status pendente:** `bg state.warning_bg · text state.warning`
**Neutro:** `bg surface.muted · text text.secondary`

Todas as tags: `font display bold 700 · size xs · uppercase · tracking 0.03em · radius sm · px 8 py 3`

### Formulários

Inputs com `border border.default · radius md · focus ring brand.accent 2px`. Label acima sempre, placeholder em text.muted. Helper text em text.muted; error text em state.error abaixo do campo.

Seções de formulário longo separadas por `<section>` com título lg + divider, não por cards aninhados.

Checkbox/toggle de consentimento LGPD: label completo visível, obrigatório, sem pré-marcado.

---

## Do's and Don'ts

**Do's:**
- Usar brand.accent exclusivamente para sinais de verificação e ações confirmadas — preserva o significado do Selo
- Exibir o Seal Banner em toda sessão autenticada do executivo — é o elemento de confiança central
- Usar JetBrains Mono para todos os valores monetários sem exceção
- Manter hierarquia: 1 ação primária por viewport sem scroll
- Usar skeleton screens durante carregamento — nunca spinners bloqueantes

**Don'ts:**
- Não usar brand.accent como cor de destaque decorativo — dilui o sinal do Selo
- Não usar puro preto (#000) ou branco puro (#fff) — sempre os tons do sistema
- Não animar o Selo FracExec com pulsação/glow — rebaixa a credibilidade
- Não colocar mais de 2 botões primários side-by-side
- Não exibir stack traces ou códigos de erro técnicos ao usuário — mensagens em português sem jargão
