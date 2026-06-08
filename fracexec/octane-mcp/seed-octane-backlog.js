/**
 * Cadastra todos os épicos e stories do backlog FracExec no Octane.
 * Épicos 1–3 + Features já existem; este script adiciona:
 *   - Stories 3.2, 3.3, 3.4 (na Feature 1047)
 *   - Epic 4 + Feature + Stories 4.1–4.6
 *   - Epic 5 + Feature + Stories 5.1–5.5
 *   - Epic 6 + Feature + Stories 6.1–6.4
 */

import fetch from 'node-fetch';
import { OctaneClient } from './src/octane-client.js';

const admin = new OctaneClient({
  url: 'http://localhost:8090', sharedSpaceId: '1001', workspaceId: '1003',
  username: 'sa@nga', password: 'Welcome1',
});
await admin.authenticate();
const h    = { Cookie: admin.cookie, Accept: 'application/json', 'Content-Type': 'application/json' };
const base = 'http://localhost:8090/api/shared_spaces/1001/workspaces/1003';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function createEpic(name, desc) {
  const r = await fetch(`${base}/epics`, {
    method: 'POST', headers: h,
    body: JSON.stringify({ data: [{ name, description: desc }] })
  });
  return (await r.json())?.data?.[0]?.id;
}

async function createFeature(name, epicId) {
  const r = await fetch(`${base}/features`, {
    method: 'POST', headers: h,
    body: JSON.stringify({ data: [{ name, parent: { type: 'epic', id: String(epicId) } }] })
  });
  return (await r.json())?.data?.[0]?.id;
}

async function createStory(name, desc, sp, featureId) {
  const r = await fetch(`${base}/stories`, {
    method: 'POST', headers: h,
    body: JSON.stringify({ data: [{ name, description: desc, story_points: sp, parent: { type: 'feature', id: String(featureId) } }] })
  });
  return (await r.json())?.data?.[0]?.id;
}

// ─── Stories restantes do Epic 3 (Feature 1047 já existe) ────────────────────
const EPIC3_STORIES = [
  {
    name: 'Story 3.2: SMB Need Posting Form', sp: 5,
    desc: 'PME posta necessidade com tipo C-Level, escopo (dias/mês + duração), descrição do desafio (mín 50 chars), resultado esperado, contexto confidencial (só ADMIN). E-mail SLA 5 dias úteis. Rascunho salvo sem mudar status.',
  },
  {
    name: 'Story 3.3: SMB Company Dashboard with Need Funnel', sp: 5,
    desc: 'Dashboard PME com NeedFunnelComponent: 5 estados (Recebida → Em análise → Shortlist enviada → Em mediação → Contratado). SLA calculado a partir de need.created_at. Estado vazio com CTA para postar.',
  },
  {
    name: 'Story 3.4: Admin Needs Queue', sp: 5,
    desc: 'Fila admin /admin/needs com accordion inline; botão Iniciar análise; filtros status/C-Level/setor/data. /admin/needs/:id com contexto confidencial. /admin/companies com ativação de PMEs (PENDING_ACTIVATION → ACTIVE).',
  },
];

// ─── Epics 4–6 com features e stories ────────────────────────────────────────
const EPICS = [
  {
    epicName: 'Epic 4: Match, Shortlist & Mediation',
    epicDesc: 'Admin constrói shortlists com detecção automática de conflito de interesses (CNAE 2 dígitos + região). PMEs revisam perfis anonimizados. Executivos declaram interesse. Comunicação mediada via thread.',
    featureName: 'Match, Shortlist & Mediation',
    stories: [
      { name: 'Story 4.1: Conflict of Interest Registry', sp: 5, desc: 'Registro de clientes ativos por executivo (CNAE 2 dígitos + região). API CRUD admin. Serviço de detecção retorna CONFLICT ou CLEAR. Seed com 5 CNAEs distintos.' },
      { name: 'Story 4.2: Shortlist Builder (Split-View)', sp: 8, desc: 'Interface split-view: pool filtrada à esquerda, shortlist (4 slots) à direita. Verificação de conflito automática ao adicionar. Botão Enviar shortlist bloqueado enquanto houver conflito pendente.' },
      { name: 'Story 4.3: Conflict Review & Admin Decision', sp: 5, desc: 'Revisão de conflito em /admin/conflicts/:id. Opções: Excluir da shortlist ou Apresentar com alerta. Auditoria de decisão com timestamp e admin ID. Envio da shortlist ativa notificação PME.' },
      { name: 'Story 4.4: Anonymized Profiles & SMB Selection', sp: 5, desc: 'PME revisa 2-4 AnonProfileComponents sem nome/empresa. ConflictAlertComponent não-bloqueante. Seleção de até 2 executivos. Necessidade avança para IN_MEDIATION. E-mail brief anonimizado ao executivo.' },
      { name: 'Story 4.5: Executive Opportunity Response', sp: 5, desc: 'Lista de oportunidades em /executive/opportunities. Prazo 3 dias úteis. Botões Tenho interesse / Declinar. Expiração automática. Retratação em 24h. Novo ciclo se ambos declinarem.' },
      { name: 'Story 4.6: Mediation Thread', sp: 8, desc: 'Thread mediada por ADMIN. PME e executivo veem papel (Empresa/Executivo/FracExec), nunca nome. Somente ADMIN escreve diretamente. E-mail de nova mensagem aos participantes. LoadingSkeletonComponent tipo list.' },
    ],
  },
  {
    epicName: 'Epic 5: Contract, Payments & Engagements',
    epicDesc: 'Geração e assinatura de contrato PDF; pagamentos PIX via Stripe Connect; janela de escrow de 5 dias úteis; repasse líquido com 18% de fee; extratos e comprovantes; identidades reveladas após assinatura.',
    featureName: 'Contract, Payments & Engagements',
    stories: [
      { name: 'Story 5.1: Contract Generation & Signature', sp: 8, desc: 'Admin gera contrato PDF (iText 7 ou OpenPDF) com partes, escopo, cláusulas. MinIO fracexec-contracts. Registro de aceite manual. Status engagement → ACTIVE. Identidades reveladas. Validação de disponibilidade não-bloqueante.' },
      { name: 'Story 5.2: Stripe Integration & Recurring Payment', sp: 8, desc: 'Stripe Connect marketplace BR. Payment Intent PIX com QR Code (1h expiração). Webhook idempotente payment_intent.succeeded. Validação de assinatura Stripe-Signature. Tratamento de EXPIRED.' },
      { name: 'Story 5.3: Escrow Window & Executive Transfer', sp: 5, desc: 'Job agendado: 5 dias úteis brasileiros após PAID. Payout net_amount via Stripe Connect. Status → TRANSFERRED. E-mails comprovante PME e extrato executivo (bruto/taxa 18%/líquido em JetBrains Mono).' },
      { name: 'Story 5.4: Executive Payment Dashboard', sp: 3, desc: 'Histórico de repasses em /executive/payments: mês, empresa, bruto, taxa, líquido. Widget no dashboard com próximo repasse e total do mês. Valores em JetBrains Mono sem exceções.' },
      { name: 'Story 5.5: SMB Contract & Payment History', sp: 3, desc: 'Histórico de pagamentos e contratos em /company/payments. Download PDF via URL pré-assinada MinIO 1h. Widget dashboard com próximo vencimento. Identidade executivo revelada pós-contrato.' },
    ],
  },
  {
    epicName: 'Epic 6: Complete Dashboards, Admin Operations & Production Readiness',
    epicDesc: 'Dashboards completos nos três portais com dados reais. Painel admin com visibilidade operacional total. Direito de exclusão LGPD em 30 dias. CI/CD GitHub Actions, Logback JSON, Actuator health/metrics.',
    featureName: 'Complete Dashboards & Production Readiness',
    stories: [
      { name: 'Story 6.1: Executive Dashboard Completion', sp: 5, desc: '4 stat cards: engajamentos ativos, dias comprometidos, próximo repasse, oportunidades pendentes. Seções Engajamentos e Oportunidades. LoadingSkeletonComponent individual por widget.' },
      { name: 'Story 6.2: Admin Dashboard & Full Operations Panel', sp: 8, desc: 'Métricas operacionais: candidaturas/pool/necessidades/contratos/pipeline financeiro. /admin/engagements com transições PAUSED/COMPLETED/CANCELLED. Seção LGPD no dashboard.' },
      { name: 'Story 6.3: LGPD Compliance & Data Deletion', sp: 5, desc: 'Botão de exclusão em /executive/profile e /company/profile. POST /account/deletion-request. Job de anonimização em 30 dias (nome/email/foto). Preservação de contratos. PENDING_ENGAGEMENTS bloqueio.' },
      { name: 'Story 6.4: Production Readiness & Observability', sp: 5, desc: 'GitHub Actions: build + testes + Docker. Logback JSON estruturado sem PII. Actuator /health e /metrics (rede interna). Performance < 3s em 4G. HTTPS + redirect HTTP. Smoke tests multibrowser.' },
    ],
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log('=== Cadastrando backlog completo FracExec no Octane ===\n');

// Epic 3 — stories restantes
console.log('Epic 3 — stories 3.2, 3.3, 3.4 (Feature 1047)');
for (const s of EPIC3_STORIES) {
  const id = await createStory(s.name, s.desc, s.sp, '1047');
  console.log(`  ✅ [${id}] ${s.name} (${s.sp} pts)`);
  await sleep(250);
}

// Epics 4, 5, 6
for (const block of EPICS) {
  console.log(`\n${block.epicName}`);
  const epicId = await createEpic(block.epicName, block.epicDesc);
  console.log(`  Epic: [${epicId}]`);
  await sleep(300);

  const featureId = await createFeature(block.featureName, epicId);
  console.log(`  Feature: [${featureId}]`);
  await sleep(300);

  for (const s of block.stories) {
    const sid = await createStory(s.name, s.desc, s.sp, featureId);
    console.log(`  ✅ [${sid}] ${s.name} (${s.sp} pts)`);
    await sleep(250);
  }
}

console.log('\n=== Backlog completo cadastrado no Octane! ===');
