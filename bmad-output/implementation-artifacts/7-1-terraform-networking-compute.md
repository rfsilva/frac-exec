# Story 7.1: Terraform — Networking e Compute

## Status
ready-for-dev

## Story

**Como** engenheiro de infraestrutura,
**Quero** provisionar a rede e a camada de compute da FracExec na AWS com Terraform,
**Para que** a API possa ser hospedada em um ambiente seguro, com IP fixo e acesso restrito.

## Context

Esta é a primeira story do Epic 7 (AWS Infrastructure). Todo o código da aplicação (Epics 1–6) está concluído e testado localmente com Docker Compose. O objetivo agora é criar a infraestrutura como código (IaC) que servirá de base para o deploy em produção.

A estratégia usa Free Tier AWS: EC2 t2.micro em subnet pública, sem NAT Gateway (custo ~$32/mês evitado), RDS em subnet privada acessível apenas pela EC2 via Security Group.

**NOTA DE GAP:** Esta story produz código Terraform válido e revisável, mas `terraform apply` requer uma conta AWS ativa com credenciais configuradas. Veja o relatório de gaps em `bmad-output/planning-artifacts/aws-gaps-report.md`.

## Acceptance Criteria

### AC1 — Estrutura de diretórios criada
**Dado** o repositório FracExec,
**Então** existe a estrutura:
```
fracexec/infra/terraform/
  main.tf
  variables.tf
  outputs.tf
  modules/
    networking/main.tf
    networking/variables.tf
    networking/outputs.tf
    compute/main.tf
    compute/variables.tf
    compute/outputs.tf
  environments/prod/terraform.tfvars.example
fracexec/infra/scripts/
  bootstrap-ec2.sh
```

### AC2 — Módulo networking provisionado
**Dado** o módulo `modules/networking`,
**Então** define:
- VPC `10.0.0.0/16` com `enable_dns_hostnames = true`
- Subnet pública `10.0.1.0/24` com `map_public_ip_on_launch = true`
- Subnet privada `10.0.2.0/24`
- Internet Gateway atachado à VPC
- Route table pública com rota `0.0.0.0/0 → IGW`
- Security Group EC2: ingress 443/tcp e 80/tcp de `0.0.0.0/0`; ingress 22/tcp de `var.admin_ip_cidr`; egress `0.0.0.0/0`
- Security Group RDS: ingress 5432/tcp apenas do SG da EC2

### AC3 — Módulo compute provisionado
**Dado** o módulo `modules/compute`,
**Então** define:
- `aws_instance` tipo `t2.micro`, Amazon Linux 2023, com `user_data = bootstrap-ec2.sh`
- `aws_eip` atachado à instância
- `aws_iam_role` `fracexec-ec2-role` com trust policy para `ec2.amazonaws.com`
- `aws_iam_role_policy_attachment` para: `AmazonSSMManagedInstanceCore`, `AmazonS3FullAccess` (restrito aos buckets fracexec), `AmazonSESFullAccess`, `AmazonEC2ContainerRegistryReadOnly`, `CloudWatchAgentServerPolicy`
- `aws_iam_instance_profile` atachado ao role

### AC4 — Script bootstrap-ec2.sh
**Dado** o script `infra/scripts/bootstrap-ec2.sh` rodando como user-data na EC2,
**Então** o script:
- Instala Docker e inicia o serviço
- Instala Nginx
- Instala Certbot (`certbot-nginx`)
- Cria diretório `/opt/fracexec/` com permissão para `ec2-user`
- Instala AWS CLI v2

### AC5 — Root module wired
**Dado** `main.tf` na raiz do módulo Terraform,
**Então**:
- Provider `aws` configurado com `region = var.aws_region`
- Backend `s3` configurado (comentado com placeholder — requer bucket de estado que é criado manualmente antes do `terraform init`)
- Módulos `networking` e `compute` chamados com os outputs corretos como inputs

### AC6 — outputs.tf expõe valores necessários
**Dado** `outputs.tf`,
**Então** expõe: `ec2_public_ip`, `ec2_elastic_ip`, `ec2_instance_id`, `vpc_id`, `public_subnet_id`, `private_subnet_id`, `ec2_sg_id`, `rds_sg_id`

### AC7 — Validação sintática (sem conta AWS)
**Dado** Terraform CLI instalado localmente,
**Então** `terraform validate` retorna `Success! The configuration is valid.` para todos os módulos.
> **GAP:** `terraform plan` e `terraform apply` requerem conta AWS — ver relatório de gaps.

### AC8 — .gitignore para artefatos Terraform
**Dado** o `.gitignore` na raiz de `fracexec/infra/terraform/`,
**Então** ignora: `.terraform/`, `*.tfstate`, `*.tfstate.backup`, `*.tfvars` (exceto `.tfvars.example`), `.terraform.lock.hcl` não é ignorado (deve ser commitado)

## Technical Notes

- Usar `data.aws_ami` para buscar dinamicamente o AMI mais recente do Amazon Linux 2023 (evita hardcode de AMI ID por região)
- `var.admin_ip_cidr` no Security Group SSH deve ter default `"0.0.0.0/0"` com comentário orientando restringir ao IP do admin em prod
- Todos os recursos devem ter tag `Project = "fracexec"` e `Environment = "prod"`
- O arquivo `terraform.tfvars.example` deve documentar todas as variáveis obrigatórias sem valores reais

## Tasks

- [ ] Criar estrutura de diretórios `fracexec/infra/`
- [ ] Implementar `modules/networking/main.tf`, `variables.tf`, `outputs.tf`
- [ ] Implementar `modules/compute/main.tf`, `variables.tf`, `outputs.tf`
- [ ] Implementar `main.tf`, `variables.tf`, `outputs.tf` raiz
- [ ] Criar `infra/scripts/bootstrap-ec2.sh`
- [ ] Criar `environments/prod/terraform.tfvars.example`
- [ ] Criar `.gitignore` para Terraform
- [ ] Rodar `terraform validate` em todos os módulos

## Dev Notes

- **Dependência de conta AWS:** ACs 1–6 e 8 são implementáveis agora. AC7 (`terraform validate`) requer Terraform CLI instalado localmente — não requer conta AWS. `terraform plan/apply` dependem de conta.
- Referência de arquitetura: `bmad-output/planning-artifacts/aws-infrastructure.md` seções 2 e 4.
