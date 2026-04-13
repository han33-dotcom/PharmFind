# Contributing to PharmFind

This repo is already past the stage where unguarded feature work is acceptable. Every new requirement should ship through the same gate.

## Feature Gate

Before a change is ready to merge, it should satisfy all of the following:

- the feature is API-backed if it affects real product data
- route access is protected correctly for the intended role
- local mock or localStorage state is not introduced as the source of truth for a real flow
- loading, empty, error, and success states are handled
- tests are added or updated for the changed behavior
- `npm run lint` passes
- `npm run build` passes
- `npm test` passes
- `npm run test:e2e` passes for changes that affect user journeys
- CI is green

## Recommended Validation Commands

Full validation:

```bash
npm run validate
```

Faster pre-review validation:

```bash
npm run validate:quick
```

## Change Scope Rules

- Prefer one product slice per branch.
- Keep backend and frontend contract changes in the same branch when they are coupled.
- Do not bypass the service layer by wiring components directly to ad hoc fetch calls.
- Do not add new mock data paths for production features.

## Definition of Done for Product Work

A product slice is done when:

1. the backend contract exists and is validated
2. the frontend consumes that contract cleanly
3. role access and data ownership rules are enforced
4. manual UX dead ends are handled
5. automated checks cover the changed path

If one of those is missing, the slice is not done yet.
