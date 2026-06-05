# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 04-availability-drawer.spec.ts >> Widget e Drawer de Disponibilidade >> ESC com alterações não salvas mostra confirmação
- Location: tests/04-availability-drawer.spec.ts:74:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: .confirm-box, text=Descartar
Expected: visible
Error: Unexpected token "=" while parsing css selector ".confirm-box, text=Descartar". Did you mean to CSS.escape it?

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for .confirm-box, text=Descartar

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
        - generic [ref=e55]: avail.e2e.1780688887708
        - generic [ref=e56]: Data de verificação não disponível
      - generic "Ativo status" [ref=e58]: Ativo
    - generic [ref=e60]:
      - complementary "Menu de navegação" [ref=e61]:
        - generic [ref=e62]:
          - generic [ref=e63]: AV
          - generic [ref=e64]:
            - generic [ref=e65]: avail.e2e.1780688887708
            - generic [ref=e66]: Executivo
        - navigation "Portal" [ref=e67]:
          - link "Dashboard" [ref=e68] [cursor=pointer]:
            - /url: /executive/dashboard
            - generic [ref=e69]: ⊞
            - generic [ref=e70]: Dashboard
          - link "Perfil" [ref=e71] [cursor=pointer]:
            - /url: /executive/profile
            - generic [ref=e72]: ◎
            - generic [ref=e73]: Perfil
          - link "Engajamentos" [ref=e74] [cursor=pointer]:
            - /url: /executive/engagements
            - generic [ref=e75]: ⊡
            - generic [ref=e76]: Engajamentos
          - link "Oportunidades" [ref=e77] [cursor=pointer]:
            - /url: /executive/opportunities
            - generic [ref=e78]: ◈
            - generic [ref=e79]: Oportunidades
          - link "Pagamentos" [ref=e80] [cursor=pointer]:
            - /url: /executive/payments
            - generic [ref=e81]: ◇
            - generic [ref=e82]: Pagamentos
        - button "Sair" [ref=e84] [cursor=pointer]
      - main [ref=e85]:
        - generic [ref=e86]:
          - generic "Dashboard" [ref=e87]:
            - navigation "Localização atual" [ref=e88]:
              - generic [ref=e89]: Executivo
              - generic [ref=e90]: /
              - generic [ref=e91]: Dashboard
            - heading "Dashboard" [level=1] [ref=e92]
          - generic [ref=e94]:
            - heading "Disponibilidade" [level=2] [ref=e95]
            - generic [ref=e96]:
              - generic [ref=e100]: 20 / 20
              - button "Editar disponibilidade" [ref=e101] [cursor=pointer]: Editar
          - generic:
            - dialog "Editar disponibilidade" [ref=e103]:
              - generic [ref=e104]:
                - heading "Disponibilidade" [level=2] [ref=e105]
                - button "Fechar drawer" [active] [ref=e106] [cursor=pointer]: ×
              - generic [ref=e107]:
                - generic [ref=e108]:
                  - generic [ref=e109]: Dias disponíveis / mês
                  - spinbutton "Dias por mês" [ref=e110]: "5"
                  - paragraph [ref=e111]: Entre 1 e 20 dias. Para pausar, use o seletor de status abaixo.
                - generic [ref=e112]:
                  - generic [ref=e113]: Status
                  - combobox "Status de disponibilidade" [ref=e114] [cursor=pointer]:
                    - option "Ativo" [selected]
                    - option "Pausado"
                    - option "Indisponível"
              - generic [ref=e115]:
                - button "Cancelar" [ref=e116] [cursor=pointer]
                - button "Salvar" [ref=e117] [cursor=pointer]
            - alertdialog "Descartar alterações?" [ref=e118]:
              - generic [ref=e119]:
                - paragraph [ref=e120]: Descartar alterações?
                - generic [ref=e121]:
                  - button "Continuar editando" [ref=e122] [cursor=pointer]
                  - button "Descartar" [ref=e123] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * E2E — Story 2.5: Seal Banner & Availability Management
  5   |  * Cria um executivo com perfil completo via API antes de testar a UI do dashboard
  6   |  */
  7   | async function setupCompleteExecAndLogin(page: any, request: any) {
  8   |   const email = `avail.e2e.${Date.now()}@test.com`;
  9   |   // Registrar
  10  |   await request.post('http://localhost:8080/api/v1/auth/register', {
  11  |     data: { email, password: 'Avail@2026!', role: 'EXECUTIVE' }
  12  |   });
  13  |   // Login via API para obter token
  14  |   const res = await request.post('http://localhost:8080/api/v1/auth/login', {
  15  |     data: { email, password: 'Avail@2026!' }
  16  |   });
  17  |   const { accessToken } = await res.json();
  18  |   // Salvar perfil completo via API (bio + specialty)
  19  |   await request.put('http://localhost:8080/api/v1/executive/profile', {
  20  |     headers: { Authorization: `Bearer ${accessToken}` },
  21  |     data: { bio: 'Bio completa para E2E.', specialties: ['CFO'], sectors: ['Tecnologia'], companyVisibility: {} }
  22  |   });
  23  |   // Definir disponibilidade para ter algo no widget
  24  |   await request.patch('http://localhost:8080/api/v1/executive/profile/availability', {
  25  |     headers: { Authorization: `Bearer ${accessToken}` },
  26  |     data: { availabilityDaysPerMonth: 20, profileStatus: 'ACTIVE' }
  27  |   });
  28  | 
  29  |   // Login na UI
  30  |   await page.goto('/login');
  31  |   await page.waitForLoadState('networkidle');
  32  |   await page.waitForTimeout(800);
  33  |   await page.locator('input[type="email"]').fill(email);
  34  |   await page.locator('input[type="password"]').fill('Avail@2026!');
  35  |   await page.getByRole('button', { name: /entrar/i }).click();
  36  |   // Com perfil completo, vai direto para /executive/dashboard
  37  |   await expect(page).toHaveURL(/\/executive\/dashboard/, { timeout: 10000 });
  38  |   await page.waitForLoadState('networkidle');
  39  |   // Aguardar Angular hidratar o dashboard e renderizar o widget de disponibilidade
  40  |   await page.waitForTimeout(3000);
  41  |   await page.waitForSelector('.widget-card, .btn-edit, button', { timeout: 15000, state: 'visible' });
  42  | }
  43  | 
  44  | test.describe('Widget e Drawer de Disponibilidade', () => {
  45  | 
  46  |   test('Dashboard exibe widget de disponibilidade', async ({ page, request }) => {
  47  |     await setupCompleteExecAndLogin(page, request);
  48  |     await expect(page.locator('.widget-card, text=Disponibilidade')).toBeVisible({ timeout: 15000 });
  49  |     await expect(page.locator('.progress-bar, .progress-fill')).toBeVisible({ timeout: 10000 });
  50  |     await expect(page.locator('.btn-edit, button:has-text("Editar")')).toBeVisible({ timeout: 10000 });
  51  |   });
  52  | 
  53  |   test('Botão Editar abre drawer lateral', async ({ page, request }) => {
  54  |     await setupCompleteExecAndLogin(page, request);
  55  |     await page.locator('.btn-edit, button:has-text("Editar")').first().click();
  56  |     await expect(page.locator('.drawer, [role="dialog"]')).toBeVisible({ timeout: 5000 });
  57  |     await expect(page.locator('input[type="number"]')).toBeVisible();
  58  |   });
  59  | 
  60  |   test('Salvar no drawer atualiza widget', async ({ page, request }) => {
  61  |     await setupCompleteExecAndLogin(page, request);
  62  |     await page.locator('.btn-edit, button:has-text("Editar")').first().click();
  63  |     const drawer = page.locator('.drawer, [role="dialog"]');
  64  |     await expect(drawer).toBeVisible({ timeout: 10000 });
  65  | 
  66  |     await drawer.locator('input[type="number"]').clear();
  67  |     await drawer.locator('input[type="number"]').fill('12');
  68  |     await drawer.locator('button:has-text("Salvar")').click();
  69  | 
  70  |     await expect(drawer).not.toBeVisible({ timeout: 10000 });
  71  |     await expect(page.locator('.saved-msg, text=Disponibilidade atualizada')).toBeVisible({ timeout: 10000 });
  72  |   });
  73  | 
  74  |   test('ESC com alterações não salvas mostra confirmação', async ({ page, request }) => {
  75  |     await setupCompleteExecAndLogin(page, request);
  76  |     await page.locator('.btn-edit, button:has-text("Editar")').first().click();
  77  |     const drawer = page.locator('.drawer, [role="dialog"]');
  78  |     await expect(drawer).toBeVisible({ timeout: 10000 });
  79  | 
  80  |     await drawer.locator('input[type="number"]').fill('5');
  81  |     await page.keyboard.press('Escape');
> 82  |     await expect(page.locator('.confirm-box, text=Descartar')).toBeVisible({ timeout: 8000 });
      |                                                                ^ Error: expect(locator).toBeVisible() failed
  83  |     await page.locator('button:has-text("Continuar editando")').click();
  84  |     await expect(drawer).toBeVisible({ timeout: 5000 });
  85  |   });
  86  | 
  87  |   test('Backdrop click com alterações mostra confirmação', async ({ page, request }) => {
  88  |     await setupCompleteExecAndLogin(page, request);
  89  |     await page.locator('.btn-edit, button:has-text("Editar")').first().click();
  90  |     const drawer = page.locator('.drawer, [role="dialog"]');
  91  |     await expect(drawer).toBeVisible({ timeout: 10000 });
  92  | 
  93  |     await drawer.locator('input[type="number"]').fill('3');
  94  |     await page.locator('.drawer-backdrop').click();
  95  |     await expect(page.locator('.confirm-box, text=Descartar')).toBeVisible({ timeout: 8000 });
  96  |     await page.locator('button:has-text("Descartar")').click();
  97  |     await expect(drawer).not.toBeVisible({ timeout: 8000 });
  98  |   });
  99  | });
  100 | 
```