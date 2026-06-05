import { test, expect } from '@playwright/test';

/**
 * E2E — Jornada do Candidato (pública)
 * Story 2.1: Public Application Form (Stepper)
 */
test.describe('Formulário de candidatura pública', () => {

  test('Rota /apply é pública — sem redirecionamento para login', async ({ page }) => {
    await page.goto('/apply');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveTitle('FracExec');
  });

  test('Candidato preenche e submete candidatura em 3 etapas', async ({ page }) => {
    await page.goto('/apply');
    await page.waitForLoadState('networkidle');
    // Aguardar Angular hidratar — o stepper precisa de mais tempo que o networkidle
    await page.waitForTimeout(2000);
    await page.waitForSelector('.apply-container, .stepper, h1', { timeout: 15000, state: 'visible' });

    await expect(page.locator('.apply-container').or(page.locator('.stepper')).first()).toBeVisible({ timeout: 15000 });

    // Etapa 1
    await page.locator('input[id="fullName"], input[type="text"]').first().fill('Carlos Lima');
    await page.locator('input[id="email"], input[type="email"]').first().fill(`carlos.e2e.${Date.now()}@test.com`);
    await page.locator('input[id="linkedinUrl"], input[type="url"]').first().fill('https://linkedin.com/in/carloslima');
    await page.getByRole('button', { name: /próxima etapa/i }).click();
    await page.waitForTimeout(500);

    // Etapa 2 — roleTitle
    const roleInput = page.locator('input[placeholder*="CFO"], input[placeholder*="cargo"]').first();
    if (await roleInput.isVisible()) await roleInput.fill('CTO');
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible()) await dateInput.fill('2019-01-01');
    await page.getByRole('button', { name: /próxima etapa/i }).click();
    await page.waitForTimeout(500);

    // Etapa 3 — referências
    const refInputs = page.locator('.reference-block input[type="text"]');
    const count = await refInputs.count();
    if (count >= 6) {
      await refInputs.nth(0).fill('Ana Oliveira');
      await refInputs.nth(1).fill('CEO');
      await refInputs.nth(2).fill('ana@empresa.com');
      await refInputs.nth(3).fill('Bruno Santos');
      await refInputs.nth(4).fill('CFO');
      await refInputs.nth(5).fill('bruno@empresa.com');
    }
    await page.locator('textarea[id="motivation"]').fill('Experiência de 20 anos em liderança tecnológica.');
    await page.locator('.lgpd-field input[type="checkbox"]').check();
    await page.getByRole('button', { name: /enviar candidatura/i }).click();

    await expect(page.locator('.confirmation-title').or(page.getByText('Candidatura recebida').first())).toBeVisible({ timeout: 15000 });
  });

  test('Formulário bloqueia avanço com LinkedIn inválido', async ({ page }) => {
    await page.goto('/apply');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.waitForSelector('input[type="text"]', { timeout: 15000, state: 'visible' });

    await page.locator('input[type="text"]').first().fill('Teste Bloqueio');
    await page.locator('input[type="email"]').first().fill('bloqueio@test.com');
    await page.locator('input[type="url"], input[id="linkedinUrl"]').first().fill('https://twitter.com/invalido');
    await page.getByRole('button', { name: /próxima etapa/i }).click();
    await page.waitForTimeout(500);

    // Permanece na etapa 1 — erro de URL (locator .error ou mensagem visível)
    await expect(page.locator('.error').first().or(page.getByText('inválido').first())).toBeVisible({ timeout: 10000 });
  });
});
