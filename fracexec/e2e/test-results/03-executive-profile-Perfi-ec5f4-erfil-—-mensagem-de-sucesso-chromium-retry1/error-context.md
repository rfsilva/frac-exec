# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 03-executive-profile.spec.ts >> Perfil do executivo >> Executivo preenche e salva perfil — mensagem de sucesso
- Location: tests/03-executive-profile.spec.ts:29:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('textarea[id="bio"]').first()
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for locator('textarea[id="bio"]').first()

```

```yaml
- main:
  - img
  - heading "Hello, fracexec-web" [level=1]
  - paragraph: Congratulations! Your app is running. 🎉
  - separator "Divider"
  - link "Explore the Docs":
    - /url: https://angular.dev
    - text: Explore the Docs
    - img
  - link "Learn with Tutorials":
    - /url: https://angular.dev/tutorials
    - text: Learn with Tutorials
    - img
  - link "Prompt and best practices for AI":
    - /url: https://angular.dev/ai/develop-with-ai
    - text: Prompt and best practices for AI
    - img
  - link "CLI Docs":
    - /url: https://angular.dev/tools/cli
    - text: CLI Docs
    - img
  - link "Angular Language Service":
    - /url: https://angular.dev/tools/language-service
    - text: Angular Language Service
    - img
  - link "Angular DevTools":
    - /url: https://angular.dev/tools/devtools
    - text: Angular DevTools
    - img
  - link "Github":
    - /url: https://github.com/angular/angular
    - img
  - link "X":
    - /url: https://x.com/angular
    - img
  - link "Youtube":
    - /url: https://www.youtube.com/channel/UCbn1OgGei-DV7aSRo_HaAiw
    - img
- banner "Selo FracExec":
  - text: e2e.executive.1780515623957 Data de verificação não disponível Inativo
  - button "Atualizar disponibilidade"
- complementary "Menu de navegação":
  - text: E2 e2e.executive.1780515623957 Executivo
  - navigation "Portal":
    - link "Dashboard":
      - /url: /executive/dashboard
    - link "Perfil":
      - /url: /executive/profile
    - link "Engajamentos":
      - /url: /executive/engagements
    - link "Oportunidades":
      - /url: /executive/opportunities
    - link "Pagamentos":
      - /url: /executive/payments
  - button "Sair"
- main:
  - navigation "Localização atual": Executivo Perfil
  - heading "Meu Perfil" [level=1]
  - heading "Foto de perfil" [level=2]
  - button "Selecionar foto de perfil"
  - heading "Bio *" [level=2]
  - textbox "Descreva sua trajetória C-Level (máx. 300 palavras)"
  - paragraph: 0 / 300 palavras
  - heading "Especialidades C-Level *" [level=2]
  - checkbox "CFO"
  - text: CFO
  - checkbox "CTO"
  - text: CTO
  - checkbox "CMO"
  - text: CMO
  - checkbox "COO"
  - text: COO
  - checkbox "OUTRO"
  - text: OUTRO
  - heading "Setores de experiência" [level=2]
  - 'textbox "Ex: Tecnologia, Varejo, Saúde"'
  - button "Adicionar"
  - heading "Resumo de experiência verificada" [level=2]
  - textbox "Descreva suas principais realizações."
  - button "Salvar perfil"
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
  25 |     await page.waitForTimeout(1000);
  26 |     await expect(page.locator('.banner, text=Complete seu perfil')).toBeVisible({ timeout: 5000 });
  27 |   });
  28 | 
  29 |   test('Executivo preenche e salva perfil — mensagem de sucesso', async ({ page }) => {
  30 |     await loginAsExecutive(page);
  31 |     await page.goto('/executive/profile');
  32 |     await page.waitForLoadState('networkidle');
  33 |     await page.waitForTimeout(1500);
  34 | 
  35 |     const bioField = page.locator('textarea[id="bio"]').first();
> 36 |     await expect(bioField).toBeVisible({ timeout: 8000 });
     |                            ^ Error: expect(locator).toBeVisible() failed
  37 |     await bioField.fill('Executivo C-Level com 18 anos de experiência em transformação digital.');
  38 | 
  39 |     const ctoLabel = page.locator('label').filter({ hasText: 'CTO' });
  40 |     if (await ctoLabel.count() > 0) await ctoLabel.first().click();
  41 | 
  42 |     await page.getByRole('button', { name: /salvar perfil/i }).click();
  43 |     await expect(page.locator('.saved-msg, text=Perfil atualizado')).toBeVisible({ timeout: 8000 });
  44 |   });
  45 | 
  46 |   test('SealBanner aparece no portal executivo após login', async ({ page }) => {
  47 |     await loginAsExecutive(page);
  48 |     await page.waitForTimeout(2000);
  49 |     // SealBanner está no exec-layout que envolve o ExecutiveShell
  50 |     await expect(page.locator('.seal-banner')).toBeVisible({ timeout: 8000 });
  51 |     // Banner contém ícone ✦ e informações do executivo
  52 |     await expect(page.locator('.seal-banner')).toContainText('✦');
  53 |   });
  54 | 
  55 |   test('exec-layout e sidebar carregam no portal', async ({ page }) => {
  56 |     await loginAsExecutive(page);
  57 |     await page.waitForTimeout(2000);
  58 |     await expect(page.locator('.exec-layout')).toBeVisible({ timeout: 5000 });
  59 |     await expect(page.locator('.sidebar')).toBeVisible({ timeout: 5000 });
  60 |     await expect(page.locator('.sidebar-nav')).toContainText('Perfil');
  61 |   });
  62 | });
  63 | 
```