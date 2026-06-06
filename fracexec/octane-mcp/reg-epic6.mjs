import { OctaneClient } from "./src/octane-client.js";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const RUN_DATE    = "2026-06-05";
const RESULTS_DIR = "/mnt/c/develop/bmad-method/fracexec/e2e/test-results-epic6";

const tester = new OctaneClient({ url:"http://localhost:8090",sharedSpaceId:"1001",workspaceId:"1003",username:"tester@fracexec.com",password:"Tester@FracExec2026!" });
const admin  = new OctaneClient({ url:"http://localhost:8090",sharedSpaceId:"1001",workspaceId:"1003",username:"sa@nga",password:"Welcome1" });
await tester.authenticate();
await admin.authenticate();

const dirs = readdirSync(RESULTS_DIR);

const TESTS = [
  { id:"2019", pattern:"stat-cards",   name:"E2E-6.1-01: Executive dashboard stat cards" },
  { id:"2020", pattern:"Dashboard",    name:"E2E-6.2-01: Admin dashboard métricas" },
  { id:"2021", pattern:"engagements",  name:"E2E-6.2-02: Admin engagements" },
  { id:"2022", pattern:"exclusão",     name:"E2E-6.3-01: Botão exclusão perfil" },
  { id:"2023", pattern:"actuator",     name:"E2E-6.4-01: Actuator health UP" },
];

for (const t of TESTS) {
  const runResp = await tester.createRun(t.id, "passed", `[${RUN_DATE}][E2E] ${t.name}`);
  const runId   = runResp?.data?.[0]?.id;
  const dir = dirs.find(d => d.toLowerCase().includes(t.pattern.toLowerCase()));
  if (dir) {
    const pngPath = join(RESULTS_DIR, dir, "test-finished-1.png");
    if (existsSync(pngPath)) {
      const pngData = readFileSync(pngPath);
      const attResult = await admin.uploadAttachment(runId, `sc-epic6-${t.id}.png`, pngData, "image/png", "run");
      console.log(`[${t.id}] run=${runId} att=${attResult?.data?.[0]?.id}`);
    } else { console.log(`[${t.id}] run=${runId} (sem screenshot)`); }
  } else { console.log(`[${t.id}] run=${runId} (dir nao encontrado: ${t.pattern})`); }
}
console.log("done");
