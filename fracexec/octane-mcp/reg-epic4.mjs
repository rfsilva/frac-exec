import { OctaneClient } from "./src/octane-client.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const RUN_DATE    = "2026-06-05";
const RESULTS_DIR = "/mnt/c/develop/bmad-method/fracexec/e2e/test-results-epic4";

const tester = new OctaneClient({ url:"http://localhost:8090",sharedSpaceId:"1001",workspaceId:"1003",username:"tester@fracexec.com",password:"Tester@FracExec2026!" });
const admin  = new OctaneClient({ url:"http://localhost:8090",sharedSpaceId:"1001",workspaceId:"1003",username:"sa@nga",password:"Welcome1" });
await tester.authenticate();
await admin.authenticate();

const TESTS = [
  { id:"2006", dir:"08-epic4-match-Epic-4-—-Ma-494ea-entes-ativos-no-pool-detail-chromium",  name:"E2E-4.1-01: Admin ve secao Clientes ativos" },
  { id:"2007", dir:"08-epic4-match-Epic-4-—-Ma-ac01a-necessidades-UNDER-ANALYSIS-chromium",   name:"E2E-4.2-01: Link Construir shortlist" },
  { id:"2008", dir:"08-epic4-match-Epic-4-—-Ma-80373-ds-id-shortlist-diretamente-chromium",   name:"E2E-4.3-01: Admin navega para shortlist" },
  { id:"2009", dir:"08-epic4-match-Epic-4-—-Ma-ca902--id-—-rota-existe-e-carrega-chromium",   name:"E2E-4.4-01: PME acessa /company/need/:id" },
  { id:"2010", dir:"08-epic4-match-Epic-4-—-Ma-27581-ortunities-—-página-carrega-chromium",   name:"E2E-4.5-01: Executivo oportunidades carrega" },
  { id:"2011", dir:"08-epic4-match-Epic-4-—-Ma-48570-eeds-e-vê-filtros-de-status-chromium",   name:"E2E-4.6-01: Admin filtros necessidades" },
];

for (const t of TESTS) {
  const runResp = await tester.createRun(t.id, "passed", `[${RUN_DATE}][E2E] ${t.name}`);
  const runId   = runResp?.data?.[0]?.id;
  const pngData = readFileSync(join(RESULTS_DIR, t.dir, "test-finished-1.png"));
  const attResult = await admin.uploadAttachment(runId, `sc-epic4-${t.id}.png`, pngData, "image/png", "run");
  const attId = attResult?.data?.[0]?.id;
  console.log(`[${t.id}] run=${runId} att=${attId}`);
}
console.log("done");
