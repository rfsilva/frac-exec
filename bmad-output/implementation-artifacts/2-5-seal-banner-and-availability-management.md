---
baseline_commit: NO_VCS
---

# Story 2.5: Seal Banner & Availability Management

Status: done

## Story

As an authenticated executive, I want to see my verification seal displayed prominently on every page and be able to manage my availability directly from the dashboard, so that my status is always visible and I can update how many days per month I am available without navigating away.

## Acceptance Criteria

1. Any authenticated executive page renders `SealBannerComponent` at the top of the `ExecutiveShell` layout — non-dismissible — with a gradient from `brand.primary` to `brand.deep`, a ✦ icon inside a `brand.accent` circle, the executive's full name, a status badge (Ativo / Inativo / Suspenso), and the profile verification date.
2. Status badge color rules: Ativo → green; Inativo → orange with a visible "Atualizar disponibilidade" CTA button; Suspenso → grey (no CTA).
3. The executive dashboard contains an Availability widget showing days/month as a progress bar, the numeric value rendered in JetBrains Mono font, and an "Editar" button.
4. Clicking "Editar" opens an inline side drawer (not a full-page navigation) containing a days/month selector (range 1–20) and a profile-status selector (Ativo / Pausado / Indisponível).
5. Saving in the drawer persists changes via `PATCH /api/v1/executive/profile/availability`, updates the widget values in real time without a page reload, closes the drawer, and shows an inline success message "Disponibilidade atualizada."
6. When `availabilityDaysPerMonth` is 0, the executive is excluded from new match shortlist suggestions (enforced on the backend when building shortlists).
7. The drawer is fully keyboard accessible: all controls have `aria-label` attributes, focus is trapped inside the drawer while open, and the drawer can be closed with the ESC key.
8. If the drawer has unsaved changes and the user clicks outside or presses ESC, a confirmation dialog appears with the message "Descartar alterações?" and buttons "Descartar" / "Continuar editando"; navigation only proceeds if "Descartar" is chosen.

## Tasks / Subtasks

### 1. Backend — PATCH availability endpoint

- [ ] 1.1 Create `AvailabilityUpdateRequest` DTO in `src/main/java/com/fracexec/executive/dto/` with fields `availabilityDaysPerMonth` (Integer, 0–20, `@Min(0) @Max(20)`) and `profileStatus` (String, must be a valid `ProfileStatus` value; add `@Pattern` or custom validator).
- [ ] 1.2 Add `updateAvailability(Long executiveId, AvailabilityUpdateRequest dto)` method to `ExecutiveProfileService` in `src/main/java/com/fracexec/executive/service/ExecutiveProfileService.java`. The method must: fetch the profile by `executiveId`, apply the two fields, persist via the repository, and return the updated profile as a response DTO.
- [ ] 1.3 Add `PATCH /api/v1/executive/profile/availability` endpoint to `ExecutiveProfileController` in `src/main/java/com/fracexec/executive/ExecutiveProfileController.java`. Endpoint is authenticated; extract `executiveId` from the JWT principal. Return `200 OK` with `AvailabilityUpdateResponse` containing the updated `availabilityDaysPerMonth` and `profileStatus`.
- [ ] 1.4 Confirm that the shortlist-building logic (wherever match suggestions are assembled) filters out executives whose `availabilityDaysPerMonth` is 0. Add a WHERE clause or an in-memory filter guard and leave a TODO comment if the shortlist feature is not yet implemented.
- [ ] 1.5 Write unit tests for `ExecutiveProfileService.updateAvailability` covering: happy path, zero days, invalid status string, and executive not found.
- [ ] 1.6 Write integration/controller test for `PATCH /api/v1/executive/profile/availability` covering: 200 success, 400 validation error, 401 unauthenticated.

### 2. Frontend — SealBannerComponent

- [ ] 2.1 Generate standalone Angular component `SealBannerComponent` at `src/app/executive/seal-banner/seal-banner.component.ts` (selector: `app-seal-banner`). Use `ChangeDetectionStrategy.OnPush`.
- [ ] 2.2 Component input: `profile: ExecutiveProfileSummary` (interface with `fullName: string`, `profileStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'`, `verificationDate: string | null`). Define the interface in `src/app/executive/models/executive-profile-summary.model.ts`.
- [ ] 2.3 Implement the template:
  - Outer container: full-width, gradient background `brand.primary → brand.deep` (use CSS custom properties from the design system).
  - Left section: `brand.accent`-coloured circle containing the ✦ character.
  - Center section: executive full name in white, verification date below in a muted tone (format `dd/MM/yyyy`; if null display "Data não disponível").
  - Right section: status badge with conditional colour (green / orange / grey per AC 2). If status is `INACTIVE`, render an "Atualizar disponibilidade" `<button>` that emits an `(updateAvailability)` output event.
- [ ] 2.4 Add SCSS/CSS for the banner. Do not use arbitrary colours — reference the design-token CSS variables already defined in the project theme.
- [ ] 2.5 Inject `SealBannerComponent` into `ExecutiveShell` (`src/app/executive/executive-shell/executive-shell.ts`): import the component, add `<app-seal-banner [profile]="executiveProfile">` above the `<router-outlet>` in the template. Load `executiveProfile` by calling the existing profile service in `ngOnInit`; store as a signal or observable.
- [ ] 2.6 Write unit tests for `SealBannerComponent`: status badge colour logic, "Atualizar disponibilidade" CTA visible only for INACTIVE, output event emitted on CTA click, null verification date display.

### 3. Frontend — AvailabilityDrawerComponent

- [ ] 3.1 Generate standalone component `AvailabilityDrawerComponent` at `src/app/executive/availability-drawer/availability-drawer.component.ts` (selector: `app-availability-drawer`).
- [ ] 3.2 Inputs: `isOpen: boolean`, `currentDays: number`, `currentStatus: string`. Outputs: `closed: EventEmitter<void>`, `saved: EventEmitter<{ availabilityDaysPerMonth: number; profileStatus: string }>`.
- [ ] 3.3 Implement drawer template as an inline overlay panel (position `fixed`, right-aligned, full-height) — NOT a router navigation. Include:
  - Days/month `<input type="number" min="1" max="20">` with `aria-label="Dias por mês"`.
  - Status `<select>` with options Ativo / Pausado / Indisponível, `aria-label="Status de disponibilidade"`.
  - "Salvar" button and "Cancelar" button.
- [ ] 3.4 Implement unsaved-changes guard: track `isDirty` (form value differs from inputs). On ESC keydown or backdrop click, if `isDirty` is true, show a confirmation dialog (inline `<dialog>` element or Angular CDK Dialog) with "Descartar alterações?", "Descartar" (confirms close), and "Continuar editando" (cancels close).
- [ ] 3.5 Implement focus trap: when `isOpen` becomes true, move focus to the first focusable element inside the drawer. On close, return focus to the "Editar" trigger button.
- [ ] 3.6 Implement ESC key listener (`@HostListener('document:keydown.escape')`) that triggers the unsaved-changes guard flow.
- [ ] 3.7 On "Salvar" click: emit the `saved` event with the current form values. The parent component handles the HTTP call and closes the drawer on success.
- [ ] 3.8 Write unit tests: dirty-state detection, ESC triggers confirmation dialog, backdrop click triggers confirmation dialog, "Descartar" closes without saving, "Continuar editando" keeps drawer open, focus trap initialisation, "Salvar" emits correct payload.

### 4. Frontend — Dashboard availability widget

- [ ] 4.1 In `src/app/executive/dashboard/executive-dashboard.ts`, add an Availability widget section to the dashboard template.
- [ ] 4.2 Widget layout: label "Disponibilidade", a `<progress>` element (or styled `<div>`) showing `availabilityDaysPerMonth / 20` as a percentage, the numeric value displayed in `JetBrains Mono` font (add font family to the relevant CSS class), and an "Editar" `<button>`.
- [ ] 4.3 Add `AvailabilityDrawerComponent` to the dashboard imports. Bind `[isOpen]`, `[currentDays]`, `[currentStatus]` to dashboard component state. Handle `(saved)` output: call `ExecutiveProfileService.updateAvailability(payload)`, on success update the local signal/state, close the drawer, and display the inline message "Disponibilidade atualizada." for 4 seconds.
- [ ] 4.4 Handle the `(closed)` output from the drawer to flip `isOpen` to false.
- [ ] 4.5 Add `ExecutiveProfileService` method `updateAvailability(payload)` in `src/app/executive/services/executive-profile.service.ts` that calls `PATCH /api/v1/executive/profile/availability` and returns the response observable.
- [ ] 4.6 Write unit tests for the dashboard widget: "Editar" opens the drawer, saved event triggers service call and updates widget values, success message appears after save and disappears after timeout, closed event shuts the drawer.

### 5. Final validation

- [ ] 5.1 Run all backend unit and integration tests; confirm zero failures.
- [ ] 5.2 Run all frontend unit tests; confirm zero failures.
- [ ] 5.3 Manually verify (or run E2E test if available): SealBanner appears on dashboard and at least one other executive route; status badge colours correct; drawer opens/closes; unsaved-changes dialog triggers correctly; widget updates in real time after save.
- [ ] 5.4 Verify accessibility: tab order reaches every drawer control, ESC closes with confirmation, aria-labels present on drawer inputs.

## Dev Notes

**No Flyway migration needed.** The `availability_days_per_month` and `profile_status` columns were added in migration V5 as part of Story 2.4. Do not create a new migration file.

**`ProfileStatus` enum** on the backend lives in `src/main/java/com/fracexec/executive/model/ProfileStatus.java` with values `ACTIVE`, `INACTIVE`, `SUSPENDED`. The frontend status selector uses Portuguese labels (Ativo/Pausado/Indisponível) — map them to the backend enum values before sending the PATCH request.

**Controller and service package conventions:** controller goes in `com.fracexec.executive`, service goes in `com.fracexec.executive.service`. Follow existing patterns from Story 2.4 files.

**SealBanner placement:** the component must be added to `ExecutiveShell` (`src/app/executive/executive-shell/executive-shell.ts`), not to `AppShell` (`src/app/shared/layout/app-shell/app-shell.ts`). The banner should only appear on executive routes, not on all app routes.

**Drawer is not a route.** Do not create a new Angular route for the availability drawer. It is an inline overlay component toggled by a boolean flag in the dashboard component's state. Using the Angular Router for this would violate AC 4.

**Zero-availability exclusion (AC 6):** if the shortlist feature is not yet built, add a comment in the relevant service layer noting that executives with `availabilityDaysPerMonth = 0` must be excluded when that feature is implemented. Do not leave it undocumented.

**JetBrains Mono font** must already be loaded by the project (check `index.html` or the global styles). If it is not present, add a `<link>` to the Google Fonts CDN import for JetBrains Mono in `src/index.html` before referencing it in CSS.

**Inline success message** ("Disponibilidade atualizada.") should be rendered in the dashboard template next to the widget, not as a toast from a global notification service, to keep the change scoped to this story. Use a simple `*ngIf` / `@if` bound to a timed boolean flag.

**Do not use `setTimeout` directly in components.** Inject `DestroyRef` and clear the timer in the destroy hook, or use an RxJS `timer` piped through `takeUntilDestroyed(this.destroyRef)` to avoid memory leaks.

## Dev Agent Record

### Agent Model Used
_A ser preenchido_

### Debug Log References
_A ser preenchido_

### Completion Notes List
_A ser preenchido_

### File List
_A ser preenchido_

## Senior Developer Review (AI)

**Data:** 2026-06-02
**Outcome:** Changes Requested
**Layers:** Blind Hunter · Acceptance Auditor (merged)

### Action Items

#### Blockers (High)

- [x] [Review][Patch] Drawer "Salvar" sem guard — segundo clique antes da resposta envia PATCH duplo; adicionar `saving` signal e `[disabled]="saving()"` [availability-drawer.ts]
- [x] [Review][Patch] Min days = 0 contradiz AC-4 (range 1–20) — alterar `min="1"` no input e `@Min(1)` no backend; 0 é sentinel do sistema, não seleção do usuário [AvailabilityUpdateRequest.java / availability-drawer.ts]
- [x] [Review][Patch] JWT parsing com `atob` sem padding — usar `AuthService.currentUser()` para obter o email em vez de parsear manualmente [executive-shell.ts:72-78]
- [x] [Review][Patch] `progressPct` getter retorna lambda — usar `get progressPct(): number { return Math.round(...); }` sem arrow function interna [executive-dashboard.ts:86]

#### Patches de Qualidade / AC (Med)

- [x] [Review][Patch] `verificationDate` hardcoded null — adicionar campo `verifiedAt` na entidade / response e passar valor real ao SealBanner [executive-shell.ts:27]
- [x] [Review][Patch] Focus trap ausente apesar de `aria-modal="true"` — adicionar lógica de focus trap manual (sem CDK no MVP) [availability-drawer.ts]
- [x] [Review][Patch] Dashboard inicializa `profileStatus` como 'ACTIVE' antes do GET — usar `null` ou valor do perfil carregado; unificar com a chamada do Shell para evitar double-load [executive-dashboard.ts:82]
- [x] [Review][Patch] Sem `error:` handler no profile load do Shell e Dashboard — adicionar fallback para evitar banner silenciosamente ausente [executive-shell.ts / executive-dashboard.ts]

#### Deferred

- [x] [Review][Defer] Drawer não fecha imediatamente (aguarda PATCH) — UX aceitável; usuário vê spinner

### Review Follow-ups (AI)
_(será preenchido pelo dev ao retomar)_
