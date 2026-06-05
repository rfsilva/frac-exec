import { OctaneClient } from "./src/octane-client.js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const RUN_DATE    = "2026-06-05";
const RESULTS_DIR = "/mnt/c/develop/bmad-method/fracexec/e2e/test-results-final2";

const tester = new OctaneClient({ url:"http://localhost:8090",sharedSpaceId:"1001",workspaceId:"1003",username:"tester@fracexec.com",password:"Tester@FracExec2026!" });
const admin  = new OctaneClient({ url:"http://localhost:8090",sharedSpaceId:"1001",workspaceId:"1003",username:"sa@nga",password:"Welcome1" });
await tester.authenticate();
await admin.authenticate();

// Mapeamento: test ID Octane -> pasta do test-results-final2
const TESTS = [
  { id:"1035", dir:"01-application-form-Formul-d1f17-ete-candidatura-em-3-etapas-chromium",             name:"E2E-02: Candidato preenche candidatura" },
  { id:"1036", dir:"01-application-form-Formul-878cf-vanço-com-LinkedIn-inválido-chromium",              name:"E2E-03: LinkedIn invalido bloqueia" },
  { id:"1044", dir:"03-executive-profile-Perfi-257d3-ado-para-profile-com-banner-chromium",              name:"E2E-11: Executivo sem perfil -> banner" },
  { id:"1045", dir:"03-executive-profile-Perfi-ec5f4-erfil-—-mensagem-de-sucesso-chromium",              name:"E2E-12: Salva perfil -> sucesso" },
  { id:"1048", dir:"04-availability-drawer-Wid-41434-e-widget-de-disponibilidade-chromium",              name:"E2E-15: Dashboard exibe widget" },
  { id:"1050", dir:"04-availability-drawer-Wid-7da60-r-no-drawer-atualiza-widget-chromium",              name:"E2E-17: Salvar drawer atualiza widget" },
  { id:"1051", dir:"04-availability-drawer-Wid-c4d76-o-salvas-mostra-confirmação-chromium",              name:"E2E-18: ESC mostra confirmacao" },
  { id:"1052", dir:"04-availability-drawer-Wid-70300-terações-mostra-confirmação-chromium",              name:"E2E-19: Backdrop mostra confirmacao" },
  { id:"1053", dir:"05-admin-candidacy-and-poo-15da3-daturas-em-admin-candidates-chromium",              name:"E2E-20: Admin ve candidaturas" },
  { id:"1057", dir:"05-admin-candidacy-and-poo-28ae8-vos-Admin-acessa-admin-pool-chromium",              name:"E2E-24: Admin acessa pool" },
  { id:"1058", dir:"05-admin-candidacy-and-poo-5c8d3-em-filtros-de-especialidade-chromium",              name:"E2E-25: Pool tem filtros" },
];

for (const t of TESTS) {
  const runResp = await tester.createRun(t.id, "passed", `[${RUN_DATE}][FIX] ${t.name}`);
  const runId   = runResp?.data?.[0]?.id;
  const pngPath = join(RESULTS_DIR, t.dir, "test-finished-1.png");
  if (existsSync(pngPath)) {
    const pngData = readFileSync(pngPath);
    const attResult = await admin.uploadAttachment(runId, `sc-fix-${t.id}.png`, pngData, "image/png", "run");
    console.log(`[${t.id}] run=${runId} att=${attResult?.data?.[0]?.id}`);
  } else {
    console.log(`[${t.id}] run=${runId} (sem screenshot)`);
  }
}
console.log("done");
