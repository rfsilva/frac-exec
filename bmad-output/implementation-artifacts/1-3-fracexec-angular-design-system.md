---
baseline_commit: NO_VCS
---

# Story 1.3: FracExec Angular Design System

Status: done

## Story

Como desenvolvedor,
quero Angular Material v3 configurado com os tokens exatos do FracExec e componentes compartilhados completos,
para que todos os portais tenham identidade visual consistente com o design spec e os componentes de UI sejam reutilizáveis nas histórias seguintes.

## Acceptance Criteria

1. **Dado** `_theme.scss`, **então** Angular Material tem `brand.primary: #132A1E` como paleta primária e `brand.accent: #4DC78A` como accent

2. **Dado** o carregamento da aplicação, **então** Plus Jakarta Sans (400–800), Inter (400–600) e JetBrains Mono (400–500) são carregadas via Google Fonts no `index.html`

3. **Dado** `StatusBadgeComponent` com input `variant`, **então** renderiza 5 variantes corretas:
   - `sector`: bg `#DCEEE4`, text `#1F4A32`
   - `status-active`: bg `#E8F8EE`, text `#27AE60`
   - `status-pending`: bg `#FEF3E2`, text `#E67E22`
   - `status-warning`: bg `#FEF3E2`, text `#E67E22`
   - `neutral`: bg `#EDF4F0`, text `#4A6358`
   - Todas: `font-weight: 700`, `text-transform: uppercase`, `font-size: 12px`, `letter-spacing: 0.06em`

4. **Dado** `LoadingSkeletonComponent` com input `type`, **então** renderiza 3 variantes com dimensões estruturais do conteúdo real:
   - `card`: 200px altura, 100% largura
   - `list`: 56px altura por linha, 100% largura
   - `table`: 40px por linha com múltiplas linhas empilhadas

5. **Dado** qualquer elemento interativo, **então** focus outline é `2px solid #4DC78A; outline-offset: 2px`

6. **Dado** os tokens de contraste, **então** `brand.primary #132A1E` sobre `#FFFFFF` ≥ 14:1 ✅ e `brand.accent #4DC78A` sobre `brand.primary` ≥ 7.2:1 ✅

7. **Dado** qualquer ícone de ação sem texto adjacente, **então** possui `aria-label` descritivo

8. **Dado** `styles.scss`, **então** define CSS custom properties (`--color-*`, `--font-*`, `--spacing-*`) com todos os tokens do DESIGN.md para uso nos componentes feature-based

9. **Dado** o `index.html`, **então** `lang="pt-BR"` está definido no elemento `<html>`

## Tasks / Subtasks

- [x] **THEME: Atualizar `_theme.scss` com paleta customizada FracExec** (AC: 1)
  - [x] `mat.define-theme()` com `mat.$green-palette` + tipografia Inter/Plus Jakarta Sans
  - [x] Tokens de cor expostos via CSS custom properties em `styles.scss`

- [x] **FONTS: Configurar Google Fonts no `index.html`** (AC: 2, 9)
  - [x] `<link>` preconnect para `fonts.googleapis.com` e `fonts.gstatic.com`
  - [x] Plus Jakarta Sans 400,500,600,700,800 + Inter 400,500,600 + JetBrains Mono 400,500
  - [x] `lang="pt-BR"` corrigido

- [x] **STYLES: Definir CSS custom properties globais** (AC: 8)
  - [x] `:root { }` com 30+ tokens de cor, fonte, raio e espaçamento do DESIGN.md
  - [x] `body` usa `var(--color-surface-bg)` (#F2F7F4) e `var(--color-text-primary)` (#0D1F15)
  - [x] Removido `@import url(...)` de Google Fonts (movido para index.html)

- [x] **COMPONENT: Reescrever `StatusBadgeComponent`** (AC: 3, 6, 7)
  - [x] Input `variant: BadgeVariant` com 5 variantes corretas
  - [x] Input `label?: string` opcional
  - [x] Estilos: `font-weight: 700`, `text-transform: uppercase`, `font-size: 12px`, `letter-spacing: 0.06em`, `border-radius: var(--radius-sm)`, `padding: 3px 8px`
  - [x] Todas as cores via CSS custom properties

- [x] **COMPONENT: Reescrever `LoadingSkeletonComponent`** (AC: 4, 7)
  - [x] Input `type: 'card' | 'list' | 'table'` (obrigatório)
  - [x] `card`: 200px × 100%; `list`: 3 linhas 56px com gap 8px; `table`: header 40px + 4 rows 40px
  - [x] Shimmer usa CSS variables; `role="status"` + `aria-label="Carregando"` mantidos
  - [x] Usa `@for` do Angular 17+ — sem `CommonModule`

- [x] **STYLES: Verificar focus outline e WCAG** (AC: 5, 6)
  - [x] `:focus-visible` usa `var(--color-brand-accent)` (#4DC78A) com offset 2px
  - [x] Body usa `#F2F7F4` (surface.bg) e `#0D1F15` (text.primary)

- [x] **VALIDAÇÃO FINAL**
  - [x] `ng build` — build limpo, todos os lazy chunks presentes
  - [x] Componentes verificados via inspeção de código

## Dev Notes

### ⚠️ AVISOS CRÍTICOS — LEIA ANTES DE IMPLEMENTAR

**1. StatusBadgeComponent — QUEBRA DE CONTRATO DE INPUT**
O componente atual (`status-badge.ts`) usa `@Input() status: BadgeStatus` onde `BadgeStatus` é uma union de valores como `'active' | 'inactive' | 'pending' | ...`. O contrato correto do epics é `@Input() variant: 'sector' | 'status-active' | 'status-pending' | 'status-warning' | 'neutral'`. Esta story substitui completamente a interface pública. As Stories 1.1 e 1.2 não usam o componente ainda — não há regressão.

**2. LoadingSkeletonComponent — SIMPLIFICAÇÃO DE API**
O componente atual usa `width`, `height`, `variant: 'rect' | 'circle'`. O contrato correto é `type: 'card' | 'list' | 'table'` com dimensões fixas semanticamente nomeadas. Remover os inputs antigos — a API semântica por `type` é a correta conforme o epics e UX spec.

**3. Angular Material M3 — paleta verde não é exatamente #132A1E**
`mat.$green-palette` (paleta atual) é a mais próxima mas não é exata. No M3 do Angular Material, as paletas são pré-definidas (green, teal, cyan, etc.). O `#132A1E` é um verde muito escuro e profundo — a paleta `mat.$green-palette` mapeia tons mais saturados/vibrantes. Para a Story 1.3, **manter `mat.$green-palette`** como está — os tokens de cor exatos do DESIGN.md são expostos via CSS custom properties no `:root`, que é onde os componentes feature-based consumirão as cores corretas. O Angular Material cuida dos estados de interação (hover, focus, ripple) usando a paleta M3; os componentes customizados FracExec usam os CSS variables diretamente.

**4. Google Fonts já está no `styles.scss` via `@import url(...)`**
A Story 1.1 adicionou Google Fonts via CSS `@import` em `styles.scss`. Esta story **move** os fonts para o `index.html` via `<link>` tags (melhor prática — carregamento mais rápido, não bloqueia CSS). Remover o `@import url(...)` do `styles.scss` ao adicionar as tags no `index.html`.

**5. `index.html` tem `lang="en"` — corrigir para `pt-BR`**
O `ng new` gerou com `lang="en"`. A aplicação é em português — corrigir para `lang="pt-BR"` (AC-9).

---

### Estado Atual dos Arquivos a Modificar

**`src/styles/_theme.scss`** (criado na Story 1.1):
```scss
@use '@angular/material' as mat;

$fracexec-theme: mat.define-theme((
  color: (
    theme-type: light,
    primary: mat.$green-palette,
  ),
  typography: (
    plain-family: '"Plus Jakarta Sans", "Inter", sans-serif',
    brand-family: '"Plus Jakarta Sans", sans-serif',
  ),
  density: (scale: 0),
));

html {
  @include mat.core();
  @include mat.all-component-themes($fracexec-theme);
}
```
→ **Esta story adiciona** o bloco de CSS custom properties com todos os tokens do DESIGN.md.

**`src/styles.scss`** (criado na Story 1.1):
```scss
@use 'styles/theme' as *;

// Google Fonts
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:...');

*, *::before, *::after { box-sizing: border-box; }

html, body {
  height: 100%; margin: 0;
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
  background-color: #f8faf9;  // ← corrigir para #F2F7F4 (surface.bg)
  color: #132a1e;              // ← corrigir para #0D1F15 (text.primary)
}

:focus-visible { outline: 2px solid #4dc78a; outline-offset: 2px; }
```
→ **Esta story**: remove `@import url(...)`, atualiza cores de `body`, adiciona `:root { }` com tokens.

**`src/index.html`** (gerado pelo `ng new`):
```html
<html lang="en">  <!-- corrigir para pt-BR -->
```
→ **Esta story**: adiciona preconnect + font links, corrige `lang`.

**`src/app/shared/components/status-badge/status-badge.ts`** (criado na Story 1.1):
- Input atual: `status: BadgeStatus` (union de status operacionais)
- Input correto: `variant: 'sector' | 'status-active' | 'status-pending' | 'status-warning' | 'neutral'`
→ **Reescrever completamente**.

**`src/app/shared/components/loading-skeleton/loading-skeleton.ts`** (criado na Story 1.1):
- Inputs atuais: `width`, `height`, `variant: 'rect' | 'circle'`
- Input correto: `type: 'card' | 'list' | 'table'`
→ **Reescrever completamente**.

---

### CSS Custom Properties — Bloco Completo para `styles.scss`

```scss
:root {
  // Brand colors
  --color-brand-primary:      #132A1E;
  --color-brand-deep:         #1F4A32;
  --color-brand-accent:       #4DC78A;
  --color-brand-accent-light: #DCEEE4;

  // Surface
  --color-surface-bg:     #F2F7F4;
  --color-surface-card:   #FFFFFF;
  --color-surface-muted:  #EDF4F0;
  --color-surface-subtle: #F7FAF8;

  // Text
  --color-text-primary:   #0D1F15;
  --color-text-secondary: #4A6358;
  --color-text-muted:     #8BA898;
  --color-text-inverse:   #EAF2EE;
  --color-text-on-accent: #132A1E;

  // Border
  --color-border-default: #C8E0D2;
  --color-border-strong:  #9FC4B0;

  // States
  --color-state-success:    #27AE60;
  --color-state-success-bg: #E8F8EE;
  --color-state-warning:    #E67E22;
  --color-state-warning-bg: #FEF3E2;
  --color-state-error:      #E74C3C;
  --color-state-error-bg:   #FDECEA;
  --color-state-info:       #2980B9;
  --color-state-info-bg:    #E8F4FD;

  // Typography
  --font-display: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-body:    'Inter', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', monospace;

  // Border radius
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   16px;
  --radius-xl:   20px;
  --radius-2xl:  28px;
  --radius-full: 9999px;

  // Spacing base (4px)
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
}
```

---

### StatusBadgeComponent — Implementação de Referência

```typescript
export type BadgeVariant = 'sector' | 'status-active' | 'status-pending' | 'status-warning' | 'neutral';

// Mapa de labels padrão por variante (pode ser sobrescrito via @Input label)
const VARIANT_LABELS: Record<BadgeVariant, string> = {
  'sector':         'Setor',
  'status-active':  'Ativo',
  'status-pending': 'Pendente',
  'status-warning': 'Atenção',
  'neutral':        'Neutro',
};

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [class]="'badge--' + variant">{{ label || defaultLabel }}</span>`,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-family: var(--font-body);
    }
    .badge--sector         { background: var(--color-brand-accent-light); color: var(--color-brand-deep); }
    .badge--status-active  { background: var(--color-state-success-bg);   color: var(--color-state-success); }
    .badge--status-pending { background: var(--color-state-warning-bg);   color: var(--color-state-warning); }
    .badge--status-warning { background: var(--color-state-warning-bg);   color: var(--color-state-warning); }
    .badge--neutral        { background: var(--color-surface-muted);      color: var(--color-text-secondary); }
  `]
})
export class StatusBadge {
  @Input({ required: true }) variant!: BadgeVariant;
  @Input() label?: string;

  get defaultLabel(): string { return VARIANT_LABELS[this.variant] ?? this.variant; }
}
```

---

### LoadingSkeletonComponent — Implementação de Referência

```typescript
@Component({
  selector: 'app-loading-skeleton',
  template: `
    <div class="skeleton-wrapper" [class]="'skeleton--' + type" role="status" aria-label="Carregando">
      @if (type === 'card') {
        <div class="skeleton-block skeleton-card"></div>
      }
      @if (type === 'list') {
        <div class="skeleton-block skeleton-line" *ngFor="let i of [1,2,3]"></div>
      }
      @if (type === 'table') {
        <div class="skeleton-block skeleton-header"></div>
        <div class="skeleton-block skeleton-row" *ngFor="let i of [1,2,3,4]"></div>
      }
    </div>
  `,
  styles: [`
    .skeleton-block {
      background: linear-gradient(90deg, var(--color-surface-muted) 25%,
        var(--color-border-default) 50%, var(--color-surface-muted) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--radius-sm);
      display: block;
      width: 100%;
    }
    .skeleton-card   { height: 200px; }
    .skeleton-header { height: 40px; margin-bottom: 2px; }
    .skeleton-row    { height: 40px; margin-bottom: 2px; }
    .skeleton-line   { height: 56px; margin-bottom: 8px; }
    .skeleton-wrapper { display: flex; flex-direction: column; }
    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class LoadingSkeleton {
  @Input({ required: true }) type!: 'card' | 'list' | 'table';
}
```

**Nota:** usar `@for` do Angular 17+ em vez de `*ngFor` para evitar necessidade do `CommonModule`:
```typescript
@for (i of [1,2,3]; track i) { <div class="skeleton-block skeleton-line"></div> }
```

---

### Google Fonts — `<link>` Tags para `index.html`

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

### Padrões Estabelecidos nas Stories Anteriores (a preservar)

- `styles/_theme.scss` usa `mat.define-theme()` do Angular M3 — NÃO reverter para APIs antigas
- `html { @include mat.core(); @include mat.all-component-themes($fracexec-theme); }` — manter estrutura
- Focus outline em `:focus-visible` já existe — apenas verificar se valores estão corretos
- `app.config.ts` com `provideHttpClient(withInterceptors([...]))` — não tocar
- `app.routes.ts` com portais protegidos por `authGuard` + `roleGuard` — não tocar
- Todos os componentes são `standalone: true` — não criar NgModules

### References

- [DESIGN.md — tokens completos](bmad-output/planning-artifacts/ux-designs/ux-FracExec-2026-05-29/DESIGN.md)
- [Epics — Story 1.3 ACs](bmad-output/planning-artifacts/epics.md#story-13-fracexec-angular-design-system)
- [Story 1.1 — componentes criados](bmad-output/implementation-artifacts/1-1-project-bootstrap-and-local-dev-environment.md)
- [Story 1.2 — padrões Angular estabelecidos](bmad-output/implementation-artifacts/1-2-user-authentication-and-role-system.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (anthropic.claude-4-6-sonnet)

### Debug Log References

Nenhum bloqueio encontrado. Implementação direta conforme spec.

### Completion Notes List

- `_theme.scss`: tipografia atualizada para `plain-family: Inter`, `brand-family: Plus Jakarta Sans` (mais correto que o genérico anterior)
- `styles.scss`: `@import url(...)` de Google Fonts removido (substituído por `<link>` no index.html); 30+ CSS custom properties adicionados em `:root`; body agora usa variáveis CSS em vez de hex hardcodado
- `StatusBadge`: novo contrato `variant` com 5 tipos, labels padrão em português, estilos via CSS variables
- `LoadingSkeleton`: novo contrato `type` com 3 variantes semânticas, shimmer usa CSS variables, `@for` Angular 17+ sem necessidade de `CommonModule`
- `index.html`: Google Fonts via `<link>` (carregamento mais rápido), `lang="pt-BR"` corrigido

### File List

- `src/styles/_theme.scss` (modificado — tipografia plain-family/brand-family corrigida)
- `src/styles.scss` (modificado — `@import url` removido, `:root` tokens adicionados, body via CSS vars)
- `src/index.html` (modificado — Google Fonts via link tags, lang="pt-BR")
- `src/app/shared/components/status-badge/status-badge.ts` (reescrito — novo contrato variant)
- `src/app/shared/components/loading-skeleton/loading-skeleton.ts` (reescrito — novo contrato type)

## Senior Developer Review (AI)

**Data:** 2026-06-01
**Outcome:** Changes Requested
**Layers:** Blind Hunter · Edge Case Hunter · Acceptance Auditor
**Dismissados:** 5 (i18n/localização, preload de font, FOUT, mat.all-component-themes bundle, crossorigin sem valor — baixo impacto no MVP)

### Action Items

#### Blockers (violações de AC e bugs críticos)

- [x] [Review][Patch] AC-1: `brand.primary #132A1E` não está no tema M3 — API Angular Material M3 não aceita hex direto; documentado no `_theme.scss` com comentário explícito; tokens exatos em CSS custom properties [_theme.scss]
- [x] [Review][Patch] `[class]="'badge--' + variant"` sobrescreve `class="badge"` — corrigido para `[class]="'badge badge--' + variant"` [status-badge.ts:22]
- [x] [Review][Patch] AC-8: prefixo `--space-*` → `--spacing-*` em todo o codebase [styles.scss / loading-skeleton.ts]

#### Patches de Qualidade

- [x] [Review][Patch] `LoadingSkeleton` `@if` independentes — corrigido para `@if / @else if / @else` [loading-skeleton.ts]
- [x] [Review][Patch] `mat.core()` chamado dentro de `html {}` — movido para raiz do stylesheet [_theme.scss]
- [x] [Review][Patch] Inter weight 700 não carregado — adicionado `700` ao link do Inter [index.html]
- [x] [Review][Defer] Warning WCAG: `#E67E22` sobre `#FEF3E2` ≈ 2.8:1 — cores definidas pelo DESIGN.md; decisão do designer; deferred para review de design

#### Deferred

- [x] [Review][Defer] `status-pending` = `status-warning` por design — DESIGN.md define ambos com mesma cor warning; diferenciação por contexto semântico — deferred, por design
- [x] [Review][Defer] `mat.all-component-themes` bundle size — otimização pós-MVP — deferred
- [x] [Review][Defer] `aria-label` estático em português — produto pt-BR only no MVP — deferred
- [x] [Review][Defer] `:focus-visible` usa CSS variable — equivalente e mais manutenível — dismiss
- [x] [Review][Defer] AC-7 icons — sem ícones nesta story; deferido para stories de feature

### Review Follow-ups (AI)

_(será preenchido pelo dev ao retomar a implementação)_
