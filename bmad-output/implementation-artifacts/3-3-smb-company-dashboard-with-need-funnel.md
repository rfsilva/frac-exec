---
baseline_commit: 934e2bb4190d177c856982d18f40e385f00a8dee
---

# Story 3.3: SMB Company Dashboard with Need Funnel

Status: done

## Story

Como PME ativa,
quero ver o status da minha necessidade no dashboard como um funil de progresso visual,
para que eu saiba exatamente em qual etapa do processo estou sem precisar entrar em contato.

## Acceptance Criteria

1. **Dado** `/company/dashboard` com necessidade ativa, **então** exibe `NeedFunnelComponent` como stepper horizontal com 5 estados: Recebida → Em análise → Shortlist enviada → Em mediação → Contratado — estado atual destacado

2. **Dado** cada estado do funil, **então** exibe: label, descrição do que está acontecendo, próximo evento esperado (ex: "Retorno com shortlist em até 5 dias úteis")

3. **Dado** dashboard sem necessidade ativa, **então** exibe estado vazio: "Você ainda não postou uma necessidade." + CTA "Postar necessidade" → `/company/need/new`

4. **Dado** o dashboard carregando dados, **então** `LoadingSkeletonComponent` tipo `card` — nunca spinner bloqueante

5. **Dado** stats de contexto no topo, **então** exibe: status, data de postagem, SLA restante (5 dias úteis a partir de `need.created_at`) em JetBrains Mono

6. **Dado** necessidade em estado `CONTRACTED`, **então** funil exibe todos os passos concluídos

7. **Dado** cálculo do SLA, **então** contado a partir de `need.created_at` independente do status atual; exibir "X dias restantes" ou "Prazo encerrado"

## Tasks / Subtasks

- [ ] **BACKEND: `GET /api/v1/company/dashboard`** (AC: 1–7)
  - [ ] Criar `CompanyDashboardController.java` com `GET /api/v1/company/dashboard`
  - [ ] `CompanyDashboardResponse.java`: record com `NeedSummary activeNeed` (nullable), `String companyName`, `CompanyStatus companyStatus`
  - [ ] `NeedSummary`: record interno com `id`, `cLevelType`, `status`, `createdAt`, `slaDeadline` (calculado: `created_at + 5 dias úteis`)
  - [ ] Calcular SLA: contar 5 dias úteis (seg–sex) a partir de `createdAt` — helper `BusinessDayCalculator.addBusinessDays(Instant, int)`
  - [ ] Necessidade ativa = status in (`RECEIVED`, `UNDER_ANALYSIS`, `SHORTLIST_SENT`, `IN_MEDIATION`, `CONTRACTED`)

- [ ] **BACKEND: Testes** (AC: 1, 3, 5, 7)
  - [ ] `CompanyDashboardControllerTest.java`: com necessidade ativa → retorna NeedSummary; sem necessidade → activeNeed null; SLA calculado corretamente (5 dias úteis)

- [ ] **FRONTEND: `NeedFunnelComponent`** (AC: 1, 2)
  - [ ] Criar `src/app/company/dashboard/need-funnel/need-funnel.ts` — componente standalone
  - [ ] Input: `@Input() currentStatus: string`
  - [ ] 5 passos com label + descrição + próximo evento esperado por status
  - [ ] Passo ativo destacado visualmente; passos anteriores como concluídos

- [ ] **FRONTEND: Reescrever `company-dashboard.ts`** (AC: 1, 3, 4, 5)
  - [ ] `GET /api/v1/company/dashboard` no `ngOnInit`
  - [ ] `loading = signal(false)`, `dashboard = signal<DashboardData | null>(null)`
  - [ ] Se `activeNeed` presente: renderizar stats + `NeedFunnelComponent`
  - [ ] Se ausente: estado vazio com CTA
  - [ ] `LoadingSkeletonComponent` enquanto carrega
  - [ ] SLA: calcular dias restantes a partir de `slaDeadline` (mostrar em JetBrains Mono)

## Dev Notes

### Cálculo de SLA no backend
```java
public static Instant addBusinessDays(Instant start, int days) {
    LocalDate date = start.atZone(ZoneId.of("America/Sao_Paulo")).toLocalDate();
    int added = 0;
    while (added < days) {
        date = date.plusDays(1);
        DayOfWeek dow = date.getDayOfWeek();
        if (dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY) added++;
    }
    return date.atStartOfDay(ZoneId.of("America/Sao_Paulo")).toInstant();
}
```

### Dependência: Story 3.2
Este endpoint usa `NeedRepository` e `Need` criados na Story 3.2. Implementar após V7 migration existir.

### Mapeamento de status → descrição do funil
| Status | Label | Descrição | Próximo evento |
|---|---|---|---|
| RECEIVED | Recebida | Sua necessidade foi recebida e está na fila. | Retorno em até 5 dias úteis |
| UNDER_ANALYSIS | Em análise | O time FracExec está avaliando sua necessidade. | Shortlist de executivos em breve |
| SHORTLIST_SENT | Shortlist enviada | Perfis de executivos foram selecionados. | Revise os perfis e selecione |
| IN_MEDIATION | Em mediação | Executivos notificados, aguardando confirmação. | Contrato em preparação |
| CONTRACTED | Contratado | Engajamento formalizado. | — |

## Dev Agent Record
### Debug Log
_vazio_
### Completion Notes
_vazio_

## File List
_a preencher_

## Change Log
_a preencher_
