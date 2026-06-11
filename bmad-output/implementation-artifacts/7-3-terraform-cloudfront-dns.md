# Story 7.3: Terraform — CloudFront, DNS e SSL

## Status
ready-for-dev

## Story

**Como** engenheiro de infraestrutura,
**Quero** configurar o CloudFront como CDN/proxy e obter SSL gratuito com Let's Encrypt,
**Para que** usuários acessem a FracExec via HTTPS com boa performance sem custo de domínio.

## Context

Depende das Stories 7.1 (EC2 Elastic IP) e 7.2 (bucket S3 web). O CloudFront terá dois origins: S3 para o Angular SPA (arquivos estáticos) e EC2 para a API (`/api/v1/*`). O domínio usa sslip.io (DNS gratuito baseado em IP — ex: `1-2-3-4.sslip.io`). SSL na EC2 via Certbot/Let's Encrypt; CloudFront usa o certificado ACM (gratuito, mas requer confirmação de domínio).

**NOTA DE GAP:** Esta story tem 2 gaps críticos dependentes de conta AWS e IP alocado. Veja `bmad-output/planning-artifacts/aws-gaps-report.md`.

## Acceptance Criteria

### AC1 — Módulo CDN — CloudFront Distribution
**Dado** `modules/cdn/main.tf`,
**Então** define `aws_cloudfront_distribution` com:
- **Origin 1 — S3:** `domain_name = var.web_bucket_regional_domain_name`, com `s3_origin_config` usando Origin Access Control (OAC)
- **Origin 2 — API:** `domain_name = var.ec2_elastic_ip`, `custom_origin_config` com `origin_protocol_policy = "https-only"`, `origin_ssl_protocols = ["TLSv1.2"]`, porta 443
- **Behavior padrão:** forward para S3 (SPA), cache otimizado para assets estáticos, `compress = true`
- **Behavior `/api/v1/*`:** forward para EC2, `allowed_methods = ["DELETE","GET","HEAD","OPTIONS","PATCH","POST","PUT"]`, `cached_methods = ["GET","HEAD"]`, `forward_all_query_strings = true`, `forward_all_headers = true`, `min_ttl = 0`, `default_ttl = 0`, `max_ttl = 0` (sem cache para API)
- `price_class = "PriceClass_100"` (América do Norte + Europa — menor custo)
- `default_root_object = "index.html"`
- `custom_error_response` para 403 e 404 → `/index.html` com status 200 (SPA routing)

### AC2 — Origin Access Control (OAC) para S3
**Dado** o módulo cdn,
**Então** cria `aws_cloudfront_origin_access_control` e a `aws_s3_bucket_policy` no bucket web permitindo apenas o CloudFront acessar os objetos:
```json
{
  "Effect": "Allow",
  "Principal": { "Service": "cloudfront.amazonaws.com" },
  "Action": "s3:GetObject",
  "Condition": { "StringEquals": { "AWS:SourceArn": "<CF_ARN>" } }
}
```

### AC3 — Nginx prod na EC2 (nginx-prod.conf)
**Dado** o arquivo `fracexec/infra/scripts/nginx-prod.conf`,
**Então** contém:
- Bloco `server` na porta 80 com redirect 301 para HTTPS
- Bloco `server` na porta 443 com `ssl_certificate` e `ssl_certificate_key` apontando para `/etc/letsencrypt/live/<domain>/`
- `location /api/v1/` fazendo `proxy_pass http://localhost:8080` com headers `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto https`
- `location /actuator/health` restrito a `allow 10.0.0.0/8; deny all`
- Arquivo usa placeholder `<DOMAIN>` que é substituído pelo script de bootstrap após o Certbot emitir o certificado

### AC4 — Script certbot-setup.sh
**Dado** `fracexec/infra/scripts/certbot-setup.sh`,
**Então** o script:
- Recebe o domínio sslip.io como argumento `$1`
- Roda `certbot --nginx -d $1 --non-interactive --agree-tos -m admin@fracexec.com.br`
- Substitui o placeholder `<DOMAIN>` no `nginx-prod.conf` pelo valor de `$1`
- Habilita renovação automática via cron: `0 12 * * * /usr/bin/certbot renew --quiet`
> **GAP:** Este script só pode ser executado após a EC2 ter IP alocado e o DNS sslip.io estar resolvendo para esse IP.

### AC5 — Outputs do módulo cdn
**Dado** `modules/cdn/outputs.tf`,
**Então** expõe: `cloudfront_domain_name`, `cloudfront_distribution_id`, `cloudfront_arn`

### AC6 — Integração no root module
**Dado** `main.tf` raiz,
**Então** chama o módulo `cdn` passando `web_bucket_regional_domain_name` (output 7.2) e `ec2_elastic_ip` (output 7.1).

### AC7 — Variável FRONTEND_URL documentada
**Dado** `environments/prod/terraform.tfvars.example`,
**Então** inclui comentário:
```
# Após terraform apply, copiar o valor de output cloudfront_domain_name e
# setar no SSM: /fracexec/prod/FRONTEND_URL = https://<cloudfront_domain_name>
```

### AC8 — Validação sintática
**Dado** Terraform CLI instalado,
**Então** `terraform validate` retorna `Success!` para todos os módulos.

## Technical Notes

- CloudFront não aceita certificados Let's Encrypt — o certificado na distribuição CloudFront é o padrão da própria AWS (*.cloudfront.net) ou ACM. Para o MVP usamos o domínio `*.cloudfront.net` que já vem com HTTPS nativo, sem custo
- O Let's Encrypt é usado apenas no Nginx da EC2 (para o CloudFront se conectar à EC2 via HTTPS)
- `sslip.io` funciona assim: IP `54.123.45.67` → domínio `54-123-45-67.sslip.io` — sem configuração, apenas convencional
- Cache-Control para assets Angular: `Cache-Control: max-age=31536000, immutable` para arquivos com hash; `Cache-Control: no-cache` para `index.html`

## Tasks

- [ ] Implementar `modules/cdn/main.tf`, `variables.tf`, `outputs.tf`
- [ ] Criar OAC e bucket policy S3 no módulo cdn
- [ ] Criar `infra/scripts/nginx-prod.conf`
- [ ] Criar `infra/scripts/certbot-setup.sh`
- [ ] Integrar módulo cdn no `main.tf` raiz
- [ ] Documentar FRONTEND_URL em `terraform.tfvars.example`
- [ ] Rodar `terraform validate`

## Dev Notes

- **GAPs desta story:** (1) Certbot requer IP alocado e DNS resolvendo; (2) ACM Certificate requer domínio — para MVP usamos `*.cloudfront.net`, sem ACM custom.
- Referência: `bmad-output/planning-artifacts/aws-infrastructure.md` seção 2 (diagrama e fluxo).
