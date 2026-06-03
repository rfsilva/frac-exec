import { test, expect } from '@playwright/test';

/**
 * E2E — Story 2.5: Seal Banner & Availability Management
 * Cria um executivo com perfil completo via API antes de testar a UI do dashboard
 */
async function setupCompleteExecAndLogin(page: any, request: any) {
  const email = `avail.e2e.${Date.now()}@test.com`;
  // Registrar
  await request.post('http://localhost:8080/api/v1/auth/register', {
    data: { email, password: 'Avail@2026!', role: 'EXECUTIVE' }
  });
  // Login via API para obter token
  const res = await request.post('http://localhost:8080/api/v1/auth/login', {
    data: { email, password: 'Avail@2026!' }
  });
  const { accessToken } = await res.json();
  // Salvar perfil completo via API (bio + specialty)
  await request.put('http://localhost:8080/api/v1/executive/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { bio: 'Bio completa para E2E.', specialties: ['CFO'], sectors: ['Tecnologia'], companyVisibility: {} }
  });
  // Definir disponibilidade para ter algo no widget
  await request.patch('http://localhost:8080/api/v1/executive/profile/availability', {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { availabilityDaysPerMonth: 20, profileStatus: 'ACTIVE' }
  });

  // Login na UI
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill('Avail@2026!');
  await page.getByRole('button', { name: /entrar/i }).click();
  // Com perfil completo, vai direto para /executive/dashboard
  await expect(page).toHaveURL(/\/executive\/dashboard/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
}

test.describe('Widget e Drawer de Disponibilidade', () => {

  test('Dashboard exibe widget de disponibilidade', async ({ page, request }) => {
    await setupCompleteExecAndLogin(page, request);
    await expect(page.locator('.widget-card, text=Disponibilidade')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.progress-bar, .progress-fill')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.btn-edit, button:has-text("Editar")')).toBeVisible({ timeout: 5000 });
  });

  test('Botão Editar abre drawer lateral', async ({ page, request }) => {
    await setupCompleteExecAndLogin(page, request);
    await page.locator('.btn-edit, button:has-text("Editar")').first().click();
    await expect(page.locator('.drawer, [role="dialog"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="number"]')).toBeVisible();
  });

  test('Salvar no drawer atualiza widget', async ({ page, request }) => {
    await setupCompleteExecAndLogin(page, request);
    await page.locator('.btn-edit, button:has-text("Editar")').first().click();
    const drawer = page.locator('.drawer, [role="dialog"]');
    await expect(drawer).toBeVisible({ timeout: 5000 });

    await drawer.locator('input[type="number"]').clear();
    await drawer.locator('input[type="number"]').fill('12');
    await drawer.locator('button:has-text("Salvar")').click();

    await expect(drawer).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('.saved-msg, text=Disponibilidade atualizada')).toBeVisible({ timeout: 5000 });
  });

  test('ESC com alterações não salvas mostra confirmação', async ({ page, request }) => {
    await setupCompleteExecAndLogin(page, request);
    await page.locator('.btn-edit, button:has-text("Editar")').first().click();
    const drawer = page.locator('.drawer, [role="dialog"]');
    await expect(drawer).toBeVisible({ timeout: 5000 });

    await drawer.locator('input[type="number"]').fill('5');
    await page.keyboard.press('Escape');
    await expect(page.locator('.confirm-box, text=Descartar')).toBeVisible({ timeout: 3000 });
    await page.locator('button:has-text("Continuar editando")').click();
    await expect(drawer).toBeVisible();
  });

  test('Backdrop click com alterações mostra confirmação', async ({ page, request }) => {
    await setupCompleteExecAndLogin(page, request);
    await page.locator('.btn-edit, button:has-text("Editar")').first().click();
    const drawer = page.locator('.drawer, [role="dialog"]');
    await expect(drawer).toBeVisible({ timeout: 5000 });

    await drawer.locator('input[type="number"]').fill('3');
    await page.locator('.drawer-backdrop').click();
    await expect(page.locator('.confirm-box, text=Descartar')).toBeVisible({ timeout: 3000 });
    await page.locator('button:has-text("Descartar")').click();
    await expect(drawer).not.toBeVisible({ timeout: 3000 });
  });
});
