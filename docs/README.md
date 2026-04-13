# Documentation Index

This folder contains the active documentation for the PharmFind MVP. The goal of the docs is to explain the product, implementation, setup, and operational model without duplicating low-value material or leaving stale guidance behind.

## Start Here

If you are new to the repo, read these first:

- [Product Overview](./PRODUCT_OVERVIEW.md)
- [Architecture](./ARCHITECTURE.md)
- [Testing And Quality Gates](./TESTING.md)

## Setup Guides

Use these when you want to run or deploy the application:

- [Quick Start](./guides/QUICK_START.md)
- [Full Setup](./guides/SETUP.md)
- [Docker Guide](./guides/DOCKER.md)
- [Microservices Guide](./guides/MICROSERVICES_SETUP.md)

## Backend References

Use these when you need backend or data-contract detail:

- [Backend Integration](./backend/BACKEND_INTEGRATION.md)
- [Database Schema](./backend/DATABASE_SCHEMA.md)
- [Email Verification](./backend/EMAIL_VERIFICATION.md)
- [PostgreSQL Migration](./backend/POSTGRES_MIGRATION.md)

## Repo-Adjacent Docs

Some important docs live outside `docs/` because they belong to a specific area of the repo:

- [Root README](../README.md)
- [Backend Services README](../server/README.md)
- [Infrastructure README](../infra/README.md)
- [Contributing Guide](../CONTRIBUTING.md)

## Recommended Reading By Role

For a product owner, stakeholder, or reviewer:

- [Product Overview](./PRODUCT_OVERVIEW.md)
- [Root README](../README.md)

For a frontend developer:

- [Architecture](./ARCHITECTURE.md)
- [Full Setup](./guides/SETUP.md)
- [Testing And Quality Gates](./TESTING.md)
- [Backend Integration](./backend/BACKEND_INTEGRATION.md)

For a backend developer:

- [Backend Services README](../server/README.md)
- [Microservices Guide](./guides/MICROSERVICES_SETUP.md)
- [Database Schema](./backend/DATABASE_SCHEMA.md)
- [PostgreSQL Migration](./backend/POSTGRES_MIGRATION.md)

For someone working on deployment or operations:

- [Docker Guide](./guides/DOCKER.md)
- [Infrastructure README](../infra/README.md)
- [Architecture](./ARCHITECTURE.md)

## Documentation Principles

The docs in this repo are intentionally biased toward:

- current behavior over historical notes
- setup paths that actually match the repo
- operational detail that helps somebody run or extend the MVP
- fewer, stronger documents instead of many overlapping “quick” guides
