# tensor-chain-indexer

Modular blockchain event indexer with built-in ML analytics for real-time liquidity, gas fee, and token velocity forecasting.

`tensor-chain-indexer` is designed to provide a reliable data and analytics layer for blockchain applications by transforming raw on-chain events into structured, queryable data and actionable market metrics.

## Overview

The project combines blockchain event indexing with machine-learning-assisted analytics.

It focuses on three core capabilities:

1. **Blockchain Event Indexing** — Ingest and normalize on-chain events into structured records.
2. **Real-Time Analytics** — Calculate metrics such as liquidity, gas fees, and token velocity from indexed blockchain activity.
3. **ML Forecasting** — Provide forecasting capabilities for selected blockchain metrics using historical indexed data.

The architecture is modular so that additional blockchain networks, event types, analytics models, and data providers can be added without coupling them to the core indexing pipeline.

## Goals

* Provide a reliable blockchain event indexing pipeline.
* Normalize blockchain data into a consistent internal representation.
* Support incremental and resumable indexing.
* Prevent duplicate event processing.
* Handle transient blockchain/RPC failures safely.
* Provide real-time analytics from indexed data.
* Support ML-based forecasting of selected blockchain metrics.
* Expose structured data through APIs for downstream applications.
* Keep chain-specific implementations isolated from analytics logic.
* Make the system easy for contributors to extend and test.

## Architecture

The system separates blockchain ingestion, data processing, analytics, and forecasting.

```text
                         Blockchain Network
                                │
                                ▼
                     ┌─────────────────────┐
                     │   RPC / Data Source │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │  Event Ingestion    │
                     │                     │
                     │ Blocks / Logs / Tx  │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │ Event Normalization │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │ Indexed Data Store  │
                     └──────────┬──────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
          ┌──────────────────┐    ┌──────────────────┐
          │ Real-Time        │    │ ML Analytics     │
          │ Analytics        │    │ & Forecasting    │
          └────────┬─────────┘    └────────┬─────────┘
                   │                       │
                   └───────────┬───────────┘
                               ▼
                     ┌─────────────────────┐
                     │      Query API      │
                     └─────────────────────┘
```

## Planned Project Structure

```text
tensor-chain-indexer/
├── src/
│   ├── chains/
│   │   ├── common/
│   │   ├── stellar/
│   │   └── evm/
│   │
│   ├── ingestion/
│   │   ├── blocks/
│   │   ├── events/
│   │   └── workers/
│   │
│   ├── normalization/
│   │   ├── events/
│   │   └── transactions/
│   │
│   ├── storage/
│   │   ├── models/
│   │   ├── repositories/
│   │   └── migrations/
│   │
│   ├── analytics/
│   │   ├── liquidity/
│   │   ├── gas/
│   │   └── token-velocity/
│   │
│   ├── forecasting/
│   │   ├── models/
│   │   ├── features/
│   │   └── services/
│   │
│   ├── api/
│   │   ├── health/
│   │   ├── events/
│   │   └── analytics/
│   │
│   ├── common/
│   │   ├── errors/
│   │   ├── logging/
│   │   └── config/
│   │
│   └── main.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/
├── examples/
├── .env.example
├── .gitignore
├── LICENSE
├── README.md
├── package.json
└── tsconfig.json
```

## Core Concepts

### Event Indexing

The indexer processes blockchain data incrementally.

A typical indexing lifecycle is:

```text
Discover Block
      │
      ▼
Fetch Blockchain Data
      │
      ▼
Extract Events
      │
      ▼
Normalize Events
      │
      ▼
Validate
      │
      ▼
Persist
      │
      ▼
Update Index Position
```

The indexing position should be persisted so that processing can resume safely after a restart.

### Event Identity

Every indexed event should have a deterministic identity.

Depending on the blockchain, this may include:

* Network/chain identifier.
* Block identifier.
* Transaction hash.
* Event/log index.

This allows the indexer to safely process the same event more than once without creating duplicate records.

## Reliability

The indexing pipeline should be designed to tolerate common blockchain infrastructure failures.

The system should support:

* RPC timeouts.
* Temporary provider failures.
* Rate limits.
* Retry with backoff.
* Resumable indexing.
* Duplicate event protection.
* Failed-event tracking.
* Basic chain reorganization handling where supported.

Retries should be applied only to transient failures. Deterministic validation or contract errors should not be retried indefinitely.

## Analytics

The analytics layer converts indexed blockchain activity into useful metrics.

### Liquidity

Liquidity analytics may include:

* Liquidity by token.
* Liquidity by pool.
* Liquidity changes over time.
* Inflow and outflow.
* Liquidity growth or decline.

### Gas Fees

Gas analytics may include:

* Total gas fees.
* Average gas fee.
* Minimum gas fee.
* Maximum gas fee.
* Gas fee trends over time.
* Gas usage by transaction or contract.

### Token Velocity

Token velocity measures the movement of a token through the observed ecosystem over a defined period.

The calculation and assumptions should be explicitly documented so downstream users can correctly interpret the metric.

## ML Forecasting

The forecasting layer uses indexed historical data to generate predictions for supported metrics.

Potential forecasting targets include:

* Liquidity trends.
* Gas fee trends.
* Token velocity.
* Other time-series blockchain indicators.

The architecture separates feature generation, model execution, and forecast serving:

```text
Indexed Data
     │
     ▼
Feature Generation
     │
     ▼
Model Input
     │
     ▼
ML Model
     │
     ▼
Forecast
     │
     ▼
Analytics API
```

### Forecasting Principles

Models should:

* Use clearly defined input features.
* Record the time range used for training/inference.
* Provide reproducible results where practical.
* Handle insufficient historical data safely.
* Avoid presenting predictions as guaranteed outcomes.

## API

The API is intended to expose indexed blockchain data and analytics to downstream applications.

Planned endpoints include:

```text
GET /health

GET /events
GET /events/:id

GET /analytics/liquidity
GET /analytics/gas
GET /analytics/token-velocity

GET /forecast/liquidity
GET /forecast/gas
GET /forecast/token-velocity
```

The API contract will evolve alongside implementation and should be documented as endpoints are introduced.

## Example Event Record

A normalized event may follow a structure similar to:

```json
{
  "id": "evt_01",
  "chain": "stellar",
  "blockNumber": 123456,
  "transactionHash": "TRANSACTION_HASH",
  "eventType": "token_transfer",
  "timestamp": "2026-08-25T10:00:00Z",
  "data": {
    "asset": "USDC",
    "from": "SOURCE_ADDRESS",
    "to": "DESTINATION_ADDRESS",
    "amount": "100.00"
  }
}
```

The exact schema will depend on the supported networks and event types.

## Supported Networks

The architecture is intended to support multiple blockchain networks through chain-specific adapters.

Potential initial integrations include:

* Stellar/Soroban.
* EVM-compatible networks.

Chain-specific code should remain isolated under the appropriate adapter so that adding a new network does not require changes to the core analytics engine.

## Development

### Prerequisites

Install:

* Node.js 20+
* npm
* Git

Additional infrastructure dependencies will be documented as they are introduced.

### Setup

Clone the repository:

```bash
git clone https://github.com/AetherWave-Labs/tensor-chain-indexer.git
cd tensor-chain-indexer
```

Install dependencies:

```bash
npm install
```

Create the local environment file:

```bash
cp .env.example .env
```

Configure the required RPC, database, and application settings.

> **Note:** The repository is currently in early development. Exact development commands, environment variables, database configuration, and runtime requirements will be finalized as the initial implementation is established.

## Testing

Testing should be separated by responsibility:

```text
tests/
├── unit/
├── integration/
└── e2e/
```

The test suite should cover:

* Event parsing.
* Event normalization.
* Duplicate event handling.
* Block processing.
* RPC failure handling.
* Retry behavior.
* Analytics calculations.
* Forecasting feature generation.
* Forecasting behavior.
* API responses.
* Persistence.
* Indexer recovery.

Blockchain integration tests should use dedicated test networks, fixtures, or controlled mocks where appropriate.

## Contributing

Contributions are welcome.

Before starting work:

1. Check the existing issues.
2. Select an unassigned issue.
3. Read the issue description and acceptance criteria.
4. Create a focused branch.
5. Keep changes within the defined issue scope.
6. Add or update tests.
7. Run the project's quality checks.
8. Open a pull request describing the implementation.

### Branch Naming

Use descriptive branch names:

```text
feat/event-parser
feat/liquidity-metrics
feat/gas-analytics
fix/duplicate-events
fix/rpc-retry
test/indexer-recovery
docs/local-setup
```

### Commit Convention

Use Conventional Commits:

```text
feat: add token transfer event parser
fix: prevent duplicate event indexing
test: add block processor tests
docs: improve local indexer setup
refactor: isolate chain event adapters
```

Commit subjects should be lowercase.

## Good First Issues

The repository is designed to support small, independently deliverable contributor tasks.

Examples include:

* Add token transfer event parser.
* Add block processing metrics.
* Implement failed event retry handling.
* Add duplicate event protection.
* Add basic chain reorganization handling.
* Add token velocity calculation.
* Add gas fee aggregation.
* Add indexer health check endpoint.
* Add event parser test fixtures.
* Document local indexer development setup.

Each contributor issue should contain:

* Clear problem statement.
* Technical context.
* Defined scope.
* Acceptance criteria.
* Expected tests.
* Relevant module or directory.

## Roadmap

### Phase 1 — Indexer Foundation

* [ ] Initialize indexing service.
* [ ] Establish project structure.
* [ ] Add configuration management.
* [ ] Add logging.
* [ ] Add testing infrastructure.
* [ ] Add CI checks.
* [ ] Implement health endpoint.

### Phase 2 — Blockchain Ingestion

* [ ] Define common chain adapter interface.
* [ ] Implement block ingestion.
* [ ] Implement event extraction.
* [ ] Normalize blockchain events.
* [ ] Persist indexing position.
* [ ] Add duplicate protection.
* [ ] Add retry handling.

### Phase 3 — Data Storage

* [ ] Define indexed event models.
* [ ] Implement repositories.
* [ ] Add database migrations.
* [ ] Add indexing queries.
* [ ] Add historical data retrieval.

### Phase 4 — Real-Time Analytics

* [ ] Implement liquidity metrics.
* [ ] Implement gas fee analytics.
* [ ] Implement token velocity.
* [ ] Add analytics API.
* [ ] Add metric aggregation and filtering.

### Phase 5 — ML Forecasting

* [ ] Define forecasting data pipeline.
* [ ] Implement feature generation.
* [ ] Add baseline forecasting model.
* [ ] Add forecast API.
* [ ] Evaluate forecast accuracy.
* [ ] Add model monitoring.

### Phase 6 — Multi-Chain Expansion

* [ ] Expand chain adapters.
* [ ] Normalize chain-specific event differences.
* [ ] Add cross-chain analytics.
* [ ] Improve indexing scalability.
* [ ] Add additional decentralized RPC providers.

## Security and Data Integrity

Because the indexer processes externally sourced blockchain data, all incoming data should be treated as untrusted.

Contributors must:

* Validate external event data.
* Avoid trusting client-provided blockchain state.
* Prevent duplicate records.
* Avoid exposing RPC credentials.
* Never commit API keys or private credentials.
* Validate API query parameters.
* Handle malformed blockchain responses safely.
* Preserve data provenance where practical.

For ML analytics, forecasts should be clearly distinguished from observed blockchain data.

## Observability

The indexing service should expose operational information such as:

* Current indexed block.
* Latest observed block.
* Indexing lag.
* Blocks processed.
* Events processed.
* Processing failures.
* Retry counts.
* Processing latency.

These metrics will help maintainers identify stalled or degraded indexing pipelines.

## Project Status

**Early development**

`tensor-chain-indexer` is currently being established as a modular blockchain indexing and analytics platform.

The architecture and public APIs may evolve during initial development. Contributors should therefore prefer small, isolated changes that follow the established interfaces and project conventions.

The long-term objective is to provide a reliable data layer for the broader on-chain AI infrastructure stack, supplying structured blockchain events and analytics that can be consumed by autonomous agents, monitoring systems, and other applications.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
