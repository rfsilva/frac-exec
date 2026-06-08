/**
 * Registra os resultados E2E do Playwright no Octane.
 *
 * Estratégia:
 *   1. Cria os 26 testes E2E como test_manual no Octane (se ainda não existirem)
 *   2. Para cada teste: cria manual_run com description contendo a evidência inline
 *   3. Para testes FALHOS: cria defect com o screenshot PNG como attachment
 *      (defects aceitam attachment vinculado; runs não nesta versão Community)
 *
 * Pré-requisitos:
 *   - Playwright já rodou: fracexec/e2e/test-results/ populado com PNGs
 *   - Octane rodando em http://localhost:8090
 */

import { OctaneClient } from './src/octane-client.js';
import fetch from 'node-fetch';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// ── Config ─────────────────────────────────────────────────────────────────────

const RUN_DATE    = '2026-06-03';
const E2E_RESULTS = 'c:/develop/bmad-method/fracexec/e2e/test-results';
const RELEASE_ID  = '1001';
const BASE        = 'http://localhost:8090/api/shared_spaces/1001/workspaces/1003';

// sa@nga cria testes e defects (Space Admin)
const admin = new OctaneClient({
  url: 'http://localhost:8090', sharedSpaceId: '1001', workspaceId: '1003',
  username: 'sa@nga', password: 'Welcome1',
});

// tester cria manual_runs
const tester = new OctaneClient({
  url: 'http://localhost:8090', sharedSpaceId: '1001', workspaceId: '1003',
  username: 'tester@fracexec.com', password: 'Tester@FracExec2026!',
});

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Definição dos 26 testes E2E ───────────────────────────────────────────────

const E2E_TESTS = [
  // 01 — Formulário candidatura (Story 2.1)
  { name: 'E2E-01: Rota /apply é pública — sem redirecionamento para login',        pass: true,  story: '2.1' },
  { name: 'E2E-02: Candidato preenche e submete candidatura em 3 etapas',           pass: false, story: '2.1', error: 'Angular hydration — stepper não carregado antes do timeout' },
  { name: 'E2E-03: Formulário bloqueia avanço com LinkedIn inválido',               pass: false, story: '2.1', error: 'Angular hydration — validação não renderizada antes do timeout' },
  // 02 — Auth (Stories 1.2 / 1.4)
  { name: 'E2E-04: Rota raiz redireciona para /login',                              pass: true,  story: '1.2' },
  { name: 'E2E-05: Login com credenciais inválidas permanece em /login',            pass: true,  story: '1.2' },
  { name: 'E2E-06: Login como EXECUTIVE redireciona para /executive',               pass: true,  story: '1.2' },
  { name: 'E2E-07: Portal EXECUTIVE exibe sidebar com itens corretos',              pass: true,  story: '1.2' },
  { name: 'E2E-08: Login como ADMIN redireciona para /admin',                       pass: true,  story: '1.4' },
  { name: 'E2E-09: Botão Sair limpa sessão e volta para login',                     pass: true,  story: '1.4' },
  { name: 'E2E-10: PME tentando acessar /admin é redirecionada ao portal correto',  pass: true,  story: '1.4' },
  // 03 — Perfil (Story 2.4)
  { name: 'E2E-11: Executivo sem perfil é redirecionado para /profile com banner',  pass: false, story: '2.4', error: 'Angular hydration — banner não visível antes do timeout' },
  { name: 'E2E-12: Executivo preenche e salva perfil — mensagem de sucesso',        pass: false, story: '2.4', error: 'Angular hydration — textarea[id="bio"] não visível antes do timeout' },
  { name: 'E2E-13: SealBanner aparece no portal executivo após login',              pass: true,  story: '2.4' },
  { name: 'E2E-14: exec-layout e sidebar carregam no portal',                      pass: true,  story: '2.4' },
  // 04 — Disponibilidade (Story 2.5)
  { name: 'E2E-15: Dashboard exibe widget de disponibilidade',                      pass: false, story: '2.5', error: 'Angular hydration — .widget-card não visível antes do timeout' },
  { name: 'E2E-16: Botão Editar abre drawer lateral',                               pass: true,  story: '2.5' },
  { name: 'E2E-17: Salvar no drawer atualiza widget',                               pass: false, story: '2.5', error: 'Angular hydration — widget não atualizado antes do timeout' },
  { name: 'E2E-18: ESC com alterações não salvas mostra confirmação',               pass: false, story: '2.5', error: 'Angular hydration — pré-requisito não estabelecido' },
  { name: 'E2E-19: Backdrop click com alterações mostra confirmação e descarta',    pass: false, story: '2.5', error: 'Angular hydration — pré-requisito não estabelecido' },
  // 05 — Admin candidaturas (Story 2.2)
  { name: 'E2E-20: Admin vê fila de candidaturas em /admin/candidates',             pass: false, story: '2.2', error: 'Angular hydration — .page-body não visível antes do timeout' },
  { name: 'E2E-21: Admin vê filtro de status na fila',                             pass: true,  story: '2.2' },
  { name: 'E2E-22: Admin expande candidatura inline',                               pass: true,  story: '2.2' },
  { name: 'E2E-23: Rota /admin/candidates sem login redireciona para /login',       pass: true,  story: '2.2' },
  // 05 — Admin pool (Story 2.6)
  { name: 'E2E-24: Admin acessa /admin/pool',                                      pass: false, story: '2.6', error: 'Angular hydration — .page-body não visível antes do timeout' },
  { name: 'E2E-25: Pool exibe filtros de especialidade e setor',                   pass: false, story: '2.6', error: 'Angular hydration — filtros não visíveis antes do timeout' },
  { name: 'E2E-26: Rota /admin/pool sem login redireciona para /login',             pass: true,  story: '2.6' },
];

// ── Criar testes E2E no Octane (se não existirem) ────────────────────────────

async function ensureTestsCreated() {
  const existing = await admin.listTests('E2E-', 200);
  const existingNames = new Set((existing.data || []).map(t => t.name));

  for (const test of E2E_TESTS) {
    if (existingNames.has(test.name)) continue;

    const resp = await fetch(`${BASE}/manual_tests`, {
      method: 'POST',
      headers: { Cookie: admin.cookie, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ data: [{
        name:        test.name,
        description: `Story ${test.story} — Teste E2E com Playwright 1.60.0 + Chromium`,
      }]}),
    });
    const d = await resp.json().catch(() => ({}));
    test.octaneId = d?.data?.[0]?.id;
    await sleep(150);
  }

  // Para os que já existiam, mapear o ID
  const refreshed = await admin.listTests('E2E-', 200);
  for (const t of refreshed.data || []) {
    const match = E2E_TESTS.find(e => e.name === t.name);
    if (match) match.octaneId = t.id;
  }
}

// ── Localizar screenshot do test-results ──────────────────────────────────────

function findScreenshot(testName) {
  if (!existsSync(E2E_RESULTS)) return null;
  const dirs = readdirSync(E2E_RESULTS);

  const keywords = testName
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(w => w.length > 3)
    .slice(0, 5);

  const scored = dirs
    .map(d => ({ d, score: keywords.filter(k => d.toLowerCase().includes(k)).length }))
    .filter(x => x.score >= 2)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;

  // Preferir retry1 (última tentativa dos falhos)
  const base  = scored[0].d.replace(/-chromium(-retry1)?$/, '');
  const retry = dirs.find(d => d.startsWith(base) && d.endsWith('retry1'));
  const chosen = retry || scored[0].d;

  const failed   = join(E2E_RESULTS, chosen, 'test-failed-1.png');
  const finished = join(E2E_RESULTS, chosen, 'test-finished-1.png');
  return existsSync(failed) ? failed : existsSync(finished) ? finished : null;
}

// ── Upload de PNG como attachment (multipart manual) ──────────────────────────

async function uploadPng(client, ownerId, ownerType, fileName, filePath) {
  const fileData   = readFileSync(filePath);
  const boundary   = `Boundary${Date.now()}`;
  const entityJson = JSON.stringify({ name: fileName });
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="entity"; filename="entity.json"\r\nContent-Type: application/json\r\n\r\n${entityJson}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="content"; filename="${fileName}"\r\nContent-Type: image/png\r\n\r\n`),
    fileData,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  await client.ensureAuth();
  const resp = await fetch(
    `${BASE}/attachments?owner_type=${ownerType}&owner_id=${ownerId}`,
    { method: 'POST', headers: { Cookie: client.cookie, 'Content-Type': `multipart/form-data; boundary=${boundary}` }, body }
  );
  const d = await resp.json().catch(() => ({}));
  return d?.data?.[0]?.id || null;
}

// ── Criar defect com screenshot vinculado ─────────────────────────────────────

async function createDefectWithScreenshot(name, errorMsg, story, screenshotPath) {
  await admin.ensureAuth();
  const resp = await fetch(`${BASE}/defects`, {
    method: 'POST',
    headers: { Cookie: admin.cookie, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ data: [{
      name,
      description: `<b>[E2E FAIL] Story ${story}</b><br/>${errorMsg}<br/>Data: ${RUN_DATE}<br/>Framework: Playwright 1.60.0 + Chromium`,
      severity: { type: 'list_node', id: 'list_node.severity.high' },
    }]}),
  });
  const d     = await resp.json().catch(() => ({}));
  const defId = d?.data?.[0]?.id;
  if (!defId) return null;

  if (screenshotPath && existsSync(screenshotPath)) {
    const attId = await uploadPng(admin, defId, 'defect', `screenshot-e2e-${defId}.png`, screenshotPath);
    return { defId, attId };
  }
  return { defId, attId: null };
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== FracExec — E2E Playwright → Octane (${RUN_DATE}) ===`);
  console.log('Playwright 1.60.0 + Chromium | 26 testes | 15 PASS / 11 FAIL\n');

  await admin.authenticate();
  await tester.authenticate();

  // Passo 1: garantir que os 26 test_manual existem no Octane
  console.log('Passo 1/2: Criando/verificando test_manual no Octane...');
  await ensureTestsCreated();
  const mapped = E2E_TESTS.filter(t => t.octaneId).length;
  console.log(`  ${mapped}/26 testes mapeados\n`);

  // Passo 2: criar runs + defects com screenshots
  console.log('Passo 2/2: Registrando runs e evidências...');
  let passed = 0, failed = 0, errors = 0;

  for (const test of E2E_TESTS) {
    const status     = test.pass ? 'passed' : 'failed';
    const statusId   = `list_node.run_native_status.${status}`;
    const screenshot = findScreenshot(test.name);
    const screenshotLabel = screenshot
      ? screenshot.replace('c:/develop/bmad-method/', '')
      : 'não disponível';

    process.stdout.write(`  [${test.name.substring(0, 8)}][${test.story}] ${test.name.substring(9, 57)}... `);

    try {
      // description inline como evidência no run
      const desc = [
        `<b>Teste E2E — Story ${test.story}</b>`,
        `<br/>Status: <b>${status.toUpperCase()}</b>`,
        test.error ? `<br/>Falha: ${test.error}` : '',
        `<br/>Screenshot: ${screenshotLabel}`,
        `<br/>Data: ${RUN_DATE} | Playwright 1.60.0 + Chromium`,
      ].filter(Boolean).join('');

      // Criar manual_run vinculado ao test_manual
      await tester.ensureAuth();
      const runBody = {
        name:          `[${RUN_DATE}][E2E] ${test.name}`,
        native_status: { type: 'list_node', id: statusId },
        description:   desc,
        release:       { type: 'release', id: RELEASE_ID },
      };
      if (test.octaneId) runBody.test = { type: 'test_manual', id: String(test.octaneId) };

      const runResp = await fetch(`${BASE}/manual_runs`, {
        method: 'POST',
        headers: { Cookie: tester.cookie, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ data: [runBody] }),
      });
      const runD  = await runResp.json().catch(() => ({}));
      const runId = runD?.data?.[0]?.id;

      // Para falhas: defect com screenshot vinculado
      let defInfo = null;
      if (!test.pass) {
        defInfo = await createDefectWithScreenshot(
          `[E2E FAIL] ${test.name}`,
          test.error || 'Falha na execução E2E',
          test.story,
          screenshot
        );
        await sleep(150);
      }

      test.pass ? passed++ : failed++;

      const runStr  = runId          ? `run ${runId}` : 'sem run';
      const defStr  = defInfo?.defId ? ` | defect ${defInfo.defId}` : '';
      const attStr  = defInfo?.attId ? ` + PNG ${defInfo.attId}` : '';
      console.log(`${test.pass ? '✅' : '❌'} (${runStr}${defStr}${attStr})`);

    } catch (err) {
      errors++;
      console.log(`⚠️  ERRO: ${err.message.substring(0, 70)}`);
    }

    await sleep(250);
  }

  console.log('\n─────────────────────────────────────────');
  console.log('SUMÁRIO E2E');
  console.log('─────────────────────────────────────────');
  console.log(`Total    : ${E2E_TESTS.length}`);
  console.log(`✅ PASS  : ${passed}`);
  console.log(`❌ FAIL  : ${failed}`);
  if (errors) console.log(`⚠️  ERRO  : ${errors}`);
  console.log(`\nEvidências no Octane:`);
  console.log(`  • Runs: campo description com status, erro e path do screenshot`);
  console.log(`  • Falhas: defect com screenshot PNG como attachment vinculado`);
  console.log('\nRegistro completo.');
}

await main();
