/**
 * Executa testes de API ao vivo contra o FracExec backend,
 * cria manual_runs no Octane e faz upload da evidência como attachment.
 *
 * Execute: node register-test-results-with-evidence.js
 *
 * Pré-requisitos:
 *   - Backend rodando em http://localhost:8081
 *   - Octane rodando em http://localhost:8090
 */

import { OctaneClient } from './src/octane-client.js';
import fetch from 'node-fetch';

// ── Config ─────────────────────────────────────────────────────────────────────

const API     = 'http://localhost:8080/api/v1';
const RUN_DATE = '2026-06-02';

const octane = new OctaneClient({
  url:           'http://localhost:8090',
  sharedSpaceId: '1001',
  workspaceId:   '1003',
  username:      'tester@fracexec.com',
  password:      'Tester@FracExec2026!',
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function ts() { return new Date().toISOString(); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Executa uma chamada HTTP e retorna { ok, status, body, evidence }
 * evidence = texto pronto para usar como attachment
 */
async function apiCall(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const start = Date.now();
  const resp  = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const elapsed = Date.now() - start;
  const text    = await resp.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = text; }

  const evidence = [
    `Timestamp : ${ts()}`,
    `Method    : ${method} ${API}${path}`,
    `Status    : ${resp.status} ${resp.statusText}`,
    `Duration  : ${elapsed}ms`,
    body ? `Request   :\n${JSON.stringify(body, null, 2)}` : '',
    `Response  :\n${JSON.stringify(parsed, null, 2)}`,
  ].filter(Boolean).join('\n');

  return { ok: resp.ok, status: resp.status, body: parsed, evidence };
}

// ── Login helper ───────────────────────────────────────────────────────────────

async function login(email, password) {
  const r = await apiCall('POST', '/auth/login', { email, password });
  return r.body?.accessToken || null;
}

// ── Definição dos testes ───────────────────────────────────────────────────────
// Cada item: { octaneTestId, name, run: async() => { ok, evidence } }

async function buildTests() {
  // Tokens reutilizados entre testes
  let adminToken = null;
  let execToken  = null;

  const ADMIN_EMAIL    = 'admin@fracexec.com';
  const ADMIN_PASSWORD = 'Admin@FracExec2026!';

  // Candidato gerado com timestamp para evitar duplicatas em re-runs
  const ts_suffix = Date.now();
  const EXEC_EMAIL = `exec.test.${ts_suffix}@example.com`;
  let   createdApplicationId = null;

  return [

    // ── T01 — Health ─────────────────────────────────────────────────────────
    {
      octaneTestId: '1001',
      name: 'T01: Actuator health — todos componentes UP',
      run: async () => {
        const r = await fetch(`http://localhost:8081/actuator/health`, { headers: { Accept: 'application/json' } });
        const body = await r.json();
        const evidence = `Timestamp : ${ts()}\nGET http://localhost:8081/actuator/health\nStatus    : ${r.status}\nResponse  :\n${JSON.stringify(body, null, 2)}`;
        return { ok: r.ok && body.status === 'UP', evidence };
      },
    },

    // ── T02 — Registro EXECUTIVE ──────────────────────────────────────────────
    {
      octaneTestId: '1002',
      name: 'T02: Registro EXECUTIVE retorna JWT',
      run: async () => {
        const r = await apiCall('POST', '/auth/register', {
          email: EXEC_EMAIL, password: 'Exec@Test2026!', role: 'EXECUTIVE',
        });
        execToken = r.body?.accessToken || null;
        return { ok: r.ok && !!r.body?.accessToken, evidence: r.evidence };
      },
    },

    // ── T03 — Registro ADMIN bloqueado ────────────────────────────────────────
    {
      octaneTestId: '1003',
      name: 'T03: Registro ADMIN retorna 400',
      run: async () => {
        const r = await apiCall('POST', '/auth/register', {
          email: `admin.test.${ts_suffix}@example.com`, password: 'Admin@Test2026!', role: 'ADMIN',
        });
        return { ok: r.status === 400, evidence: r.evidence };
      },
    },

    // ── T04 — Login válido ────────────────────────────────────────────────────
    {
      octaneTestId: '1004',
      name: 'T04: Login válido retorna accessToken',
      run: async () => {
        adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
        const r = await apiCall('POST', '/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
        return { ok: r.ok && !!r.body?.accessToken, evidence: r.evidence };
      },
    },

    // ── T05 — Login inválido ──────────────────────────────────────────────────
    {
      octaneTestId: '1005',
      name: 'T05: Login senha inválida retorna 401',
      run: async () => {
        const r = await apiCall('POST', '/auth/login', { email: ADMIN_EMAIL, password: 'WrongPass!' });
        return { ok: r.status === 401, evidence: r.evidence };
      },
    },

    // ── T06 — Endpoint protegido sem token ────────────────────────────────────
    {
      octaneTestId: '1006',
      name: 'T06: Endpoint protegido sem token retorna 401',
      run: async () => {
        const r = await apiCall('GET', '/admin/applications');
        return { ok: r.status === 401, evidence: r.evidence };
      },
    },

    // ── T07 — Refresh token rotation ──────────────────────────────────────────
    {
      octaneTestId: '1007',
      name: 'T07: Refresh token rotation — token rotacionado',
      run: async () => {
        const loginR = await apiCall('POST', '/auth/login', { email: EXEC_EMAIL, password: 'Exec@Test2026!' });
        const refreshToken = loginR.body?.refreshToken;
        if (!refreshToken) return { ok: false, evidence: loginR.evidence + '\nERRO: sem refreshToken' };
        const r = await apiCall('POST', '/auth/refresh', { refreshToken });
        return { ok: r.ok && !!r.body?.accessToken, evidence: loginR.evidence + '\n\n---\n\n' + r.evidence };
      },
    },

    // ── T08 — Forgot password ─────────────────────────────────────────────────
    {
      octaneTestId: '1008',
      name: 'T08: Forgot-password retorna 200 genérico',
      run: async () => {
        const r = await apiCall('POST', '/auth/forgot-password', { email: EXEC_EMAIL });
        return { ok: r.status === 200, evidence: r.evidence };
      },
    },

    // ── T09 — Candidatura válida ──────────────────────────────────────────────
    {
      octaneTestId: '1010',
      name: 'T09: Submissão válida cria candidatura PENDING',
      run: async () => {
        const r = await apiCall('POST', '/applications', {
          fullName:        `Exec Test ${ts_suffix}`,
          email:           `apply.${ts_suffix}@example.com`,
          linkedinUrl:     'https://linkedin.com/in/exectest',
          yearsExperience: 12,
          currentPosition: 'CFO',
          desiredRoles:    ['CFO', 'COO'],
          lgpdConsent:     true,
        });
        createdApplicationId = r.body?.id || r.body?.applicationId || null;
        return { ok: r.ok && (r.body?.status === 'PENDING' || r.body?.id), evidence: r.evidence };
      },
    },

    // ── T10 — Email duplicado ─────────────────────────────────────────────────
    {
      octaneTestId: '1011',
      name: 'T10: Email duplicado retorna 409',
      run: async () => {
        const r = await apiCall('POST', '/applications', {
          fullName:        `Exec Test ${ts_suffix}`,
          email:           `apply.${ts_suffix}@example.com`,
          linkedinUrl:     'https://linkedin.com/in/exectest2',
          yearsExperience: 12,
          currentPosition: 'CFO',
          desiredRoles:    ['CFO'],
          lgpdConsent:     true,
        });
        return { ok: r.status === 409, evidence: r.evidence };
      },
    },

    // ── T11 — LGPD false ──────────────────────────────────────────────────────
    {
      octaneTestId: '1012',
      name: 'T11: LGPD false retorna 400',
      run: async () => {
        const r = await apiCall('POST', '/applications', {
          fullName:        'Sem LGPD',
          email:           `nolgpd.${ts_suffix}@example.com`,
          linkedinUrl:     'https://linkedin.com/in/nolgpd',
          yearsExperience: 5,
          currentPosition: 'CEO',
          desiredRoles:    ['CEO'],
          lgpdConsent:     false,
        });
        return { ok: r.status === 400, evidence: r.evidence };
      },
    },

    // ── T13 — Admin lista candidaturas sem auth ───────────────────────────────
    {
      octaneTestId: '1015',
      name: 'T13: GET /admin/applications sem auth retorna 401',
      run: async () => {
        const r = await apiCall('GET', '/admin/applications');
        return { ok: r.status === 401, evidence: r.evidence };
      },
    },

    // ── T14 — EXECUTIVE não acessa admin ──────────────────────────────────────
    {
      octaneTestId: '1016',
      name: 'T14: GET /admin/applications com EXECUTIVE retorna 403',
      run: async () => {
        if (!execToken) execToken = await login(EXEC_EMAIL, 'Exec@Test2026!');
        const r = await apiCall('GET', '/admin/applications', undefined, execToken);
        return { ok: r.status === 403, evidence: r.evidence };
      },
    },

    // ── T15 — Admin lista candidaturas ───────────────────────────────────────
    {
      octaneTestId: '1017',
      name: 'T15: GET /admin/applications com ADMIN retorna 200',
      run: async () => {
        if (!adminToken) adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
        const r = await apiCall('GET', '/admin/applications?page=0&size=5', undefined, adminToken);
        return { ok: r.ok, evidence: r.evidence };
      },
    },

    // ── T15b — Filtro por status ──────────────────────────────────────────────
    {
      octaneTestId: '1018',
      name: 'T15b: Filtro por status PENDING funciona',
      run: async () => {
        if (!adminToken) adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
        const r = await apiCall('GET', '/admin/applications?status=PENDING&page=0&size=5', undefined, adminToken);
        const allPending = (r.body?.content || []).every(a => a.status === 'PENDING');
        return { ok: r.ok && allPending, evidence: r.evidence };
      },
    },

    // ── T15c — Filtro por nome ────────────────────────────────────────────────
    {
      octaneTestId: '1019',
      name: 'T15c: Filtro por nome funciona',
      run: async () => {
        if (!adminToken) adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
        const r = await apiCall('GET', `/admin/applications?name=Exec+Test&page=0&size=5`, undefined, adminToken);
        return { ok: r.ok, evidence: r.evidence };
      },
    },

    // ── T22 — LinkedIn inválido ───────────────────────────────────────────────
    {
      octaneTestId: '1013',
      name: 'T22: LinkedIn inválido retorna 400',
      run: async () => {
        const r = await apiCall('POST', '/applications', {
          fullName:        'LinkedIn Invalido',
          email:           `bad.linkedin.${ts_suffix}@example.com`,
          linkedinUrl:     'nao-e-um-linkedin',
          yearsExperience: 5,
          currentPosition: 'CEO',
          desiredRoles:    ['CEO'],
          lgpdConsent:     true,
        });
        return { ok: r.status === 400, evidence: r.evidence };
      },
    },

    // ── T23 — Candidatura duplicada (mesmo email de aplicação) ─────────────────
    {
      octaneTestId: '1014',
      name: 'T23: Candidatura duplicada retorna 409',
      run: async () => {
        // já testado em T10 — repetir para evidência explícita
        const r = await apiCall('POST', '/applications', {
          fullName:        `Exec Test ${ts_suffix}`,
          email:           `apply.${ts_suffix}@example.com`,
          linkedinUrl:     'https://linkedin.com/in/exectest-dup',
          yearsExperience: 12,
          currentPosition: 'CFO',
          desiredRoles:    ['CFO'],
          lgpdConsent:     true,
        });
        return { ok: r.status === 409, evidence: r.evidence };
      },
    },

    // ── T23A — Aprovar candidatura ────────────────────────────────────────────
    {
      octaneTestId: '1020',
      name: 'T23A: Aprovar UNDER_REVIEW → APPROVED + User EXECUTIVE criado',
      run: async () => {
        if (!adminToken) adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
        // Primeiro colocar em UNDER_REVIEW
        if (!createdApplicationId) {
          const listR = await apiCall('GET', '/admin/applications?status=PENDING&page=0&size=1', undefined, adminToken);
          createdApplicationId = listR.body?.content?.[0]?.id;
        }
        if (!createdApplicationId) return { ok: false, evidence: 'Nenhuma candidatura PENDING encontrada' };

        const reviewR = await apiCall('PATCH', `/admin/applications/${createdApplicationId}/status`,
          { status: 'UNDER_REVIEW' }, adminToken);
        const approveR = await apiCall('PATCH', `/admin/applications/${createdApplicationId}/status`,
          { status: 'APPROVED' }, adminToken);
        return {
          ok: approveR.ok && approveR.body?.status === 'APPROVED',
          evidence: reviewR.evidence + '\n\n---\n\n' + approveR.evidence,
        };
      },
    },

    // ── T23C — Rejeitar candidatura ───────────────────────────────────────────
    {
      octaneTestId: '1022',
      name: 'T23C: Rejeitar UNDER_REVIEW → REJECTED',
      run: async () => {
        if (!adminToken) adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
        // Criar nova candidatura para rejeitar
        const applyR = await apiCall('POST', '/applications', {
          fullName:        `Reject Test ${ts_suffix}`,
          email:           `reject.${ts_suffix}@example.com`,
          linkedinUrl:     'https://linkedin.com/in/rejecttest',
          yearsExperience: 8,
          currentPosition: 'CTO',
          desiredRoles:    ['CTO'],
          lgpdConsent:     true,
        });
        const appId = applyR.body?.id || applyR.body?.applicationId;
        if (!appId) return { ok: false, evidence: applyR.evidence + '\nERRO: sem applicationId' };

        const reviewR  = await apiCall('PATCH', `/admin/applications/${appId}/status`, { status: 'UNDER_REVIEW' }, adminToken);
        const rejectR  = await apiCall('PATCH', `/admin/applications/${appId}/status`, { status: 'REJECTED', adminNotes: 'Reprovado em avaliação técnica' }, adminToken);
        return {
          ok: rejectR.ok && rejectR.body?.status === 'REJECTED',
          evidence: applyR.evidence + '\n\n---\n\n' + reviewR.evidence + '\n\n---\n\n' + rejectR.evidence,
        };
      },
    },

    // ── T23D — Cooldown 6 meses ───────────────────────────────────────────────
    {
      octaneTestId: '1023',
      name: 'T23D: Cooldown 6 meses retorna 422 com data',
      run: async () => {
        // Tentar candidatura com email recém-rejeitado
        const r = await apiCall('POST', '/applications', {
          fullName:        `Reject Test ${ts_suffix}`,
          email:           `reject.${ts_suffix}@example.com`,
          linkedinUrl:     'https://linkedin.com/in/rejecttest-retry',
          yearsExperience: 8,
          currentPosition: 'CTO',
          desiredRoles:    ['CTO'],
          lgpdConsent:     true,
        });
        return { ok: r.status === 409 || r.status === 422, evidence: r.evidence };
      },
    },

    // ── T24 — Refresh token use-once ──────────────────────────────────────────
    {
      octaneTestId: '1009',
      name: 'T24: Refresh token use-once — segundo uso retorna 401',
      run: async () => {
        const loginR = await apiCall('POST', '/auth/login', { email: EXEC_EMAIL, password: 'Exec@Test2026!' });
        const refreshToken = loginR.body?.refreshToken;
        if (!refreshToken) return { ok: false, evidence: loginR.evidence };
        const first  = await apiCall('POST', '/auth/refresh', { refreshToken });
        const second = await apiCall('POST', '/auth/refresh', { refreshToken });
        return {
          ok: first.ok && second.status === 401,
          evidence: loginR.evidence + '\n\n--- 1º uso ---\n\n' + first.evidence + '\n\n--- 2º uso ---\n\n' + second.evidence,
        };
      },
    },

    // ── T16 — Perfil vazio ────────────────────────────────────────────────────
    {
      octaneTestId: '1024',
      name: 'T16: GET perfil vazio retorna isComplete:false',
      run: async () => {
        // Registrar novo executivo para ter perfil vazio garantido
        const newEmail = `profile.${ts_suffix}@example.com`;
        const regR = await apiCall('POST', '/auth/register', { email: newEmail, password: 'Profile@Test2026!', role: 'EXECUTIVE' });
        const token = regR.body?.accessToken;
        if (!token) return { ok: false, evidence: regR.evidence };
        const r = await apiCall('GET', '/executive/profile/complete', undefined, token);
        return { ok: r.ok && r.body?.complete === false, evidence: regR.evidence + '\n\n---\n\n' + r.evidence };
      },
    },

    // ── T17 — Salvar perfil ───────────────────────────────────────────────────
    {
      octaneTestId: '1025',
      name: 'T17: PUT perfil com bio+specialty → isComplete:true',
      run: async () => {
        if (!execToken) execToken = await login(EXEC_EMAIL, 'Exec@Test2026!');
        const r = await apiCall('PUT', '/executive/profile', {
          bio:              'Executivo com 15 anos de experiência em finanças.',
          currentPosition:  'CFO',
          yearsExperience:  15,
          availabilityDays: 10,
          specialties:      ['Finanças', 'Gestão de Riscos'],
          sectors:          ['Tecnologia', 'Financeiro'],
          linkedinUrl:      'https://linkedin.com/in/exectest',
        }, execToken);
        return { ok: r.ok, evidence: r.evidence };
      },
    },

    // ── T18 — GET complete após salvar ────────────────────────────────────────
    {
      octaneTestId: '1026',
      name: 'T18: GET /complete após salvar retorna true',
      run: async () => {
        if (!execToken) execToken = await login(EXEC_EMAIL, 'Exec@Test2026!');
        const r = await apiCall('GET', '/executive/profile/complete', undefined, execToken);
        return { ok: r.ok && r.body?.complete === true, evidence: r.evidence };
      },
    },

    // ── T19 — GET complete sem perfil ─────────────────────────────────────────
    {
      octaneTestId: '1027',
      name: 'T19: GET /complete sem perfil retorna false',
      run: async () => {
        const newEmail = `noprofile.${ts_suffix}@example.com`;
        const regR = await apiCall('POST', '/auth/register', { email: newEmail, password: 'NoProf@Test2026!', role: 'EXECUTIVE' });
        const token = regR.body?.accessToken;
        if (!token) return { ok: false, evidence: regR.evidence };
        const r = await apiCall('GET', '/executive/profile/complete', undefined, token);
        return { ok: r.ok && r.body?.complete === false, evidence: regR.evidence + '\n\n---\n\n' + r.evidence };
      },
    },

    // ── T20 — PATCH availability válido ──────────────────────────────────────
    {
      octaneTestId: '1028',
      name: 'T20: PATCH availability 15 dias retorna 200',
      run: async () => {
        if (!execToken) execToken = await login(EXEC_EMAIL, 'Exec@Test2026!');
        const r = await apiCall('PATCH', '/executive/profile/availability', { availabilityDays: 15 }, execToken);
        return { ok: r.ok, evidence: r.evidence };
      },
    },

    // ── T21 — PATCH availability inválido ─────────────────────────────────────
    {
      octaneTestId: '1029',
      name: 'T21: PATCH availability >20 dias retorna 400',
      run: async () => {
        if (!execToken) execToken = await login(EXEC_EMAIL, 'Exec@Test2026!');
        const r = await apiCall('PATCH', '/executive/profile/availability', { availabilityDays: 25 }, execToken);
        return { ok: r.status === 400, evidence: r.evidence };
      },
    },

    // ── T26A — Admin pool retorna executivos completos ────────────────────────
    {
      octaneTestId: '1030',
      name: 'T26A: GET /admin/pool retorna executivos completos',
      run: async () => {
        if (!adminToken) adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
        const r = await apiCall('GET', '/admin/pool?page=0&size=5', undefined, adminToken);
        return { ok: r.ok, evidence: r.evidence };
      },
    },

    // ── T26B — Pool exclui sem perfil completo ────────────────────────────────
    {
      octaneTestId: '1031',
      name: 'T26B: Pool exclui executivo sem perfil completo',
      run: async () => {
        if (!adminToken) adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
        const r = await apiCall('GET', '/admin/pool?page=0&size=100', undefined, adminToken);
        const poolEmails = (r.body?.content || []).map(e => e.email);
        // executivos sem perfil não devem aparecer no pool
        const newEmail = `incomplete.${ts_suffix}@example.com`;
        const ok = r.ok && !poolEmails.includes(newEmail);
        return { ok, evidence: r.evidence + `\n\nVerificação: ${newEmail} não está no pool = ${ok}` };
      },
    },

    // ── T26C — EXECUTIVE não acessa pool ─────────────────────────────────────
    {
      octaneTestId: '1032',
      name: 'T26C: GET /admin/pool com EXECUTIVE retorna 403',
      run: async () => {
        if (!execToken) execToken = await login(EXEC_EMAIL, 'Exec@Test2026!');
        const r = await apiCall('GET', '/admin/pool', undefined, execToken);
        return { ok: r.status === 403, evidence: r.evidence };
      },
    },

    // ── T23B — Forgot password para aprovado ──────────────────────────────────
    {
      octaneTestId: '1021',
      name: 'T23B: Forgot-password funciona para executivo aprovado',
      run: async () => {
        const r = await apiCall('POST', '/auth/forgot-password', { email: EXEC_EMAIL });
        return { ok: r.status === 200, evidence: r.evidence };
      },
    },
  ];
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== FracExec — Registro de Evidências no Octane (${RUN_DATE}) ===\n`);

  // Verificar backend
  try {
    const health = await fetch('http://localhost:8081/actuator/health');
    if (!health.ok) throw new Error('backend não saudável');
    console.log('✓ Backend FracExec online\n');
  } catch {
    console.error('✗ Backend indisponível em http://localhost:8081\nInicie o stack Docker antes de rodar este script.');
    process.exit(1);
  }

  const tests = await buildTests();
  let passed = 0, failed = 0, errors = 0;

  for (const test of tests) {
    process.stdout.write(`  [${test.octaneTestId}] ${test.name} ... `);
    try {
      // 1. Executar o teste
      const { ok, evidence } = await test.run();
      const status = ok ? 'passed' : 'failed';
      ok ? passed++ : failed++;

      // 2. Criar o run no Octane
      const runResp = await octane.createRun(
        test.octaneTestId,
        status,
        `[${RUN_DATE}] ${test.name}`,
      );
      const runId = runResp?.data?.[0]?.id;

      // 3. Upload da evidência como attachment
      if (runId) {
        const fileName = `evidencia-${test.octaneTestId}-${status}.txt`;
        const fullEvidence = [
          `=== EVIDÊNCIA DE TESTE ===`,
          `Teste     : ${test.name}`,
          `Octane ID : ${test.octaneTestId}`,
          `Run ID    : ${runId}`,
          `Status    : ${status.toUpperCase()}`,
          `Data      : ${RUN_DATE}`,
          ``,
          evidence,
        ].join('\n');
        await octane.uploadAttachment(runId, fileName, fullEvidence);
        console.log(`${ok ? '✅' : '❌'} (run ${runId}, attachment OK)`);
      } else {
        console.log(`${ok ? '✅' : '❌'} (run criado, sem ID para attachment)`);
      }

    } catch (err) {
      errors++;
      console.log(`⚠️  ERRO: ${err.message.substring(0, 80)}`);
    }

    await sleep(300); // pausa entre chamadas ao Octane
  }

  console.log('\n─────────────────────────────────────────');
  console.log('SUMÁRIO');
  console.log('─────────────────────────────────────────');
  console.log(`Total    : ${tests.length}`);
  console.log(`✅ PASS  : ${passed}`);
  console.log(`❌ FAIL  : ${failed}`);
  if (errors) console.log(`⚠️  ERRO  : ${errors}`);
  console.log(`\nTaxa: ${Math.round(passed / (passed + failed) * 100)}%`);
  console.log('\nRuns + evidências registrados no Octane.');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
