import { test, expect } from '@playwright/test';

const EXECUTIVE_EMAIL = process.env.E2E_EXEC_EMAIL || 'test.executive@fracexec.com';
const EXECUTIVE_PASS  = process.env.E2E_EXEC_PASSWORD || 'Test@2026!';

async function loginAsExecutive(page: any, email = EXECUTIVE_EMAIL, pass = EXECUTIVE_PASS) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(pass);
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page).toHaveURL(/\/executive/, { timeout: 10000 });
}

test.describe('Perfil do executivo', () => {

  test('Executivo sem perfil é redirecionado para /profile com banner', async ({ page, request }) => {
    const email = `exec.noprofile.${Date.now()}@test.com`;
    await request.post('http://localhost:8080/api/v1/auth/register', {
      data: { email, password: 'Exec@2026!', role: 'EXECUTIVE' }
    });
    await loginAsExecutive(page, email, 'Exec@2026!');
    await expect(page).toHaveURL(/\/executive\/profile/, { timeout: 10000 });
    // Aguardar Angular hidratar o componente de perfil + banner
    await page.waitForTimeout(2000);
    await page.waitForSelector('.banner, .seal-banner, [class*="banner"]', { timeout: 15000, state: 'visible' });
    await expect(page.locator('.banner').first().or(page.getByText('Complete seu perfil').first())).toBeVisible({ timeout: 10000 });
  });

  test('Executivo preenche e salva perfil — mensagem de sucesso', async ({ page }) => {
    await loginAsExecutive(page);
    // profileGuard redireciona para /executive/profile se perfil não completo
    await page.waitForURL(/\/executive\/profile/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    // Angular precisa de tempo extra para renderizar o formulário de perfil
    await page.waitForTimeout(3000);
    // Aguardar qualquer textarea ou campo de texto do perfil
    await page.waitForFunction(
      () => document.querySelector('textarea, input[type="text"]') !== null,
      { timeout: 15000 }
    );

    const bioField = page.locator('textarea').first();
    await expect(bioField).toBeVisible({ timeout: 15000 });
    await bioField.fill('Executivo C-Level com 18 anos de experiência em transformação digital.');

    const ctoLabel = page.locator('label').filter({ hasText: 'CTO' });
    if (await ctoLabel.count() > 0) await ctoLabel.first().click();

    await page.getByRole('button', { name: /salvar perfil/i }).click();
    await expect(
      page.locator('.saved-msg').or(page.getByText('Perfil atualizado')).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('SealBanner aparece no portal executivo após login', async ({ page }) => {
    await loginAsExecutive(page);
    await page.waitForTimeout(2000);
    // SealBanner está no exec-layout que envolve o ExecutiveShell
    await expect(page.locator('.seal-banner')).toBeVisible({ timeout: 8000 });
    // Banner contém ícone ✦ e informações do executivo
    await expect(page.locator('.seal-banner')).toContainText('✦');
  });

  test('exec-layout e sidebar carregam no portal', async ({ page }) => {
    await loginAsExecutive(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.exec-layout')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.sidebar')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.sidebar-nav')).toContainText('Perfil');
  });
});
