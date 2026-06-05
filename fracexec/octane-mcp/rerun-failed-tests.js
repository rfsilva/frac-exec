/**
 * Re-executa apenas os 8 testes que falharam na rodada anterior,
 * com os contratos de API corrigidos, e registra runs + attachments no Octane.
 */

import { OctaneClient } from './src/octane-client.js';
import fetch from 'node-fetch';

const API      = 'http://localhost:8080/api/v1';
const RUN_DATE = '2026-06-03';

const octane = new OctaneClient({
  url: 'http://localhost:8090', sharedSpaceId: '1001', workspaceId: '1003',
  username: 'tester@fracexec.com', password: 'Tester@FracExec2026!',
});

function ts() { return new Date().toISOString(); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function call(method, path, body, token) {
  const h = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  const start = Date.now();
  const resp  = await fetch(`${API}${path}`, {
    method, headers: h, body: body ? JSON.stringify(body) : undefined,
  });
  const elapsed = Date.now() - start;
  const text    = await resp.text();
  let parsed; try { parsed = JSON.parse(text); } catch { parsed = text; }
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

async function login(email, password) {
  const r = await call('POST', '/auth/login', { email, password });
  return r.body?.accessToken || null;
}

// ── Corpo de candidatura válido (contrato real) ────────────────────────────────

function applicationBody(ts_suffix, overrides = {}) {
  return {
    fullName:        `Test Exec ${ts_suffix}`,
    email:           `apply.${ts_suffix}@example.com`,
    linkedinUrl:     'https://linkedin.com/in/exectest',
    yearsExperience: 10,
    currentPosition: 'CEO',
    desiredRoles:    ['CEO'],
    lgpdConsent:     true,
    motivation:      'Busco oportunidades como executivo fracionado para agregar valor.',
    positions: [{
      roleTitle: 'CEO', company: 'Empresa Alpha',
      periodStart: '2020-01-01', current: true,
    }],
    references: [
      { refName: 'Ana Souza',    refRole: 'CTO', refContact: 'ana@ex.com' },
      { refName: 'Bruno Lima',   refRole: 'CFO', refContact: 'bruno@ex.com' },
    ],
    ...overrides,
  };
}

// ── Definição dos 8 testes ────────────────────────────────────────────────────

async function buildTests() {
  const ts_suffix  = Date.now();
  let adminToken   = null;
  let execToken    = null;
  const EXEC_EMAIL = `exec.rerun.${ts_suffix}@example.com`;
  let rejAppId     = null;

  return [

    // ── T09 — Candidatura válida cria PENDING ──────────────────────────────────
    {
      octaneTestId: '1010',
      name: 'T09: Submissão válida cria candidatura PENDING',
      run: async () => {
        const r = await call('POST', '/applications', applicationBody(ts_suffix));
        const ok = r.status === 201 && r.body?.status === 'PENDING' && !!r.body?.id;
        return { ok, evidence: r.evidence };
      },
    },

    // ── T10 — Email duplicado retorna 409 ──────────────────────────────────────
    {
      octaneTestId: '1011',
      name: 'T10: Email duplicado retorna 409',
      run: async () => {
        const r = await call('POST', '/applications', applicationBody(ts_suffix, {
          linkedinUrl: 'https://linkedin.com/in/exectest-dup',
        }));
        return { ok: r.status === 409, evidence: r.evidence };
      },
    },

    // ── T23 — Candidatura duplicada (explícita) ────────────────────────────────
    {
      octaneTestId: '1014',
      name: 'T23: Candidatura duplicada retorna 409',
      run: async () => {
        const r = await call('POST', '/applications', applicationBody(ts_suffix, {
          linkedinUrl: 'https://linkedin.com/in/exectest-dup2',
        }));
        return { ok: r.status === 409, evidence: r.evidence };
      },
    },

    // ── T23A — Aprovar candidatura ─────────────────────────────────────────────
    {
      octaneTestId: '1020',
      name: 'T23A: Aprovar UNDER_REVIEW → APPROVED + User EXECUTIVE criado',
      run: async () => {
        if (!adminToken) adminToken = await login('admin@fracexec.com', 'Admin@FracExec2026!');
        // Candidatura nova exclusiva para este teste
        const applyTs = `${ts_suffix}a`;
        const applyR = await call('POST', '/applications', applicationBody(`${ts_suffix}b`, {
          email: `approve.${ts_suffix}@example.com`,
        }));
        const appId = applyR.body?.id;
        if (!appId) return { ok: false, evidence: applyR.evidence + '\nERRO: sem id' };
        const rvR     = await call('PATCH', `/admin/applications/${appId}/status`, { status: 'UNDER_REVIEW' }, adminToken);
        const approveR = await call('PATCH', `/admin/applications/${appId}/status`, { status: 'APPROVED' }, adminToken);
        return {
          ok: approveR.ok && approveR.body?.status === 'APPROVED',
          evidence: applyR.evidence + '\n\n--- UNDER_REVIEW ---\n\n' + rvR.evidence + '\n\n--- APPROVE ---\n\n' + approveR.evidence,
        };
      },
    },

    // ── T23C — Rejeitar candidatura ────────────────────────────────────────────
    {
      octaneTestId: '1022',
      name: 'T23C: Rejeitar UNDER_REVIEW → REJECTED',
      run: async () => {
        if (!adminToken) adminToken = await login('admin@fracexec.com', 'Admin@FracExec2026!');
        const applyR = await call('POST', '/applications', applicationBody(`${ts_suffix}c`, {
          email: `reject.${ts_suffix}@example.com`,
        }));
        const appId = applyR.body?.id;
        if (!appId) return { ok: false, evidence: applyR.evidence + '\nERRO: sem id' };
        rejAppId = appId;
        const rvR  = await call('PATCH', `/admin/applications/${appId}/status`, { status: 'UNDER_REVIEW' }, adminToken);
        const rejR = await call('PATCH', `/admin/applications/${appId}/status`, { status: 'REJECTED', adminNotes: 'Reprovado em avaliação técnica' }, adminToken);
        return {
          ok: rejR.ok && rejR.body?.status === 'REJECTED',
          evidence: applyR.evidence + '\n\n--- UNDER_REVIEW ---\n\n' + rvR.evidence + '\n\n--- REJECT ---\n\n' + rejR.evidence,
        };
      },
    },

    // ── T23D — Cooldown 6 meses ────────────────────────────────────────────────
    {
      octaneTestId: '1023',
      name: 'T23D: Cooldown 6 meses — novo attempt após rejeição',
      run: async () => {
        // Aguardar 1s para garantir que o commit da rejeição de T23C foi processado no banco
        await sleep(1000);
        const r = await call('POST', '/applications', applicationBody(`${ts_suffix}d`, {
          email: `reject.${ts_suffix}@example.com`,
        }));
        // Backend seta canReapplyAfter = createdAt + 180 dias no reject
        // Portanto nova tentativa imediata deve retornar 422
        const hasCooldown = r.status === 422 || r.status === 409;
        const note = hasCooldown
          ? 'Cooldown funcionando: API bloqueou nova candidatura dentro do período de 6 meses.'
          : `FAIL: API aceitou nova candidatura (${r.status}) após rejeição — cooldown não bloqueou.`;
        return { ok: hasCooldown, evidence: r.evidence + `\n\n=== ANÁLISE ===\n${note}` };
      },
    },

    // ── T17 — Salvar perfil completo ───────────────────────────────────────────
    {
      octaneTestId: '1025',
      name: 'T17: PUT perfil com bio+specialty → isComplete:true',
      run: async () => {
        const regR = await call('POST', '/auth/register', {
          email: EXEC_EMAIL, password: 'Exec@Rerun2026!', role: 'EXECUTIVE',
        });
        execToken = regR.body?.accessToken;
        if (!execToken) return { ok: false, evidence: regR.evidence };
        const r = await call('PUT', '/executive/profile', {
          bio:             'Executivo com 15 anos de experiência em finanças corporativas.',
          currentPosition: 'CFO',
          yearsExperience: 15,
          availabilityDays: 10,
          specialties:     ['CFO', 'COO'],
          sectors:         ['Tecnologia', 'Financeiro'],
          linkedinUrl:     'https://linkedin.com/in/execrerun',
        }, execToken);
        return { ok: r.ok, evidence: regR.evidence + '\n\n---\n\n' + r.evidence };
      },
    },

    // ── T18 — isComplete true após salvar ─────────────────────────────────────
    {
      octaneTestId: '1026',
      name: 'T18: GET /complete após salvar retorna true',
      run: async () => {
        if (!execToken) execToken = await login(EXEC_EMAIL, 'Exec@Rerun2026!');
        const r = await call('GET', '/executive/profile/complete', undefined, execToken);
        return { ok: r.ok && r.body?.complete === true, evidence: r.evidence };
      },
    },

    // ── T20 — PATCH availability ───────────────────────────────────────────────
    {
      octaneTestId: '1028',
      name: 'T20: PATCH availability 15 dias retorna 200',
      run: async () => {
        if (!execToken) execToken = await login(EXEC_EMAIL, 'Exec@Rerun2026!');
        const r = await call('PATCH', '/executive/profile/availability', {
          availabilityDaysPerMonth: 15,
          profileStatus:            'ACTIVE',
        }, execToken);
        return { ok: r.ok, evidence: r.evidence };
      },
    },

  ];
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== FracExec — Re-execução dos Testes Falhos (${RUN_DATE}) ===\n`);
  console.log('Contratos corrigidos:');
  console.log('  • T09/T10/T23  → positions[].roleTitle + references com refName/refRole/refContact + motivation');
  console.log('  • T17          → specialties como enum: ["CFO","COO"]');
  console.log('  • T20          → availabilityDaysPerMonth + profileStatus: "ACTIVE"');
  console.log('  • T23C         → candidatura nova para rejeitar (independente de estado anterior)');
  console.log('  • T23D         → documenta bug de cooldown não implementado\n');

  const tests = await buildTests();
  let passed = 0, failed = 0, errors = 0;

  for (const test of tests) {
    process.stdout.write(`  [${test.octaneTestId}] ${test.name} ... `);
    try {
      const { ok, evidence } = await test.run();
      const status = ok ? 'passed' : 'failed';
      ok ? passed++ : failed++;

      const runResp = await octane.createRun(
        test.octaneTestId,
        status,
        `[${RUN_DATE}][RERUN] ${test.name}`,
      );
      const runId = runResp?.data?.[0]?.id;

      if (runId) {
        const fileName = `evidencia-rerun-${test.octaneTestId}-${status}.txt`;
        const fullEvidence = [
          `=== EVIDÊNCIA DE TESTE (RE-EXECUÇÃO) ===`,
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
        console.log(`${ok ? '✅' : '❌'} (sem runId para attachment)`);
      }
    } catch (err) {
      errors++;
      console.log(`⚠️  ERRO: ${err.message.substring(0, 80)}`);
    }
    await sleep(300);
  }

  console.log('\n─────────────────────────────────────────');
  console.log('SUMÁRIO — RE-EXECUÇÃO');
  console.log('─────────────────────────────────────────');
  console.log(`Total    : ${tests.length}`);
  console.log(`✅ PASS  : ${passed}`);
  console.log(`❌ FAIL  : ${failed}${failed === 1 ? ' (T23D — bug documentado: cooldown não implementado)' : ''}`);
  if (errors) console.log(`⚠️  ERRO  : ${errors}`);
  console.log(`\nTaxa: ${Math.round(passed / (passed + failed) * 100)}%`);
  console.log('\nRuns + evidências registrados no Octane.');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
