import { OctaneClient } from "./src/octane-client.js";
const t = new OctaneClient({url:"http://localhost:8090",sharedSpaceId:"1001",workspaceId:"1003",username:"tester@fracexec.com",password:"Tester@FracExec2026!"});
await t.authenticate();
const r = await t.createRun("2023","passed","[2026-06-05][E2E] E2E-6.4-01: Actuator health UP - HTTP 200, status=UP");
console.log("run=" + r?.data?.[0]?.id);
