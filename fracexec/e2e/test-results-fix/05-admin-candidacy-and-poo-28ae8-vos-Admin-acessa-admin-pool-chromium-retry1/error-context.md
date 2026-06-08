# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 05-admin-candidacy-and-pool.spec.ts >> Admin — Pool de Executivos >> Admin acessa /admin/pool
- Location: tests/05-admin-candidacy-and-pool.spec.ts:79:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.page-body, .filters')
Expected: visible
Error: strict mode violation: locator('.page-body, .filters') resolved to 2 elements:
    1) <div class="page-body" _ngcontent-ng-c501306693="">…</div> aka locator('div').filter({ hasText: 'Todas' }).nth(1)
    2) <div class="filters" _ngcontent-ng-c501306693="">…</div> aka getByText('Todas especialidadesCFOCTOCMOCOOOutroTodos os statusAtivoPausadoIndisponí')

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
        - generic "Pool de Executivos" [ref=e84]:
          - navigation "Localização atual" [ref=e85]:
            - generic [ref=e86]: Admin
            - generic [ref=e87]: /
            - generic [ref=e88]: Pool
          - heading "Pool de Executivos" [level=1] [ref=e89]
        - generic [ref=e90]:
          - generic [ref=e91]:
            - combobox [ref=e92] [cursor=pointer]:
              - option "Todas especialidades" [selected]
              - option "CFO"
              - option "CTO"
              - option "CMO"
              - option "COO"
              - option "Outro"
            - spinbutton [ref=e93]
            - textbox "Setor" [ref=e94]
            - combobox [ref=e95] [cursor=pointer]:
              - option "Todos os status" [selected]
              - option "Ativo"
              - option "Pausado"
              - option "Indisponível"
            - button "Limpar" [ref=e96] [cursor=pointer]
          - generic [ref=e97]:
            - generic [ref=e98] [cursor=pointer]:
              - generic "avail.e2e.1780688872161 iniciais" [ref=e99]: AV
              - generic [ref=e100]:
                - paragraph [ref=e101]: avail.e2e.1780688872161
                - paragraph [ref=e102]: avail.e2e.1780688872161@test.com
                - generic [ref=e104]: CFO
                - paragraph [ref=e105]: Tecnologia
              - generic [ref=e106]:
                - generic [ref=e107]: 12 dias/mês
                - generic [ref=e109]: Disponível
            - generic [ref=e110] [cursor=pointer]:
              - generic "avail.e2e.1780688859037 iniciais" [ref=e111]: AV
              - generic [ref=e112]:
                - paragraph [ref=e113]: avail.e2e.1780688859037
                - paragraph [ref=e114]: avail.e2e.1780688859037@test.com
                - generic [ref=e116]: CFO
                - paragraph [ref=e117]: Tecnologia
              - generic [ref=e118]:
                - generic [ref=e119]: 12 dias/mês
                - generic [ref=e121]: Disponível
            - generic [ref=e122] [cursor=pointer]:
              - generic "avail.e2e.1780688852095 iniciais" [ref=e123]: AV
              - generic [ref=e124]:
                - paragraph [ref=e125]: avail.e2e.1780688852095
                - paragraph [ref=e126]: avail.e2e.1780688852095@test.com
                - generic [ref=e128]: CFO
                - paragraph [ref=e129]: Tecnologia
              - generic [ref=e130]:
                - generic [ref=e131]: 20 dias/mês
                - generic [ref=e133]: Disponível
            - generic [ref=e134] [cursor=pointer]:
              - generic "avail.e2e.1780688834734 iniciais" [ref=e135]: AV
              - generic [ref=e136]:
                - paragraph [ref=e137]: avail.e2e.1780688834734
                - paragraph [ref=e138]: avail.e2e.1780688834734@test.com
                - generic [ref=e140]: CFO
                - paragraph [ref=e141]: Tecnologia
              - generic [ref=e142]:
                - generic [ref=e143]: 20 dias/mês
                - generic [ref=e145]: Disponível
            - generic [ref=e146] [cursor=pointer]:
              - generic "avail.e2e.1780688820441 iniciais" [ref=e147]: AV
              - generic [ref=e148]:
                - paragraph [ref=e149]: avail.e2e.1780688820441
                - paragraph [ref=e150]: avail.e2e.1780688820441@test.com
                - generic [ref=e152]: CFO
                - paragraph [ref=e153]: Tecnologia
              - generic [ref=e154]:
                - generic [ref=e155]: 20 dias/mês
                - generic [ref=e157]: Disponível
            - generic [ref=e158] [cursor=pointer]:
              - generic "exec.epic4.1780683302194 iniciais" [ref=e159]: EX
              - generic [ref=e160]:
                - paragraph [ref=e161]: exec.epic4.1780683302194
                - paragraph [ref=e162]: exec.epic4.1780683302194@test.com
                - generic [ref=e163]:
                  - generic [ref=e164]: CFO
                  - generic [ref=e165]: COO
                - paragraph [ref=e166]: Tecnologia, Financeiro
              - generic [ref=e167]:
                - generic [ref=e168]: 20 dias/mês
                - generic [ref=e170]: Indisponível
            - generic [ref=e171] [cursor=pointer]:
              - generic "avail.e2e.1780515734104 iniciais" [ref=e172]: AV
              - generic [ref=e173]:
                - paragraph [ref=e174]: avail.e2e.1780515734104
                - paragraph [ref=e175]: avail.e2e.1780515734104@test.com
                - generic [ref=e177]: CFO
                - paragraph [ref=e178]: Tecnologia
              - generic [ref=e179]:
                - generic [ref=e180]: 20 dias/mês
                - generic [ref=e182]: Disponível
            - generic [ref=e183] [cursor=pointer]:
              - generic "avail.e2e.1780515722671 iniciais" [ref=e184]: AV
              - generic [ref=e185]:
                - paragraph [ref=e186]: avail.e2e.1780515722671
                - paragraph [ref=e187]: avail.e2e.1780515722671@test.com
                - generic [ref=e189]: CFO
                - paragraph [ref=e190]: Tecnologia
              - generic [ref=e191]:
                - generic [ref=e192]: 20 dias/mês
                - generic [ref=e194]: Disponível
            - generic [ref=e195] [cursor=pointer]:
              - generic "avail.e2e.1780515707127 iniciais" [ref=e196]: AV
              - generic [ref=e197]:
                - paragraph [ref=e198]: avail.e2e.1780515707127
                - paragraph [ref=e199]: avail.e2e.1780515707127@test.com
                - generic [ref=e201]: CFO
                - paragraph [ref=e202]: Tecnologia
              - generic [ref=e203]:
                - generic [ref=e204]: 20 dias/mês
                - generic [ref=e206]: Disponível
            - generic [ref=e207] [cursor=pointer]:
              - generic "avail.e2e.1780515687102 iniciais" [ref=e208]: AV
              - generic [ref=e209]:
                - paragraph [ref=e210]: avail.e2e.1780515687102
                - paragraph [ref=e211]: avail.e2e.1780515687102@test.com
                - generic [ref=e213]: CFO
                - paragraph [ref=e214]: Tecnologia
              - generic [ref=e215]:
                - generic [ref=e216]: 20 dias/mês
                - generic [ref=e218]: Disponível
            - generic [ref=e219] [cursor=pointer]:
              - generic "avail.e2e.1780515664825 iniciais" [ref=e220]: AV
              - generic [ref=e221]:
                - paragraph [ref=e222]: avail.e2e.1780515664825
                - paragraph [ref=e223]: avail.e2e.1780515664825@test.com
                - generic [ref=e225]: CFO
                - paragraph [ref=e226]: Tecnologia
              - generic [ref=e227]:
                - generic [ref=e228]: 12 dias/mês
                - generic [ref=e230]: Disponível
            - generic [ref=e231] [cursor=pointer]:
              - generic "avail.e2e.1780515655185 iniciais" [ref=e232]: AV
              - generic [ref=e233]:
                - paragraph [ref=e234]: avail.e2e.1780515655185
                - paragraph [ref=e235]: avail.e2e.1780515655185@test.com
                - generic [ref=e237]: CFO
                - paragraph [ref=e238]: Tecnologia
              - generic [ref=e239]:
                - generic [ref=e240]: 12 dias/mês
                - generic [ref=e242]: Disponível
            - generic [ref=e243] [cursor=pointer]:
              - generic "avail.e2e.1780515650259 iniciais" [ref=e244]: AV
              - generic [ref=e245]:
                - paragraph [ref=e246]: avail.e2e.1780515650259
                - paragraph [ref=e247]: avail.e2e.1780515650259@test.com
                - generic [ref=e249]: CFO
                - paragraph [ref=e250]: Tecnologia
              - generic [ref=e251]:
                - generic [ref=e252]: 20 dias/mês
                - generic [ref=e254]: Disponível
            - generic [ref=e255] [cursor=pointer]:
              - generic "avail.e2e.1780515634431 iniciais" [ref=e256]: AV
              - generic [ref=e257]:
                - paragraph [ref=e258]: avail.e2e.1780515634431
                - paragraph [ref=e259]: avail.e2e.1780515634431@test.com
                - generic [ref=e261]: CFO
                - paragraph [ref=e262]: Tecnologia
              - generic [ref=e263]:
                - generic [ref=e264]: 20 dias/mês
                - generic [ref=e266]: Disponível
            - generic [ref=e267] [cursor=pointer]:
              - generic "avail.e2e.1780515627164 iniciais" [ref=e268]: AV
              - generic [ref=e269]:
                - paragraph [ref=e270]: avail.e2e.1780515627164
                - paragraph [ref=e271]: avail.e2e.1780515627164@test.com
                - generic [ref=e273]: CFO
                - paragraph [ref=e274]: Tecnologia
              - generic [ref=e275]:
                - generic [ref=e276]: 20 dias/mês
                - generic [ref=e278]: Disponível
            - generic [ref=e279] [cursor=pointer]:
              - generic "avail.e2e.1780515562600 iniciais" [ref=e280]: AV
              - generic [ref=e281]:
                - paragraph [ref=e282]: avail.e2e.1780515562600
                - paragraph [ref=e283]: avail.e2e.1780515562600@test.com
                - generic [ref=e285]: CFO
                - paragraph [ref=e286]: Tecnologia
              - generic [ref=e287]:
                - generic [ref=e288]: 20 dias/mês
                - generic [ref=e290]: Disponível
            - generic [ref=e291] [cursor=pointer]:
              - generic "avail.e2e.1780515550934 iniciais" [ref=e292]: AV
              - generic [ref=e293]:
                - paragraph [ref=e294]: avail.e2e.1780515550934
                - paragraph [ref=e295]: avail.e2e.1780515550934@test.com
                - generic [ref=e297]: CFO
                - paragraph [ref=e298]: Tecnologia
              - generic [ref=e299]:
                - generic [ref=e300]: 20 dias/mês
                - generic [ref=e302]: Disponível
            - generic [ref=e303] [cursor=pointer]:
              - generic "avail.e2e.1780515534398 iniciais" [ref=e304]: AV
              - generic [ref=e305]:
                - paragraph [ref=e306]: avail.e2e.1780515534398
                - paragraph [ref=e307]: avail.e2e.1780515534398@test.com
                - generic [ref=e309]: CFO
                - paragraph [ref=e310]: Tecnologia
              - generic [ref=e311]:
                - generic [ref=e312]: 20 dias/mês
                - generic [ref=e314]: Disponível
            - generic [ref=e315] [cursor=pointer]:
              - generic "avail.e2e.1780515519809 iniciais" [ref=e316]: AV
              - generic [ref=e317]:
                - paragraph [ref=e318]: avail.e2e.1780515519809
                - paragraph [ref=e319]: avail.e2e.1780515519809@test.com
                - generic [ref=e321]: CFO
                - paragraph [ref=e322]: Tecnologia
              - generic [ref=e323]:
                - generic [ref=e324]: 20 dias/mês
                - generic [ref=e326]: Disponível
            - generic [ref=e327] [cursor=pointer]:
              - generic "avail.e2e.1780515507286 iniciais" [ref=e328]: AV
              - generic [ref=e329]:
                - paragraph [ref=e330]: avail.e2e.1780515507286
                - paragraph [ref=e331]: avail.e2e.1780515507286@test.com
                - generic [ref=e333]: CFO
                - paragraph [ref=e334]: Tecnologia
              - generic [ref=e335]:
                - generic [ref=e336]: 12 dias/mês
                - generic [ref=e338]: Disponível
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
  29  |     await expect(page.locator('.page-body, .filters')).toBeVisible({ timeout: 10000 });
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
> 89  |     await expect(page.locator('.page-body, .filters')).toBeVisible({ timeout: 10000 });
      |                                                        ^ Error: expect(locator).toBeVisible() failed
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