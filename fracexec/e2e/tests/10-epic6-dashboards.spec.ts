import { test, expect } from '@playwright/test';

/**
 * E2E — Epic 6: Complete Dashboards, Admin Ops & Production Readiness
 * Octane test IDs: 2019–2023
 */

async function loginAdmin(page: any) {
  await page.goto('/login');
  await page.waitForSelector('input[type="email"]', { timeout: 8000 });
  await page.fill('input[type="email"]', 'admin@fracexec.com');
  await page.fill('input[type="password"]', 'Admin@FracExec2026!');
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/admin/, { timeout: 8000 });
}

async function loginExec(page: any, email: string, password: string) {
  await page.goto('/login');
  await page.waitForSelector('input[type="email"]', { timeout: 8000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/executive/, { timeout: 10000 });
}

test.describe('Epic 6 — Dashboards, Admin Ops & Production Readiness', () => {

  // 6.4-01: Actuator health
  test('6.4-01: GET /actuator/health retorna UP com sub-checks', async () => {
    const r = await fetch('http://localhost:8081/actuator/health');
    const d = await r.json();
    expect(r.status).toBe(200);
    expect(d.status).toBe('UP');
    expect(d.components?.db?.status).toBe('UP');
    expect(d.components?.diskSpace?.status).toBe('UP');
  });

  // 6.2-01: Admin dashboard
  test('6.2-01: Admin dashboard carrega com stat cards operacionais', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.page-body', { timeout: 12000 });
    await expect(page.locator('.page-title')).toContainText('Dashboard');
    await expect(page.locator('.stat-grid').first()).toBeVisible({ timeout: 10000 });
  });

  // 6.2-02: Admin engagements
  test('6.2-02: Admin acessa /admin/engagements', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/engagements');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.page-body', { timeout: 10000 });
    await expect(page.locator('.page-title')).toContainText('Engajamentos');
  });

  // 6.1-01: Executive dashboard com stat cards
  test('6.1-01: Executive dashboard com stat cards e seções', async ({ page }) => {
    const ts = Date.now();
    const email = `exec.dash6.${ts}@test.com`;
    const pass  = 'ExecDash@2026!';
    const regR = await fetch('http://localhost:8080/api/v1/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, role: 'EXECUTIVE' }),
    });
    const regData = await regR.json();
    if (!regData.accessToken) { test.skip(); return; }

    await fetch('http://localhost:8080/api/v1/executive/profile', {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${regData.accessToken}` },
      body: JSON.stringify({ bio: 'Bio E2E epic6.', currentPosition: 'CFO', yearsExperience: 12,
        availabilityDays: 8, specialties: ['CFO'], sectors: ['Tecnologia'], linkedinUrl: 'https://linkedin.com/in/epic6' }),
    });

    await loginExec(page, email, pass);
    await page.waitForURL(/\/executive\/dashboard/, { timeout: 10000 });
    await page.waitForSelector('.page-body', { timeout: 10000 });

    // Stat cards devem estar presentes (com zeros)
    await expect(page.locator('.stat-row').first()).toBeVisible({ timeout: 12000 });
  });

  // 6.3-01: Botão de exclusão no perfil executivo
  test('6.3-01: Perfil executivo tem botão de exclusão de conta', async ({ page }) => {
    const ts = Date.now();
    const email = `exec.del6.${ts}@test.com`;
    const pass  = 'ExecDel@2026!';
    const regR = await fetch('http://localhost:8080/api/v1/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, role: 'EXECUTIVE' }),
    });
    const regData = await regR.json();
    if (!regData.accessToken) { test.skip(); return; }

    await loginExec(page, email, pass);
    await page.goto('/executive/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.page-body', { timeout: 10000 });

    await expect(page.locator('.btn-danger').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.privacy-section')).toBeVisible();
  });

});
