# Continuation Plan

Use this checklist if work continues in a later session.

## Immediate verification

From `web/`:

1. `pnpm install`
2. `pnpm dev` — login with `owner@saru.demo` / `Demo@1234`
3. `pnpm build`
4. `pnpm test`
5. `pnpm lint`

## Remaining vertical slices (priority)

1. **Import detail tabs** — items, documents, landed cost preview, discrepancy review
2. **Tender detail workspace** — bid lines, compliance checklist, award/partial award UI
3. **Delivery confirm dispatch** — confirmation dialog + 409 handling + no optimistic stock
4. **Invoice PDF/print contract** — API download action wiring
5. **Document uploader** — drag/drop, progress, cancel, retry against mock
6. **Roles permission matrix** — editable grid posting to `/roles/:id/permissions`
7. **Reports job polling** — create job, poll status, secure download link
8. **Barcode lookup screen** — wedge + camera UI without silent stock mutation
9. **Playwright journeys** — login → products → tender → invoice finalize
10. **OpenAPI client generation** — replace provisional types

## Quality gates before calling a module “done”

- Route + page UI
- Typed API module + query keys
- MSW mock behavior
- Loading / empty / error states
- Permission checks on nav + primary actions
- At least one focused test

## Do not

- Invent connected third-party integrations
- Hardcode Pakistani tax rates as legal truth
- Mark placeholders as finished
- Fall back to mocks on production API failure
