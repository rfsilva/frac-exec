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

Locator: locator('.confirm-box').or(getByText('Descartar').first())
Expected: visible
Error: strict mode violation: locator('.confirm-box').or(getByText('Descartar').first()) resolved to 2 elements:
    1) <div class="confirm-box" _ngcontent-ng-c4059276371="">…</div> aka getByText('Descartar alterações?Continuar editandoDescartar')
    2) <p class="confirm-msg" _ngcontent-ng-c4059276371="">Descartar alterações?</p> aka getByText('Descartar alterações?')

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for locator('.confirm-box').or(getByText('Descartar').first())

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - banner "Selo FracExec" [ref=e6]:
    - generic [ref=e7]: ✦
    - generic [ref=e8]:
      - generic [ref=e9]: avail.e2e.1780692409936
      - generic [ref=e10]: Data de verificação não disponível
    - generic "Ativo status" [ref=e12]: Ativo
  - generic [ref=e14]:
    - complementary "Menu de navegação" [ref=e15]:
      - generic [ref=e16]:
        - generic [ref=e17]: AV
        - generic [ref=e18]:
          - generic [ref=e19]: avail.e2e.1780692409936
          - generic [ref=e20]: Executivo
      - navigation "Portal" [ref=e21]:
        - link "Dashboard" [ref=e22] [cursor=pointer]:
          - /url: /executive/dashboard
          - generic [ref=e23]: ⊞
          - generic [ref=e24]: Dashboard
        - link "Perfil" [ref=e25] [cursor=pointer]:
          - /url: /executive/profile
          - generic [ref=e26]: ◎
          - generic [ref=e27]: Perfil
        - link "Engajamentos" [ref=e28] [cursor=pointer]:
          - /url: /executive/engagements
          - generic [ref=e29]: ⊡
          - generic [ref=e30]: Engajamentos
        - link "Oportunidades" [ref=e31] [cursor=pointer]:
          - /url: /executive/opportunities
          - generic [ref=e32]: ◈
          - generic [ref=e33]: Oportunidades
        - link "Pagamentos" [ref=e34] [cursor=pointer]:
          - /url: /executive/payments
          - generic [ref=e35]: ◇
          - generic [ref=e36]: Pagamentos
      - button "Sair" [ref=e38] [cursor=pointer]
    - main [ref=e39]:
      - generic [ref=e40]:
        - generic "Dashboard" [ref=e41]:
          - navigation "Localização atual" [ref=e42]:
            - generic [ref=e43]: Executivo
            - generic [ref=e44]: /
            - generic [ref=e45]: Dashboard
          - heading "Dashboard" [level=1] [ref=e46]
        - generic [ref=e48]:
          - heading "Disponibilidade" [level=2] [ref=e49]
          - generic [ref=e50]:
            - generic [ref=e54]: 20 / 20
            - button "Editar disponibilidade" [ref=e55] [cursor=pointer]: Editar
        - generic:
          - dialog "Editar disponibilidade" [ref=e57]:
            - generic [ref=e58]:
              - heading "Disponibilidade" [level=2] [ref=e59]
              - button "Fechar drawer" [active] [ref=e60] [cursor=pointer]: ×
            - generic [ref=e61]:
              - generic [ref=e62]:
                - generic [ref=e63]: Dias disponíveis / mês
                - spinbutton "Dias por mês" [ref=e64]: "5"
                - paragraph [ref=e65]: Entre 1 e 20 dias. Para pausar, use o seletor de status abaixo.
              - generic [ref=e66]:
                - generic [ref=e67]: Status
                - combobox "Status de disponibilidade" [ref=e68] [cursor=pointer]:
                  - option "Ativo" [selected]
                  - option "Pausado"
                  - option "Indisponível"
            - generic [ref=e69]:
              - button "Cancelar" [ref=e70] [cursor=pointer]
              - button "Salvar" [ref=e71] [cursor=pointer]
          - alertdialog "Descartar alterações?" [ref=e72]:
            - generic [ref=e73]:
              - paragraph [ref=e74]: Descartar alterações?
              - generic [ref=e75]:
                - button "Continuar editando" [ref=e76] [cursor=pointer]
                - button "Descartar" [ref=e77] [cursor=pointer]
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
  48  |     await expect(page.locator('.widget-card').or(page.getByText('Disponibilidade').first())).toBeVisible({ timeout: 15000 });
  49  |     await expect(page.locator('.progress-bar').or(page.locator('.progress-fill')).first()).toBeVisible({ timeout: 10000 });
  50  |     await expect(page.locator('.btn-edit').or(page.getByRole('button', { name: /editar/i })).first()).toBeVisible({ timeout: 10000 });
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
  71  |     await expect(page.locator('.saved-msg').or(page.getByText('Disponibilidade atualizada').first())).toBeVisible({ timeout: 10000 });
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
> 82  |     await expect(page.locator('.confirm-box').or(page.getByText('Descartar').first())).toBeVisible({ timeout: 8000 });
      |                                                                                        ^ Error: expect(locator).toBeVisible() failed
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
  95  |     await expect(page.locator('.confirm-box').or(page.getByText('Descartar').first())).toBeVisible({ timeout: 8000 });
  96  |     await page.locator('button:has-text("Descartar")').click();
  97  |     await expect(drawer).not.toBeVisible({ timeout: 8000 });
  98  |   });
  99  | });
  100 | 
```