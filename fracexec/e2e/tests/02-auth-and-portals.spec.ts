import { test, expect } from '@playwright/test';

const EXECUTIVE_EMAIL = process.env.E2E_EXEC_EMAIL || 'test.executive@fracexec.com';
const EXECUTIVE_PASS  = process.env.E2E_EXEC_PASSWORD || 'Test@2026!';
const ADMIN_EMAIL     = process.env.E2E_ADMIN_EMAIL || 'admin@fracexec.com';
const ADMIN_PASS      = process.env.E2E_ADMIN_PASSWORD || 'Admin@FracExec2026!';

async function wait(page: any) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
}

async function login(page: any, email: string, pass: string) {
  await page.goto('/login');
  await wait(page);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(pass);
  await page.getByRole('button', { name: /entrar/i }).click();
}

test.describe('Login e roteamento por role', () => {

  test('Rota raiz redireciona para /login', async ({ page }) => {
    await page.goto('/');
    await wait(page);
    await expect(page).toHaveURL(/\/login/);
  });

  test('Login com credenciais inválidas permanece em /login', async ({ page }) => {
    await login(page, 'naoexiste@test.com', 'SenhaErrada!');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });

  test('Login como EXECUTIVE redireciona para /executive', async ({ page }) => {
    await login(page, EXECUTIVE_EMAIL, EXECUTIVE_PASS);
    await expect(page).toHaveURL(/\/executive/, { timeout: 10000 });
  });

  test('Portal EXECUTIVE exibe sidebar com itens corretos', async ({ page }) => {
    await login(page, EXECUTIVE_EMAIL, EXECUTIVE_PASS);
    await expect(page).toHaveURL(/\/executive/, { timeout: 10000 });
    const sidebar = page.locator('.sidebar-nav');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText('Dashboard');
    await expect(sidebar).toContainText('Perfil');
  });

  test('Login como ADMIN redireciona para /admin', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    await expect(page.locator('.sidebar-nav')).toContainText('Candidaturas');
  });

  test('Botão Sair limpa sessão e volta para login', async ({ page }) => {
    await login(page, EXECUTIVE_EMAIL, EXECUTIVE_PASS);
    await expect(page).toHaveURL(/\/executive/, { timeout: 10000 });
    await page.locator('.sidebar-footer button, button.btn-logout').first().click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('PME tentando acessar /admin é redirecionada ao portal correto', async ({ page, request }) => {
    const pmeEmail = `pme.e2e.${Date.now()}@test.com`;
    await request.post('http://localhost:8080/api/v1/auth/register', {
      data: { email: pmeEmail, password: 'PME@Test2026!', role: 'PME' }
    });
    await login(page, pmeEmail, 'PME@Test2026!');
    await expect(page).toHaveURL(/\/company/, { timeout: 10000 });
    await page.goto('/admin');
    await wait(page);
    await expect(page).not.toHaveURL(/^http:\/\/localhost\/admin$/);
  });
});
