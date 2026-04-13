# Product Overview

## What PharmFind Is

PharmFind is a role-based web application for pharmacy discovery, medicine ordering, and delivery coordination. It is built around three operating roles:

- `patient`
- `pharmacist`
- `driver`

The product is intended to cover the path from medicine search to pharmacy fulfillment to final delivery.

## Core User Roles

### Patient

The patient side of the app is responsible for customer-facing commerce behavior:

- search for medicines
- compare which pharmacies stock a medicine
- browse an individual pharmacy store
- add medicines to cart
- manage saved addresses
- manage favorites
- upload prescriptions when required
- place pickup or delivery orders
- track order progress
- reorder past items

### Pharmacist

The pharmacist side of the app is responsible for pharmacy operations:

- register a pharmacy account
- manage pharmacy profile data
- manage inventory
- review pending orders
- accept or reject orders
- move orders through the pharmacy side of fulfillment

### Driver

The driver side of the app is responsible for the delivery handoff:

- view available deliveries
- accept one delivery
- mark pickup from the pharmacy
- mark the order in transit
- mark the order delivered
- review delivery history and summary stats

## End-To-End Product Flow

The intended MVP flow is:

1. a patient searches for a medicine
2. the patient selects a pharmacy and adds items to cart
3. checkout creates an order
4. if a prescription is needed, the patient uploads it
5. a pharmacist reviews and confirms the order
6. a driver accepts the delivery
7. the patient tracks progress until the order is delivered

This flow is implemented across the live microservices and is covered by integration and browser tests.

## What The MVP Covers

The `v1.0` MVP covers the first real working baseline of the product:

- patient order flow backed by APIs
- pharmacist order management backed by APIs
- driver delivery flow backed by APIs
- password reset
- email verification
- pharmacy inventory management
- Docker and Kubernetes deployment assets
- CI and automated regression coverage

## What The MVP Does Not Claim

This version is a real baseline, but it is not the final product:

- it is not a full production platform with complete operational hardening
- it does not include a full admin product surface
- it does not claim exhaustive browser/device coverage
- it still supports JSON-backed development storage for local workflows

These are deliberate boundaries, not hidden failures.

## Product Principles In This Repo

The current repo is organized around a few explicit principles:

- real product flows should be API-backed
- role access should be enforced server-side
- local mock or localStorage state should not become the source of truth for real flows
- the repo should stay runnable locally with minimal setup
- new product work should go through automated validation before merge
