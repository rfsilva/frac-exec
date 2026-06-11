# Story 7.4: Pipeline CI/CD — GitHub Actions

## Status
ready-for-dev

## Story

**Como** desenvolvedor,
**Quero** um pipeline CI/CD automatizado no GitHub Actions,
**Para que** todo push na branch `main` construa, teste e faça deploy automático da API e do frontend em produção.

## Context

O projeto já tem GitHub Actions configurado parcialmente (ci.yml foi criado na Story 6.4). Esta story consolida o CI completo e adiciona o CD (deploy para AWS). O pipeline usa ECR para imagens Docker, S3+CloudFront para o frontend Angular, e SSH para orquestrar o restart da API na EC2.

**NOTA DE GAP:** Os workflows podem ser escritos e commitados agora. Os GitHub Secrets e o `terraform apply` precisam de conta AWS. Veja `bmad-output/planning-artifacts/aws-gaps-report.md`.

## Acceptance Criteria

### AC1 — CI workflow (`ci.yml`) — backend
**Dado** `.github/workflows/ci.yml`,
**Então** o job `backend` executa em `ubuntu-latest` em todo PR para `main` ou `develop` e em push para `main`:
- Checkout do código
- Setup Java 21 (Temurin distribution)
- Cache do Maven (`~/.m2/repository`)
- `mvn verify -f fracexec/fracexec-api/pom.xml` com `SPRING_PROFILES_ACTIVE=test`
- Upload do relatório JaCoCo como artifact em caso de falha

### AC2 — CI workflow — frontend
**Dado** `.github/workflows/ci.yml`,
**Então** o job `frontend` executa em paralelo com `backend`:
- Checkout do código
- Setup Node.js 22 com cache npm
- `npm ci` no diretório `fracexec/fracexec-web`
- `npx ng build --configuration=production`
- Upload do `dist/` como artifact (usado pelo job de deploy)

### AC3 — CD workflow — deploy-backend
**Dado** `.github/workflows/deploy.yml`,
**Então** o job `deploy-backend` executa apenas em push para `main`, após CI passar (`needs: [ci]`):
- Configura credenciais AWS via `aws-actions/configure-aws-credentials@v4` usando secrets `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY`
- Login no ECR via `aws-actions/amazon-ecr-login@v2`
- Build da imagem Docker com tags `${{ github.sha }}` e `latest`
- Push da imagem para ECR (`$ECR_REGISTRY/fracexec-api`)
- SSH na EC2 (`secrets.EC2_HOST`) com a chave `secrets.EC2_SSH_KEY`, executando `deploy.sh` com variáveis de ambiente `IMAGE_TAG` e `ECR_REGISTRY`

### AC4 — CD workflow — deploy-frontend
**Dado** `.github/workflows/deploy.yml`,
**Então** o job `deploy-frontend` executa em paralelo com `deploy-backend`:
- Build Angular production
- Sync `dist/fracexec-web/browser/` para `s3://fracexec-web-prod` com `aws s3 sync --delete`
- Invalidação de cache CloudFront: `aws cloudfront create-invalidation --paths "/*"` usando `secrets.CF_DISTRIBUTION_ID`

### AC5 — Script `deploy.sh` na EC2
**Dado** `fracexec/infra/scripts/deploy.sh`,
**Então** o script:
- Faz login no ECR via `aws ecr get-login-password`
- Faz `docker pull $ECR_REGISTRY/fracexec-api:$IMAGE_TAG`
- Busca secrets do SSM em `/fracexec/prod/*` e gera `/opt/fracexec/.env`
- Executa `docker compose -f docker-compose.prod.yml up -d api`
- Executa `docker image prune -f` para limpar imagens antigas
- Tem `set -e` (falha imediatamente em caso de erro)

### AC6 — `docker-compose.prod.yml`
**Dado** `fracexec/docker-compose.prod.yml`,
**Então** define apenas o serviço `api`:
- `image: ${ECR_REGISTRY}/fracexec-api:${IMAGE_TAG}`
- `env_file: .env`
- `ports: ["8080:8080"]`
- `restart: unless-stopped`
- `healthcheck` em `localhost:8080/actuator/health`
- Volumes para logs: `/var/log/fracexec:/var/log/fracexec`

### AC7 — Dockerfile da API
**Dado** `fracexec/fracexec-api/Dockerfile`,
**Então**:
- Multi-stage: stage `build` usa `maven:3.9-eclipse-temurin-21` para `mvn package -DskipTests`
- Stage final usa `eclipse-temurin:21-jre-alpine`
- Copia o JAR e define `ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]`
- `EXPOSE 8080`

### AC8 — Documentação de GitHub Secrets necessários
**Dado** `fracexec/infra/README-secrets.md`,
**Então** documenta todos os secrets que devem ser configurados no repositório GitHub:
| Secret | Descrição |
|--------|-----------|
| `AWS_ACCESS_KEY_ID` | IAM user para CI/CD (não o da EC2) |
| `AWS_SECRET_ACCESS_KEY` | IAM user para CI/CD |
| `EC2_HOST` | Elastic IP da EC2 |
| `EC2_SSH_KEY` | Chave PEM privada para SSH na EC2 |
| `CF_DISTRIBUTION_ID` | ID da distribuição CloudFront |
> **GAP:** Todos esses secrets dependem de recursos AWS provisionados.

### AC9 — `.github/workflows/` commitados
**Dado** o repositório,
**Então** os arquivos `ci.yml` e `deploy.yml` estão commitados e a aba Actions do GitHub mostra os workflows (mesmo que falhem por falta de secrets).

## Technical Notes

- O IAM user para CI/CD (`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`) deve ter apenas as permissões mínimas: ECR push, S3 sync no bucket web, CloudFront invalidation — criar policy específica via Terraform
- Nunca usar `aws-actions/configure-aws-credentials` com credenciais de longa duração no EC2 — a instância usa IAM Role (sem chaves)
- O `deploy.sh` gera o `.env` dinamicamente do SSM a cada deploy — nunca commitar `.env` de prod
- O SSH no step de deploy deve usar `-o StrictHostKeyChecking=no` apenas na primeira conexão; considerar usar `known_hosts` fixo para ambientes maduros

## Tasks

- [ ] Criar/atualizar `.github/workflows/ci.yml`
- [ ] Criar `.github/workflows/deploy.yml`
- [ ] Criar `fracexec/infra/scripts/deploy.sh`
- [ ] Criar `fracexec/docker-compose.prod.yml`
- [ ] Criar `fracexec/fracexec-api/Dockerfile`
- [ ] Criar `fracexec/infra/README-secrets.md`
- [ ] Verificar sintaxe dos workflows com `actionlint` (se disponível)

## Dev Notes

- **GAPs desta story:** GitHub Secrets não podem ser preenchidos sem conta AWS. Os arquivos de workflow podem ser commitados; o primeiro run bem-sucedido de CD só ocorrerá após os gaps AWS serem resolvidos.
- Story 7.4 pode ser desenvolvida em paralelo com 7.1, 7.2, 7.3 — não há dependência de código entre elas.
