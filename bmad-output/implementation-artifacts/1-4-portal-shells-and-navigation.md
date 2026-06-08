---
baseline_commit: NO_VCS
---

# Story 1.4: Portal Shells & Navigation

Status: done

## Story

Como usuário autenticado (executivo, PME ou admin),
quero ver um layout de portal com sidebar de navegação e área de conteúdo após o login,
para que eu possa navegar entre as seções do meu portal sem precisar redigitar a URL.

## Acceptance Criteria

1. **Dado** login com role EXECUTIVE, **quando** redirecionado para `/executive`, **então** vê sidebar esquerda com: Dashboard, Perfil, Engajamentos, Oportunidades, Pagamentos

2. **Dado** login com role PME, **quando** redirecionado para `/company`, **então** vê sidebar esquerda com: Dashboard, Nova Necessidade, Pagamentos

3. **Dado** login com role ADMIN, **quando** redirecionado para `/admin`, **então** vê sidebar esquerda com: Dashboard, Candidaturas, Pool de Executivos, Necessidades, Engajamentos, Contratos

4. **Dado** o item de navegação ativo, **então** exibe `border-left: 3px solid brand.accent` + `background: brand.accent 10%` + texto `brand.accent` (conforme DESIGN.md nav_sidebar)

5. **Dado** sidebar em qualquer portal, **então** exibe no topo o nome do usuário + role e no rodapé o botão "Sair"

6. **Dado** o botão "Sair", **quando** clicado, **então** chama `AuthService.logout()` e redireciona para `/login`

7. **Dado** qualquer rota dentro de um portal, **quando** o usuário tenta navegar para `/executive` com role PME, **então** `roleGuard` redireciona para `/company` (portal correto do role)

8. **Dado** a área de conteúdo de cada portal, **então** cada rota lazy-loaded renderiza dentro do `<router-outlet>` do shell sem recarregar a sidebar

9. **Dado** viewport < 768px, **então** sidebar colapsa para ícones (sem labels) — mobile fora do escopo MVP mas colapso responsivo básico é obrigatório

10. **Dado** qualquer página de conteúdo dentro do portal, **então** exibe um `PageHeaderComponent` com título da página e breadcrumb mínimo (portal > página atual)

## Tasks / Subtasks

- [x] **SHELL: Criar `AppShellComponent`** — layout wrapper comum a todos os portais (AC: 4, 5, 6, 8)
  - [x] `src/app/shared/layout/app-shell/app-shell.ts` — sidebar fixa + `<router-outlet>`
  - [x] Avatar (iniciais), nav items via `@Input() navItems`, botão "Sair" via `inject(AuthService)`
  - [x] Estilos DESIGN.md: bg `brand.primary`, ativo border-left accent + bg accent 10%

- [x] **SHELL: Criar `NavItem` interface e `SidebarComponent`** (AC: 1, 2, 3, 4)
  - [x] Interface `NavItem { label, route, icon? }` exportada em `app-shell.ts`
  - [x] `routerLinkActive="active"` com `exact: false` para detecção automática

- [x] **SHELL: Criar `PageHeaderComponent`** (AC: 10)
  - [x] `src/app/shared/layout/page-header/page-header.ts` — title + breadcrumb opcional

- [x] **PORTAL: Reescrever Executive Shell** (AC: 1, 8)
  - [x] 5 nav items corretos; `executive.routes.ts` com shell como layout + 5 rotas filhas stub

- [x] **PORTAL: Reescrever Company Shell** (AC: 2, 8)
  - [x] 3 nav items; `company.routes.ts` com shell como layout + 3 rotas filhas stub

- [x] **PORTAL: Reescrever Admin Shell** (AC: 3, 8)
  - [x] 6 nav items; `admin.routes.ts` com shell como layout + 6 rotas filhas stub

- [x] **ROUTING: Atualizar `app.routes.ts`** (AC: 7)
  - [x] `roleGuard` retorna `UrlTree` do portal correto (não `false` + navigate)
  - [x] `redirectTo: 'dashboard'` em cada portal

- [x] **RESPONSIVO: Colapso de sidebar** (AC: 9)
  - [x] `@media (max-width: 768px)`: sidebar 240px → 60px, labels ocultos

- [x] **VALIDAÇÃO FINAL**
  - [x] `ng build` — limpo, 20+ lazy chunks confirmados (executive, company, admin routes + stubs)

## Dev Notes

### ⚠️ AVISOS CRÍTICOS — LEIA ANTES DE IMPLEMENTAR

**1. `app.routes.ts` já está implementado com guards — NÃO sobrescrever**
O arquivo atual tem `authGuard` + `roleGuard` configurados corretamente desde a Story 1.2. Esta story apenas:
- Adiciona `redirectTo: 'dashboard'` dentro de cada portal shell
- Confirma que o `roleGuard` redireciona (não apenas bloqueia)

**2. Shell vs. Layout — padrão correto no Angular**
O `AppShellComponent` é um componente de layout que contém a sidebar + `<router-outlet>`. O shell de cada portal (`ExecutiveShell`, `CompanyShell`, `AdminShell`) usa o `AppShellComponent` e define os nav items. As rotas filhas (dashboard, profile, etc.) são `loadComponent` dentro do `<router-outlet>` do shell — não dentro do `app.routes.ts` global.

**3. `routerLinkActive` — usar no template do sidebar**
Não usar lógica customizada para detectar rota ativa. Usar `[routerLinkActive]="'active'"` e `[routerLinkActiveOptions]="{ exact: false }"` no Angular Router.

**4. Stubs de rota — placeholder simples**
Cada rota filha stub deve ser um componente inline mínimo — apenas para o build funcionar. As implementações reais vêm nas Stories do Epic 2+. Exemplo:
```typescript
@Component({ standalone: true, template: `<p>Dashboard do Executivo — em breve</p>` })
export class ExecutiveDashboard {}
```

**5. `roleGuard` atual verifica mas não redireciona**
Verificar o `role.guard.ts` atual. Se ele apenas retorna `false` (bloqueio), atualizar para redirecionar ao portal correto baseado no role do usuário autenticado.

---

### Estado Atual dos Arquivos a Modificar

**`src/app/executive/executive.routes.ts`** (criado na Story 1.1 — stub):
```typescript
export const EXECUTIVE_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./executive-shell/executive-shell').then(m => m.ExecutiveShell) },
];
```
→ **Esta story adiciona** rotas filhas com stubs e o shell como layout wrapper.

**`src/app/company/company.routes.ts`** — mesma situação.
**`src/app/admin/admin.routes.ts`** — mesma situação.

**`src/app/core/auth/role.guard.ts`** — verificar implementação atual e atualizar se necessário para redirecionar ao portal correto.

---

### Estrutura de Layout — Referência

```
AppShellComponent
  ├── <aside class="sidebar">
  │     ├── .sidebar-header (avatar + nome + role badge)
  │     ├── <nav> (nav items com routerLinkActive)
  │     └── .sidebar-footer (botão "Sair")
  └── <main class="content">
        <router-outlet />
```

**Estrutura de rotas correta:**
```typescript
// executive.routes.ts
export const EXECUTIVE_ROUTES: Routes = [
  {
    path: '',
    component: ExecutiveShell,          // layout com sidebar
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',    loadComponent: () => import('./dashboard/executive-dashboard').then(m => m.ExecutiveDashboard) },
      { path: 'profile',      loadComponent: () => import('./profile/executive-profile').then(m => m.ExecutiveProfile) },
      { path: 'engagements',  loadComponent: () => import('./engagements/executive-engagements').then(m => m.ExecutiveEngagements) },
      { path: 'opportunities',loadComponent: () => import('./opportunities/executive-opportunities').then(m => m.ExecutiveOpportunities) },
      { path: 'payments',     loadComponent: () => import('./payments/executive-payments').then(m => m.ExecutivePayments) },
    ]
  }
];
```

---

### Sidebar — Estilos DESIGN.md

```scss
.sidebar {
  width: 240px;
  background-color: var(--color-brand-primary);  // #132A1E
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.nav-item {
  color: rgba(234, 242, 238, 0.65);  // text.inverse 65%
  border-left: 3px solid transparent;
  padding: var(--spacing-3) var(--spacing-4);
  cursor: pointer;

  &:hover {
    color: var(--color-text-inverse);
    background: rgba(77, 199, 138, 0.07);  // brand.accent 7%
  }

  &.active {
    color: var(--color-brand-accent);         // #4DC78A
    border-left-color: var(--color-brand-accent);
    background: rgba(77, 199, 138, 0.10);    // brand.accent 10%
  }
}

@media (max-width: 768px) {
  .sidebar { width: 60px; }
  .nav-item .label { display: none; }
}
```

---

### `roleGuard` — Atualização Necessária

O guard atual apenas bloqueia. Deve redirecionar ao portal correto:
```typescript
export const roleGuard: CanActivateFn = (route) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const user   = auth.currentUser();

  if (!user) return router.createUrlTree(['/login']);

  const required: string[] = route.data?.['roles'] ?? [];
  if (required.length === 0 || required.includes(user.role)) return true;

  // Redirecionar ao portal do role do usuário
  const portalByRole: Record<string, string> = {
    EXECUTIVE: '/executive',
    PME:       '/company',
    ADMIN:     '/admin',
  };
  return router.createUrlTree([portalByRole[user.role] ?? '/login']);
};
```

---

### Padrões das Stories Anteriores (preservar)

- `app.routes.ts`: guards `authGuard` + `roleGuard` com `data: { roles: [...] }` — NÃO alterar estrutura
- `auth.service.ts`: `currentUser()` retorna `signal<User | null>` — usar `auth.currentUser()` para leitura
- `--spacing-*` é o prefixo correto de spacing tokens (corrigido na Story 1.3)
- `--color-brand-primary`, `--color-brand-accent` etc. disponíveis globalmente via `:root`
- Todos os componentes são `standalone: true` — não criar NgModules

### References

- [EXPERIENCE.md — IA e portais](bmad-output/planning-artifacts/ux-designs/ux-FracExec-2026-05-29/EXPERIENCE.md#information-architecture)
- [DESIGN.md — nav_sidebar tokens](bmad-output/planning-artifacts/ux-designs/ux-FracExec-2026-05-29/DESIGN.md#components)
- [Architecture — Frontend Angular 21](bmad-output/planning-artifacts/architecture.md#frontend--angular-2124)
- [Story 1.2 — AuthService e guards](bmad-output/implementation-artifacts/1-2-user-authentication-and-role-system.md)
- [Story 1.3 — tokens CSS e componentes](bmad-output/implementation-artifacts/1-3-fracexec-angular-design-system.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (anthropic.claude-4-6-sonnet)

### Debug Log References

- `AppShell` importado como `import { AppShell }` + `import type { NavItem }` — language server reportava NG2012 indevidamente por cache; build real estava correto após corrigir caminho do `AuthService` (`../../../core/auth/auth.service`) e usar `inject()` em vez de constructor injection.
- Shells de portal usam `component: Shell` (não `loadComponent`) nas rotas para que a sidebar permaneça durante navegação nas rotas filhas.

### Completion Notes List

- `AppShell` criado em `shared/layout/app-shell/` — reutilizado pelos 3 portais via `@Input() navItems`
- `PageHeader` criado em `shared/layout/page-header/` — usado em todos os stubs de página
- `roleGuard` atualizado: retorna `UrlTree` em vez de `false` após chamada redundante ao `navigate`
- Executive (5 pages), Company (3 pages), Admin (6 pages) — todos como lazy chunks confirmados no build

### File List

**Criados:**
- `src/app/shared/layout/app-shell/app-shell.ts`
- `src/app/shared/layout/page-header/page-header.ts`
- `src/app/executive/dashboard/executive-dashboard.ts`
- `src/app/executive/profile/executive-profile.ts`
- `src/app/executive/engagements/executive-engagements.ts`
- `src/app/executive/opportunities/executive-opportunities.ts`
- `src/app/executive/payments/executive-payments.ts`
- `src/app/company/dashboard/company-dashboard.ts`
- `src/app/company/need/company-need-new.ts`
- `src/app/company/payments/company-payments.ts`
- `src/app/admin/dashboard/admin-dashboard.ts`
- `src/app/admin/candidates/admin-candidates.ts`
- `src/app/admin/pool/admin-pool.ts`
- `src/app/admin/needs/admin-needs.ts`
- `src/app/admin/engagements/admin-engagements.ts`
- `src/app/admin/contracts/admin-contracts.ts`

**Modificados:**
- `src/app/executive/executive-shell/executive-shell.ts` (reescrito)
- `src/app/executive/executive.routes.ts` (reescrito — shell como layout + children)
- `src/app/company/company-shell/company-shell.ts` (reescrito)
- `src/app/company/company.routes.ts` (reescrito)
- `src/app/admin/admin-shell/admin-shell.ts` (reescrito)
- `src/app/admin/admin.routes.ts` (reescrito)
- `src/app/core/auth/role.guard.ts` (retorna UrlTree em vez de false)

## Senior Developer Review (AI)

**Data:** 2026-06-01
**Outcome:** Changes Requested
**Layers:** Blind Hunter · Acceptance Auditor
**Dismissados:** 5 (baixo impacto / por design)

### Action Items

#### Blockers (violações de AC)

- [x] [Review][Patch] AC-9: sidebar colapsada não exibe ícones — adicionado campo `icon: string` obrigatório em `NavItem`; todos os shells atualizados com ícones Unicode; CSS exibe `.icon` e oculta `.label` em mobile [app-shell.ts / *-shell.ts]
- [x] [Review][Patch] AC-5: sidebar exibe email em vez de nome — exibe parte local do email (antes do @) como `displayName` [app-shell.ts]

#### Patches de Qualidade / Segurança

- [x] [Review][Patch] `roleGuard` fail-open quando `allowedRoles` vazio — comportamento intencional documentado com comentário explícito [role.guard.ts]
- [x] [Review][Patch] Role exibido verbatim — mapeado para `ROLE_LABELS: { EXECUTIVE: 'Executivo', PME: 'PME', ADMIN: 'Administrador' }` [app-shell.ts]
- [x] [Review][Patch] Breadcrumb `track crumb` → `track $index` [page-header.ts]
- [x] [Review][Patch] `<aside>` sem `aria-label` → `aria-label="Menu de navegação"` [app-shell.ts]
- [x] [Review][Patch] Breadcrumb `<nav aria-label="Navegação">` → `aria-label="Localização atual"` [page-header.ts]
- [x] [Review][Patch] Breadcrumb último item → `[attr.aria-current]="last ? 'page' : null"` [page-header.ts]

#### Deferred

- [x] [Review][Defer] `EXECUTIVE_ROUTES` sem `canActivate` — guards aplicados no `app.routes.ts` pai; defence-in-depth válida mas deferred para não alterar padrão sem aprovação
- [x] [Review][Defer] `@Input() navItems` sem `required: true` — risco de esquecimento futuro; deferred
- [x] [Review][Defer] roleGuard role desconhecido redireciona para login silenciosamente — aceitável no MVP
- [x] [Review][Defer] i18n do botão "Sair" — app é pt-BR only no MVP
- [x] [Review][Defer] `initials` derivado do email — brittle para emails curtos; deferred (sem campo name na Story 1.4)

### Review Follow-ups (AI)

_(será preenchido pelo dev ao retomar a implementação)_
