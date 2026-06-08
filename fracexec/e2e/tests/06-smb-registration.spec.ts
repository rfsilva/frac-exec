import { test, expect } from '@playwright/test';

/**
 * E2E — Cadastro de PME (pública)
 * Story 3.1: SMB Registration Form
 *
 * Octane test IDs: 1060–1065
 */

// Gera CNPJ válido único a partir de um seed numérico (últimos 10 dígitos do timestamp)
function generateCnpj(seed: number): string {
  // Usa seed para os 8 primeiros dígitos + 0001 para filial
  const base = String(seed).padStart(8, '1').slice(-8) + '0001';
  const d = base.split('').map(Number);
  d.push(0, 0);
  const dv = (w: number[]) => {
    const s = w.reduce((acc, v, i) => acc + d[i] * v, 0);
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  d[12] = dv([5,4,3,2,9,8,7,6,5,4,3,2]);
  d[13] = dv([6,5,4,3,2,9,8,7,6,5,4,3,2]);
  const n = d.join('');
  return `${n.slice(0,2)}.${n.slice(2,5)}.${n.slice(5,8)}/${n.slice(8,12)}-${n.slice(12)}`;
}

// CNPJ fixo e válido para o teste de máscara (T02) — não faz submit
const CNPJ_MASK_TEST = '11.222.333/0001-81';

async function fillRegistrationForm(page: any, opts: {
  cnpj: string;  // obrigatório — sempre gerar único via generateCnpj()
  email?: string;
  sector?: string;
  ts?: number;
}) {
  const ts = opts.ts ?? Date.now();
  await page.locator('#legalName').fill('Empresa Teste E2E LTDA');
  const cnpjInput = page.locator('#cnpj');
  await cnpjInput.click();
  await cnpjInput.fill(opts.cnpj);
  await page.locator('#sector').fill(opts.sector ?? 'Tecnologia');
  await page.locator('#employeeRange').selectOption('E_11_50');
  await page.locator('#annualRevenueRange').selectOption('R_1M_5M');
  await page.locator('#responsibleName').fill('João Silva');
  await page.locator('#responsibleEmail').fill(opts.email ?? `pme.e2e.${ts}@test.com`);
}

test.describe('Cadastro de PME — Story 3.1', () => {

  // E2E-3.1-01
  test('Rota /register é pública — formulário visível sem login', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);
    // Usar seletor específico para evitar strict mode com múltiplos h1
    await expect(page.locator('.register-title')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#legalName')).toBeVisible();
    await expect(page.locator('#cnpj')).toBeVisible();
    await expect(page.locator('#responsibleEmail')).toBeVisible();
  });

  // E2E-3.1-02
  test('Máscara CNPJ aplicada automaticamente ao digitar', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#cnpj', { timeout: 10000, state: 'visible' });

    const cnpjInput = page.locator('#cnpj');
    await cnpjInput.click();
    // Digita apenas dígitos — máscara deve ser aplicada
    await cnpjInput.pressSequentially('11222333000181');
    await page.waitForTimeout(300);
    const value = await cnpjInput.inputValue();
    expect(value).toBe(CNPJ_MASK_TEST);
  });

  // E2E-3.1-03
  test('CNPJ inválido exibe erro inline', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    // Aguardar hidratação Angular antes de interagir
    await page.waitForSelector('#legalName', { timeout: 10000, state: 'visible' });
    await page.waitForFunction(() => document.querySelector('#cnpj') !== null);

    // CNPJ inválido: formato correto mas dígito verificador errado (não faz submit com sucesso)
    await fillRegistrationForm(page, { cnpj: '11.222.333/0001-00', ts: Date.now() }); // dígito errado
    // Tocar no campo CNPJ e fazer blur — Angular exibe erro após `touched`
    await page.locator('#cnpj').focus();
    await page.keyboard.press('Tab'); // move foco para próximo campo, disparando blur
    await page.waitForTimeout(500);

    const errorLocator = page.locator('.error').filter({ hasText: /cnpj inválido/i });
    await expect(errorLocator).toBeVisible({ timeout: 8000 });
  });

  // E2E-3.1-04
  test('Formulário válido exibe tela de confirmação', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#legalName', { timeout: 10000, state: 'visible' });

    // Usa e-mail e CNPJ únicos por execução
    const ts = Date.now();
    await fillRegistrationForm(page, {
      email: `pme.t04.${ts}@test.com`,
      cnpj: generateCnpj(ts),
    });
    await page.getByRole('button', { name: /solicitar acesso/i }).click();

    // Aguardar tela de confirmação
    await expect(page.locator('.success-title').filter({ hasText: /cadastro recebido/i }))
      .toBeVisible({ timeout: 12000 });
  });

  // E2E-3.1-05
  test('E-mail duplicado exibe erro inline no campo', async ({ page }) => {
    // Registrar uma primeira vez
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#legalName', { timeout: 10000, state: 'visible' });

    const ts = Date.now();
    const sharedEmail = `pme.dup.${ts}@test.com`;
    // CNPJs únicos por execução para evitar colisão com outras rodadas
    await fillRegistrationForm(page, { email: sharedEmail, cnpj: generateCnpj(ts) });
    await page.getByRole('button', { name: /solicitar acesso/i }).click();
    await expect(page.locator('.success-title').filter({ hasText: /cadastro recebido/i }))
      .toBeVisible({ timeout: 12000 });

    // Segunda tentativa com mesmo e-mail (CNPJ_A — diferente do primeiro)
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#legalName', { timeout: 10000, state: 'visible' });

    await fillRegistrationForm(page, { email: sharedEmail, cnpj: generateCnpj(ts + 1) });
    await page.getByRole('button', { name: /solicitar acesso/i }).click();
    await page.waitForTimeout(1000);

    const emailError = page.locator('.error').filter({ hasText: /e-mail já possui cadastro/i });
    await expect(emailError).toBeVisible({ timeout: 5000 });
  });

  // E2E-3.1-06
  test('Link "Cadastre-se aqui" na página de login navega para /register', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('a[href="/register"]', { timeout: 8000 });

    const link = page.locator('a[href="/register"]');
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForURL(/\/register/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/register/);
  });

});
