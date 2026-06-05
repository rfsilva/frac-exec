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
  - Expect "toBeVisible" with timeout 10000ms
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
        - link "Empresas" [ref=e71] [cursor=pointer]:
          - /url: /admin/companies
          - generic [ref=e72]: ⊛
          - generic [ref=e73]: Empresas
        - link "Engajamentos" [ref=e74] [cursor=pointer]:
          - /url: /admin/engagements
          - generic [ref=e75]: ⊡
          - generic [ref=e76]: Engajamentos
        - link "Contratos" [ref=e77] [cursor=pointer]:
          - /url: /admin/contracts
          - generic [ref=e78]: ⊠
          - generic [ref=e79]: Contratos
      - button "Sair" [ref=e81] [cursor=pointer]
    - main [ref=e82]:
      - generic [ref=e83]:
        - generic "Candidaturas" [ref=e84]:
          - navigation "Localização atual" [ref=e85]:
            - generic [ref=e86]: Admin
            - generic [ref=e87]: /
            - generic [ref=e88]: Candidaturas
          - heading "Candidaturas" [level=1] [ref=e89]
        - generic [ref=e90]:
          - generic [ref=e91]:
            - combobox [ref=e92]:
              - option "Todos os status" [selected]
              - option "Aguardando análise"
              - option "Em análise"
              - option "Aprovado"
              - option "Rejeitado"
            - textbox "Buscar por nome" [ref=e93]
            - textbox [ref=e94]
            - textbox [ref=e95]
            - button "Limpar filtros" [ref=e96] [cursor=pointer]
          - table [ref=e98]:
            - rowgroup [ref=e99]:
              - row "Nome E-mail Data de entrada Status Ação" [ref=e100]:
                - columnheader "Nome" [ref=e101]
                - columnheader "E-mail" [ref=e102]
                - columnheader "Data de entrada" [ref=e103]
                - columnheader "Status" [ref=e104]
                - columnheader "Ação" [ref=e105]
            - rowgroup [ref=e106]:
              - row "E2E Expand Test expand.e2e.1780515693111@test.com 03/06/2026 Aguardando análise Ver detalhes ▼" [ref=e107]:
                - cell "E2E Expand Test" [ref=e108]
                - cell "expand.e2e.1780515693111@test.com" [ref=e109]
                - cell "03/06/2026" [ref=e110]
                - cell "Aguardando análise" [ref=e111]:
                  - generic [ref=e113]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e114]:
                  - button "Ver detalhes ▼" [ref=e115] [cursor=pointer]
              - row "E2E Expand Test expand.e2e.1780515526604@test.com 03/06/2026 Aguardando análise Ver detalhes ▼" [ref=e116]:
                - cell "E2E Expand Test" [ref=e117]
                - cell "expand.e2e.1780515526604@test.com" [ref=e118]
                - cell "03/06/2026" [ref=e119]
                - cell "Aguardando análise" [ref=e120]:
                  - generic [ref=e122]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e123]:
                  - button "Ver detalhes ▼" [ref=e124] [cursor=pointer]
              - row "Test Exec 1780513261851d reject.1780513261851@example.com 03/06/2026 Aguardando análise Ver detalhes ▼" [ref=e125]:
                - cell "Test Exec 1780513261851d" [ref=e126]
                - cell "reject.1780513261851@example.com" [ref=e127]
                - cell "03/06/2026" [ref=e128]
                - cell "Aguardando análise" [ref=e129]:
                  - generic [ref=e131]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e132]:
                  - button "Ver detalhes ▼" [ref=e133] [cursor=pointer]
              - row "Test Exec 1780513261851c reject.1780513261851@example.com 03/06/2026 Rejeitado Ver detalhes ▼" [ref=e134]:
                - cell "Test Exec 1780513261851c" [ref=e135]
                - cell "reject.1780513261851@example.com" [ref=e136]
                - cell "03/06/2026" [ref=e137]
                - cell "Rejeitado" [ref=e138]:
                  - generic [ref=e140]: Rejeitado
                - cell "Ver detalhes ▼" [ref=e141]:
                  - button "Ver detalhes ▼" [ref=e142] [cursor=pointer]
              - row "Test Exec 1780513261851b approve.1780513261851@example.com 03/06/2026 Aprovado Ver detalhes ▼" [ref=e143]:
                - cell "Test Exec 1780513261851b" [ref=e144]
                - cell "approve.1780513261851@example.com" [ref=e145]
                - cell "03/06/2026" [ref=e146]
                - cell "Aprovado" [ref=e147]:
                  - generic [ref=e149]: Aprovado
                - cell "Ver detalhes ▼" [ref=e150]:
                  - button "Ver detalhes ▼" [ref=e151] [cursor=pointer]
              - row "Test Exec 1780513261851 apply.1780513261851@example.com 03/06/2026 Aguardando análise Ver detalhes ▼" [ref=e152]:
                - cell "Test Exec 1780513261851" [ref=e153]
                - cell "apply.1780513261851@example.com" [ref=e154]
                - cell "03/06/2026" [ref=e155]
                - cell "Aguardando análise" [ref=e156]:
                  - generic [ref=e158]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e159]:
                  - button "Ver detalhes ▼" [ref=e160] [cursor=pointer]
              - row "Reject 1780513177940 rej.1780513177940@ex.com 03/06/2026 Aguardando análise Ver detalhes ▼" [ref=e161]:
                - cell "Reject 1780513177940" [ref=e162]
                - cell "rej.1780513177940@ex.com" [ref=e163]
                - cell "03/06/2026" [ref=e164]
                - cell "Aguardando análise" [ref=e165]:
                  - generic [ref=e167]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e168]:
                  - button "Ver detalhes ▼" [ref=e169] [cursor=pointer]
              - row "Reject 1780513177940 rej.1780513177940@ex.com 03/06/2026 Rejeitado Ver detalhes ▼" [ref=e170]:
                - cell "Reject 1780513177940" [ref=e171]
                - cell "rej.1780513177940@ex.com" [ref=e172]
                - cell "03/06/2026" [ref=e173]
                - cell "Rejeitado" [ref=e174]:
                  - generic [ref=e176]: Rejeitado
                - cell "Ver detalhes ▼" [ref=e177]:
                  - button "Ver detalhes ▼" [ref=e178] [cursor=pointer]
              - row "Test 1780513177940 t09.1780513177940@ex.com 03/06/2026 Aguardando análise Ver detalhes ▼" [ref=e179]:
                - cell "Test 1780513177940" [ref=e180]
                - cell "t09.1780513177940@ex.com" [ref=e181]
                - cell "03/06/2026" [ref=e182]
                - cell "Aguardando análise" [ref=e183]:
                  - generic [ref=e185]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e186]:
                  - button "Ver detalhes ▼" [ref=e187] [cursor=pointer]
              - row "E2E Expand Test expand.e2e.1780441707674@test.com 02/06/2026 Aprovado Ver detalhes ▼" [ref=e188]:
                - cell "E2E Expand Test" [ref=e189]
                - cell "expand.e2e.1780441707674@test.com" [ref=e190]
                - cell "02/06/2026" [ref=e191]
                - cell "Aprovado" [ref=e192]:
                  - generic [ref=e194]: Aprovado
                - cell "Ver detalhes ▼" [ref=e195]:
                  - button "Ver detalhes ▼" [ref=e196] [cursor=pointer]
              - row "E2E Expand Test expand.e2e.1780441284712@test.com 02/06/2026 Aguardando análise Ver detalhes ▼" [ref=e197]:
                - cell "E2E Expand Test" [ref=e198]
                - cell "expand.e2e.1780441284712@test.com" [ref=e199]
                - cell "02/06/2026" [ref=e200]
                - cell "Aguardando análise" [ref=e201]:
                  - generic [ref=e203]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e204]:
                  - button "Ver detalhes ▼" [ref=e205] [cursor=pointer]
              - row "E2E Expand Test expand.e2e.1780433419767@test.com 02/06/2026 Aguardando análise Ver detalhes ▼" [ref=e206]:
                - cell "E2E Expand Test" [ref=e207]
                - cell "expand.e2e.1780433419767@test.com" [ref=e208]
                - cell "02/06/2026" [ref=e209]
                - cell "Aguardando análise" [ref=e210]:
                  - generic [ref=e212]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e213]:
                  - button "Ver detalhes ▼" [ref=e214] [cursor=pointer]
              - row "Expand Test Exec expand.test.1780432344336@test.com 02/06/2026 Aguardando análise Ver detalhes ▼" [ref=e215]:
                - cell "Expand Test Exec" [ref=e216]
                - cell "expand.test.1780432344336@test.com" [ref=e217]
                - cell "02/06/2026" [ref=e218]
                - cell "Aguardando análise" [ref=e219]:
                  - generic [ref=e221]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e222]:
                  - button "Ver detalhes ▼" [ref=e223] [cursor=pointer]
              - row "Expand Test Exec expand.test.1780432336064@test.com 02/06/2026 Aguardando análise Ver detalhes ▼" [ref=e224]:
                - cell "Expand Test Exec" [ref=e225]
                - cell "expand.test.1780432336064@test.com" [ref=e226]
                - cell "02/06/2026" [ref=e227]
                - cell "Aguardando análise" [ref=e228]:
                  - generic [ref=e230]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e231]:
                  - button "Ver detalhes ▼" [ref=e232] [cursor=pointer]
              - row "Rejectme Test rejectme@fracexec.com 02/06/2026 Rejeitado Ver detalhes ▼" [ref=e233]:
                - cell "Rejectme Test" [ref=e234]
                - cell "rejectme@fracexec.com" [ref=e235]
                - cell "02/06/2026" [ref=e236]
                - cell "Rejeitado" [ref=e237]:
                  - generic [ref=e239]: Rejeitado
                - cell "Ver detalhes ▼" [ref=e240]:
                  - button "Ver detalhes ▼" [ref=e241] [cursor=pointer]
              - row "Maria Admin Test admintest@fracexec.com 02/06/2026 Aprovado Ver detalhes ▼" [ref=e242]:
                - cell "Maria Admin Test" [ref=e243]
                - cell "admintest@fracexec.com" [ref=e244]
                - cell "02/06/2026" [ref=e245]
                - cell "Aprovado" [ref=e246]:
                  - generic [ref=e248]: Aprovado
                - cell "Ver detalhes ▼" [ref=e249]:
                  - button "Ver detalhes ▼" [ref=e250] [cursor=pointer]
              - row "João Teste applicant2@fracexec.com 02/06/2026 Aguardando análise Ver detalhes ▼" [ref=e251]:
                - cell "João Teste" [ref=e252]
                - cell "applicant2@fracexec.com" [ref=e253]
                - cell "02/06/2026" [ref=e254]
                - cell "Aguardando análise" [ref=e255]:
                  - generic [ref=e257]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e258]:
                  - button "Ver detalhes ▼" [ref=e259] [cursor=pointer]
              - row "Test Applicant applicant@test.com 02/06/2026 Aguardando análise Ver detalhes ▼" [ref=e260]:
                - cell "Test Applicant" [ref=e261]
                - cell "applicant@test.com" [ref=e262]
                - cell "02/06/2026" [ref=e263]
                - cell "Aguardando análise" [ref=e264]:
                  - generic [ref=e266]: Aguardando análise
                - cell "Ver detalhes ▼" [ref=e267]:
                  - button "Ver detalhes ▼" [ref=e268] [cursor=pointer]
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
  21  |     await page.waitForLoadState('networkidle');
  22  |     // Buffer extra de hidratação para componente admin-candidates
  23  |     await page.waitForTimeout(4000);
  24  |     await expect(page).toHaveURL(/\/admin\/candidates/);
  25  |     await page.waitForFunction(
  26  |       () => document.querySelector('.page-body, .table-wrapper, .filters, .empty-state') !== null,
  27  |       { timeout: 15000 }
  28  |     );
> 29  |     await expect(page.locator('.page-body, .filters')).toBeVisible({ timeout: 10000 });
      |                                                        ^ Error: expect(locator).toBeVisible() failed
  30  |   });
  31  | 
  32  |   test('Admin vê filtro de status na fila', async ({ page }) => {
  33  |     await loginAsAdmin(page);
  34  |     await page.goto('/admin/candidates');
  35  |     await page.waitForLoadState('networkidle');
  36  |     await page.waitForTimeout(1500);
  37  |     await expect(page.locator('.filters select, select')).toBeVisible({ timeout: 5000 });
  38  |   });
  39  | 
  40  |   test('Admin expande candidatura inline', async ({ page, request }) => {
  41  |     // Seed candidatura
  42  |     await request.post('http://localhost:8080/api/v1/applications', {
  43  |       data: {
  44  |         fullName: 'E2E Expand Test',
  45  |         email: `expand.e2e.${Date.now()}@test.com`,
  46  |         linkedinUrl: 'https://linkedin.com/in/expandtest',
  47  |         positions: [{ roleTitle: 'CFO', periodStart: '2020-01-01' }],
  48  |         references: [
  49  |           { refName: 'Ref A', refRole: 'CEO', refContact: 'a@ref.com' },
  50  |           { refName: 'Ref B', refRole: 'CTO', refContact: 'b@ref.com' },
  51  |         ],
  52  |         motivation: 'Motivação E2E inline expand test.',
  53  |         lgpdConsent: true,
  54  |       }
  55  |     });
  56  | 
  57  |     await loginAsAdmin(page);
  58  |     await page.goto('/admin/candidates');
  59  |     await page.waitForLoadState('networkidle');
  60  |     await page.waitForTimeout(1500);
  61  | 
  62  |     const expandBtn = page.locator('.btn-expand, button:has-text("Ver detalhes")').first();
  63  |     if (await expandBtn.isVisible({ timeout: 5000 })) {
  64  |       await expandBtn.click();
  65  |       await expect(page.locator('.accordion-row, .detail-panel')).toBeVisible({ timeout: 5000 });
  66  |     }
  67  |   });
  68  | 
  69  |   test('Rota /admin/candidates sem login redireciona para /login', async ({ page }) => {
  70  |     await page.goto('/admin/candidates');
  71  |     await page.waitForLoadState('networkidle');
  72  |     await page.waitForTimeout(1000);
  73  |     await expect(page).toHaveURL(/\/login/);
  74  |   });
  75  | });
  76  | 
  77  | test.describe('Admin — Pool de Executivos', () => {
  78  | 
  79  |   test('Admin acessa /admin/pool', async ({ page }) => {
  80  |     await loginAsAdmin(page);
  81  |     await page.goto('/admin/pool');
  82  |     await page.waitForLoadState('networkidle');
  83  |     // Buffer extra de hidratação para componente admin-pool
  84  |     await page.waitForTimeout(4000);
  85  |     await page.waitForFunction(
  86  |       () => document.querySelector('.page-body, .pool-grid, .empty-state, .filters') !== null,
  87  |       { timeout: 15000 }
  88  |     );
  89  |     await expect(page.locator('.page-body, .filters')).toBeVisible({ timeout: 10000 });
  90  |   });
  91  | 
  92  |   test('Pool tem filtros de especialidade', async ({ page }) => {
  93  |     await loginAsAdmin(page);
  94  |     await page.goto('/admin/pool');
  95  |     await page.waitForLoadState('networkidle');
  96  |     await page.waitForTimeout(4000);
  97  |     await page.waitForFunction(
  98  |       () => document.querySelector('.filters, select') !== null,
  99  |       { timeout: 15000 }
  100 |     );
  101 |     await expect(page.locator('.filters select')).toBeVisible({ timeout: 10000 });
  102 |   });
  103 | 
  104 |   test('Rota /admin/pool sem login redireciona para /login', async ({ page }) => {
  105 |     await page.goto('/admin/pool');
  106 |     await page.waitForLoadState('networkidle');
  107 |     await page.waitForTimeout(1000);
  108 |     await expect(page).toHaveURL(/\/login/);
  109 |   });
  110 | });
  111 | 
```