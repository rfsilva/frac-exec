import { OctaneClient } from "./src/octane-client.js";
import fetch from "node-fetch";

const admin = new OctaneClient({ url:"http://localhost:8090",sharedSpaceId:"1001",workspaceId:"1003",username:"sa@nga",password:"Welcome1" });
await admin.authenticate();
const h    = { Cookie: admin.cookie, Accept: "application/json" };
const base = "http://localhost:8090/api/shared_spaces/1001/workspaces/1003";

const r = await fetch(`${base}/manual_runs?limit=500&fields=id,name,native_status,test`, { headers: h });
const d = await r.json();
const runs = d.data || [];

const byTest = {};
for (const run of runs) {
  const testId = run.test?.id;
  if (!testId) continue;
  const prev = byTest[testId];
  const currId = parseInt(run.id);
  if (!prev || currId > parseInt(prev.runId)) {
    byTest[testId] = { runId: run.id, name: run.name, status: run.native_status?.logical_name || "unknown" };
  }
}

const entries = Object.entries(byTest).sort((a,b) => parseInt(a[0]) - parseInt(b[0]));
for (const [testId, info] of entries) {
  const st = info.status.includes("passed") ? "PASS" : info.status.includes("failed") ? "FAIL" : "UNKN";
  console.log(`${st}|${testId}|${info.name.replace(/\[.*?\]\[?.*?\]?\s*/,"").substring(0,90)}`);
}

const passed = Object.values(byTest).filter(r => r.status.includes("passed")).length;
const failed = Object.values(byTest).filter(r => r.status.includes("failed")).length;
console.log(`---`);
console.log(`TOTAL=${Object.keys(byTest).length} PASS=${passed} FAIL=${failed}`);
