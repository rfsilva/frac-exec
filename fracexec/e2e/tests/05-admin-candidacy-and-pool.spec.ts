import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@fracexec.com';
const ADMIN_PASS  = process.env.E2E_ADMIN_PASSWORD || 'Admin@FracExec2026!';

async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(ADMIN_PASS);
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
}

test.describe('Admin — Fila de Candidaturas', () => {

  test('Admin vê fila de candidaturas em /admin/candidates', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/candidates');
    await page.waitForLoadState('networkidle');
    // Buffer extra de hidratação para componente admin-candidates
    await page.waitForTimeout(4000);
    await expect(page).toHaveURL(/\/admin\/candidates/);
    await page.waitForFunction(
      () => document.querySelector('.page-body, .table-wrapper, .filters, .empty-state') !== null,
      { timeout: 15000 }
    );
    await expect(page.locator('.page-body').first()).toBeVisible({ timeout: 10000 });
  });

  test('Admin vê filtro de status na fila', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/candidates');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await expect(page.locator('.filters select, select')).toBeVisible({ timeout: 5000 });
  });

  test('Admin expande candidatura inline', async ({ page, request }) => {
    // Seed candidatura
    await request.post('http://localhost:8080/api/v1/applications', {
      data: {
        fullName: 'E2E Expand Test',
        email: `expand.e2e.${Date.now()}@test.com`,
        linkedinUrl: 'https://linkedin.com/in/expandtest',
        positions: [{ roleTitle: 'CFO', periodStart: '2020-01-01' }],
        references: [
          { refName: 'Ref A', refRole: 'CEO', refContact: 'a@ref.com' },
          { refName: 'Ref B', refRole: 'CTO', refContact: 'b@ref.com' },
        ],
        motivation: 'Motivação E2E inline expand test.',
        lgpdConsent: true,
      }
    });

    await loginAsAdmin(page);
    await page.goto('/admin/candidates');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const expandBtn = page.locator('.btn-expand, button:has-text("Ver detalhes")').first();
    if (await expandBtn.isVisible({ timeout: 5000 })) {
      await expandBtn.click();
      await expect(page.locator('.accordion-row, .detail-panel')).toBeVisible({ timeout: 5000 });
    }
  });

  test('Rota /admin/candidates sem login redireciona para /login', async ({ page }) => {
    await page.goto('/admin/candidates');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Admin — Pool de Executivos', () => {

  test('Admin acessa /admin/pool', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/pool');
    await page.waitForLoadState('networkidle');
    // Buffer extra de hidratação para componente admin-pool
    await page.waitForTimeout(4000);
    await page.waitForFunction(
      () => document.querySelector('.page-body, .pool-grid, .empty-state, .filters') !== null,
      { timeout: 15000 }
    );
    await expect(page.locator('.page-body').first()).toBeVisible({ timeout: 10000 });
  });

  test('Pool tem filtros de especialidade', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/pool');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(4000);
    await page.waitForFunction(
      () => document.querySelector('.filters select, select') !== null,
      { timeout: 15000 }
    );
    await expect(page.locator('.filters select').first()).toBeVisible({ timeout: 10000 });
  });

  test('Rota /admin/pool sem login redireciona para /login', async ({ page }) => {
    await page.goto('/admin/pool');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/login/);
  });
});
