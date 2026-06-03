# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 05-admin-candidacy-and-pool.spec.ts >> Admin — Fila de Candidaturas >> Admin vê fila de candidaturas em /admin/candidates
- Location: tests/05-admin-candidacy-and-pool.spec.ts:18:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.page-body, .filters')
Expected: visible
Error: strict mode violation: locator('.page-body, .filters') resolved to 2 elements:
    1) <div class="page-body" _ngcontent-ng-c2811659284="">…</div> aka getByText('Todos os statusAguardando análiseEm análiseAprovadoRejeitadoLimpar filtrosNomeE')
    2) <div class="filters" _ngcontent-ng-c2811659284="">…</div> aka getByText('Todos os statusAguardando análiseEm análiseAprovadoRejeitadoLimpar filtros')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.page-body, .filters')

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
  - generic [ref=e51]:
    - complementary "Menu de navegação" [ref=e52]:
      - generic [ref=e53]:
        - generic [ref=e54]: AD
        - generic [ref=e55]:
          - generic [ref=e56]: admin
          - generic [ref=e57]: Administrador
      - navigation "Portal" [ref=e58]:
        - link "Dashboard" [ref=e59] [cursor=pointer]:
          - /url: /admin/dashboard
          - generic [ref=e60]: ⊞
          - generic [ref=e61]: Dashboard
        - link "Candidaturas" [ref=e62] [cursor=pointer]:
          - /url: /admin/candidates
          - generic [ref=e63]: ◉
          - generic [ref=e64]: Candidaturas
        - link "Pool de Executivos" [ref=e65] [cursor=pointer]:
          - /url: /admin/pool
          - generic [ref=e66]: ⊟
          - generic [ref=e67]: Pool de Executivos
        - link "Necessidades" [ref=e68] [cursor=pointer]:
          - /url: /admin/needs
          - generic [ref=e69]: ◈
          - generic [ref=e70]: Necessidades
        - link "Engajamentos" [ref=e71] [cursor=pointer]:
          - /url: /admin/engagements
          - generic [ref=e72]: ⊡
          - generic [ref=e73]: Engajamentos
        - link "Contratos" [ref=e74] [cursor=pointer]:
          - /url: /admin/contracts
          - generic [ref=e75]: ⊠
          - generic [ref=e76]: Contratos
      - button "Sair" [ref=e78] [cursor=pointer]
    - main [ref=e79]:
      - generic [ref=e80]:
        - generic "Candidaturas" [ref=e81]:
          - navigation "Localização atual" [ref=e82]:
            - generic [ref=e83]: Admin
            - generic [ref=e84]: /
            - generic [ref=e85]: Candidaturas
          - heading "Candidaturas" [level=1] [ref=e86]
        - generic [ref=e87]:
          - generic [ref=e88]:
            - combobox [ref=e89]:
              - option "Todos os status" [selected]
              - option "Aguardando análise"
              - option "Em análise"
              - option "Aprovado"
              - option "Rejeitado"
            - textbox "Buscar por nome" [ref=e90]
            - textbox [ref=e91]
            - textbox [ref=e92]
            - button "Limpar filtros" [ref=e93] [cursor=pointer]
          - table [ref=e95]:
            - rowgroup [ref=e96]:
              - row "Nome E-mail Data de entrada Status Ação" [ref=e97]:
                - columnheader "Nome" [ref=e98]
                - columnheader "E-mail" [ref=e99]
                - columnheader "Data de entrada" [ref=e100]
                - columnheader "Status" [ref=e101]
                - columnheader "Ação" [ref=e102]
            - rowgroup [ref=e103]:
              - row "E2E Expand Test expand.e2e.1780515526604@test.com 03/06/2026 Aguardando análise Ver detalhes ▼" [ref=e104]:
                - cell "E2E Expand Test" [ref=e105]
                - cell "expand.e2e.1780515526604@test.com" [ref=e106]
                - cell "03/06/2026" [ref=e107]
                - cell "Aguardando análise" [ref=e108]:
                  - generic [ref=e110]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e111]:
                  - button "Ver detalhes ▼" [ref=e112] [cursor=pointer]
              - row "Test Exec 1780513261851d reject.1780513261851@example.com 03/06/2026 Aguardando análise Ver detalhes ▼" [ref=e113]:
                - cell "Test Exec 1780513261851d" [ref=e114]
                - cell "reject.1780513261851@example.com" [ref=e115]
                - cell "03/06/2026" [ref=e116]
                - cell "Aguardando análise" [ref=e117]:
                  - generic [ref=e119]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e120]:
                  - button "Ver detalhes ▼" [ref=e121] [cursor=pointer]
              - row "Test Exec 1780513261851c reject.1780513261851@example.com 03/06/2026 Rejeitado Ver detalhes ▼" [ref=e122]:
                - cell "Test Exec 1780513261851c" [ref=e123]
                - cell "reject.1780513261851@example.com" [ref=e124]
                - cell "03/06/2026" [ref=e125]
                - cell "Rejeitado" [ref=e126]:
                  - generic [ref=e128]: Rejeitado
                - cell "Ver detalhes ▼" [ref=e129]:
                  - button "Ver detalhes ▼" [ref=e130] [cursor=pointer]
              - row "Test Exec 1780513261851b approve.1780513261851@example.com 03/06/2026 Aprovado Ver detalhes ▼" [ref=e131]:
                - cell "Test Exec 1780513261851b" [ref=e132]
                - cell "approve.1780513261851@example.com" [ref=e133]
                - cell "03/06/2026" [ref=e134]
                - cell "Aprovado" [ref=e135]:
                  - generic [ref=e137]: Aprovado
                - cell "Ver detalhes ▼" [ref=e138]:
                  - button "Ver detalhes ▼" [ref=e139] [cursor=pointer]
              - row "Test Exec 1780513261851 apply.1780513261851@example.com 03/06/2026 Aguardando análise Ver detalhes ▼" [ref=e140]:
                - cell "Test Exec 1780513261851" [ref=e141]
                - cell "apply.1780513261851@example.com" [ref=e142]
                - cell "03/06/2026" [ref=e143]
                - cell "Aguardando análise" [ref=e144]:
                  - generic [ref=e146]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e147]:
                  - button "Ver detalhes ▼" [ref=e148] [cursor=pointer]
              - row "Reject 1780513177940 rej.1780513177940@ex.com 03/06/2026 Aguardando análise Ver detalhes ▼" [ref=e149]:
                - cell "Reject 1780513177940" [ref=e150]
                - cell "rej.1780513177940@ex.com" [ref=e151]
                - cell "03/06/2026" [ref=e152]
                - cell "Aguardando análise" [ref=e153]:
                  - generic [ref=e155]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e156]:
                  - button "Ver detalhes ▼" [ref=e157] [cursor=pointer]
              - row "Reject 1780513177940 rej.1780513177940@ex.com 03/06/2026 Rejeitado Ver detalhes ▼" [ref=e158]:
                - cell "Reject 1780513177940" [ref=e159]
                - cell "rej.1780513177940@ex.com" [ref=e160]
                - cell "03/06/2026" [ref=e161]
                - cell "Rejeitado" [ref=e162]:
                  - generic [ref=e164]: Rejeitado
                - cell "Ver detalhes ▼" [ref=e165]:
                  - button "Ver detalhes ▼" [ref=e166] [cursor=pointer]
              - row "Test 1780513177940 t09.1780513177940@ex.com 03/06/2026 Aguardando análise Ver detalhes ▼" [ref=e167]:
                - cell "Test 1780513177940" [ref=e168]
                - cell "t09.1780513177940@ex.com" [ref=e169]
                - cell "03/06/2026" [ref=e170]
                - cell "Aguardando análise" [ref=e171]:
                  - generic [ref=e173]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e174]:
                  - button "Ver detalhes ▼" [ref=e175] [cursor=pointer]
              - row "E2E Expand Test expand.e2e.1780441707674@test.com 02/06/2026 Aprovado Ver detalhes ▼" [ref=e176]:
                - cell "E2E Expand Test" [ref=e177]
                - cell "expand.e2e.1780441707674@test.com" [ref=e178]
                - cell "02/06/2026" [ref=e179]
                - cell "Aprovado" [ref=e180]:
                  - generic [ref=e182]: Aprovado
                - cell "Ver detalhes ▼" [ref=e183]:
                  - button "Ver detalhes ▼" [ref=e184] [cursor=pointer]
              - row "E2E Expand Test expand.e2e.1780441284712@test.com 02/06/2026 Aguardando análise Ver detalhes ▼" [ref=e185]:
                - cell "E2E Expand Test" [ref=e186]
                - cell "expand.e2e.1780441284712@test.com" [ref=e187]
                - cell "02/06/2026" [ref=e188]
                - cell "Aguardando análise" [ref=e189]:
                  - generic [ref=e191]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e192]:
                  - button "Ver detalhes ▼" [ref=e193] [cursor=pointer]
              - row "E2E Expand Test expand.e2e.1780433419767@test.com 02/06/2026 Aguardando análise Ver detalhes ▼" [ref=e194]:
                - cell "E2E Expand Test" [ref=e195]
                - cell "expand.e2e.1780433419767@test.com" [ref=e196]
                - cell "02/06/2026" [ref=e197]
                - cell "Aguardando análise" [ref=e198]:
                  - generic [ref=e200]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e201]:
                  - button "Ver detalhes ▼" [ref=e202] [cursor=pointer]
              - row "Expand Test Exec expand.test.1780432344336@test.com 02/06/2026 Aguardando análise Ver detalhes ▼" [ref=e203]:
                - cell "Expand Test Exec" [ref=e204]
                - cell "expand.test.1780432344336@test.com" [ref=e205]
                - cell "02/06/2026" [ref=e206]
                - cell "Aguardando análise" [ref=e207]:
                  - generic [ref=e209]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e210]:
                  - button "Ver detalhes ▼" [ref=e211] [cursor=pointer]
              - row "Expand Test Exec expand.test.1780432336064@test.com 02/06/2026 Aguardando análise Ver detalhes ▼" [ref=e212]:
                - cell "Expand Test Exec" [ref=e213]
                - cell "expand.test.1780432336064@test.com" [ref=e214]
                - cell "02/06/2026" [ref=e215]
                - cell "Aguardando análise" [ref=e216]:
                  - generic [ref=e218]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e219]:
                  - button "Ver detalhes ▼" [ref=e220] [cursor=pointer]
              - row "Rejectme Test rejectme@fracexec.com 02/06/2026 Rejeitado Ver detalhes ▼" [ref=e221]:
                - cell "Rejectme Test" [ref=e222]
                - cell "rejectme@fracexec.com" [ref=e223]
                - cell "02/06/2026" [ref=e224]
                - cell "Rejeitado" [ref=e225]:
                  - generic [ref=e227]: Rejeitado
                - cell "Ver detalhes ▼" [ref=e228]:
                  - button "Ver detalhes ▼" [ref=e229] [cursor=pointer]
              - row "Maria Admin Test admintest@fracexec.com 02/06/2026 Aprovado Ver detalhes ▼" [ref=e230]:
                - cell "Maria Admin Test" [ref=e231]
                - cell "admintest@fracexec.com" [ref=e232]
                - cell "02/06/2026" [ref=e233]
                - cell "Aprovado" [ref=e234]:
                  - generic [ref=e236]: Aprovado
                - cell "Ver detalhes ▼" [ref=e237]:
                  - button "Ver detalhes ▼" [ref=e238] [cursor=pointer]
              - row "João Teste applicant2@fracexec.com 02/06/2026 Aguardando análise Ver detalhes ▼" [ref=e239]:
                - cell "João Teste" [ref=e240]
                - cell "applicant2@fracexec.com" [ref=e241]
                - cell "02/06/2026" [ref=e242]
                - cell "Aguardando análise" [ref=e243]:
                  - generic [ref=e245]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e246]:
                  - button "Ver detalhes ▼" [ref=e247] [cursor=pointer]
              - row "Test Applicant applicant@test.com 02/06/2026 Aguardando análise Ver detalhes ▼" [ref=e248]:
                - cell "Test Applicant" [ref=e249]
                - cell "applicant@test.com" [ref=e250]
                - cell "02/06/2026" [ref=e251]
                - cell "Aguardando análise" [ref=e252]:
                  - generic [ref=e254]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e255]:
                  - button "Ver detalhes ▼" [ref=e256] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@fracexec.com';
  4   | const ADMIN_PASS  = process.env.E2E_ADMIN_PASSWORD || 'Admin@FracExec2026!';
  5   | 
  6   | async function loginAsAdmin(page: any) {
  7   |   await page.goto('/login');
  8   |   await page.waitForLoadState('networkidle');
  9   |   await page.waitForTimeout(800);
  10  |   await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  11  |   await page.locator('input[type="password"]').fill(ADMIN_PASS);
  12  |   await page.getByRole('button', { name: /entrar/i }).click();
  13  |   await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
  14  | }
  15  | 
  16  | test.describe('Admin — Fila de Candidaturas', () => {
  17  | 
  18  |   test('Admin vê fila de candidaturas em /admin/candidates', async ({ page }) => {
  19  |     await loginAsAdmin(page);
  20  |     await page.goto('/admin/candidates');
  21  |     // Aguarda Angular hidratar completamente (app-admin-candidates renderiza)
  22  |     await page.waitForLoadState('networkidle');
  23  |     await page.waitForTimeout(3000);
  24  |     // Aguarda URL confirmar que está na página correta
  25  |     await expect(page).toHaveURL(/\/admin\/candidates/);
  26  |     // O componente Angular renderiza .page-body após hidratação
  27  |     await page.waitForFunction(
  28  |       () => document.querySelector('.page-body, .table-wrapper, .filters, .empty-state') !== null,
  29  |       { timeout: 10000 }
  30  |     );
> 31  |     await expect(page.locator('.page-body, .filters')).toBeVisible({ timeout: 5000 });
      |                                                        ^ Error: expect(locator).toBeVisible() failed
  32  |   });
  33  | 
  34  |   test('Admin vê filtro de status na fila', async ({ page }) => {
  35  |     await loginAsAdmin(page);
  36  |     await page.goto('/admin/candidates');
  37  |     await page.waitForLoadState('networkidle');
  38  |     await page.waitForTimeout(1500);
  39  |     await expect(page.locator('.filters select, select')).toBeVisible({ timeout: 5000 });
  40  |   });
  41  | 
  42  |   test('Admin expande candidatura inline', async ({ page, request }) => {
  43  |     // Seed candidatura
  44  |     await request.post('http://localhost:8080/api/v1/applications', {
  45  |       data: {
  46  |         fullName: 'E2E Expand Test',
  47  |         email: `expand.e2e.${Date.now()}@test.com`,
  48  |         linkedinUrl: 'https://linkedin.com/in/expandtest',
  49  |         positions: [{ roleTitle: 'CFO', periodStart: '2020-01-01' }],
  50  |         references: [
  51  |           { refName: 'Ref A', refRole: 'CEO', refContact: 'a@ref.com' },
  52  |           { refName: 'Ref B', refRole: 'CTO', refContact: 'b@ref.com' },
  53  |         ],
  54  |         motivation: 'Motivação E2E inline expand test.',
  55  |         lgpdConsent: true,
  56  |       }
  57  |     });
  58  | 
  59  |     await loginAsAdmin(page);
  60  |     await page.goto('/admin/candidates');
  61  |     await page.waitForLoadState('networkidle');
  62  |     await page.waitForTimeout(1500);
  63  | 
  64  |     const expandBtn = page.locator('.btn-expand, button:has-text("Ver detalhes")').first();
  65  |     if (await expandBtn.isVisible({ timeout: 5000 })) {
  66  |       await expandBtn.click();
  67  |       await expect(page.locator('.accordion-row, .detail-panel')).toBeVisible({ timeout: 5000 });
  68  |     }
  69  |   });
  70  | 
  71  |   test('Rota /admin/candidates sem login redireciona para /login', async ({ page }) => {
  72  |     await page.goto('/admin/candidates');
  73  |     await page.waitForLoadState('networkidle');
  74  |     await page.waitForTimeout(1000);
  75  |     await expect(page).toHaveURL(/\/login/);
  76  |   });
  77  | });
  78  | 
  79  | test.describe('Admin — Pool de Executivos', () => {
  80  | 
  81  |   test('Admin acessa /admin/pool', async ({ page }) => {
  82  |     await loginAsAdmin(page);
  83  |     await page.goto('/admin/pool');
  84  |     await page.waitForLoadState('networkidle');
  85  |     await page.waitForTimeout(3000);
  86  |     await page.waitForFunction(
  87  |       () => document.querySelector('.page-body, .pool-grid, .empty-state, .filters') !== null,
  88  |       { timeout: 10000 }
  89  |     );
  90  |     await expect(page.locator('.page-body, .filters')).toBeVisible({ timeout: 5000 });
  91  |   });
  92  | 
  93  |   test('Pool tem filtros de especialidade', async ({ page }) => {
  94  |     await loginAsAdmin(page);
  95  |     await page.goto('/admin/pool');
  96  |     await page.waitForLoadState('networkidle');
  97  |     await page.waitForTimeout(3000);
  98  |     await page.waitForTimeout(1500);
  99  |     await expect(page.locator('.filters select')).toBeVisible({ timeout: 5000 });
  100 |   });
  101 | 
  102 |   test('Rota /admin/pool sem login redireciona para /login', async ({ page }) => {
  103 |     await page.goto('/admin/pool');
  104 |     await page.waitForLoadState('networkidle');
  105 |     await page.waitForTimeout(1000);
  106 |     await expect(page).toHaveURL(/\/login/);
  107 |   });
  108 | });
  109 | 
```