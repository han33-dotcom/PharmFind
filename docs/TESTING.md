# Testing And Quality Gates

## Why This Exists

PharmFind is no longer in a phase where feature work should be merged based only on manual clicking. The current repo uses layered checks so regressions are easier to catch before they land in `main`.

## Validation Commands

Run these from the repo root.

### Lint

```bash
npm run lint
```

Purpose:

- catches TypeScript/JavaScript and React lint issues
- protects basic code quality and consistency

### Build

```bash
npm run build
```

Purpose:

- confirms the frontend can compile successfully for production

### Frontend Smoke Tests

```bash
npm run test:frontend
```

Purpose:

- checks the route shell and guarded route behavior
- catches obvious frontend breakage without requiring full browser automation

### Backend Integration Tests

```bash
npm run test:server
```

Purpose:

- starts the backend microservices
- validates cross-service behavior through real HTTP calls
- covers critical product flows such as auth recovery and order lifecycle behavior

### Browser E2E Tests

```bash
npm run test:e2e
```

Purpose:

- runs Playwright against the real frontend and local microservices
- validates the main role-based journeys in a browser

Currently covered:

- patient prescription checkout
- pharmacist order acceptance
- driver delivery lifecycle
- pharmacist inventory maintenance

### Full Validation

```bash
npm run validate
```

This runs:

1. lint
2. build
3. frontend smoke tests
4. backend integration tests
5. browser E2E tests

### Faster Validation

```bash
npm run validate:quick
```

This is intended for faster local iteration when browser E2E is not needed yet.

## Important Operational Note

Do not run backend integration tests and Playwright against the same local repo environment in parallel unless you intentionally isolate ports and data. Both flows spin up local services and use the same dev resources. Sequential execution is the supported path.

## GitHub Actions

CI workflow:

- `.github/workflows/ci.yml`

It runs on push and pull request and covers:

- dependency install
- Playwright browser install
- lint
- build
- frontend smoke tests
- backend integration tests
- browser E2E tests

## Definition Of Done For A Product Slice

A product slice should not be treated as done unless:

- it is API-backed where appropriate
- role access rules are correct
- loading, empty, success, and error states are handled
- automated checks are updated for the changed behavior
- local validation is green
- CI is green

## Recommended Developer Workflow

1. implement one coherent slice
2. run `npm run validate:quick`
3. if the slice affects user journeys, run `npm run test:e2e`
4. before merge, run `npm run validate`
5. confirm CI passes after push
