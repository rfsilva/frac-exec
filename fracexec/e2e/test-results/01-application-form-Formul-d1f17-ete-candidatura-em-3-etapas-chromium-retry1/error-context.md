# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-application-form.spec.ts >> Formulário de candidatura pública >> Candidato preenche e submete candidatura em 3 etapas
- Location: tests/01-application-form.spec.ts:16:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1, .apply-container, .stepper')
Expected: visible
Error: strict mode violation: locator('h1, .apply-container, .stepper') resolved to 4 elements:
    1) <h1 _ngcontent-ng-c1687365377="">Hello, fracexec-web</h1> aka getByRole('heading', { name: 'Hello, fracexec-web' })
    2) <div class="apply-container" _ngcontent-ng-c678723123="">…</div> aka locator('div').filter({ hasText: 'Candidatura FracExecJunte-se' })
    3) <h1 class="apply-title" _ngcontent-ng-c678723123="">Candidatura FracExec</h1> aka getByRole('heading', { name: 'Candidatura FracExec' })
    4) <div role="list" class="stepper" _ngcontent-ng-c678723123="" aria-label="Etapas da candidatura">…</div> aka getByRole('list', { name: 'Etapas da candidatura' })

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('h1, .apply-container, .stepper')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - main [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - img [ref=e6]
        - heading "Hello, fracexec-web" [level=1] [ref=e10]
        - paragraph [ref=e11]: Congratulations! Your app is running. 🎉
      - separator "Divider" [ref=e12]
      - generic [ref=e13]:
        - generic [ref=e14]:
          - link "Explore the Docs" [ref=e15] [cursor=pointer]:
            - /url: https://angular.dev
            - generic [ref=e16]: Explore the Docs
            - img [ref=e17]
          - link "Learn with Tutorials" [ref=e19] [cursor=pointer]:
            - /url: https://angular.dev/tutorials
            - generic [ref=e20]: Learn with Tutorials
            - img [ref=e21]
          - link "Prompt and best practices for AI" [ref=e23] [cursor=pointer]:
            - /url: https://angular.dev/ai/develop-with-ai
            - generic [ref=e24]: Prompt and best practices for AI
            - img [ref=e25]
          - link "CLI Docs" [ref=e27] [cursor=pointer]:
            - /url: https://angular.dev/tools/cli
            - generic [ref=e28]: CLI Docs
            - img [ref=e29]
          - link "Angular Language Service" [ref=e31] [cursor=pointer]:
            - /url: https://angular.dev/tools/language-service
            - generic [ref=e32]: Angular Language Service
            - img [ref=e33]
          - link "Angular DevTools" [ref=e35] [cursor=pointer]:
            - /url: https://angular.dev/tools/devtools
            - generic [ref=e36]: Angular DevTools
            - img [ref=e37]
        - generic [ref=e39]:
          - link "Github" [ref=e40] [cursor=pointer]:
            - /url: https://github.com/angular/angular
            - img [ref=e41]
          - link "X" [ref=e43] [cursor=pointer]:
            - /url: https://x.com/angular
            - img [ref=e44]
          - link "Youtube" [ref=e46] [cursor=pointer]:
            - /url: https://www.youtube.com/channel/UCbn1OgGei-DV7aSRo_HaAiw
            - img [ref=e47]
  - generic [ref=e50]:
    - banner [ref=e51]:
      - heading "Candidatura FracExec" [level=1] [ref=e52]
      - paragraph [ref=e53]: Junte-se ao nosso pool de executivos C-Level verificados.
    - list "Etapas da candidatura" [ref=e54]:
      - listitem [ref=e55]:
        - generic [ref=e56]: "1"
        - generic [ref=e57]: Dados pessoais
      - listitem [ref=e59]:
        - generic [ref=e60]: "2"
        - generic [ref=e61]: Histórico C-Level
      - listitem [ref=e63]:
        - generic [ref=e64]: "3"
        - generic [ref=e65]: Referências
    - generic [ref=e66]:
      - generic [ref=e67]:
        - heading "Dados pessoais" [level=2] [ref=e68]
        - generic [ref=e69]:
          - generic [ref=e70]: Nome completo *
          - textbox "Nome completo *" [ref=e71]
        - generic [ref=e72]:
          - generic [ref=e73]: E-mail profissional *
          - textbox "E-mail profissional *" [ref=e74]
        - generic [ref=e75]:
          - generic [ref=e76]: LinkedIn *
          - textbox "LinkedIn *" [ref=e77]:
            - /placeholder: https://linkedin.com/in/seu-perfil
      - button "Próxima etapa →" [ref=e79] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * E2E — Jornada do Candidato (pública)
  5  |  * Story 2.1: Public Application Form (Stepper)
  6  |  */
  7  | test.describe('Formulário de candidatura pública', () => {
  8  | 
  9  |   test('Rota /apply é pública — sem redirecionamento para login', async ({ page }) => {
  10 |     await page.goto('/apply');
  11 |     await page.waitForLoadState('networkidle');
  12 |     await expect(page).not.toHaveURL(/\/login/);
  13 |     await expect(page).toHaveTitle('FracExec');
  14 |   });
  15 | 
  16 |   test('Candidato preenche e submete candidatura em 3 etapas', async ({ page }) => {
  17 |     await page.goto('/apply');
  18 |     await page.waitForLoadState('networkidle');
  19 |     await page.waitForTimeout(1500);
  20 | 
> 21 |     await expect(page.locator('h1, .apply-container, .stepper')).toBeVisible({ timeout: 10000 });
     |                                                                  ^ Error: expect(locator).toBeVisible() failed
  22 | 
  23 |     // Etapa 1
  24 |     await page.locator('input[id="fullName"], input[type="text"]').first().fill('Carlos Lima');
  25 |     await page.locator('input[id="email"], input[type="email"]').first().fill(`carlos.e2e.${Date.now()}@test.com`);
  26 |     await page.locator('input[id="linkedinUrl"], input[type="url"]').first().fill('https://linkedin.com/in/carloslima');
  27 |     await page.getByRole('button', { name: /próxima etapa/i }).click();
  28 |     await page.waitForTimeout(500);
  29 | 
  30 |     // Etapa 2 — roleTitle
  31 |     const roleInput = page.locator('input[placeholder*="CFO"], input[placeholder*="cargo"]').first();
  32 |     if (await roleInput.isVisible()) await roleInput.fill('CTO');
  33 |     const dateInput = page.locator('input[type="date"]').first();
  34 |     if (await dateInput.isVisible()) await dateInput.fill('2019-01-01');
  35 |     await page.getByRole('button', { name: /próxima etapa/i }).click();
  36 |     await page.waitForTimeout(500);
  37 | 
  38 |     // Etapa 3 — referências
  39 |     const refInputs = page.locator('.reference-block input[type="text"]');
  40 |     const count = await refInputs.count();
  41 |     if (count >= 6) {
  42 |       await refInputs.nth(0).fill('Ana Oliveira');
  43 |       await refInputs.nth(1).fill('CEO');
  44 |       await refInputs.nth(2).fill('ana@empresa.com');
  45 |       await refInputs.nth(3).fill('Bruno Santos');
  46 |       await refInputs.nth(4).fill('CFO');
  47 |       await refInputs.nth(5).fill('bruno@empresa.com');
  48 |     }
  49 |     await page.locator('textarea[id="motivation"]').fill('Experiência de 20 anos em liderança tecnológica.');
  50 |     await page.locator('.lgpd-field input[type="checkbox"]').check();
  51 |     await page.getByRole('button', { name: /enviar candidatura/i }).click();
  52 | 
  53 |     await expect(page.locator('.confirmation-title, text=Candidatura recebida')).toBeVisible({ timeout: 15000 });
  54 |   });
  55 | 
  56 |   test('Formulário bloqueia avanço com LinkedIn inválido', async ({ page }) => {
  57 |     await page.goto('/apply');
  58 |     await page.waitForLoadState('networkidle');
  59 |     await page.waitForTimeout(1500);
  60 | 
  61 |     await page.locator('input[type="text"]').first().fill('Teste Bloqueio');
  62 |     await page.locator('input[type="email"]').first().fill('bloqueio@test.com');
  63 |     await page.locator('input[type="url"], input[id="linkedinUrl"]').first().fill('https://twitter.com/invalido');
  64 |     await page.getByRole('button', { name: /próxima etapa/i }).click();
  65 |     await page.waitForTimeout(500);
  66 | 
  67 |     // Permanece na etapa 1 — erro de URL
  68 |     await expect(page.locator('.error, text=inválida, text=LinkedIn')).toBeVisible({ timeout: 5000 });
  69 |   });
  70 | });
  71 | 
```