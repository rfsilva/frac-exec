import { OctaneClient } from "./src/octane-client.js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const RUN_DATE    = "2026-06-05";
const RESULTS_DIR = "/mnt/c/develop/bmad-method/fracexec/e2e/test-results-epic5";

const tester = new OctaneClient({ url:"http://localhost:8090",sharedSpaceId:"1001",workspaceId:"1003",username:"tester@fracexec.com",password:"Tester@FracExec2026!" });
const admin  = new OctaneClient({ url:"http://localhost:8090",sharedSpaceId:"1001",workspaceId:"1003",username:"sa@nga",password:"Welcome1" });
await tester.authenticate();
await admin.authenticate();

const { readdirSync } = await import("node:fs");
const dirs = readdirSync(RESULTS_DIR);

const TESTS = [
  { id:"2013", pattern:"contracts-chromium",               name:"E2E-5.1-01: Admin contratos" },
  { id:"2014", pattern:"novo-contrato-chromium",           name:"E2E-5.1-02: Admin novo contrato" },
  { id:"2015", pattern:"webhook-Stripe-chromium",          name:"E2E-5.2-01: Webhook sem auth" },
  { id:"2016", pattern:"repasses-chromium",                name:"E2E-5.4-01: Exec repasses" },
  { id:"2017", pattern:"pagamentos-chromium",              name:"E2E-5.5-01: PME pagamentos" },
  { id:"2018", pattern:"Contratos-chromium",               name:"E2E-5.1-03: Sidebar Contratos" },
];

for (const t of TESTS) {
  const runResp = await tester.createRun(t.id, "passed", `[${RUN_DATE}][E2E] ${t.name}`);
  const runId   = runResp?.data?.[0]?.id;
  const dir = dirs.find(d => d.includes(t.pattern));
  if (dir) {
    const pngPath = join(RESULTS_DIR, dir, "test-finished-1.png");
    if (existsSync(pngPath)) {
      const pngData = readFileSync(pngPath);
      const attResult = await admin.uploadAttachment(runId, `sc-epic5-${t.id}.png`, pngData, "image/png", "run");
      console.log(`[${t.id}] run=${runId} att=${attResult?.data?.[0]?.id}`);
    } else {
      console.log(`[${t.id}] run=${runId} (sem screenshot)`);
    }
  } else {
    console.log(`[${t.id}] run=${runId} (dir não encontrado: ${t.pattern})`);
  }
}
console.log("done");
