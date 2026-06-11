# FracExec — Relatório de Gaps AWS

**Data:** 2026-06-11
**Status:** Epic 7 em andamento — conta AWS ainda não criada
**Referência de infra:** `aws-infrastructure.md`

---

## Resumo executivo

Das 5 stories do Epic 7, **4 podem ser desenvolvidas agora** (código Terraform, workflows, configurações). Apenas a **execução dos recursos na AWS** está bloqueada pela ausência de conta. A Story 7.5 pode ser **100% concluída** sem conta AWS.

| Story | Pode fazer agora | Bloqueado pela AWS |
|-------|-----------------|-------------------|
| 7.1 Terraform Networking + Compute | ✅ Escrever HCL completo + validar sintaxe | `terraform apply` |
| 7.2 Terraform Database + Storage | ✅ Escrever HCL completo + validar sintaxe | `terraform apply` |
| 7.3 Terraform CloudFront + DNS | ✅ Escrever HCL + nginx conf + certbot script | `terraform apply`, IP alocado para Certbot |
| 7.4 Pipeline CI/CD | ✅ Escrever workflows, Dockerfile, deploy.sh | Preencher GitHub Secrets |
| 7.5 application-prod.yml + código | ✅ **100% implementável e testável** | Valores reais dos SSM params |

---

## Gaps detalhados

### GAP-01 — Conta AWS não criada
**Impacto:** Bloqueia `terraform apply` em todas as stories 7.1–7.4.
**Stories afetadas:** 7.1, 7.2, 7.3, 7.4
**Ação necessária:**
1. Criar conta em https://aws.amazon.com/free/
2. Ativar MFA no root account
3. Criar IAM user administrativo (nunca usar root para deploys)
4. Criar IAM user de CI/CD com permissões mínimas (ECR push, S3 sync, CloudFront invalidation)
5. Salvar `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` do CI/CD user nos GitHub Secrets

---

### GAP-02 — Terraform state backend (S3 + DynamoDB)
**Impacto:** `terraform init` com backend S3 falha sem o bucket de estado criado.
**Stories afetadas:** 7.1 (e consequentemente 7.2, 7.3)
**Ação necessária:**
1. Criar manualmente o bucket S3 para o Terraform state: `fracexec-terraform-state`
2. Criar tabela DynamoDB para lock: `fracexec-terraform-lock`
3. Descomentar e preencher o bloco `backend "s3"` em `main.tf`
> **Nota:** Esses recursos são criados fora do Terraform (chicken-and-egg problem) — usar AWS Console ou AWS CLI.

---

### GAP-03 — ECR Repository
**Impacto:** O job `deploy-backend` do GitHub Actions não consegue fazer push da imagem Docker.
**Stories afetadas:** 7.4
**Ação necessária:**
1. Criar o ECR repository `fracexec-api` (pode ser via Terraform na Story 7.1 ou manualmente)
2. Adicionar ao módulo `compute/main.tf`:
```hcl
resource "aws_ecr_repository" "fracexec_api" {
  name                 = "fracexec-api"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
}
```

---

### GAP-04 — SES — verificação de domínio/e-mail e saída do sandbox
**Impacto:** E-mails transacionais (8 eventos do sistema) não são enviados em produção.
**Stories afetadas:** 7.5 (SSM params SES)
**Ação necessária:**
1. Verificar o domínio `fracexec.com.br` no SES (ou e-mail `no-reply@fracexec.com.br` se ainda sem domínio)
2. Solicitar saída do SES Sandbox (processo de aprovação AWS — pode levar 1–2 dias úteis)
   - Preencher formulário em SES Console → "Request production access"
   - Descrever caso de uso: e-mails transacionais B2B, máximo ~500/dia no MVP
3. Criar IAM credentials SMTP no SES Console (gera `SES_SMTP_USERNAME` e `SES_SMTP_PASSWORD`)
4. Salvar as credenciais no SSM: `/fracexec/prod/SES_SMTP_USERNAME` e `/fracexec/prod/SES_SMTP_PASSWORD`
> **Risco:** Enquanto no SES Sandbox, só é possível enviar para e-mails verificados. Aprovar saída do sandbox antes do go-live.

---

### GAP-05 — Stripe — conta e chaves de produção
**Impacto:** Pagamentos, webhooks e repasses não funcionam em produção.
**Stories afetadas:** 7.5 (SSM params Stripe)
**Ação necessária:**
1. Criar conta Stripe Connect em https://dashboard.stripe.com/register
2. Completar verificação KYC da plataforma (pode levar 1–5 dias úteis)
3. Ativar o modelo Stripe Connect Marketplace
4. Copiar `sk_live_...` (Stripe API Key) e salvar no SSM: `/fracexec/prod/STRIPE_API_KEY`
5. Configurar webhook endpoint: `https://<cloudfront-domain>/api/v1/webhooks/stripe`
6. Copiar `whsec_...` (Webhook Secret) e salvar no SSM: `/fracexec/prod/STRIPE_WEBHOOK_SECRET`
> **Nota:** Para testes pré-conta-AWS, continuar usando `sk_test_...` no ambiente local.

---

### GAP-06 — EC2 Elastic IP + DNS sslip.io + Let's Encrypt
**Impacto:** Nginx não pode obter certificado SSL sem IP alocado e DNS resolvendo.
**Stories afetadas:** 7.3
**Ação necessária:**
1. Após `terraform apply` da Story 7.1, anotar o Elastic IP alocado (output `ec2_elastic_ip`)
2. Certificado Certbot: o domínio será `<X-X-X-X>.sslip.io` onde `X-X-X-X` é o IP com hífens
   - Ex: IP `54.123.45.67` → domínio `54-123-45-67.sslip.io`
3. SSH na EC2 e executar: `bash /opt/fracexec/scripts/certbot-setup.sh 54-123-45-67.sslip.io`
4. Atualizar o SSM `/fracexec/prod/FRONTEND_URL` com a URL do CloudFront

---

### GAP-07 — RDS endpoint e senha do banco
**Impacto:** A aplicação não consegue conectar ao banco de dados em produção.
**Stories afetadas:** 7.5 (SSM params RDS), 7.2 (apply)
**Ação necessária:**
1. Gerar senha forte (≥ 16 chars): `openssl rand -base64 20 | tr -d '=+/'`
2. Salvar no SSM **antes** do `terraform apply`: `/fracexec/prod/DB_PASSWORD`
3. Após `terraform apply` da Story 7.2, copiar o RDS endpoint (output `rds_endpoint`)
4. Salvar no SSM: `/fracexec/prod/DB_URL = jdbc:postgresql://<rds_endpoint>:5432/fracexec`
5. Salvar no SSM: `/fracexec/prod/DB_USERNAME = fracexec`

---

### GAP-08 — JWT Secret
**Impacto:** Tokens JWT não são gerados/validados em produção.
**Stories afetadas:** 7.5
**Ação necessária:**
1. Gerar secret HMAC-SHA256 de pelo menos 32 chars: `openssl rand -hex 32`
2. Salvar no SSM: `/fracexec/prod/JWT_SECRET = <valor gerado>`

---

### GAP-09 — GitHub Secrets preenchidos
**Impacto:** Pipeline CD não consegue fazer deploy.
**Stories afetadas:** 7.4
**Ação necessária:** Após resolver GAPs 01, 03, 06 e o Terraform apply:

| Secret GitHub | Origem |
|--------------|--------|
| `AWS_ACCESS_KEY_ID` | GAP-01 (IAM user CI/CD) |
| `AWS_SECRET_ACCESS_KEY` | GAP-01 (IAM user CI/CD) |
| `EC2_HOST` | Output Terraform `ec2_elastic_ip` (GAP-06) |
| `EC2_SSH_KEY` | Key pair criado durante Terraform apply |
| `CF_DISTRIBUTION_ID` | Output Terraform `cloudfront_distribution_id` |

---

## Ordem recomendada de execução (quando conta AWS for criada)

```
Dia 1
  ├── Criar conta AWS + MFA + IAM users (GAP-01)
  ├── Criar bucket Terraform state + DynamoDB lock (GAP-02)
  ├── Iniciar processo SES sandbox removal (GAP-04) — pode levar dias
  └── Iniciar verificação KYC Stripe (GAP-05) — pode levar dias

Dia 2
  ├── terraform apply 7.1 (networking + compute)
  ├── terraform apply 7.2 (database + storage)   [após 7.1]
  └── terraform apply 7.3 (CloudFront + DNS)     [após 7.2]

Dia 3
  ├── SSH na EC2 → certbot-setup.sh (GAP-06)
  ├── Preencher todos os SSM parameters (GAPs 04, 05, 07, 08)
  ├── Preencher GitHub Secrets (GAP-09)
  └── Push na main → primeiro deploy automatizado

Dia 4
  └── Smoke tests em produção + validar 8 eventos de e-mail + validar Stripe webhook
```

---

## O que está 100% pronto (sem conta AWS)

- [x] Todos os arquivos Terraform (HCL) escritos e com `terraform validate` passando
- [x] `bootstrap-ec2.sh` e `certbot-setup.sh`
- [x] `nginx-prod.conf`
- [x] `.github/workflows/ci.yml` e `deploy.yml`
- [x] `deploy.sh` e `docker-compose.prod.yml`
- [x] `Dockerfile` da API (multi-stage)
- [x] `application-prod.yml` com todas as env vars
- [x] `MinioConfig.java` com suporte a IAM Role
- [x] `environment.prod.ts` Angular com path relativo
- [x] `README-secrets.md` e `README-ssm.md` documentados
- [x] `mvn verify` passando com perfil `test`
