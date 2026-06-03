import { request } from '@playwright/test';

/**
 * Global setup: seed test data before E2E suite runs.
 * Creates users and applications needed across all test flows.
 */
async function globalSetup() {
  const api = await request.newContext({ baseURL: 'http://localhost:8080' });

  // Seed a fresh EXECUTIVE user for E2E tests
  const email = `e2e.executive.${Date.now()}@fracexec.com`;
  const password = 'E2E@Test2026!';

  const reg = await api.post('/api/v1/auth/register', {
    data: { email, password, role: 'EXECUTIVE' }
  });

  if (reg.ok()) {
    const { accessToken } = await reg.json();
    // Store credentials for tests to consume
    process.env.E2E_EXEC_EMAIL    = email;
    process.env.E2E_EXEC_PASSWORD = password;
    process.env.E2E_EXEC_TOKEN    = accessToken;
    console.log('[Global Setup] EXECUTIVE user created:', email);
  } else {
    console.warn('[Global Setup] Could not create EXECUTIVE user — tests may use existing data');
  }

  // ADMIN credentials (seeded by DataInitializer)
  process.env.E2E_ADMIN_EMAIL    = 'admin@fracexec.com';
  process.env.E2E_ADMIN_PASSWORD = 'Admin@FracExec2026!';

  await api.dispose();
}

export default globalSetup;
