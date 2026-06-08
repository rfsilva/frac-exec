# GitHub Actions — Configuração e Execução

## Estrutura de workflows: raiz vs. componentes

O projeto tem **três camadas de workflows** que coexistem com propósitos diferentes:

```
c:\develop\bmad-method\               ← repo raiz (monorepo)
  .github/workflows/
    ci.yml                            ← CI integrado (backend + frontend + Docker)
    deploy.yml                        ← Deploy produção (EC2 + S3/CloudFront)

  fracexec/
    fracexec-api/
      .github/workflows/
        ci.yml                        ← CI standalone do backend
      sonar-project.properties        ← Config SonarCloud do backend
      pom.xml                         ← JaCoCo já configurado

    fracexec-web/
      .github/workflows/
        ci.yml                        ← CI standalone do frontend
      sonar-project.properties        ← Config SonarCloud do frontend
      angular.json                    ← configuração `ci` com coverage
```

### Por que três camadas?

| Camada | Arquivo | Quando usar |
|--------|---------|-------------|
| **Raiz** | `.github/workflows/ci.yml` | **Caso principal.** O repo GitHub é `bmad-method` (ou qualquer nome que englobe `fracexec/`). Os paths `working-directory` apontam para cada subpasta. Um único CI cuida de tudo. |
| **Raiz** | `.github/workflows/deploy.yml` | Deploy disparado automaticamente após o CI da raiz passar em `main`. |
| **Componente** | `fracexec-api/.github/workflows/ci.yml` | Caso alternativo: você extraiu o backend para um repo separado (ex.: `fracexec-api`). O CI roda na raiz desse repo, sem prefixo de path. |
| **Componente** | `fracexec-web/.github/workflows/ci.yml` | Idem para o frontend em repo separado. |

> **Regra prática:** use o CI da **raiz** enquanto tiver um único repo. Os CIs dos componentes são o plano B para quando/se separar os repos. Se o GitHub detectar ambos (raiz + componente), ambos vão rodar — o que duplica minutos sem ganho. Nesse caso, desative os dos componentes ou mova-os para `.github/workflows.disabled/`.

---

## Fluxo geral

```
push para develop ou main
        │
        ├─▶ job: backend  ──── mvn verify (JaCoCo) ──▶ SonarCloud Scan
        │
        ├─▶ job: frontend ──── ng test --coverage ───▶ ng build ──▶ SonarCloud Scan
        │
        └─▶ job: docker   (só em main, após backend + frontend passarem)
                  │
                  └─▶ Build + push ECR
                              │
                  [deploy.yml dispara automaticamente]
                              │
                    SSH deploy EC2 + S3 sync + CloudFront invalidate
```

O SonarCloud analisa **após os testes**, então o relatório de cobertura (JaCoCo / lcov) já está disponível para upload.

---

## Pré-requisitos

1. Repo no GitHub (público ou privado)
2. Conta no [SonarCloud](https://sonarcloud.io) (gratuito para repos públicos; plano Team ~€10/mês para privados)
3. Conta AWS (ECR, EC2, S3, CloudFront) — só necessária para o job `docker` e o `deploy.yml`

---

## Passo 1 — Criar o repositório no GitHub

```bash
cd c:\develop\bmad-method
git init          # se ainda não for um repo git
git add .
git commit -m "feat: initial commit"

# Criar e vincular (substitua ORG/REPO)
gh repo create ORG/fracexec --private --source=. --push
```

---

## Passo 2 — Configurar o SonarCloud

### 2.1 Criar a organização e os projetos

1. Acesse [sonarcloud.io](https://sonarcloud.io) e faça login com GitHub
2. Clique em **+** → **Analyze new project** → selecione seu repo
3. Em **Organization**, anote o slug (ex.: `minha-empresa`) — você vai usá-lo abaixo
4. Escolha **Set up with GitHub Actions** (o SonarCloud gera o token automaticamente)
5. Crie **dois projetos** separados:
   - `minha-empresa_fracexec-api`
   - `minha-empresa_fracexec-web`

> Se o repo for privado, o SonarCloud exige o plano pago. Uma alternativa gratuita para privados é [SonarQube Community Edition](https://www.sonarsource.com/open-source-editions/) auto-hospedado na EC2.

### 2.2 Atualizar os arquivos `sonar-project.properties`

Edite `fracexec/fracexec-api/sonar-project.properties`:
```properties
sonar.projectKey=minha-empresa_fracexec-api   # ← substituir
sonar.organization=minha-empresa              # ← substituir
```

Edite `fracexec/fracexec-web/sonar-project.properties`:
```properties
sonar.projectKey=minha-empresa_fracexec-web   # ← substituir
sonar.organization=minha-empresa              # ← substituir
```

### 2.3 Obter os tokens

Em cada projeto no SonarCloud: **Administration → Analysis Method → GitHub Actions** → copie o token gerado.

---

## Passo 3 — Configurar Secrets no GitHub

Vá em **Settings → Secrets and variables → Actions → New repository secret**:

### Secrets para SonarCloud (necessários agora)

| Secret | Valor |
|--------|-------|
| `SONAR_TOKEN_BACKEND` | Token do projeto `fracexec-api` no SonarCloud |
| `SONAR_TOKEN_FRONTEND` | Token do projeto `fracexec-web` no SonarCloud |

> `GITHUB_TOKEN` é gerado automaticamente pelo GitHub — não precisa criar.

### Secrets para AWS/deploy (adicionar antes de ativar o job `docker`)

| Secret | Valor | Onde obter |
|--------|-------|------------|
| `AWS_ACCESS_KEY_ID` | Access key do IAM User | AWS IAM Console |
| `AWS_SECRET_ACCESS_KEY` | Secret key do IAM User | AWS IAM Console |
| `EC2_HOST` | IP público ou DNS da instância | AWS EC2 Console |
| `EC2_SSH_KEY` | Conteúdo completo do arquivo `.pem` | EC2 Key Pairs |
| `CF_DISTRIBUTION_ID` | ID da distribuição CloudFront | AWS CloudFront Console |
| `DB_URL` | `jdbc:postgresql://RDS_ENDPOINT:5432/fracexec` | AWS RDS Console |
| `DB_PASSWORD` | Senha do banco | Definida ao criar o RDS |
| `JWT_SECRET` | String aleatória 64+ chars | `openssl rand -hex 32` |
| `SES_SMTP_USERNAME` | SMTP credentials do SES | AWS SES → SMTP Settings |
| `SES_SMTP_PASSWORD` | SMTP password do SES | AWS SES → SMTP Settings |
| `FRONTEND_URL` | `https://app.fracexec.com.br` | Seu domínio |
| `STRIPE_API_KEY` | `sk_live_...` | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe Dashboard → Webhooks |

Via CLI:
```bash
gh secret set SONAR_TOKEN_BACKEND  --body "sqp_..."
gh secret set SONAR_TOKEN_FRONTEND --body "sqp_..."
```

---

## Passo 4 — Quality Gates do SonarCloud

O SonarCloud aplica o **Sonar Way** (gate padrão) automaticamente. Para o FracExec, recomendamos ajustar as condições em cada projeto:

### Backend (`fracexec-api`)

Em **Administration → Quality Gates → Create** (ou edite o Sonar Way):

| Métrica | Condição | Threshold |
|---------|----------|-----------|
| Coverage on New Code | `<` | 70% |
| Duplicated Lines on New Code | `>` | 5% |
| Maintainability Rating on New Code | worse than | B |
| Reliability Rating on New Code | worse than | A |
| Security Rating on New Code | worse than | A |
| Security Hotspots Reviewed | `<` | 100% |

O JaCoCo já está configurado no `pom.xml` com gate local de 60% de cobertura de linhas e 50% de branches. O SonarCloud vai além e analisa dívida técnica, code smells e hotspots de segurança.

Exclusões já configuradas no `sonar-project.properties` (não contam para cobertura):
- `**/config/**` — classes de configuração Spring
- `**/*Application.java` — entry point
- `**/db/migration/**` — scripts SQL do Flyway

### Frontend (`fracexec-web`)

| Métrica | Condição | Threshold |
|---------|----------|-----------|
| Coverage on New Code | `<` | 60% |
| Duplicated Lines on New Code | `>` | 5% |
| Maintainability Rating on New Code | worse than | B |
| Reliability Rating on New Code | worse than | A |
| Security Rating on New Code | worse than | A |

> Coverage 60% para o frontend é razoável dado que Angular components com template têm parte da lógica em HTML — o lcov só captura TypeScript.

Para associar o gate ao projeto: **Administration → Quality Gate → selecionar seu gate customizado**.

---

## Passo 5 — Verificar que o CI está rodando

Após o primeiro push, vá em **Actions** no GitHub:

```
✓ CI — Build & Test
    ├─ backend   ── Tests: 80 passed ── SonarCloud: Quality Gate passed
    ├─ frontend  ── Build: OK ── SonarCloud: Quality Gate passed
    └─ docker    ── (só em main) Image pushed to ECR
```

Se o Quality Gate **falhar**, o SonarCloud comenta no PR com os problemas encontrados e o job retorna exit code 1, bloqueando o merge.

---

## Passo 6 — Verificar localmente

```bash
# Backend — reproduz exatamente o que o CI faz
cd fracexec/fracexec-api
mvn verify -q
# Relatório de cobertura gerado em: target/site/jacoco/index.html

# Frontend — com coverage
cd fracexec/fracexec-web
npx ng test --configuration=ci --watch=false
# Relatório gerado em: coverage/index.html
```

---

## Proteção de branches (recomendado)

Em **Settings → Branches → Add branch ruleset** para `main`:

- [x] Require status checks to pass before merging
  - `backend` (CI — Build & Test)
  - `frontend` (CI — Build & Test)
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings

---

## Controle de minutos (repo privado)

O plano gratuito inclui **2.000 minutos Linux/mês**. Estimativa por push para `main`:

| Job | Tempo estimado |
|-----|----------------|
| backend: `mvn verify` + SonarCloud | 4–5 min |
| frontend: `ng test` + `ng build` + SonarCloud | 3–4 min |
| docker: build + push ECR | 2–3 min |
| deploy: EC2 SSH + S3 sync + CloudFront | 2 min |
| **Total por push completo** | **~11–14 min** |

Push para `develop` não aciona `docker` nem `deploy` — ~8–9 min.

Com 2.000 min/mês: **~140–180 pushes para `main`** sem custo extra.

Monitorar consumo: **Settings → Billing → Actions minutes**.

---

## Troubleshooting comum

**`./mvnw: Permission denied`**
```bash
git update-index --chmod=+x fracexec/fracexec-api/mvnw
git commit -m "fix: mvnw executable permission"
```

**SonarCloud: `SONAR_TOKEN` not set**
Confirme que o secret se chama `SONAR_TOKEN_BACKEND` ou `SONAR_TOKEN_FRONTEND` exatamente (case-sensitive) e que está na aba **Actions secrets**, não **Codespaces secrets**.

**SonarCloud: cobertura zerada no relatório**
O `mvn verify` precisa rodar antes do step do Sonar — o JaCoCo só gera o XML na fase `verify`. Confirme que o CI usa `mvn verify` e não `mvn test`.

**Frontend: `ng test --configuration=ci` falha**
A configuração `ci` foi adicionada ao `angular.json`. Se estiver usando o CI dos componentes, confirme que o arquivo foi commitado.

**Quality Gate falhou por cobertura insuficiente em código existente**
Na primeira análise, o SonarCloud avalia **todo o código**. Para projetos em andamento, configure o gate para analisar apenas **New Code** (código alterado nos últimos 30 dias ou desde uma data de referência). Em **Administration → New Code** → selecione **Previous version** ou uma data específica.

**Job `docker` falha por falta de secrets AWS**
O job `docker` só roda em `main`. Se os secrets AWS não estiverem configurados ainda, adicione uma condição `if: false` temporariamente ou configure os secrets antes de fazer merge.
