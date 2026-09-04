# OmniScribe Health — AI Scribe Backend

Enterprise backend for the OmniScribe AI Medical Scribe. Handles clinical consultation sessions, message ingestion via a Redis-backed FIFO queue, SOAP note generation via Gemini, and FHIR R4 clinical document export.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway (:4000)                   │
│            /api/v1/* → proxy to services                │
└────────────────────────┬────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
│ Scribe Svc   │ │ Gemini Svc   │ │ FHIR Formatter   │
│   (:4001)    │ │   (:4002)    │ │     (:4003)      │
│              │ │              │ │                  │
│ Sessions     │ │ SOAP Gen     │ │ FHIR R4 Bundle   │
│ Messages     │ │ via Gemini   │ │ Mapping          │
│ Tasks        │ │              │ │                  │
└──────┬───────┘ └──────────────┘ └──────────────────┘
       │
  ┌────┴────┐
  ▼         ▼
Redis    Supabase
(BullMQ)  (Postgres)
```

### Services

| Service | Port | Responsibility |
|---------|------|----------------|
| **api-gateway** | 4000 | Public HTTP entry, proxying, health aggregation |
| **scribe-service** | 4001 | Consultation lifecycle, message ingestion, task orchestration |
| **gemini-service** | 4002 | Gemini SDK wrapper, SOAP note generation |
| **fhir-formatter-service** | 4003 | SOAP → FHIR R4 Document Bundle mapping |

### Packages

| Package | Purpose |
|---------|---------|
| **@omniscribe/contracts** | OpenAPI spec, generated types, Zod schemas, event types |
| **@omniscribe/config** | Zod-validated environment configuration |
| **@omniscribe/observability** | Pino logger, HTTP logging, correlation IDs |
| **@omniscribe/data-layer** | Repository interfaces + Supabase adapters |
| **@omniscribe/messaging** | BullMQ typed producers/consumers, Redis connection |

### BullMQ Queues

| Queue | Purpose |
|-------|---------|
| `scribe.message.ingestion` | Process incoming transcript messages |
| `scribe.soap.generation` | Trigger SOAP note generation via Gemini |
| `fhir.export` | Trigger FHIR R4 bundle export |

## Getting Started

### Prerequisites

- Node.js 22+
- Docker & Docker Compose
- A Gemini API key

### Setup

```bash
# 1. Clone and install
cd omniscribe-backend
npm install

# 2. Start infrastructure
docker compose up -d

# 3. Configure environment
cp .env.example .env
# Edit .env with your Supabase and Gemini credentials

# 4. Run database migrations
# Apply infrastructure/supabase/migrations/001_create_tables.sql
# to your Postgres/Supabase instance

# 5. Build
npm run build

# 6. Start services (in separate terminals or use a process manager)
npm run start --workspace=apps/api-gateway
npm run start --workspace=apps/scribe-service
npm run start --workspace=apps/gemini-service
npm run start --workspace=apps/fhir-formatter-service
```

### Development

```bash
# Type-check entire monorepo
npm run typecheck

# Build all packages and apps
npm run build

# Run a single service in dev mode
npm run dev --workspace=apps/scribe-service

# Lint
npm run lint

# Format
npm run format
```

## API Endpoints

Base URL: `http://localhost:4000/api/v1`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | System health check |
| POST | `/scribe/sessions` | Create consultation session |
| GET | `/scribe/sessions/:id` | Get session details |
| PATCH | `/scribe/sessions/:id` | Update session status |
| POST | `/scribe/sessions/:id/messages` | Submit transcript message |
| GET | `/scribe/sessions/:id/messages` | List session messages |
| GET | `/scribe/sessions/:id/records` | Get clinical records |
| POST | `/scribe/sessions/:id/tasks/generate-soap` | Trigger SOAP generation |
| GET | `/scribe/sessions/:id/tasks/:taskId` | Get task status |
| GET | `/scribe/sessions/:id/soap` | Get SOAP note |
| POST | `/scribe/sessions/:id/fhir/export` | Export FHIR bundle |
| GET | `/scribe/sessions/:id/fhir` | Get FHIR bundle |

## Database Schema

6 tables: `sessions`, `messages`, `clinical_records`, `tasks`, `soap_notes`, `fhir_bundles`

See `infrastructure/supabase/migrations/001_create_tables.sql` for the full schema.

## Clean Architecture

Each service follows strict Clean Architecture layers:

```
Domain (entities, value objects, errors)
  ↑
Application (use cases, ports, DTOs)
  ↑
Infrastructure (repositories, workers, external services)
  ↑
Presentation (controllers, routes, middleware)
```

**Dependency rule**: Inner layers never depend on outer layers. Infrastructure depends on application ports, not the other way around.

## License

Proprietary — OmniScribe Engineering
