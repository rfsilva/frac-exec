# FracExec — Arquitetura de Infraestrutura AWS (Free Tier)

**Versão:** 1.0  
**Data:** 2026-06-03  
**Autor:** BMAD Engineering  
**Épico de implementação:** Epic 7 (após Epic 6)

---

## 1. Contexto e Restrições

### 1.1 Stack atual (desenvolvimento local)

| Serviço | Tecnologia | Porta |
|---------|-----------|-------|
| Backend API | Spring Boot 3.5.1 + Java 21 (Docker) | 8080 |
| Frontend SPA | Angular 21 + Nginx (Docker) | 80 |
| Banco de dados | PostgreSQL 16 (Docker) | 5432 |
| Object storage | MinIO (S3-compatible) | 9000/9001 |
| SMTP (dev) | Mailpit | 1025/8025 |

### 1.2 Restrições do Free Tier AWS

O free tier AWS divide-se em dois tipos:

**12 meses gratuitos (expiram após a criação da conta):**
- EC2 t2.micro — 750 horas/mês
- RDS t3.micro — 750 horas/mês + 20 GB SSD + 20 GB backup
- S3 — 5 GB storage + 20.000 GET + 2.000 PUT

**Gratuitos permanentes (não expiram):**
- CloudFront — 1 TB transfer/mês + 10M requests/mês
- SES — 62.000 e-mails/mês enviados de EC2
- SSM Parameter Store (Standard) — 10.000 parâmetros
- ECR — 500 MB/mês de imagens Docker
- GitHub Actions — 2.000 min/mês (repo público) ou 500 min (privado)
- CloudWatch — 10 métricas custom, 5 GB logs/mês, 3 dashboards

### 1.3 O que fica fora do free tier

| Item | Custo estimado | Alternativa gratuita |
|------|---------------|---------------------|
| Route 53 Hosted Zone | ~$0,50/mês | Usar IP elástico + **sslip.io** para DNS gratuito baseado em IP |
| Certificado SSL (ACM) | Gratuito, mas exige domínio | **Let's Encrypt + Certbot** na EC2 — 100% gratuito |
| NAT Gateway | ~$32/mês | Sem NAT — EC2 em subnet pública com Security Group restritivo |
| Multi-AZ RDS | 2x custo | Aceitar single-AZ para MVP |
| Elastic Load Balancer | ~$16/mês | CloudFront aponta direto para EC2 via IP elástico |

---

## 2. Arquitetura Proposta

### 2.1 Diagrama

```
                        INTERNET
                           │
              ┌────────────┴────────────┐
              │                         │
    ┌─────────▼──────────┐    ┌─────────▼──────────┐
    │   CloudFront CDN   │    │   S3 Static Website │
    │  (HTTPS + cache)   │    │   fracexec-web/     │
    │  *.sslip.io        │    │   (Angular SPA)     │
    └─────────┬──────────┘    └────────────────────┘
              │ /api/v1/*
    ┌─────────▼──────────────────────────────────┐
    │            VPC (10.0.0.0/16)               │
    │                                            │
    │  ┌──────────────────────────────────────┐  │
    │  │        Public Subnet (10.0.1.0/24)   │  │
    │  │                                      │  │
    │  │  ┌─────────────────────────────┐     │  │
    │  │  │   EC2 t2.micro              │     │  │
    │  │  │   Elastic IP                │     │  │
    │  │  │   ┌──────────────────────┐  │     │  │
    │  │  │   │  Docker              │  │     │  │
    │  │  │   │  fracexec-api:8080   │  │     │  │
    │  │  │   └──────────────────────┘  │     │  │
    │  │  │   Certbot (Let's Encrypt)   │     │  │
    │  │  │   Nginx (reverse proxy)     │     │  │
    │  │  └─────────────────────────────┘     │  │
    │  └──────────────────────────────────────┘  │
    │                                            │
    │  ┌──────────────────────────────────────┐  │
    │  │       Private Subnet (10.0.2.0/24)   │  │
    │  │                                      │  │
    │  │  ┌─────────────────────────────┐     │  │
    │  │  │   RDS PostgreSQL t3.micro   │     │  │
    │  │  │   (single-AZ, 20 GB SSD)   │     │  │
    │  │  └─────────────────────────────┘     │  │
    │  └──────────────────────────────────────┘  │
    │                                            │
    └────────────────────────────────────────────┘

    S3 Buckets (fora da VPC, acesso via IAM Role):
      fracexec-docs        (documentos de suporte — admin only)
      fracexec-profiles    (fotos de executivos)
      fracexec-contracts   (PDFs de contratos)

    SES:   e-mails transacionais (SMTP TLS porta 587)
    SSM:   secrets (DB_PASSWORD, JWT_SECRET, STRIPE_KEY, etc.)
    ECR:   imagens Docker (fracexec-api)
    CloudWatch: logs + métricas básicas
```

### 2.2 Fluxo de uma requisição

```
Usuário browser
    → HTTPS *.sslip.io (CloudFront)
    → CloudFront origin: S3 (arquivos estáticos Angular)
    → Angular SPA faz fetch /api/v1/...
    → CloudFront behavior /api/v1/* → origin: EC2 Elastic IP porta 443
    → Nginx na EC2 termina SSL (Let's Encrypt) → proxy_pass localhost:8080
    → Spring Boot responde
    → Spring Boot acessa RDS (subnet privada, porta 5432)
    → Spring Boot acessa S3 via IAM Role (uploads/downloads)
    → Spring Boot envia e-mail via SES SMTP
```

---

## 3. Mudanças de Código Necessárias

### 3.1 Sem impacto de código (só configuração)

| Item | Status | Detalhe |
|------|--------|---------|
| AWS SDK S3 | ✅ Já compatível | `MinioConfig.java` usa `software.amazon.awssdk.services.s3` — basta remover `endpointOverride` em prod |
| Spring Mail → SES | ✅ Já compatível | SES suporta SMTP padrão — apenas mudar `host`, `port`, `username`, `password` |
| CORS CloudFront | ✅ Já compatível | `SecurityConfig` lê `${fracexec.cors.allowed-origins}` — adicionar domínio CF na env var |
| JDBC → RDS | ✅ Já compatível | Mesma URL format `jdbc:postgresql://...` |

### 3.2 Mudanças necessárias (Story 6.4 ou Epic 7)

#### 3.2.1 `application-prod.yml` (novo arquivo)

```yaml
spring:
  datasource:
    url: ${DB_URL}          # jdbc:postgresql://rds-endpoint:5432/fracexec
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate    # nunca create/update em produção
  mail:
    host: email-smtp.us-east-1.amazonaws.com
    port: 587
    username: ${SES_SMTP_USERNAME}
    password: ${SES_SMTP_PASSWORD}
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true

fracexec:
  cors:
    allowed-origins: ${FRONTEND_URL}    # URL do CloudFront
  minio:
    endpoint: ""                         # vazio = S3 nativo
    access-key: ""                       # vazio = IAM Role (sem credenciais hardcoded)
    secret-key: ""
    buckets:
      docs: fracexec-docs-prod
      profiles: fracexec-profiles-prod
      contracts: fracexec-contracts-prod
  jwt:
    secret: ${JWT_SECRET}
    access-token-expiration-ms: 900000
    refresh-token-expiration-days: 7
  app:
    base-url: ${FRONTEND_URL}
  stripe:
    api-key: ${STRIPE_API_KEY}
    webhook-secret: ${STRIPE_WEBHOOK_SECRET}

logging:
  pattern:
    console: ""              # desabilitado em prod
  file:
    name: /var/log/fracexec/app.log
  level:
    root: WARN
    com.fracexec: INFO
```

#### 3.2.2 `MinioConfig.java` — suporte a S3 nativo

O `endpointOverride` deve ser condicional — se o endpoint estiver vazio, usa S3 nativo da AWS:

```java
// Trecho a modificar em MinioConfig.java
@Bean
public S3Client s3Client(StaticCredentialsProvider minioCredentials) {
    var builder = S3Client.builder()
        .credentialsProvider(
            endpoint.isBlank()
                ? DefaultCredentialsProvider.create()  // IAM Role em prod
                : minioCredentials                      // chaves em dev/local
        )
        .region(Region.of(awsRegion));

    if (!endpoint.isBlank()) {
        builder.endpointOverride(URI.create(endpoint)).forcePathStyle(true);
    }
    return builder.build();
}
```

> **Nota:** Em produção na EC2, o `DefaultCredentialsProvider` automaticamente usa as credenciais da IAM Role attached à instância — sem chaves hardcoded, sem SSM para as credenciais S3.

#### 3.2.3 Nginx na EC2 — `nginx-prod.conf`

```nginx
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name <elastic-ip>.sslip.io;

    ssl_certificate     /etc/letsencrypt/live/<domain>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<domain>/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    location /api/v1/ {
        proxy_pass         http://localhost:8080;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto https;
    }

    location /actuator/health {
        proxy_pass http://localhost:8080/actuator/health;
        allow 10.0.0.0/8;  # só VPC interna
        deny all;
    }
}
```

### 3.3 Itens que NÃO mudam

- Flyway migrations — rodam identicamente em RDS PostgreSQL
- Lógica de negócio — zero impacto
- Stripe webhooks — mesma configuração, URL muda para o domínio prod
- Frontend Angular — apenas `environment.prod.ts` com a URL da API

---

## 4. Infraestrutura como Código — Terraform

### 4.1 Escolha: Terraform vs CloudFormation

| Critério | Terraform | CloudFormation |
|----------|-----------|---------------|
| Portabilidade | Multi-cloud | AWS only |
| State management | Arquivo `.tfstate` (S3 backend) | Gerenciado pela AWS |
| Curva de aprendizado | Média | Média |
| Free tier | ✅ Open source | ✅ Gratuito |
| HCL legível | ✅ | JSON/YAML verboso |

**Decisão: Terraform** — mais portátil, HCL mais legível, facilita migração futura se necessário.

### 4.2 Estrutura dos módulos Terraform

```
fracexec/
└── infra/
    ├── terraform/
    │   ├── main.tf              # provider, backend
    │   ├── variables.tf         # variáveis parametrizadas
    │   ├── outputs.tf           # IPs, endpoints, ARNs
    │   │
    │   ├── modules/
    │   │   ├── networking/      # VPC, subnets, security groups, IGW
    │   │   │   ├── main.tf
    │   │   │   └── variables.tf
    │   │   │
    │   │   ├── compute/         # EC2, Elastic IP, IAM Role, SSM
    │   │   │   ├── main.tf
    │   │   │   └── variables.tf
    │   │   │
    │   │   ├── database/        # RDS PostgreSQL
    │   │   │   ├── main.tf
    │   │   │   └── variables.tf
    │   │   │
    │   │   ├── storage/         # S3 buckets (docs, profiles, contracts, web)
    │   │   │   ├── main.tf
    │   │   │   └── variables.tf
    │   │   │
    │   │   └── cdn/             # CloudFront distribution
    │   │       ├── main.tf
    │   │       └── variables.tf
    │   │
    │   └── environments/
    │       └── prod/
    │           └── terraform.tfvars   # valores de prod (não comitar secrets)
    │
    └── scripts/
        ├── bootstrap-ec2.sh     # userdata: instala Docker, Nginx, Certbot
        └── deploy.sh            # pull imagem ECR + docker compose up
```

### 4.3 Trechos Terraform chave

#### `modules/networking/main.tf`
```hcl
resource "aws_vpc" "fracexec" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = { Name = "fracexec-vpc" }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.fracexec.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "${var.aws_region}a"
}

resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.fracexec.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}a"
}

resource "aws_security_group" "ec2" {
  vpc_id = aws_vpc.fracexec.id
  ingress { from_port = 443; to_port = 443; protocol = "tcp"; cidr_blocks = ["0.0.0.0/0"] }
  ingress { from_port = 80;  to_port = 80;  protocol = "tcp"; cidr_blocks = ["0.0.0.0/0"] }
  ingress { from_port = 22;  to_port = 22;  protocol = "tcp"; cidr_blocks = [var.admin_ip_cidr] }
  egress  { from_port = 0;   to_port = 0;   protocol = "-1";  cidr_blocks = ["0.0.0.0/0"] }
}

resource "aws_security_group" "rds" {
  vpc_id = aws_vpc.fracexec.id
  ingress {
    from_port       = 5432; to_port = 5432; protocol = "tcp"
    security_groups = [aws_security_group.ec2.id]   # só EC2 acessa
  }
}
```

#### `modules/compute/main.tf`
```hcl
resource "aws_instance" "api" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = "t2.micro"
  subnet_id              = var.public_subnet_id
  vpc_security_group_ids = [var.ec2_sg_id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  user_data              = file("${path.module}/../../scripts/bootstrap-ec2.sh")
  tags = { Name = "fracexec-api" }
}

resource "aws_eip" "api" {
  instance = aws_instance.api.id
  domain   = "vpc"
}

# IAM Role com acesso a S3, SSM, SES, ECR, CloudWatch
resource "aws_iam_role" "ec2_role" {
  name               = "fracexec-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
}

resource "aws_iam_role_policy_attachment" "ssm_policy" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}
```

#### `modules/database/main.tf`
```hcl
resource "aws_db_instance" "fracexec" {
  identifier             = "fracexec-db"
  engine                 = "postgres"
  engine_version         = "16.3"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  storage_type           = "gp2"
  db_name                = "fracexec"
  username               = "fracexec"
  password               = var.db_password        # via tfvars + SSM
  db_subnet_group_name   = aws_db_subnet_group.fracexec.name
  vpc_security_group_ids = [var.rds_sg_id]
  skip_final_snapshot    = false
  deletion_protection    = true
  backup_retention_period = 7
  publicly_accessible    = false
  tags = { Name = "fracexec-db" }
}
```

#### `modules/storage/main.tf`
```hcl
locals {
  buckets = ["fracexec-docs-prod", "fracexec-profiles-prod",
             "fracexec-contracts-prod"]
}

resource "aws_s3_bucket" "app_buckets" {
  for_each = toset(local.buckets)
  bucket   = each.key
}

resource "aws_s3_bucket_public_access_block" "app_buckets" {
  for_each                = aws_s3_bucket.app_buckets
  bucket                  = each.value.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket web — público via CloudFront
resource "aws_s3_bucket" "web" {
  bucket = "fracexec-web-prod"
}

resource "aws_s3_bucket_website_configuration" "web" {
  bucket = aws_s3_bucket.web.id
  index_document { suffix = "index.html" }
  error_document  { key    = "index.html" }   # SPA fallback
}
```

---

## 5. Pipeline GitHub Actions

### 5.1 CI — `.github/workflows/ci.yml`

```yaml
name: CI
on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '21', distribution: 'temurin' }
      - run: mvn test -f fracexec/fracexec-api/pom.xml
        env:
          SPRING_PROFILES_ACTIVE: test

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
        working-directory: fracexec/fracexec-web
      - run: npx ng build --configuration=production
        working-directory: fracexec/fracexec-web
```

### 5.2 CD — `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: fracexec-api

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    needs: [backend, frontend]   # só deploya se CI passou
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id:     ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG \
                       -t $ECR_REGISTRY/$ECR_REPOSITORY:latest \
                       fracexec/fracexec-api
          docker push $ECR_REGISTRY/$ECR_REPOSITORY --all-tags

      - name: Deploy to EC2
        env:
          EC2_HOST: ${{ secrets.EC2_HOST }}
          EC2_KEY:  ${{ secrets.EC2_SSH_KEY }}
        run: |
          echo "$EC2_KEY" > /tmp/key.pem && chmod 600 /tmp/key.pem
          ssh -o StrictHostKeyChecking=no -i /tmp/key.pem ec2-user@$EC2_HOST \
            "AWS_REGION=${{ env.AWS_REGION }} \
             ECR_REGISTRY=${{ steps.login-ecr.outputs.registry }} \
             IMAGE_TAG=${{ github.sha }} \
             bash /opt/fracexec/scripts/deploy.sh"

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci && npx ng build --configuration=production
        working-directory: fracexec/fracexec-web

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id:     ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Sync to S3
        run: |
          aws s3 sync fracexec/fracexec-web/dist/fracexec-web/browser \
            s3://fracexec-web-prod --delete

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CF_DISTRIBUTION_ID }} \
            --paths "/*"
```

### 5.3 Script `deploy.sh` na EC2

```bash
#!/bin/bash
set -e

# Pull nova imagem do ECR
aws ecr get-login-password --region $AWS_REGION \
  | docker login --username AWS --password-stdin $ECR_REGISTRY

docker pull $ECR_REGISTRY/fracexec-api:$IMAGE_TAG

# Atualizar .env de prod com secrets do SSM
aws ssm get-parameters-by-path \
  --path /fracexec/prod \
  --with-decryption \
  --query 'Parameters[*].[Name,Value]' \
  --output text \
  | awk '{gsub("/fracexec/prod/","",$1); print toupper($1)"="$2}' \
  > /opt/fracexec/.env

# Restart com nova imagem
cd /opt/fracexec
IMAGE_TAG=$IMAGE_TAG docker compose -f docker-compose.prod.yml up -d api
docker image prune -f
```

---

## 6. Secrets Management (SSM Parameter Store)

Todos os secrets são armazenados como `SecureString` no SSM:

| Parâmetro SSM | Env var | Descrição |
|--------------|---------|-----------|
| `/fracexec/prod/DB_URL` | `DB_URL` | JDBC URL do RDS |
| `/fracexec/prod/DB_PASSWORD` | `DB_PASSWORD` | Senha do PostgreSQL |
| `/fracexec/prod/JWT_SECRET` | `JWT_SECRET` | Chave HMAC-SHA256 (≥ 32 chars) |
| `/fracexec/prod/FRONTEND_URL` | `FRONTEND_URL` | URL CloudFront (CORS + e-mails) |
| `/fracexec/prod/SES_SMTP_USERNAME` | `SES_SMTP_USERNAME` | SMTP credentials SES |
| `/fracexec/prod/SES_SMTP_PASSWORD` | `SES_SMTP_PASSWORD` | SMTP credentials SES |
| `/fracexec/prod/STRIPE_API_KEY` | `STRIPE_API_KEY` | Chave Stripe Connect |
| `/fracexec/prod/STRIPE_WEBHOOK_SECRET` | `STRIPE_WEBHOOK_SECRET` | Validação de webhooks |

> **Regra:** Nenhum secret vai para o repositório Git. O `.env` de produção é gerado dinamicamente pelo `deploy.sh` via SSM a cada deploy.

---

## 7. Epic 7 — Stories planejadas

### Story 7.1: Terraform — Networking e Compute
Provisionar VPC, subnets, security groups, EC2 t2.micro com Elastic IP, IAM Role com acesso a S3/SSM/SES/ECR. Bootstrap da EC2 com Docker, Nginx e Certbot.

### Story 7.2: Terraform — Database e Storage
Provisionar RDS PostgreSQL t3.micro em subnet privada. Criar S3 buckets (docs, profiles, contracts, web). Configurar policies de acesso via IAM Role da EC2.

### Story 7.3: Terraform — CloudFront e DNS
Configurar CloudFront distribution com dois origins: S3 (arquivos estáticos) e EC2 (proxy `/api/v1/*`). Configurar sslip.io como domínio gratuito. Emitir certificado Let's Encrypt.

### Story 7.4: Pipeline CI/CD
Implementar `.github/workflows/ci.yml` e `deploy.yml`. Configurar GitHub Secrets (AWS credentials, EC2 SSH key, CF distribution ID). Testar pipeline end-to-end com deploy de smoke.

### Story 7.5: `application-prod.yml` e validação
Criar `application-prod.yml` com todas as envvars de produção. Ajustar `MinioConfig.java` para usar `DefaultCredentialsProvider` em prod. Configurar SSM parameters. Rodar smoke tests em produção.

---

## 8. Impacto nos Epics 4–6 (avaliação de antecipação)

| Item | Deve entrar agora? | Justificativa |
|------|-------------------|---------------|
| `application-prod.yml` | **Sim — Story 6.4** | Já está no scope definido da story |
| Pipeline CI/CD (`ci.yml` + `deploy.yml`) | **Sim — Story 6.4** | Story 6.4 especifica explicitamente GitHub Actions |
| `MinioConfig.java` ajuste para IAM Role | **Sim — Story 6.4** | Pequena mudança, evita breaking change no Epic 7 |
| Terraform infra | **Não — Epic 7** | Nenhuma dependência de código nos Epics 4–5 |
| SES sandbox → produção | **Não — Epic 7** | Processo administrativo AWS, não bloqueia dev |
| RDS, EC2, S3 prod | **Não — Epic 7** | Desenvolvimento local funciona até o fim do Epic 6 |

---

## 9. Estimativa de custo após o free tier (12 meses)

Se a conta completar 12 meses e os serviços temporários expirarem:

| Serviço | Custo estimado/mês |
|---------|-------------------|
| EC2 t2.micro (on-demand) | ~$8,50 |
| RDS t3.micro | ~$14,50 |
| S3 (5 GB + requests) | ~$0,50 |
| CloudFront | Permanentemente gratuito (até 1TB) |
| SES | Permanentemente gratuito (até 62k e-mails/EC2) |
| **Total estimado** | **~$24/mês** |

Estratégia de mitigação: migrar para **EC2 Savings Plans** ou **Reserved Instances** ao final dos 12 meses (~65% de desconto) → ~$8/mês total.
