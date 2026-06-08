/**
 * Anexa evidências (screenshots PNG + texto) aos runs e defects existentes no Octane.
 * Usa o formato correto: owner_work_item no entity JSON (descoberto via DevTools da UI).
 *
 * Cobre:
 *   - 26 runs E2E (runs 1111–1136): screenshot do Playwright
 *   - 11 defects E2E (1033–1043): screenshot do Playwright
 *   - Runs de API da última execução (1067–1098): log de evidência em texto
 */

import { OctaneClient } from './src/octane-client.js';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const E2E_RESULTS = 'c:/develop/bmad-method/fracexec/e2e/test-results';
const RUN_DATE    = '2026-06-03';

const admin = new OctaneClient({
  url: 'http://localhost:8090', sharedSpaceId: '1001', workspaceId: '1003',
  username: 'sa@nga', password: 'Welcome1',
});

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Mapeamento direto: runId → pasta do Playwright ───────────────────────────
// Playwright gera nomes truncados — mapeamos diretamente para evitar falsos matches

const PLAYWRIGHT_DIRS = {
  '1111': '01-application-form-Formul-1dcec-redirecionamento-para-login-chromium',
  '1112': '01-application-form-Formul-d1f17-ete-candidatura-em-3-etapas-chromium-retry1',
  '1113': '01-application-form-Formul-878cf-vanço-com-LinkedIn-inválido-chromium-retry1',
  '1114': '02-auth-and-portals-Login--a0091-raiz-redireciona-para-login-chromium',
  '1115': '02-auth-and-portals-Login--65d0d-nválidas-permanece-em-login-chromium',
  '1116': '02-auth-and-portals-Login--98546--redireciona-para-executive-chromium',
  '1117': '02-auth-and-portals-Login--e78f9--sidebar-com-itens-corretos-chromium',
  '1118': '02-auth-and-portals-Login--cf64d-DMIN-redireciona-para-admin-chromium',
  '1119': '02-auth-and-portals-Login--6476a-a-sessão-e-volta-para-login-chromium',
  '1120': '02-auth-and-portals-Login--cd702-recionada-ao-portal-correto-chromium',
  '1121': '03-executive-profile-Perfi-257d3-ado-para-profile-com-banner-chromium-retry1',
  '1122': '03-executive-profile-Perfi-ec5f4-erfil-—-mensagem-de-sucesso-chromium-retry1',
  '1123': '03-executive-profile-Perfi-60d6f-portal-executivo-após-login-chromium',
  '1124': '03-executive-profile-Perfi-f914d--sidebar-carregam-no-portal-chromium',
  '1125': '04-availability-drawer-Wid-41434-e-widget-de-disponibilidade-chromium-retry1',
  '1126': '04-availability-drawer-Wid-b8c9c--Editar-abre-drawer-lateral-chromium',
  '1127': '04-availability-drawer-Wid-7da60-r-no-drawer-atualiza-widget-chromium-retry1',
  '1128': '04-availability-drawer-Wid-c4d76-o-salvas-mostra-confirmação-chromium-retry1',
  '1129': '04-availability-drawer-Wid-70300-terações-mostra-confirmação-chromium-retry1',
  '1130': '05-admin-candidacy-and-poo-15da3-daturas-em-admin-candidates-chromium-retry1',
  '1131': '05-admin-candidacy-and-poo-4d8ab-vê-filtro-de-status-na-fila-chromium',
  '1132': '05-admin-candidacy-and-poo-1cdd2--expande-candidatura-inline-chromium',
  '1133': '05-admin-candidacy-and-poo-a607a-ogin-redireciona-para-login-chromium',
  '1134': '05-admin-candidacy-and-poo-28ae8-vos-Admin-acessa-admin-pool-chromium-retry1',
  '1135': '05-admin-candidacy-and-poo-5c8d3-em-filtros-de-especialidade-chromium-retry1',
  '1136': '05-admin-candidacy-and-poo-d9460-ogin-redireciona-para-login-chromium',
  // defects (mesmos screenshots dos runs correspondentes)
  '1033': '01-application-form-Formul-d1f17-ete-candidatura-em-3-etapas-chromium-retry1',
  '1034': '01-application-form-Formul-878cf-vanço-com-LinkedIn-inválido-chromium-retry1',
  '1035': '03-executive-profile-Perfi-257d3-ado-para-profile-com-banner-chromium-retry1',
  '1036': '03-executive-profile-Perfi-ec5f4-erfil-—-mensagem-de-sucesso-chromium-retry1',
  '1037': '04-availability-drawer-Wid-41434-e-widget-de-disponibilidade-chromium-retry1',
  '1038': '04-availability-drawer-Wid-7da60-r-no-drawer-atualiza-widget-chromium-retry1',
  '1039': '04-availability-drawer-Wid-c4d76-o-salvas-mostra-confirmação-chromium-retry1',
  '1040': '04-availability-drawer-Wid-70300-terações-mostra-confirmação-chromium-retry1',
  '1041': '05-admin-candidacy-and-poo-15da3-daturas-em-admin-candidates-chromium-retry1',
  '1042': '05-admin-candidacy-and-poo-28ae8-vos-Admin-acessa-admin-pool-chromium-retry1',
  '1043': '05-admin-candidacy-and-poo-5c8d3-em-filtros-de-especialidade-chromium-retry1',
};

function findScreenshot(id) {
  const dir = PLAYWRIGHT_DIRS[String(id)];
  if (!dir) return null;
  const failed   = join(E2E_RESULTS, dir, 'test-failed-1.png');
  const finished = join(E2E_RESULTS, dir, 'test-finished-1.png');
  return existsSync(failed) ? failed : existsSync(finished) ? finished : null;
}

// ── Mapeamento E2E: run → defect → screenshot ─────────────────────────────────

const E2E_MAP = [
  { runId: '1111', defId: null,   pass: true,  name: 'E2E-01: Rota /apply é pública — sem redirecionamento para login' },
  { runId: '1112', defId: '1033', pass: false, name: 'E2E-02: Candidato preenche e submete candidatura em 3 etapas' },
  { runId: '1113', defId: '1034', pass: false, name: 'E2E-03: Formulário bloqueia avanço com LinkedIn inválido' },
  { runId: '1114', defId: null,   pass: true,  name: 'E2E-04: Rota raiz redireciona para /login' },
  { runId: '1115', defId: null,   pass: true,  name: 'E2E-05: Login com credenciais inválidas permanece em /login' },
  { runId: '1116', defId: null,   pass: true,  name: 'E2E-06: Login como EXECUTIVE redireciona para /executive' },
  { runId: '1117', defId: null,   pass: true,  name: 'E2E-07: Portal EXECUTIVE exibe sidebar com itens corretos' },
  { runId: '1118', defId: null,   pass: true,  name: 'E2E-08: Login como ADMIN redireciona para /admin' },
  { runId: '1119', defId: null,   pass: true,  name: 'E2E-09: Botão Sair limpa sessão e volta para login' },
  { runId: '1120', defId: null,   pass: true,  name: 'E2E-10: PME tentando acessar /admin é redirecionada ao portal correto' },
  { runId: '1121', defId: '1035', pass: false, name: 'E2E-11: Executivo sem perfil é redirecionado para /profile com banner' },
  { runId: '1122', defId: '1036', pass: false, name: 'E2E-12: Executivo preenche e salva perfil — mensagem de sucesso' },
  { runId: '1123', defId: null,   pass: true,  name: 'E2E-13: SealBanner aparece no portal executivo após login' },
  { runId: '1124', defId: null,   pass: true,  name: 'E2E-14: exec-layout e sidebar carregam no portal' },
  { runId: '1125', defId: '1037', pass: false, name: 'E2E-15: Dashboard exibe widget de disponibilidade' },
  { runId: '1126', defId: null,   pass: true,  name: 'E2E-16: Botão Editar abre drawer lateral' },
  { runId: '1127', defId: '1038', pass: false, name: 'E2E-17: Salvar no drawer atualiza widget' },
  { runId: '1128', defId: '1039', pass: false, name: 'E2E-18: ESC com alterações não salvas mostra confirmação' },
  { runId: '1129', defId: '1040', pass: false, name: 'E2E-19: Backdrop click com alterações mostra confirmação e descarta' },
  { runId: '1130', defId: '1041', pass: false, name: 'E2E-20: Admin vê fila de candidaturas em /admin/candidates' },
  { runId: '1131', defId: null,   pass: true,  name: 'E2E-21: Admin vê filtro de status na fila' },
  { runId: '1132', defId: null,   pass: true,  name: 'E2E-22: Admin expande candidatura inline' },
  { runId: '1133', defId: null,   pass: true,  name: 'E2E-23: Rota /admin/candidates sem login redireciona para /login' },
  { runId: '1134', defId: '1042', pass: false, name: 'E2E-24: Admin acessa /admin/pool' },
  { runId: '1135', defId: '1043', pass: false, name: 'E2E-25: Pool exibe filtros de especialidade e setor' },
  { runId: '1136', defId: null,   pass: true,  name: 'E2E-26: Rota /admin/pool sem login redireciona para /login' },
];

// ── Runs de API com suas evidências em texto ──────────────────────────────────

const API_RUNS = [
  { runId: '1067', name: 'T01: Actuator health', status: 'PASS', detail: 'GET /actuator/health → 200 {"status":"UP"}' },
  { runId: '1068', name: 'T02: Registro EXECUTIVE', status: 'PASS', detail: 'POST /auth/register → 201 {"accessToken":"...","role":"EXECUTIVE"}' },
  { runId: '1069', name: 'T03: Registro ADMIN bloqueado', status: 'PASS', detail: 'POST /auth/register role=ADMIN → 400 validation error' },
  { runId: '1070', name: 'T04: Login válido', status: 'PASS', detail: 'POST /auth/login → 200 {"accessToken":"...","refreshToken":"..."}' },
  { runId: '1071', name: 'T05: Login inválido', status: 'PASS', detail: 'POST /auth/login senha errada → 401 Unauthorized' },
  { runId: '1072', name: 'T06: Endpoint sem token', status: 'PASS', detail: 'GET /admin/applications sem Bearer → 401' },
  { runId: '1073', name: 'T07: Refresh token rotation', status: 'PASS', detail: 'POST /auth/refresh → 200 novo accessToken' },
  { runId: '1074', name: 'T08: Forgot-password', status: 'PASS', detail: 'POST /auth/forgot-password → 200 (resposta genérica)' },
  { runId: '1075', name: 'T09: Submissão candidatura', status: 'FAIL', detail: 'POST /applications → body incompleto (faltava positions/references/motivation)' },
  { runId: '1076', name: 'T10: Email duplicado', status: 'FAIL', detail: 'POST /applications email existente → corpo incompleto' },
  { runId: '1077', name: 'T11: LGPD false', status: 'PASS', detail: 'POST /applications lgpdConsent=false → 400 validation error' },
  { runId: '1078', name: 'T13: Admin sem auth', status: 'PASS', detail: 'GET /admin/applications → 401' },
  { runId: '1079', name: 'T14: EXECUTIVE no admin', status: 'PASS', detail: 'GET /admin/applications Bearer=EXECUTIVE → 403' },
  { runId: '1080', name: 'T15: Admin lista candidaturas', status: 'PASS', detail: 'GET /admin/applications Bearer=ADMIN → 200 Page<Application>' },
  { runId: '1081', name: 'T15b: Filtro status', status: 'PASS', detail: 'GET /admin/applications?status=PENDING → 200 todos PENDING' },
  { runId: '1082', name: 'T15c: Filtro nome', status: 'PASS', detail: 'GET /admin/applications?name=Test → 200' },
  { runId: '1083', name: 'T22: LinkedIn inválido', status: 'PASS', detail: 'POST /applications linkedinUrl="nao-e-um-linkedin" → 400' },
  { runId: '1084', name: 'T23: Candidatura duplicada', status: 'FAIL', detail: 'POST /applications email duplicado → corpo incompleto' },
  { runId: '1085', name: 'T23A: Aprovar candidatura', status: 'PASS', detail: 'PATCH /admin/applications/{id}/status APPROVED → 200' },
  { runId: '1086', name: 'T23C: Rejeitar candidatura', status: 'FAIL', detail: 'Sem candidatura PENDING disponível para rejeitar' },
  { runId: '1087', name: 'T23D: Cooldown', status: 'FAIL', detail: 'POST /applications após rejeição → 201 (bug: cooldown não implementado)' },
  { runId: '1088', name: 'T24: Refresh use-once', status: 'PASS', detail: 'POST /auth/refresh 2x com mesmo token → 2ª retorna 401' },
  { runId: '1089', name: 'T16: Perfil vazio', status: 'PASS', detail: 'GET /executive/profile/complete → 200 {"complete":false}' },
  { runId: '1090', name: 'T17: Salvar perfil', status: 'FAIL', detail: 'PUT /executive/profile specialties=["Finanças"] → 422 enum inválido' },
  { runId: '1091', name: 'T18: isComplete após salvar', status: 'FAIL', detail: 'Depende de T17 que falhou' },
  { runId: '1092', name: 'T19: isComplete sem perfil', status: 'PASS', detail: 'GET /executive/profile/complete → 200 {"complete":false}' },
  { runId: '1093', name: 'T20: PATCH availability', status: 'FAIL', detail: 'PATCH /executive/profile/availability availabilityDays → 400 (campo: availabilityDaysPerMonth)' },
  { runId: '1094', name: 'T21: Availability >20 dias', status: 'PASS', detail: 'PATCH /executive/profile/availability 25 dias → 400' },
  { runId: '1095', name: 'T26A: Admin pool', status: 'PASS', detail: 'GET /admin/pool → 200 Page<Executive>' },
  { runId: '1096', name: 'T26B: Pool exclui sem perfil', status: 'PASS', detail: 'GET /admin/pool → executivos sem perfil excluídos' },
  { runId: '1097', name: 'T26C: EXECUTIVE no pool', status: 'PASS', detail: 'GET /admin/pool Bearer=EXECUTIVE → 403' },
  { runId: '1098', name: 'T23B: Forgot-password aprovado', status: 'PASS', detail: 'POST /auth/forgot-password email aprovado → 200' },
];

// ── Runs do re-run (contratos corrigidos) ─────────────────────────────────────

const RERUN_API_RUNS = [
  { runId: '1099', name: 'T09 RERUN: Submissão candidatura PENDING', status: 'PASS', detail: 'POST /applications (com positions/references/motivation) → 201 {"id":"...","status":"PENDING"}' },
  { runId: '1100', name: 'T10 RERUN: Email duplicado 409', status: 'PASS', detail: 'POST /applications email existente → 409 Conflict' },
  { runId: '1101', name: 'T23 RERUN: Candidatura duplicada 409', status: 'PASS', detail: 'POST /applications email duplicado → 409 Conflict' },
  { runId: '1102', name: 'T23A RERUN: Aprovar APPROVED', status: 'PASS', detail: 'PATCH UNDER_REVIEW → PATCH APPROVED → 200 status=APPROVED' },
  { runId: '1103', name: 'T23C RERUN: Rejeitar REJECTED', status: 'PASS', detail: 'Nova candidatura → UNDER_REVIEW → REJECTED → 200 status=REJECTED' },
  { runId: '1104', name: 'T23D RERUN: Cooldown BUG', status: 'FAIL', detail: 'POST /applications após rejeição → 201 (BUG: cooldown não implementado)' },
  { runId: '1105', name: 'T17 RERUN: Salvar perfil', status: 'PASS', detail: 'PUT /executive/profile specialties=["CFO","COO"] → 200' },
  { runId: '1106', name: 'T18 RERUN: isComplete true', status: 'PASS', detail: 'GET /executive/profile/complete → 200 {"complete":true}' },
  { runId: '1107', name: 'T20 RERUN: PATCH availability', status: 'PASS', detail: 'PATCH /executive/profile/availability {availabilityDaysPerMonth:15, profileStatus:"ACTIVE"} → 200' },
];

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== Anexando evidências a runs e defects no Octane (${RUN_DATE}) ===\n`);
  await admin.authenticate();

  let ok = 0, skip = 0, err = 0;

  // ── E2E: screenshot nos runs (pass e fail) ────────────────────────────────

  console.log('── E2E Runs (screenshot PNG) ─────────────────────────');
  for (const item of E2E_MAP) {
    const screenshot = findScreenshot(item.runId);
    if (!screenshot || !existsSync(screenshot)) {
      console.log(`  ⬜ run ${item.runId} — sem screenshot para: ${item.name.substring(0,50)}`);
      skip++;
      continue;
    }
    try {
      const pngData = readFileSync(screenshot);
      const label   = item.pass ? 'pass' : 'fail';
      const attName = `screenshot-${item.runId}-${label}.png`;
      const result  = await admin.uploadAttachment(item.runId, attName, pngData, 'image/png', 'run');
      const attId   = result?.data?.[0]?.id;
      console.log(`  ✅ run ${item.runId} → att ${attId} | ${item.name.substring(0,50)}`);
      ok++;
    } catch (e) {
      console.log(`  ❌ run ${item.runId} ERRO: ${e.message.substring(0,60)}`);
      err++;
    }
    await sleep(200);
  }

  // ── E2E: screenshot nos defects (só fail) ────────────────────────────────

  console.log('\n── E2E Defects (screenshot PNG) ──────────────────────');
  for (const item of E2E_MAP.filter(i => i.defId)) {
    const screenshot = findScreenshot(item.defId);
    if (!screenshot || !existsSync(screenshot)) {
      console.log(`  ⬜ defect ${item.defId} — sem screenshot`);
      skip++;
      continue;
    }
    try {
      const pngData = readFileSync(screenshot);
      const attName = `screenshot-defect-${item.defId}.png`;
      const result  = await admin.uploadAttachment(item.defId, attName, pngData, 'image/png');
      const attId   = result?.data?.[0]?.id;
      console.log(`  ✅ defect ${item.defId} → att ${attId} | ${item.name.substring(0,50)}`);
      ok++;
    } catch (e) {
      console.log(`  ❌ defect ${item.defId} ERRO: ${e.message.substring(0,60)}`);
      err++;
    }
    await sleep(200);
  }

  // ── API Runs: log de evidência em texto ──────────────────────────────────

  console.log('\n── API Runs (evidência em texto) ─────────────────────');
  for (const item of [...API_RUNS, ...RERUN_API_RUNS]) {
    try {
      const content = [
        `=== EVIDÊNCIA DE EXECUÇÃO — ${item.status} ===`,
        `Teste  : ${item.name}`,
        `Run ID : ${item.runId}`,
        `Data   : ${RUN_DATE}`,
        ``,
        `Resultado: ${item.detail}`,
      ].join('\n');

      const attName = `evidencia-${item.runId}-${item.status.toLowerCase()}.txt`;
      const result  = await admin.uploadAttachment(item.runId, attName, Buffer.from(content), 'text/plain', 'run');
      const attId   = result?.data?.[0]?.id;
      console.log(`  ✅ run ${item.runId} [${item.status}] → att ${attId} | ${item.name.substring(0,45)}`);
      ok++;
    } catch (e) {
      console.log(`  ❌ run ${item.runId} ERRO: ${e.message.substring(0,60)}`);
      err++;
    }
    await sleep(150);
  }

  console.log('\n─────────────────────────────────────────');
  console.log('SUMÁRIO');
  console.log('─────────────────────────────────────────');
  console.log(`✅ Vinculados : ${ok}`);
  console.log(`⬜ Sem arquivo: ${skip}`);
  console.log(`❌ Erros      : ${err}`);
  console.log('\nEvidências anexadas e visíveis na aba Attachments do Octane.');
}

await main();
