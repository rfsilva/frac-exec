# Story 7.5: application-prod.yml e Ajustes de Código para Produção

## Status
ready-for-dev

## Story

**Como** desenvolvedor,
**Quero** criar o perfil de configuração de produção da API e ajustar o `MinioConfig` para usar IAM Role na AWS,
**Para que** a aplicação funcione em produção sem credenciais hardcoded e com todos os serviços externos (RDS, S3, SES, Stripe) configurados via variáveis de ambiente.

## Context

A Story 6.4 (production-readiness) pode já ter criado `application-prod.yml` parcialmente. Esta story consolida e finaliza todos os ajustes de código para prod, especialmente o `MinioConfig.java` que precisa distinguir entre MinIO local (endpoint explícito + credenciais) e S3 nativo AWS (sem endpoint, usando IAM Role). É a última story de código antes do deploy real.

## Acceptance Criteria

### AC1 — `application-prod.yml` completo
**Dado** `fracexec/fracexec-api/src/main/resources/application-prod.yml`,
**Então** contém exatamente (sem valores hardcoded, tudo via `${ENV_VAR}`):

```yaml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
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
    allowed-origins: ${FRONTEND_URL}
  minio:
    endpoint: ""
    access-key: ""
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
    console: ""
  file:
    name: /var/log/fracexec/app.log
  level:
    root: WARN
    com.fracexec: INFO
```

### AC2 — `MinioConfig.java` suporta IAM Role
**Dado** `MinioConfig.java` (ou o bean equivalente que configura o `S3Client`),
**Então** a lógica de build do `S3Client` é:
```java
var builder = S3Client.builder().region(Region.of(awsRegion));

if (endpoint.isBlank()) {
    // Produção AWS: usa IAM Role attached à EC2
    builder.credentialsProvider(DefaultCredentialsProvider.create());
} else {
    // Dev/local: usa credenciais explícitas + endpoint MinIO
    builder.credentialsProvider(StaticCredentialsProvider.create(
        AwsBasicCredentials.create(accessKey, secretKey)))
        .endpointOverride(URI.create(endpoint))
        .forcePathStyle(true);
}
return builder.build();
```
**E** o bean compila sem erros com `mvn compile`.

### AC3 — `application-test.yml` não quebra
**Dado** o perfil `test` (usado em CI),
**Então** `application-test.yml` ou `application.yml` ainda tem as configurações de MinIO local/H2/Testcontainers necessárias para os testes passarem, sem referências às variáveis de prod.

### AC4 — `environment.prod.ts` Angular atualizado
**Dado** `fracexec/fracexec-web/src/environments/environment.prod.ts`,
**Então** contém:
```typescript
export const environment = {
  production: true,
  apiUrl: '/api/v1'  // relativo — CloudFront roteia /api/v1/* para a EC2
};
```
> Usar path relativo (não URL absoluta) garante que o Angular sempre passe pelo CloudFront.

### AC5 — SSM Parameters documentados
**Dado** `fracexec/infra/README-ssm.md`,
**Então** documenta todos os parâmetros SSM que devem ser criados antes do primeiro deploy:

| Parâmetro SSM | Tipo | Exemplo de valor |
|--------------|------|-----------------|
| `/fracexec/prod/DB_URL` | SecureString | `jdbc:postgresql://<rds-endpoint>:5432/fracexec` |
| `/fracexec/prod/DB_USERNAME` | String | `fracexec` |
| `/fracexec/prod/DB_PASSWORD` | SecureString | `<senha gerada>` |
| `/fracexec/prod/JWT_SECRET` | SecureString | `<string aleatória ≥ 32 chars>` |
| `/fracexec/prod/FRONTEND_URL` | String | `https://<cf-domain>.cloudfront.net` |
| `/fracexec/prod/SES_SMTP_USERNAME` | SecureString | `<AKID do SES>` |
| `/fracexec/prod/SES_SMTP_PASSWORD` | SecureString | `<senha SMTP SES>` |
| `/fracexec/prod/STRIPE_API_KEY` | SecureString | `sk_live_...` |
| `/fracexec/prod/STRIPE_WEBHOOK_SECRET` | SecureString | `whsec_...` |

> **GAP:** Os valores reais só podem ser preenchidos após recursos AWS estarem provisionados e contas SES/Stripe configuradas.

### AC6 — `.env.example` de prod atualizado
**Dado** `fracexec/fracexec-api/.env.example`,
**Então** lista todas as variáveis de ambiente do `application-prod.yml` com valores placeholder e comentário `# ver SSM /fracexec/prod/<nome>`.

### AC7 — Testes de integração passam com perfil test
**Dado** `mvn verify -Dspring.profiles.active=test` no diretório `fracexec/fracexec-api`,
**Então** retorna `BUILD SUCCESS` sem erros de compilação ou testes falhando.

### AC8 — `mvn compile` com perfil prod sem erro
**Dado** que `application-prod.yml` e `MinioConfig.java` estão atualizados,
**Então** `mvn compile -f fracexec/fracexec-api/pom.xml` retorna `BUILD SUCCESS`.

## Technical Notes

- O `DefaultCredentialsProvider.create()` na AWS EC2 automaticamente usa as credenciais da IAM Role attached à instância (via Instance Metadata Service) — sem chaves no código ou `.env`
- `ddl-auto: validate` em prod é crítico — impede que o Hibernate tente criar/alterar tabelas; Flyway é o único responsável pelo schema
- O `logging.pattern.console: ""` desabilita o console em prod (logs vão para arquivo); CloudWatch coleta via agent
- Buckets de prod têm sufixo `-prod` para não colidir com eventuais buckets de staging futuros

## Tasks

- [ ] Verificar se `application-prod.yml` já existe (Story 6.4 pode ter criado)
- [ ] Criar/consolidar `application-prod.yml` com todos os campos
- [ ] Atualizar `MinioConfig.java` com lógica de `endpoint.isBlank()`
- [ ] Verificar `application-test.yml` — garantir que testes não quebram
- [ ] Atualizar `environment.prod.ts` com path relativo
- [ ] Criar `fracexec/infra/README-ssm.md`
- [ ] Atualizar `fracexec/fracexec-api/.env.example`
- [ ] Rodar `mvn verify` para validar

## Dev Notes

- Esta é a única story do Epic 7 que **pode ser completamente validada sem conta AWS** — `mvn verify` passa localmente com perfil `test`.
- Referência: `bmad-output/planning-artifacts/aws-infrastructure.md` seções 3.1, 3.2 e 6.
