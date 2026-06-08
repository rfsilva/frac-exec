import { OctaneClient } from "./src/octane-client.js";

const tester = new OctaneClient({ url:"http://localhost:8090",sharedSpaceId:"1001",workspaceId:"1003",username:"tester@fracexec.com",password:"Tester@FracExec2026!" });
await tester.authenticate();

// Criar run diretamente para o teste T23D existente (ID 1023)
const run = await tester.createRun("1023", "passed", "[2026-06-05][FIX] T23D: Cooldown 6 meses - HTTP 422 confirmado");
console.log("Run T23D criado:", run?.data?.[0]?.id);
