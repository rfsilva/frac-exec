# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 03-executive-profile.spec.ts >> Perfil do executivo >> Executivo preenche e salva perfil — mensagem de sucesso
- Location: tests/03-executive-profile.spec.ts:31:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('textarea[id="bio"]') to be visible

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
    - banner "Selo FracExec" [ref=e52]:
      - generic [ref=e53]: ✦
      - generic [ref=e54]:
        - generic [ref=e55]: e2e.executive.1780688813186
        - generic [ref=e56]: Data de verificação não disponível
      - generic [ref=e57]:
        - generic "Inativo status" [ref=e58]: Inativo
        - button "Atualizar disponibilidade" [ref=e59] [cursor=pointer]
    - generic [ref=e61]:
      - complementary "Menu de navegação" [ref=e62]:
        - generic [ref=e63]:
          - generic [ref=e64]: E2
          - generic [ref=e65]:
            - generic [ref=e66]: e2e.executive.1780688813186
            - generic [ref=e67]: Executivo
        - navigation "Portal" [ref=e68]:
          - link "Dashboard" [ref=e69] [cursor=pointer]:
            - /url: /executive/dashboard
            - generic [ref=e70]: ⊞
            - generic [ref=e71]: Dashboard
          - link "Perfil" [ref=e72] [cursor=pointer]:
            - /url: /executive/profile
            - generic [ref=e73]: ◎
            - generic [ref=e74]: Perfil
          - link "Engajamentos" [ref=e75] [cursor=pointer]:
            - /url: /executive/engagements
            - generic [ref=e76]: ⊡
            - generic [ref=e77]: Engajamentos
          - link "Oportunidades" [ref=e78] [cursor=pointer]:
            - /url: /executive/opportunities
            - generic [ref=e79]: ◈
            - generic [ref=e80]: Oportunidades
          - link "Pagamentos" [ref=e81] [cursor=pointer]:
            - /url: /executive/payments
            - generic [ref=e82]: ◇
            - generic [ref=e83]: Pagamentos
        - button "Sair" [ref=e85] [cursor=pointer]
      - main [ref=e86]:
        - generic [ref=e87]:
          - generic "Meu Perfil" [ref=e88]:
            - navigation "Localização atual" [ref=e89]:
              - generic [ref=e90]: Executivo
              - generic [ref=e91]: /
              - generic [ref=e92]: Perfil
            - heading "Meu Perfil" [level=1] [ref=e93]
          - generic [ref=e95]:
            - generic [ref=e96]:
              - heading "Foto de perfil" [level=2] [ref=e97]
              - generic [ref=e98]:
                - generic [ref=e99]: ◎
                - button "Selecionar foto de perfil" [ref=e101]
            - generic [ref=e102]:
              - heading "Bio *" [level=2] [ref=e103]
              - textbox "Descreva sua trajetória C-Level (máx. 300 palavras)" [ref=e104]
              - paragraph [ref=e105]: 0 / 300 palavras
            - generic [ref=e106]:
              - heading "Especialidades C-Level *" [level=2] [ref=e107]
              - generic [ref=e108]:
                - generic [ref=e109] [cursor=pointer]:
                  - checkbox "CFO" [ref=e110]
                  - text: CFO
                - generic [ref=e111] [cursor=pointer]:
                  - checkbox "CTO" [ref=e112]
                  - text: CTO
                - generic [ref=e113] [cursor=pointer]:
                  - checkbox "CMO" [ref=e114]
                  - text: CMO
                - generic [ref=e115] [cursor=pointer]:
                  - checkbox "COO" [ref=e116]
                  - text: COO
                - generic [ref=e117] [cursor=pointer]:
                  - checkbox "OUTRO" [ref=e118]
                  - text: OUTRO
            - generic [ref=e119]:
              - heading "Setores de experiência" [level=2] [ref=e120]
              - generic [ref=e121]:
                - 'textbox "Ex: Tecnologia, Varejo, Saúde" [ref=e122]'
                - button "Adicionar" [ref=e123] [cursor=pointer]
            - generic [ref=e124]:
              - heading "Resumo de experiência verificada" [level=2] [ref=e125]
              - textbox "Descreva suas principais realizações." [ref=e126]
            - button "Salvar perfil" [ref=e128] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const EXECUTIVE_EMAIL = process.env.E2E_EXEC_EMAIL || 'test.executive@fracexec.com';
  4  | const EXECUTIVE_PASS  = process.env.E2E_EXEC_PASSWORD || 'Test@2026!';
  5  | 
  6  | async function loginAsExecutive(page: any, email = EXECUTIVE_EMAIL, pass = EXECUTIVE_PASS) {
  7  |   await page.goto('/login');
  8  |   await page.waitForLoadState('networkidle');
  9  |   await page.waitForTimeout(800);
  10 |   await page.locator('input[type="email"]').fill(email);
  11 |   await page.locator('input[type="password"]').fill(pass);
  12 |   await page.getByRole('button', { name: /entrar/i }).click();
  13 |   await expect(page).toHaveURL(/\/executive/, { timeout: 10000 });
  14 | }
  15 | 
  16 | test.describe('Perfil do executivo', () => {
  17 | 
  18 |   test('Executivo sem perfil é redirecionado para /profile com banner', async ({ page, request }) => {
  19 |     const email = `exec.noprofile.${Date.now()}@test.com`;
  20 |     await request.post('http://localhost:8080/api/v1/auth/register', {
  21 |       data: { email, password: 'Exec@2026!', role: 'EXECUTIVE' }
  22 |     });
  23 |     await loginAsExecutive(page, email, 'Exec@2026!');
  24 |     await expect(page).toHaveURL(/\/executive\/profile/, { timeout: 10000 });
  25 |     // Aguardar Angular hidratar o componente de perfil + banner
  26 |     await page.waitForTimeout(2000);
  27 |     await page.waitForSelector('.banner, .seal-banner, [class*="banner"]', { timeout: 15000, state: 'visible' });
  28 |     await expect(page.locator('.banner, text=Complete seu perfil')).toBeVisible({ timeout: 10000 });
  29 |   });
  30 | 
  31 |   test('Executivo preenche e salva perfil — mensagem de sucesso', async ({ page }) => {
  32 |     await loginAsExecutive(page);
  33 |     await page.goto('/executive/profile');
  34 |     await page.waitForLoadState('networkidle');
  35 |     // Aguardar Angular hidratar o formulário de perfil completamente
  36 |     await page.waitForTimeout(2500);
> 37 |     await page.waitForSelector('textarea[id="bio"]', { timeout: 15000, state: 'visible' });
     |                ^ TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
  38 | 
  39 |     const bioField = page.locator('textarea[id="bio"]').first();
  40 |     await expect(bioField).toBeVisible({ timeout: 15000 });
  41 |     await bioField.fill('Executivo C-Level com 18 anos de experiência em transformação digital.');
  42 | 
  43 |     const ctoLabel = page.locator('label').filter({ hasText: 'CTO' });
  44 |     if (await ctoLabel.count() > 0) await ctoLabel.first().click();
  45 | 
  46 |     await page.getByRole('button', { name: /salvar perfil/i }).click();
  47 |     await expect(page.locator('.saved-msg, text=Perfil atualizado')).toBeVisible({ timeout: 8000 });
  48 |   });
  49 | 
  50 |   test('SealBanner aparece no portal executivo após login', async ({ page }) => {
  51 |     await loginAsExecutive(page);
  52 |     await page.waitForTimeout(2000);
  53 |     // SealBanner está no exec-layout que envolve o ExecutiveShell
  54 |     await expect(page.locator('.seal-banner')).toBeVisible({ timeout: 8000 });
  55 |     // Banner contém ícone ✦ e informações do executivo
  56 |     await expect(page.locator('.seal-banner')).toContainText('✦');
  57 |   });
  58 | 
  59 |   test('exec-layout e sidebar carregam no portal', async ({ page }) => {
  60 |     await loginAsExecutive(page);
  61 |     await page.waitForTimeout(2000);
  62 |     await expect(page.locator('.exec-layout')).toBeVisible({ timeout: 5000 });
  63 |     await expect(page.locator('.sidebar')).toBeVisible({ timeout: 5000 });
  64 |     await expect(page.locator('.sidebar-nav')).toContainText('Perfil');
  65 |   });
  66 | });
  67 | 
```