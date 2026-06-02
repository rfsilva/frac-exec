# Convenções de Organização de Pacotes — FracExec API

## Estrutura interna de um domínio

Cada domínio feature-based segue a estrutura abaixo. Pacotes são criados **sob demanda** — não crie pacotes vazios antecipadamente.

```
<domain>/
  <Domain>Controller.java          ← endpoint REST; único ponto de entrada HTTP
  model/
    <Domain>.java                  ← entidade JPA (coração do domínio)
    <Enum>.java                    ← enums pertencentes ao domínio
  dto/
    <Action>Request.java           ← entradas validadas com @Valid / Bean Validation
    <Domain>Response.java          ← saídas serializadas para o cliente
  service/
    <Domain>Service.java           ← interface do contrato de negócio
    <Domain>ServiceImpl.java       ← implementação (mesmo pacote que a interface)
  repository/
    <Domain>Repository.java        ← Spring Data JPA (referencia model.*)
  filter/                          ← apenas quando o domínio produz filtros HTTP
    <Name>Filter.java
  event/                           ← apenas quando o domínio publica eventos internos
    <Domain>Event.java
```

## Regras

| Regra | Detalhe |
|-------|---------|
| **Entidade em `model/`** | Nunca em `repository/`. O repositório é acesso a dados; a entidade é o objeto de domínio. |
| **Interface + Impl no mesmo pacote** | `service/AuthService.java` e `service/AuthServiceImpl.java` ficam lado a lado — sem sub-pacote `impl/`. |
| **Controller na raiz do domínio** | Não em sub-pacote. Fica junto ao `model/`, `dto/` e `service/` para navegação direta. |
| **`event/` e `filter/` opcionais** | Só crie quando necessário. Não criar antecipadamente. |
| **Imports explícitos entre sub-pacotes** | `AuthServiceImpl` importa `com.fracexec.api.shared.auth.model.User` — sem wildcard. |
| **Testes espelham a estrutura** | `src/test/.../shared/auth/AuthControllerTest.java` testa o controller; pode importar de qualquer sub-pacote. |

## Exemplo aplicado — `shared/auth` (modelo de referência)

```
shared/auth/
  AuthController.java
  model/
    User.java
    Role.java
    RefreshToken.java
    PasswordResetToken.java
  dto/
    RegisterRequest.java
    LoginRequest.java
    AuthResponse.java
    RefreshTokenRequest.java
    ForgotPasswordRequest.java
    ResetPasswordRequest.java
  service/
    AuthService.java
    AuthServiceImpl.java
    UserDetailsServiceImpl.java
    JwtUtil.java
  repository/
    UserRepository.java
    RefreshTokenRepository.java
    PasswordResetTokenRepository.java
  filter/
    JwtAuthenticationFilter.java
```

## Template para domínios do Epic 2+

Ao criar um novo domínio (ex: `executive`), use este template mínimo de partida:

```
executive/
  ExecutiveController.java
  model/
    Executive.java          ← @Entity @Table("executives")
    ApplicationStatus.java  ← enum de estados da candidatura
  dto/
    ExecutiveApplicationRequest.java
    ExecutiveProfileResponse.java
  service/
    ExecutiveService.java
    ExecutiveServiceImpl.java
  repository/
    ExecutiveRepository.java
```

Adicione `event/` quando o domínio precisar publicar `ApplicationContext.publishEvent(...)`.

## Pacotes de infraestrutura compartilhada

Estes pacotes **não seguem** a estrutura de domínio — são globais e planos:

```
shared/
  config/          ← Spring @Configuration beans (SecurityConfig, MinioConfig, etc.)
  exception/       ← exceções de negócio + GlobalExceptionHandler
  storage/         ← MinioStorageService
  auth/            ← domínio de autenticação (segue a estrutura acima)
```
