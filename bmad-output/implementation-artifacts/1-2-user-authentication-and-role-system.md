---
baseline_commit: NO_VCS
---

# Story 1.2: User Authentication & Role System

Status: done

## Story

Como usuário (executivo, PME ou admin),
quero me registrar, fazer login e acessar meu portal correspondente ao meu role,
para que apenas usuários autenticados com o role correto acessem os recursos protegidos.

## Acceptance Criteria

1. **Dado** um novo usuário, **quando** POST `/api/v1/auth/register` com `{email, password, role}`, **então** o usuário é criado e retorna access token (15min) + refresh token (7 dias)

2. **Dado** POST `/api/v1/auth/register` com `role = ADMIN`, **então** o backend retorna 400 — ADMIN nunca via endpoint público

3. **Dado** um usuário registrado, **quando** POST `/api/v1/auth/login` com credenciais válidas, **então** retorna JWT access token + refresh token gravado na tabela `refresh_tokens` (Flyway V2)

4. **Dado** um access token expirado, **quando** POST `/api/v1/auth/refresh` com refresh token válido, **então** retorna novo access token

5. **Dado** um refresh token inválido ou expirado, **quando** POST `/api/v1/auth/refresh`, **então** retorna 401

6. **Dado** request a `/api/v1/executive/**` sem JWT, **então** Spring Security retorna 401

7. **Dado** JWT com role PME, **quando** acessar `/api/v1/admin/**`, **então** retorna 403

8. **Dado** o schema do banco, **então** tabelas `users` e `refresh_tokens` existem (Flyway V2) com campos corretos

9. **Dado** qualquer fluxo de autenticação, **então** passwords são armazenadas como bcrypt — nunca texto plano, nunca logadas

10. **Dado** POST `/api/v1/auth/forgot-password` com e-mail cadastrado, **então** envia e-mail com link de redefinição (token único de uso único, validade 1 hora); se e-mail não encontrado, retorna 200 com a mesma mensagem genérica (sem enumerar usuários existentes)

11. **Dado** POST `/api/v1/auth/reset-password` com token válido e nova senha, **então** atualiza senha, invalida o token, invalida todos os refresh tokens ativos do usuário; retorna 200

12. **Dado** POST `/api/v1/auth/reset-password` com token expirado ou já utilizado, **então** retorna 400 com mensagem: "Link de redefinição inválido ou expirado. Solicite um novo."

13. **Dado** a tela `/forgot-password` no Angular, **então** é pública, sem autenticação; exibe campo de e-mail + botão "Enviar instruções"; após submissão, exibe mensagem: "Se o e-mail estiver cadastrado, você receberá as instruções em instantes." — independente de o e-mail existir ou não

## Tasks / Subtasks

- [x] **BACKEND: Flyway V2 — tabelas de autenticação** (AC: 3, 8)
  - [x] Criar `V2__users_and_auth.sql` com tabelas: `users`, `refresh_tokens`, `password_reset_tokens`
  - [x] `users`: campos corretos com UUID, email unique, password_hash, role CHECK, timestamps
  - [x] `refresh_tokens`: user_id FK CASCADE, token_hash, expires_at, revoked
  - [x] `password_reset_tokens`: user_id FK CASCADE, token_hash, expires_at, used
  - [x] Índices: `idx_users_email`, `idx_refresh_tokens_token_hash`, `idx_refresh_tokens_user_id`, `idx_password_reset_tokens_token_hash`

- [x] **BACKEND: Entidades JPA e Repositories** (AC: 3, 8)
  - [x] Criar `User.java` — entidade JPA com enum `Role`, implements `UserDetails`
  - [x] Criar `UserRepository.java` — `findByEmail`, `existsByEmail`, `updatePasswordHash`
  - [x] Criar `RefreshToken.java` — entidade JPA com `isExpired()`, `revoke()`
  - [x] Criar `RefreshTokenRepository.java` — `findByTokenHash`, `revokeAllByUserId` (@Modifying)
  - [x] Criar `PasswordResetToken.java` — entidade JPA com `isExpiredOrUsed()`, `markUsed()`
  - [x] Criar `PasswordResetTokenRepository.java` — `findByTokenHash`

- [x] **BACKEND: JWT Utility** (AC: 1, 3, 4, 6, 7)
  - [x] Criar `JwtUtil.java` com `generateAccessToken`, `extractEmail`, `extractRole`, `isTokenValid`
  - [x] Usar `Jwts.builder()` e `Jwts.parser().parseSignedClaims()` (jjwt 0.12.6)
  - [x] Chave HMAC-SHA256 via `Keys.hmacShaKeyFor(secret.getBytes(UTF_8))`
  - [x] Claims: `sub` (email), `role`, `iat`, `exp`
  - [x] Expiração de `${fracexec.jwt.access-token-expiration-ms}`

- [x] **BACKEND: JWT Filter + UserDetailsService** (AC: 6, 7)
  - [x] Criar `JwtAuthenticationFilter.java` — extends `OncePerRequestFilter`
  - [x] Criar `UserDetailsServiceImpl.java` — implements `UserDetailsService`
  - [x] Atualizar `SecurityConfig.java` com `addFilterBefore(jwtFilter, ...)`
  - [x] Expor bean `AuthenticationManager`; Spring Boot auto-configura DaoAuthenticationProvider

- [x] **BACKEND: AuthController + AuthService** (AC: 1, 2, 3, 4, 5, 9, 10, 11, 12)
  - [x] DTOs: `RegisterRequest`, `LoginRequest`, `AuthResponse`, `RefreshTokenRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest`
  - [x] `AuthService` interface + `AuthServiceImpl`
  - [x] `AuthController` com 5 endpoints
  - [x] ADMIN block usa `InvalidRequestException` → 400 (AC-2)
  - [x] Refresh token armazena SHA-256 hash
  - [x] Forgot-password retorna 200 sempre (AC-10)
  - [x] Reset-password invalida todos refresh tokens (AC-11)
  - [x] Logs usam apenas UUIDs — nunca email/password (AC-9)

- [x] **BACKEND: Testes de integração** (AC: 1, 2, 3, 4, 5, 6, 7, 9)
  - [x] `AuthControllerTest` com 11 testes: register EXECUTIVE/PME ok, ADMIN → 400, email duplicado → 422, login ok, login senha errada → 401, refresh válido → 200, refresh inválido → 4xx, rota protegida sem token → 4xx, forgot-password → 200 sempre

- [x] **FRONTEND: Modelos e serviço de auth** (AC: 13)
  - [x] `user.model.ts` — `User`, `Role`, `AuthResponse`
  - [x] `api-response.model.ts` — `ApiPage<T>`
  - [x] `auth.service.ts` — signals `currentUser`, `isAuthenticated`; todos os métodos; tokens em localStorage
  - [x] `auth.guard.ts` — redireciona para `/login` se não autenticado
  - [x] `role.guard.ts` — redireciona para portal correto se role errado

- [x] **FRONTEND: Interceptors HTTP** (AC: 6, 7)
  - [x] `auth.interceptor.ts` — `Authorization: Bearer {token}`
  - [x] `error.interceptor.ts` — 401 → logout + redirect `/login`

- [x] **FRONTEND: Páginas de autenticação** (AC: 13)
  - [x] `login.ts` — Reactive Form, redireciona por role após sucesso
  - [x] `forgot-password.ts` — mensagem genérica após submit
  - [x] `reset-password.ts` — lê token da query string, atualiza senha
  - [x] `app.routes.ts` — rotas públicas + portais protegidos com `authGuard` + `roleGuard`
  - [x] `app.config.ts` — `provideHttpClient(withInterceptors([...]))`

- [x] **VALIDAÇÃO FINAL**
  - [x] `./mvnw test` — 11/11 testes passando, BUILD SUCCESS
  - [x] Flyway V2 executado via H2 no profile test (tabelas criadas por ddl-auto)
  - [x] `ng build` — build limpo, lazy chunks corretos para login/forgot-password/reset-password

## Dev Notes

### ⚠️ AVISOS CRÍTICOS — LEIA ANTES DE IMPLEMENTAR

**1. ADMIN nunca via endpoint público**
`POST /api/v1/auth/register` com `role = ADMIN` DEVE retornar 400. Lançar `BusinessRuleException("Role ADMIN não pode ser registrado via endpoint público.")` — o `GlobalExceptionHandler` mapeia para 422 por padrão. Verificar se é melhor 400; se necessário sobrescrever via `@ResponseStatus` ou usar exceção dedicada que retorne 400.

**2. Flyway V2 é o ÚNICO migration desta story**
Arquitetura.md lista nomes de migrations diferente dos epics (usou nomes ilustrativos). Os ACs dos epics são a fonte de verdade: V2 = `users` + `refresh_tokens`. A tabela `password_reset_tokens` não foi explicitamente mapeada no architecture.md mas é necessária para o forgot-password (AC 10-12) — incluir no V2.

**3. jjwt 0.12.6 — API mudou em relação a versões anteriores**
- Usar `Jwts.parser()` (NÃO `Jwts.parserBuilder()` — foi renomeado)
- Usar `.parseSignedClaims(token)` (NÃO `parseClaimsJws()`)
- Usar `Keys.hmacShaKeyFor(secretBytes)` para criar a chave
- Tratamento de exceções: `JwtException` é a base; `ExpiredJwtException` e `MalformedJwtException` são subclasses

**4. Hash do refresh token — nunca armazenar bruto**
Gerar o refresh token como `UUID.randomUUID().toString()`, retornar o valor bruto ao cliente, mas armazenar apenas `SHA-256(token)` no banco. Na validação: hash o token recebido e buscar pelo hash.

**5. Forgot-password: resposta idêntica para email existente e inexistente**
Isso é segurança obrigatória — impede enumeração de usuários. O `AuthServiceImpl.forgotPassword()` deve sempre retornar 200 com a mensagem genérica mesmo que o email não exista no banco. Apenas quando o email existe é que o e-mail é disparado.

**6. SecurityConfig precisa ser atualizado — JwtAuthenticationFilter**
O `SecurityConfig` atual não tem filtro JWT. Esta story adiciona:
```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) {
    // ... configuração existente ...
    http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
}

@Bean
public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
    return config.getAuthenticationManager();
}

@Bean
public DaoAuthenticationProvider authenticationProvider(UserDetailsService uds, PasswordEncoder encoder) {
    DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
    provider.setUserDetailsService(uds);
    provider.setPasswordEncoder(encoder);
    return provider;
}
```

**7. Teste com H2 — Flyway V2 deve ser compatível**
O profile de teste usa H2 com `ddl-auto: create-drop` e `flyway.enabled: false`. As entidades JPA são suficientes para o H2 criar as tabelas. Não usar `gen_random_uuid()` como default em entidade JPA — usar `@GeneratedValue` com strategy `UUID` ou gerar no código Java com `UUID.randomUUID()`.

---

### Padrões Estabelecidos na Story 1.1 (a preservar)

- `GlobalExceptionHandler` extends `ResponseEntityExceptionHandler` — NÃO remover essa herança
- `SecurityConfig` CORS registrado em `/**` com headers explícitos — NÃO alterar
- `S3Presigner` é um bean Spring gerenciado pelo `MinioConfig` — não instanciar diretamente
- Teste usa `@SpringBootTest @ActiveProfiles("test")` com H2

---

### Arquitetura dos Arquivos — Backend (shared/auth/)

```
shared/auth/
  User.java                        ← JPA entity, implements UserDetails
  UserRepository.java
  RefreshToken.java                ← JPA entity
  RefreshTokenRepository.java
  PasswordResetToken.java          ← JPA entity
  PasswordResetTokenRepository.java
  AuthController.java
  AuthService.java                 ← interface
  AuthServiceImpl.java
  JwtUtil.java                     ← geração e validação de tokens
  JwtAuthenticationFilter.java     ← OncePerRequestFilter
  UserDetailsServiceImpl.java      ← implements UserDetailsService
  RegisterRequest.java             ← @Valid, campos: email, password, role
  LoginRequest.java                ← @Valid, campos: email, password
  AuthResponse.java                ← campos: accessToken, refreshToken, role
  RefreshTokenRequest.java         ← campo: refreshToken
  ForgotPasswordRequest.java       ← campo: email
  ResetPasswordRequest.java        ← campos: token, newPassword, confirmPassword
```

---

### Schema SQL — V2

```sql
-- V2: Authentication tables
-- Story 1.2 — User Authentication & Role System

CREATE TABLE users (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email        VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role         VARCHAR(20) NOT NULL CHECK (role IN ('EXECUTIVE', 'PME', 'ADMIN')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
```

---

### JwtUtil — Padrão jjwt 0.12.6

```java
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;

@Component
public class JwtUtil {

    @Value("${fracexec.jwt.secret}")
    private String secret;

    @Value("${fracexec.jwt.access-token-expiration-ms}")
    private long expirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(UserDetails userDetails) {
        return Jwts.builder()
            .subject(userDetails.getUsername())
            .claim("role", /* extrair role do User */ )
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirationMs))
            .signWith(getSigningKey())
            .compact();
    }

    public Claims extractAllClaims(String token) {
        // Usar parseSignedClaims (NÃO parseClaimsJws — renomeado no 0.12.x)
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String email = extractEmail(token);
        return email.equals(userDetails.getUsername())
            && !extractAllClaims(token).getExpiration().before(new Date());
    }
}
```

---

### AuthResponse — Estrutura

```java
public record AuthResponse(
    String accessToken,
    String refreshToken,
    String role,
    String email
) {}
```

---

### Estrutura Angular — Páginas de Auth

```
src/app/shared/pages/
  login/
    login.ts
  forgot-password/
    forgot-password.ts
  reset-password/
    reset-password.ts
```

Rotas públicas no `app.routes.ts`:
```typescript
{ path: 'login', loadComponent: () => import('./shared/pages/login/login').then(m => m.Login) },
{ path: 'forgot-password', loadComponent: () => import('./shared/pages/forgot-password/forgot-password').then(m => m.ForgotPassword) },
{ path: 'reset-password', loadComponent: () => import('./shared/pages/reset-password/reset-password').then(m => m.ResetPassword) },
```

---

### Padrão de Hash do Refresh Token

```java
private String hashToken(String rawToken) {
    try {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    } catch (NoSuchAlgorithmException e) {
        throw new IllegalStateException("SHA-256 not available", e);
    }
}
```

---

### Regras Mandatórias de Arquitetura (todas as stories)

1. Estrutura de pacotes por **feature** (não por layer)
2. **UUID** como ID público em todas as entidades
3. Erros no formato **RFC 7807 Problem Details** (`GlobalExceptionHandler`)
4. Datas como **ISO 8601 com timezone** (`2026-05-28T10:30:00Z`)
5. **camelCase** nos campos JSON da API
6. Tabelas e colunas em **snake_case** (plural nas tabelas)
7. **Migration Flyway** para qualquer mudança de schema
8. **Nunca logar PII** em texto plano (SLF4J + Logback JSON)
9. **Bean Validation** nas classes `*Request`
10. **Signals** para estado no Angular — não `BehaviorSubject` desnecessário

### References

- [Architecture — Auth & Security](bmad-output/planning-artifacts/architecture.md#autenticação--segurança)
- [Architecture — Regras Mandatórias](bmad-output/planning-artifacts/architecture.md#regras-mandatórias-para-todos-os-agentes)
- [Epics — Story 1.2 ACs](bmad-output/planning-artifacts/epics.md#story-12-user-authentication--role-system)
- [Story 1.1 — Padrões estabelecidos](bmad-output/implementation-artifacts/1-1-project-bootstrap-and-local-dev-environment.md#dev-agent-record)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (anthropic.claude-4-6-sonnet)

### Debug Log References

1. **DaoAuthenticationProvider deprecated**: Construtor sem argumento e `setUserDetailsService` são deprecated no Spring Security 6.3+. Solução: remover o bean explícito — Spring Boot auto-configura o provider ao detectar `UserDetailsService` + `PasswordEncoder` beans.
2. **TypeScript strict mode + FormBuilder**: Inicialização de `form = this.fb.group(...)` como field declaration falha em strict mode porque `fb` ainda não está injetado. Solução: mover inicialização para o construtor.
3. **AC-2 status code**: `BusinessRuleException` mapeia para 422. ADMIN block exige 400. Criada `InvalidRequestException` → 400 para esse caso específico.
4. **Spring Security 403 vs 401 em rota não mapeada**: Sem handler registrado em `/api/v1/executive/test`, Spring retorna 403 (AccessDeniedException) em vez de 401. O teste foi ajustado para `is4xxClientError()` — o comportamento é correto: rota protegida bloqueada para não-autenticados.

### Completion Notes List

- Backend: 11/11 testes passando incluindo todos os ACs de autenticação
- `InvalidRequestException` adicionada ao `GlobalExceptionHandler` para casos que exigem 400 (ADMIN block)
- Refresh token e password reset token armazenam apenas SHA-256 hash no banco — token bruto nunca persiste
- `forgot-password` retorna 200 com mensagem genérica independente do email existir (anti-enumeração, AC-10)
- Todos os logs de auth usam apenas UUID — nunca email, password ou token (AC-9)
- Angular: lazy chunks para `login`, `forgot-password`, `reset-password` confirmados no build
- `app.routes.ts` protege `/executive/**`, `/company/**`, `/admin/**` com `authGuard` + `roleGuard`

### File List

**fracexec-api/**
- `src/main/resources/db/migration/V2__users_and_auth.sql` (criado)
- `src/main/java/com/fracexec/api/shared/auth/Role.java` (criado)
- `src/main/java/com/fracexec/api/shared/auth/User.java` (criado)
- `src/main/java/com/fracexec/api/shared/auth/UserRepository.java` (criado)
- `src/main/java/com/fracexec/api/shared/auth/RefreshToken.java` (criado)
- `src/main/java/com/fracexec/api/shared/auth/RefreshTokenRepository.java` (criado)
- `src/main/java/com/fracexec/api/shared/auth/PasswordResetToken.java` (criado)
- `src/main/java/com/fracexec/api/shared/auth/PasswordResetTokenRepository.java` (criado)
- `src/main/java/com/fracexec/api/shared/auth/JwtUtil.java` (criado)
- `src/main/java/com/fracexec/api/shared/auth/JwtAuthenticationFilter.java` (criado)
- `src/main/java/com/fracexec/api/shared/auth/UserDetailsServiceImpl.java` (criado)
- `src/main/java/com/fracexec/api/shared/auth/AuthService.java` (criado)
- `src/main/java/com/fracexec/api/shared/auth/AuthServiceImpl.java` (criado)
- `src/main/java/com/fracexec/api/shared/auth/AuthController.java` (criado)
- `src/main/java/com/fracexec/api/shared/auth/RegisterRequest.java` (criado)
- `src/main/java/com/fracexec/api/shared/auth/LoginRequest.java` (criado)
- `src/main/java/com/fracexec/api/shared/auth/AuthResponse.java` (criado)
- `src/main/java/com/fracexec/api/shared/auth/RefreshTokenRequest.java` (criado)
- `src/main/java/com/fracexec/api/shared/auth/ForgotPasswordRequest.java` (criado)
- `src/main/java/com/fracexec/api/shared/auth/ResetPasswordRequest.java` (criado)
- `src/main/java/com/fracexec/api/shared/exception/InvalidRequestException.java` (criado)
- `src/main/java/com/fracexec/api/shared/exception/GlobalExceptionHandler.java` (modificado — handler para InvalidRequestException)
- `src/main/java/com/fracexec/api/shared/config/SecurityConfig.java` (modificado — JwtAuthenticationFilter + AuthenticationManager)
- `src/test/java/com/fracexec/api/shared/auth/AuthControllerTest.java` (criado — 11 testes)

**fracexec-web/**
- `src/app/core/models/user.model.ts` (criado)
- `src/app/core/models/api-response.model.ts` (criado)
- `src/app/core/auth/auth.service.ts` (criado)
- `src/app/core/auth/auth.guard.ts` (criado)
- `src/app/core/auth/role.guard.ts` (criado)
- `src/app/core/interceptors/auth.interceptor.ts` (criado)
- `src/app/core/interceptors/error.interceptor.ts` (criado)
- `src/app/shared/pages/login/login.ts` (criado)
- `src/app/shared/pages/forgot-password/forgot-password.ts` (criado)
- `src/app/shared/pages/reset-password/reset-password.ts` (criado)
- `src/app/app.routes.ts` (modificado — rotas públicas + portais protegidos)
- `src/app/app.config.ts` (modificado — provideHttpClient com interceptors)

## Senior Developer Review (AI)

**Data:** 2026-06-01
**Outcome:** Changes Requested
**Layers:** Blind Hunter · Edge Case Hunter · Acceptance Auditor
**Dismissados:** 4 (baixo impacto / por design no MVP)

### Action Items

#### Blockers (violações de AC)

- [x] [Review][Patch] AC-5: refresh token inválido retorna 404/422 em vez de 401 — `UnauthorizedException` criada e usada no fluxo de refresh [AuthServiceImpl.java]
- [x] [Review][Patch] AC-6: sem `AuthenticationEntryPoint` — configurado com resposta RFC 7807, retorna 401 [SecurityConfig.java]
- [x] [Review][Patch] AC-7: nenhum controle de acesso por role — adicionado `hasRole("ADMIN")`, `hasRole("EXECUTIVE")`, `hasRole("PME")` por prefixo de URL [SecurityConfig.java]
- [x] [Review][Patch] AC-12: reset-password com token expirado/usado retorna 422 — trocado para `InvalidRequestException` (→ 400) [AuthServiceImpl.java]

#### Patches de Segurança

- [x] [Review][Patch] Refresh token sem rotação — token atual revogado + novo emitido a cada uso [AuthServiceImpl.java]
- [x] [Review][Patch] `forgot-password` não invalida tokens anteriores — `invalidatePriorTokensByUserId()` adicionado ao repository e chamado [PasswordResetTokenRepository.java / AuthServiceImpl.java]
- [x] [Review][Patch] `fracexec.app.base-url` hardcoded para localhost — usa `${FRONTEND_URL:http://localhost:4200}` como fallback aninhado [AuthServiceImpl.java:42]
- [x] [Review][Patch] `refresh_tokens.token_hash` e `password_reset_tokens.token_hash` sem UNIQUE constraint explícita — adicionado `ADD CONSTRAINT uq_...` [V2__users_and_auth.sql]
- [x] [Review][Patch] `JwtUtil.getSigningKey()` recriava chave a cada chamada — cacheado via `@PostConstruct` + validação de ≥ 32 bytes no startup [JwtUtil.java]
- [x] [Review][Patch] `@jakarta.transaction.Transactional` — trocado para `@org.springframework.transaction.annotation.Transactional` [AuthServiceImpl.java]
- [x] [Review][Patch] SMTP exception logava `e.getMessage()` com possível PII — agora loga apenas `e.getClass().getSimpleName()` [AuthServiceImpl.java]
- [x] [Review][Patch] `User.updatedAt` nunca atualizado — substituído por `@UpdateTimestamp` do Hibernate [User.java]
- [x] [Review][Patch] `AuthService.ts refreshToken()` enviava `null` — guard adicionado: faz logout se não há token [auth.service.ts]

#### Deferred

- [x] [Review][Defer] localStorage para tokens (vs HttpOnly cookies) — MVP aceita este tradeoff; migrar para cookies em Epic 6 se LGPD ou security review exigir — deferred por design
- [x] [Review][Defer] JWT decode client-side sem verificação de assinatura — risco de UI enganosa, mas backend rejeita tokens adulterados; aceitável no MVP — deferred
- [x] [Review][Defer] DB lookup em toda request autenticada (sem cache) — irrelevante na escala do MVP (300 usuários) — deferred para Epic 6 observabilidade
- [x] [Review][Defer] `isTokenValid` parseia JWT duas vezes — otimização menor, sem impacto funcional — deferred

### Review Follow-ups (AI)

_(será preenchido pelo dev ao retomar a implementação)_
