# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 05-admin-candidacy-and-pool.spec.ts >> Admin — Pool de Executivos >> Admin acessa /admin/pool
- Location: tests/05-admin-candidacy-and-pool.spec.ts:81:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.page-body, .filters')
Expected: visible
Error: strict mode violation: locator('.page-body, .filters') resolved to 2 elements:
    1) <div class="page-body" _ngcontent-ng-c501306693="">…</div> aka locator('div').filter({ hasText: 'Todas' }).nth(1)
    2) <div class="filters" _ngcontent-ng-c501306693="">…</div> aka getByText('Todas especialidadesCFOCTOCMOCOOOutroTodos os statusAtivoPausadoIndisponí')

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
        - generic "Pool de Executivos" [ref=e81]:
          - navigation "Localização atual" [ref=e82]:
            - generic [ref=e83]: Admin
            - generic [ref=e84]: /
            - generic [ref=e85]: Pool
          - heading "Pool de Executivos" [level=1] [ref=e86]
        - generic [ref=e87]:
          - generic [ref=e88]:
            - combobox [ref=e89] [cursor=pointer]:
              - option "Todas especialidades" [selected]
              - option "CFO"
              - option "CTO"
              - option "CMO"
              - option "COO"
              - option "Outro"
            - spinbutton [ref=e90]
            - textbox "Setor" [ref=e91]
            - combobox [ref=e92] [cursor=pointer]:
              - option "Todos os status" [selected]
              - option "Ativo"
              - option "Pausado"
              - option "Indisponível"
            - button "Limpar" [ref=e93] [cursor=pointer]
          - generic [ref=e94]:
            - generic [ref=e95] [cursor=pointer]:
              - generic "avail.e2e.1780515722671 iniciais" [ref=e96]: AV
              - generic [ref=e97]:
                - paragraph [ref=e98]: avail.e2e.1780515722671
                - paragraph [ref=e99]: avail.e2e.1780515722671@test.com
                - generic [ref=e101]: CFO
                - paragraph [ref=e102]: Tecnologia
              - generic [ref=e103]:
                - generic [ref=e104]: 20 dias/mês
                - generic [ref=e106]: Disponível
            - generic [ref=e107] [cursor=pointer]:
              - generic "avail.e2e.1780515707127 iniciais" [ref=e108]: AV
              - generic [ref=e109]:
                - paragraph [ref=e110]: avail.e2e.1780515707127
                - paragraph [ref=e111]: avail.e2e.1780515707127@test.com
                - generic [ref=e113]: CFO
                - paragraph [ref=e114]: Tecnologia
              - generic [ref=e115]:
                - generic [ref=e116]: 20 dias/mês
                - generic [ref=e118]: Disponível
            - generic [ref=e119] [cursor=pointer]:
              - generic "avail.e2e.1780515687102 iniciais" [ref=e120]: AV
              - generic [ref=e121]:
                - paragraph [ref=e122]: avail.e2e.1780515687102
                - paragraph [ref=e123]: avail.e2e.1780515687102@test.com
                - generic [ref=e125]: CFO
                - paragraph [ref=e126]: Tecnologia
              - generic [ref=e127]:
                - generic [ref=e128]: 20 dias/mês
                - generic [ref=e130]: Disponível
            - generic [ref=e131] [cursor=pointer]:
              - generic "avail.e2e.1780515664825 iniciais" [ref=e132]: AV
              - generic [ref=e133]:
                - paragraph [ref=e134]: avail.e2e.1780515664825
                - paragraph [ref=e135]: avail.e2e.1780515664825@test.com
                - generic [ref=e137]: CFO
                - paragraph [ref=e138]: Tecnologia
              - generic [ref=e139]:
                - generic [ref=e140]: 12 dias/mês
                - generic [ref=e142]: Disponível
            - generic [ref=e143] [cursor=pointer]:
              - generic "avail.e2e.1780515655185 iniciais" [ref=e144]: AV
              - generic [ref=e145]:
                - paragraph [ref=e146]: avail.e2e.1780515655185
                - paragraph [ref=e147]: avail.e2e.1780515655185@test.com
                - generic [ref=e149]: CFO
                - paragraph [ref=e150]: Tecnologia
              - generic [ref=e151]:
                - generic [ref=e152]: 12 dias/mês
                - generic [ref=e154]: Disponível
            - generic [ref=e155] [cursor=pointer]:
              - generic "avail.e2e.1780515650259 iniciais" [ref=e156]: AV
              - generic [ref=e157]:
                - paragraph [ref=e158]: avail.e2e.1780515650259
                - paragraph [ref=e159]: avail.e2e.1780515650259@test.com
                - generic [ref=e161]: CFO
                - paragraph [ref=e162]: Tecnologia
              - generic [ref=e163]:
                - generic [ref=e164]: 20 dias/mês
                - generic [ref=e166]: Disponível
            - generic [ref=e167] [cursor=pointer]:
              - generic "avail.e2e.1780515634431 iniciais" [ref=e168]: AV
              - generic [ref=e169]:
                - paragraph [ref=e170]: avail.e2e.1780515634431
                - paragraph [ref=e171]: avail.e2e.1780515634431@test.com
                - generic [ref=e173]: CFO
                - paragraph [ref=e174]: Tecnologia
              - generic [ref=e175]:
                - generic [ref=e176]: 20 dias/mês
                - generic [ref=e178]: Disponível
            - generic [ref=e179] [cursor=pointer]:
              - generic "avail.e2e.1780515627164 iniciais" [ref=e180]: AV
              - generic [ref=e181]:
                - paragraph [ref=e182]: avail.e2e.1780515627164
                - paragraph [ref=e183]: avail.e2e.1780515627164@test.com
                - generic [ref=e185]: CFO
                - paragraph [ref=e186]: Tecnologia
              - generic [ref=e187]:
                - generic [ref=e188]: 20 dias/mês
                - generic [ref=e190]: Disponível
            - generic [ref=e191] [cursor=pointer]:
              - generic "avail.e2e.1780515562600 iniciais" [ref=e192]: AV
              - generic [ref=e193]:
                - paragraph [ref=e194]: avail.e2e.1780515562600
                - paragraph [ref=e195]: avail.e2e.1780515562600@test.com
                - generic [ref=e197]: CFO
                - paragraph [ref=e198]: Tecnologia
              - generic [ref=e199]:
                - generic [ref=e200]: 20 dias/mês
                - generic [ref=e202]: Disponível
            - generic [ref=e203] [cursor=pointer]:
              - generic "avail.e2e.1780515550934 iniciais" [ref=e204]: AV
              - generic [ref=e205]:
                - paragraph [ref=e206]: avail.e2e.1780515550934
                - paragraph [ref=e207]: avail.e2e.1780515550934@test.com
                - generic [ref=e209]: CFO
                - paragraph [ref=e210]: Tecnologia
              - generic [ref=e211]:
                - generic [ref=e212]: 20 dias/mês
                - generic [ref=e214]: Disponível
            - generic [ref=e215] [cursor=pointer]:
              - generic "avail.e2e.1780515534398 iniciais" [ref=e216]: AV
              - generic [ref=e217]:
                - paragraph [ref=e218]: avail.e2e.1780515534398
                - paragraph [ref=e219]: avail.e2e.1780515534398@test.com
                - generic [ref=e221]: CFO
                - paragraph [ref=e222]: Tecnologia
              - generic [ref=e223]:
                - generic [ref=e224]: 20 dias/mês
                - generic [ref=e226]: Disponível
            - generic [ref=e227] [cursor=pointer]:
              - generic "avail.e2e.1780515519809 iniciais" [ref=e228]: AV
              - generic [ref=e229]:
                - paragraph [ref=e230]: avail.e2e.1780515519809
                - paragraph [ref=e231]: avail.e2e.1780515519809@test.com
                - generic [ref=e233]: CFO
                - paragraph [ref=e234]: Tecnologia
              - generic [ref=e235]:
                - generic [ref=e236]: 20 dias/mês
                - generic [ref=e238]: Disponível
            - generic [ref=e239] [cursor=pointer]:
              - generic "avail.e2e.1780515507286 iniciais" [ref=e240]: AV
              - generic [ref=e241]:
                - paragraph [ref=e242]: avail.e2e.1780515507286
                - paragraph [ref=e243]: avail.e2e.1780515507286@test.com
                - generic [ref=e245]: CFO
                - paragraph [ref=e246]: Tecnologia
              - generic [ref=e247]:
                - generic [ref=e248]: 12 dias/mês
                - generic [ref=e250]: Disponível
            - generic [ref=e251] [cursor=pointer]:
              - generic "avail.e2e.1780515499209 iniciais" [ref=e252]: AV
              - generic [ref=e253]:
                - paragraph [ref=e254]: avail.e2e.1780515499209
                - paragraph [ref=e255]: avail.e2e.1780515499209@test.com
                - generic [ref=e257]: CFO
                - paragraph [ref=e258]: Tecnologia
              - generic [ref=e259]:
                - generic [ref=e260]: 12 dias/mês
                - generic [ref=e262]: Disponível
            - generic [ref=e263] [cursor=pointer]:
              - generic "avail.e2e.1780515495131 iniciais" [ref=e264]: AV
              - generic [ref=e265]:
                - paragraph [ref=e266]: avail.e2e.1780515495131
                - paragraph [ref=e267]: avail.e2e.1780515495131@test.com
                - generic [ref=e269]: CFO
                - paragraph [ref=e270]: Tecnologia
              - generic [ref=e271]:
                - generic [ref=e272]: 20 dias/mês
                - generic [ref=e274]: Disponível
            - generic [ref=e275] [cursor=pointer]:
              - generic "avail.e2e.1780515485855 iniciais" [ref=e276]: AV
              - generic [ref=e277]:
                - paragraph [ref=e278]: avail.e2e.1780515485855
                - paragraph [ref=e279]: avail.e2e.1780515485855@test.com
                - generic [ref=e281]: CFO
                - paragraph [ref=e282]: Tecnologia
              - generic [ref=e283]:
                - generic [ref=e284]: 20 dias/mês
                - generic [ref=e286]: Disponível
            - generic [ref=e287] [cursor=pointer]:
              - generic "avail.e2e.1780515474941 iniciais" [ref=e288]: AV
              - generic [ref=e289]:
                - paragraph [ref=e290]: avail.e2e.1780515474941
                - paragraph [ref=e291]: avail.e2e.1780515474941@test.com
                - generic [ref=e293]: CFO
                - paragraph [ref=e294]: Tecnologia
              - generic [ref=e295]:
                - generic [ref=e296]: 20 dias/mês
                - generic [ref=e298]: Disponível
            - generic [ref=e299] [cursor=pointer]:
              - generic "exec.rerun.1780513261851 iniciais" [ref=e300]: EX
              - generic [ref=e301]:
                - paragraph [ref=e302]: exec.rerun.1780513261851
                - paragraph [ref=e303]: exec.rerun.1780513261851@example.com
                - generic [ref=e304]:
                  - generic [ref=e305]: CFO
                  - generic [ref=e306]: COO
                - paragraph [ref=e307]: Tecnologia, Financeiro
              - generic [ref=e308]:
                - generic [ref=e309]: 15 dias/mês
                - generic [ref=e311]: Disponível
            - generic [ref=e312] [cursor=pointer]:
              - generic "av.1780513128955 iniciais" [ref=e313]: AV
              - generic [ref=e314]:
                - paragraph [ref=e315]: av.1780513128955
                - paragraph [ref=e316]: av.1780513128955@ex.com
                - generic [ref=e318]: CFO
                - paragraph [ref=e319]: Tech
              - generic [ref=e320]:
                - generic [ref=e321]: 15 dias/mês
                - generic [ref=e323]: Disponível
            - generic [ref=e324] [cursor=pointer]:
              - generic "prof.1780513091989 iniciais" [ref=e325]: PR
              - generic [ref=e326]:
                - paragraph [ref=e327]: prof.1780513091989
                - paragraph [ref=e328]: prof.1780513091989@ex.com
                - generic [ref=e329]:
                  - generic [ref=e330]: CFO
                  - generic [ref=e331]: COO
                - paragraph [ref=e332]: Tecnologia, Financeiro
              - generic [ref=e333]:
                - generic [ref=e334]: 20 dias/mês
                - generic [ref=e336]: Indisponível
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
  31  |     await expect(page.locator('.page-body, .filters')).toBeVisible({ timeout: 5000 });
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
> 90  |     await expect(page.locator('.page-body, .filters')).toBeVisible({ timeout: 5000 });
      |                                                        ^ Error: expect(locator).toBeVisible() failed
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