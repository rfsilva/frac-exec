# Story 7.2: Terraform — Database e Storage

## Status
ready-for-dev

## Story

**Como** engenheiro de infraestrutura,
**Quero** provisionar o banco de dados RDS PostgreSQL e os buckets S3 com Terraform,
**Para que** a aplicação tenha persistência de dados e armazenamento de arquivos em produção.

## Context

Depende da Story 7.1 (networking deve estar provisionado antes — os Security Groups e Subnets são inputs deste módulo). Todo o código da aplicação já usa PostgreSQL e S3-compatible storage (MinIO em dev); em prod apenas os endpoints mudam.

**NOTA DE GAP:** Esta story produz código Terraform válido, mas `terraform apply` requer conta AWS ativa. Veja `bmad-output/planning-artifacts/aws-gaps-report.md`.

## Acceptance Criteria

### AC1 — Módulo database
**Dado** `modules/database/main.tf`,
**Então** define:
- `aws_db_subnet_group` usando as subnets privadas (output da Story 7.1)
- `aws_db_instance` com:
  - `engine = "postgres"`, `engine_version = "16.3"`
  - `instance_class = "db.t3.micro"`, `allocated_storage = 20`, `storage_type = "gp2"`
  - `db_name = "fracexec"`, `username = "fracexec"`, `password = var.db_password`
  - `vpc_security_group_ids = [var.rds_sg_id]`
  - `publicly_accessible = false`
  - `skip_final_snapshot = false`, `deletion_protection = true`
  - `backup_retention_period = 7`
  - Tags: `Project = "fracexec"`, `Environment = "prod"`

### AC2 — Módulo storage
**Dado** `modules/storage/main.tf`,
**Então** define:
- 3 buckets privados via `for_each`: `fracexec-docs-prod`, `fracexec-profiles-prod`, `fracexec-contracts-prod`
- Para cada bucket privado: `aws_s3_bucket_public_access_block` com todos os flags `= true`
- 1 bucket web `fracexec-web-prod` com `aws_s3_bucket_website_configuration` (index: `index.html`, error: `index.html` para SPA fallback)
- `aws_s3_bucket_public_access_block` para o bucket web com `block_public_acls = false`, `block_public_policy = false` (necessário para CloudFront OAC)

### AC3 — IAM Policy para EC2 acessar os buckets
**Dado** o módulo storage,
**Então** cria `aws_iam_policy` `fracexec-s3-policy` com permissões `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` apenas nos 3 buckets privados (`fracexec-docs-prod`, `fracexec-profiles-prod`, `fracexec-contracts-prod`), e `s3:PutObject` no bucket web (para deploy via CI/CD).

### AC4 — Output do endpoint RDS
**Dado** `modules/database/outputs.tf`,
**Então** expõe: `rds_endpoint`, `rds_port`, `rds_db_name`, `rds_username`
> Não expor `password` em outputs — vem de `var.db_password` que deve ser provisionado via SSM.

### AC5 — Outputs do módulo storage
**Dado** `modules/storage/outputs.tf`,
**Então** expõe: `web_bucket_name`, `web_bucket_regional_domain_name`, `app_bucket_names` (map)

### AC6 — Integração no root module
**Dado** `main.tf` raiz,
**Então** chama os módulos `database` e `storage` passando os outputs corretos de networking como inputs.

### AC7 — Variável db_password via SSM (não hardcoded)
**Dado** `variables.tf` do módulo database,
**Então** `db_password` é declarada como `sensitive = true` e o `terraform.tfvars.example` instrui usar:
```
db_password = "<buscar em SSM /fracexec/prod/DB_PASSWORD>"
```

### AC8 — Validação sintática
**Dado** Terraform CLI instalado,
**Então** `terraform validate` retorna `Success!` para todos os módulos.
> **GAP:** `terraform plan/apply` dependem de conta AWS.

## Technical Notes

- O RDS ficará em subnet privada — a EC2 acessa via endpoint interno; nunca exposto à internet
- O bucket web será acessado pelo CloudFront via Origin Access Control (OAC) na Story 7.3 — a bucket policy será adicionada lá
- `db_password` deve ser gerado com pelo menos 16 chars alfanuméricos; armazenar no SSM antes do apply
- Flyway migrations rodam automaticamente no boot da aplicação (já configurado em Epic 1)

## Tasks

- [ ] Implementar `modules/database/main.tf`, `variables.tf`, `outputs.tf`
- [ ] Implementar `modules/storage/main.tf`, `variables.tf`, `outputs.tf`
- [ ] Criar `aws_iam_policy` para acesso S3 da EC2
- [ ] Integrar módulos no `main.tf` raiz
- [ ] Rodar `terraform validate`

## Dev Notes

- Referência: `bmad-output/planning-artifacts/aws-infrastructure.md` seções 4.3 (trechos database e storage).
- Dependência de Story 7.1: outputs `private_subnet_id`, `rds_sg_id` são inputs obrigatórios desta story.
