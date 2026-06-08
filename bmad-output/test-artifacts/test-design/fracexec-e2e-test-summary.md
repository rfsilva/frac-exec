---
title: "FracExec — Sumário de Testes E2E"
status: "parcialmente executado"
framework: "Playwright 1.60.0 + Chromium headless"
date: "2026-06-02"
total_tests: 26
passed: 15
failed: 11
pass_rate: "58%"
environment: "http://localhost:80 (Docker WSL)"
---

# Sumário de Testes E2E — FracExec

## Resultado Geral

| Métrica | Valor |
|---------|-------|
| Framework | Playwright 1.60.0 + Chromium headless |
| Total de testes | 26 |
| ✅ PASS | 15 |
| ❌ FAIL | 11 |
| Taxa de sucesso | 58% |

---

## Resultados por Arquivo

### 01 — Formulário de Candidatura Pública (Story 2.1)
| Teste | Status | Observação |
|-------|--------|------------|
| Rota /apply é pública | ✅ PASS | Angular carrega, URL correta |
| Candidato preenche stepper 3 etapas | ❌ FAIL | Angular hidrata lentamente; seletores do stepper não encontrados antes do timeout |
| Formulário bloqueia LinkedIn inválido | ❌ FAIL | Mesma causa — hidratação lenta |

### 02 — Autenticação e Portais (Stories 1.2, 1.4)
| Teste | Status | Observação |
|-------|--------|------------|
| Rota raiz → /login | ✅ PASS | |
| Login inválido permanece em /login | ✅ PASS | |
| Login EXECUTIVE → /executive | ✅ PASS | |
| Sidebar EXECUTIVE com itens corretos | ✅ PASS | |
| Login ADMIN → /admin | ✅ PASS | |
| Botão Sair → /login | ✅ PASS | |
| PME redireciona ao portal correto | ✅ PASS | |

### 03 — Perfil do Executivo (Story 2.4)
| Teste | Status | Observação |
|-------|--------|------------|
| Sem perfil → banner /profile | ❌ FAIL | Seletor `.banner` não encontrado antes do timeout |
| Salva perfil → mensagem de sucesso | ❌ FAIL | `textarea[id="bio"]` não visível — Angular ainda hidratando |
| SealBanner visível após login | ✅ PASS | `.seal-banner` encontrado |
| exec-layout e sidebar carregam | ✅ PASS | |

### 04 — Drawer de Disponibilidade (Story 2.5)
| Teste | Status | Observação |
|-------|--------|------------|
| Dashboard mostra widget | ❌ FAIL | `.widget-card` não visível — hidratação insuficiente |
| Botão Editar abre drawer | ✅ PASS | `.btn-edit` encontrado e drawer abre |
| Salvar drawer atualiza widget | ❌ FAIL | Widget não visível para verificar update |
| ESC com alterações → confirmação | ❌ FAIL | Idem — estado de pré-requisito não estabelecido |
| Backdrop → confirmação e descartar | ❌ FAIL | Idem |

### 05 — Admin: Candidaturas e Pool (Stories 2.2, 2.6)
| Teste | Status | Observação |
|-------|--------|------------|
| Admin vê fila em /admin/candidates | ❌ FAIL | `.page-body` não aparece antes do timeout |
| Filtro de status visível | ✅ PASS | `.filters select` encontrado |
| Expande candidatura inline | ✅ PASS | |
| /admin/candidates sem login → /login | ✅ PASS | |
| Admin acessa /admin/pool | ❌ FAIL | `.page-body` idem |
| Pool tem filtros | ❌ FAIL | Idem |
| /admin/pool sem login → /login | ✅ PASS | |

---

## Causa Raiz dos Falhos

**Problema:** O Angular 21 com `ng build` gera um SPA com JavaScript. O Nginx serve o `index.html` estático com `<app-root></app-root>` vazio. O Playwright captura o estado antes do JavaScript Angular executar e popular o DOM.

**Evidência:** `div.content`, `div.left-side` (do template `app.html` padrão) aparecem no DOM antes da hidratação dos componentes reais.

**Soluções para alcançar 100%:**

1. **Aumentar timeouts de hidratação** (5-10s em vez de 1.5-3s)
2. **Usar `waitForFunction`** aguardando seletores específicos do Angular:
   ```typescript
   await page.waitForFunction(() =>
     document.querySelector('app-admin-candidates') !== null,
     { timeout: 15000 }
   );
   ```
3. **Configurar Angular com** `prerender: false` no `angular.json` para desabilitar o SSR/prerender (mais simples para testes locais)
4. **Usar** `page.waitForSelector` com polling mais longo

---

## Testes que PASSARAM (validação de negócio confirmada)

✅ Fluxo de autenticação completo (7 testes)  
✅ Redirecionamento por role (EXECUTIVE, PME, ADMIN)  
✅ SealBanner presente no portal executivo  
✅ Layout do shell (sidebar, exec-layout)  
✅ Drawer de disponibilidade abre ao clicar em Editar  
✅ Acesso não autenticado → redirect para /login  
✅ Expansão inline de candidatura (admin)  
✅ Filtros visíveis nas páginas admin  

---

## Arquivos de Teste Gerados

```
e2e/
  tests/
    01-application-form.spec.ts      — Candidatura pública (stepper 3 etapas)
    02-auth-and-portals.spec.ts      — Login, roles, portais, logout
    03-executive-profile.spec.ts     — Perfil, banner, SealBanner
    04-availability-drawer.spec.ts   — Widget + drawer de disponibilidade
    05-admin-candidacy-and-pool.spec.ts — Fila e pool do admin
  setup/
    global-setup.ts                 — Seed de usuário EXECUTIVE antes da suite
  playwright.config.ts
  tsconfig.json
  package.json
```

## Próximos Passos

1. Adicionar `waitForAngular` helper (aguarda `ngZone.isStable` ou seletor específico)
2. Desabilitar prerender no `angular.json` para ambiente de testes
3. Integrar no CI (`.github/workflows`) como job separado executando após `docker compose up`
4. Expandir cobertura para Stories 2.3 (aprovação/rejeição via UI) e Epic 3+
