---
baseline_commit: b90c9133f3fc0c40c398a102c5ec891b6215982b
---

# Story 6.4: Production Readiness & Observability

Status: done

## Story

Como time de engenharia,
quero que a plataforma tenha CI/CD automatizado, observabilidade e performance validada,
para que deploys sejam seguros, incidentes detectáveis e os NFRs de performance e uptime sejam atendidos.

## Acceptance Criteria

1. **Dado** repositório no GitHub, **então** GitHub Actions: build Maven + testes + ng build + Docker push — falha bloqueia merge

2. **Dado** ambiente de produção, **então** Logback JSON estruturado: `timestamp`, `level`, `logger`, `message`, `traceId` — sem PII

3. **Dado** GET `/actuator/health`, **então** retorna `{"status":"UP"}` com sub-checks `db`, `diskSpace`, `ping`

4. **Dado** GET `/actuator/metrics`, **então** JVM, HTTP, HikariCP — acessível apenas via rede interna

5. **Dado** bundle Angular, **então** análise de bundle size documentada; páginas principais < 3s em 4G simulada

6. **Dado** `docker-compose.prod.yml`, **então** Nginx com terminação SSL + redirect HTTP→HTTPS documentado

## Tasks / Subtasks

- [ ] **CI: `.github/workflows/ci.yml`**
  - [ ] Trigger: `push` e `pull_request` em `main` e `develop`
  - [ ] Jobs: `backend` (mvn test), `frontend` (ng build), `docker` (build e push ECR) com dependências
  - [ ] Falha em qualquer job bloqueia merge

- [ ] **CI: `.github/workflows/deploy.yml`**
  - [ ] Trigger: `push` em `main` após CI passar
  - [ ] Reusar script `deploy.sh` da Story 7.4 (Epic 7)
  - [ ] Sync S3 + invalidação CloudFront

- [ ] **BACKEND: `application-prod.yml`**
  - [ ] Criar `src/main/resources/application-prod.yml` com todas as envvars (DB, SES, S3, JWT, Stripe)
  - [ ] `spring.jpa.hibernate.ddl-auto: validate`
  - [ ] Logging level: `root: WARN`, `com.fracexec: INFO`

- [ ] **BACKEND: Logback JSON (`logback-spring.xml`)**
  - [ ] Criar `src/main/resources/logback-spring.xml` para profile `prod`
  - [ ] Appender JSON com campos: `timestamp`, `level`, `logger`, `message`, sem PII
  - [ ] Usar `net.logstash.logback` encoder

- [ ] **BACKEND: Adicionar dependência logstash-logback-encoder ao `pom.xml`**
  - [ ] `net.logstash.logback:logstash-logback-encoder:8.0`

- [ ] **BACKEND: `MinioConfig.java` — suporte a `DefaultCredentialsProvider` para prod**
  - [ ] Se `fracexec.minio.endpoint` estiver vazio: usar `DefaultCredentialsProvider` (IAM Role)
  - [ ] Já previsto no documento `aws-infrastructure.md`

- [ ] **INFRA: `docker-compose.prod.yml`**
  - [ ] Nginx com `ssl_certificate` + `ssl_certificate_key` (Let's Encrypt)
  - [ ] `return 301 https://$host$request_uri;` para HTTP→HTTPS

- [ ] **TESTES: Bundle size Angular**
  - [ ] Documentar em `bmad-output/planning-artifacts/bundle-analysis.md` o tamanho dos chunks principais
  - [ ] Verificar que chunks lazy-loaded não excedem 500KB

## Dev Notes

### Logstash encoder
```xml
<dependency>
    <groupId>net.logstash.logback</groupId>
    <artifactId>logstash-logback-encoder</artifactId>
    <version>8.0</version>
</dependency>
```

### logback-spring.xml (profile prod)
```xml
<springProfile name="prod">
  <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
      <fieldNames><timestamp>timestamp</timestamp></fieldNames>
    </encoder>
  </appender>
  <root level="WARN"><appender-ref ref="JSON"/></root>
  <logger name="com.fracexec" level="INFO"/>
</springProfile>
```

### MinioConfig — `DefaultCredentialsProvider`
Ver `aws-infrastructure.md` seção 3.2.2 para o trecho de código completo.

### GitHub Actions secrets necessários
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `EC2_SSH_KEY`, `CF_DISTRIBUTION_ID`

## Dev Agent Record
### Debug Log
_vazio_
### Completion Notes
_vazio_

## File List
_a preencher_

## Change Log
_a preencher_
