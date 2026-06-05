import { test, expect } from '@playwright/test';

/**
 * E2E — Epic 5: Contract, Payments & Engagements
 * Octane story IDs: 1063–1067
 *
 * Foco nos fluxos de navegação e UI.
 */

async function loginAdmin(page: any) {
  await page.goto('/login');
  await page.waitForSelector('input[type="email"]', { timeout: 8000 });
  await page.fill('input[type="email"]', 'admin@fracexec.com');
  await page.fill('input[type="password"]', 'Admin@FracExec2026!');
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/admin/, { timeout: 8000 });
}

test.describe('Epic 5 — Contract, Payments & Engagements', () => {

  // Story 5.1: Admin acessa /admin/contracts
  test('5.1-01: Admin acessa página de contratos', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/contracts');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.page-body', { timeout: 10000 });
    await expect(page.locator('.page-title')).toContainText('Contratos');
  });

  // Story 5.1: Admin acessa /admin/contracts/new
  test('5.1-02: Admin acessa formulário de novo contrato', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/contracts/new');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.page-body', { timeout: 10000 });
    await expect(page.locator('.page-title')).toContainText('Novo Contrato');
    await expect(page.locator('select').first()).toBeVisible();
  });

  // Story 5.4: Executivo acessa /executive/payments
  test('5.4-01: Executivo acessa histórico de repasses', async ({ page }) => {
    const ts       = Date.now();
    const email    = `exec.pay5.${ts}@test.com`;
    const password = 'ExecPay@2026!';
    const regR = await fetch('http://localhost:8080/api/v1/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'EXECUTIVE' }),
    });
    const regData = await regR.json();
    if (!regData.accessToken) { test.skip(); return; }

    // Completar perfil
    await fetch('http://localhost:8080/api/v1/executive/profile', {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${regData.accessToken}` },
      body: JSON.stringify({ bio: 'Bio E2E epic5.', currentPosition: 'CFO', yearsExperience: 12,
        availabilityDays: 8, specialties: ['CFO'], sectors: ['Tecnologia'], linkedinUrl: 'https://linkedin.com/in/test5' }),
    });

    await page.goto('/login');
    await page.waitForSelector('input[type="email"]', { timeout: 8000 });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL(/\/executive/, { timeout: 10000 });

    await page.goto('/executive/payments');
    await page.waitForSelector('.page-body', { timeout: 10000 });
    await expect(page.locator('.page-title')).toContainText('Repasses');
  });

  // Story 5.5: PME acessa /company/payments
  test('5.5-01: PME acessa histórico de pagamentos e contratos', async ({ page }) => {
    const ts       = Date.now();
    const pmeEmail = `pme.pay5.${ts}@test.com`;
    const password = 'PmePay@2026!';

    // Registrar empresa PME
    const reg = await fetch('http://localhost:8080/api/v1/companies/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        legalName: `PME Pay5 ${ts}`, cnpj: generateCnpj(ts), sector: 'Tecnologia',
        employeeRange: 'E_11_50', annualRevenueRange: 'R_1M_5M',
        responsibleName: 'Pay5 User', responsibleEmail: pmeEmail,
      }),
    });
    const regData = await reg.json();
    if (!regData.companyId) { test.skip(); return; }

    // Ativar empresa via admin
    const adminLogin = await fetch('http://localhost:8080/api/v1/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fracexec.com', password: 'Admin@FracExec2026!' }),
    });
    const adminData = await adminLogin.json();
    await fetch(`http://localhost:8080/api/v1/admin/companies/${regData.companyId}/activate`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${adminData.accessToken}` },
    });

    // Obter token via forgot-password + Mailpit
    await fetch('http://localhost:8080/api/v1/auth/forgot-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: pmeEmail }),
    });
    await new Promise(r => setTimeout(r, 1500));

    const mailR = await fetch('http://localhost:8025/api/v1/messages?limit=20');
    if (!mailR.ok) { test.skip(); return; }
    const mails = await mailR.json();
    const mail = (mails.messages ?? []).find((m: any) =>
      Array.isArray(m.To) && m.To.some((t: any) => t.Address === pmeEmail));
    if (!mail) { test.skip(); return; }
    const msgR = await fetch(`http://localhost:8025/api/v1/message/${mail.ID}`);
    const msg = await msgR.json();
    const tokenMatch = (msg.HTML + msg.Text).match(/token=([a-zA-Z0-9\-]{20,})/);
    if (!tokenMatch) { test.skip(); return; }
    await fetch('http://localhost:8080/api/v1/auth/reset-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tokenMatch[1], newPassword: password }),
    });

    await page.goto('/login');
    await page.waitForSelector('input[type="email"]', { timeout: 8000 });
    await page.fill('input[type="email"]', pmeEmail);
    await page.fill('input[type="password"]', password);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL(/\/company/, { timeout: 10000 });

    await page.goto('/company/payments');
    await page.waitForSelector('.page-body', { timeout: 10000 });
    await expect(page.locator('.page-title')).toContainText('Pagamentos');
  });

  // Story 5.2: Webhook endpoint público
  test('5.2-01: Endpoint de webhook Stripe acessível sem auth', async ({ page }) => {
    const r = await fetch('http://localhost:8080/api/v1/webhooks/stripe', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'test.event', data: { object: { id: 'pi_test' } } }),
    });
    expect(r.status).toBe(200);
  });

  // Admin tem link "Contratos" no sidebar
  test('5.1-03: Sidebar admin tem item Contratos', async ({ page }) => {
    await loginAdmin(page);
    await expect(page.getByRole('link', { name: /contratos/i })).toBeVisible({ timeout: 8000 });
  });

});

function generateCnpj(seed: number): string {
  const base = String(seed).padStart(8, '1').slice(-8) + '0001';
  const d = base.split('').map(Number); d.push(0, 0);
  const dv = (w: number[]) => { const s = w.reduce((a, v, i) => a + d[i] * v, 0); const r = s % 11; return r < 2 ? 0 : 11 - r; };
  d[12] = dv([5,4,3,2,9,8,7,6,5,4,3,2]); d[13] = dv([6,5,4,3,2,9,8,7,6,5,4,3,2]);
  const n = d.join('');
  return `${n.slice(0,2)}.${n.slice(2,5)}.${n.slice(5,8)}/${n.slice(8,12)}-${n.slice(12)}`;
}
