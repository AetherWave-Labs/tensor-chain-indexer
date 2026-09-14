# tensor-chain-indexer

**Modular Stellar-focused blockchain event indexer with ML-powered analytics for real-time liquidity, transaction fee, and token velocity forecasting.**

`tensor-chain-indexer` is an open-source blockchain data and analytics infrastructure project designed to transform raw on-chain activity into structured, queryable data and actionable intelligence for blockchain applications.

The architecture is designed with **Stellar/Soroban as a first-class integration target**, while maintaining a modular chain-adapter layer that can support additional blockchain networks over time.

## Why Stellar

Stellar provides a strong foundation for fast, low-cost financial infrastructure, but applications still require reliable access to structured on-chain data for analytics, monitoring, forecasting, and intelligent automation.

Tensor Chain Indexer aims to provide that data layer by:

- Indexing Stellar/Soroban blockchain activity.
- Normalizing blockchain events into consistent, queryable records.
- Producing real-time liquidity and transaction-fee analytics.
- Measuring token movement and velocity.
- Applying ML models to historical indexed data for forecasting.
- Exposing structured blockchain data and analytics through APIs.
- Providing infrastructure that can be consumed by developers, analytics applications, autonomous agents, and AI-driven financial systems.

The Stellar/Soroban integration is being developed as part of the project's broader blockchain indexing architecture. The current repository is in early development, and implementation capabilities will evolve incrementally.

## Overview

The project combines blockchain event indexing with machine-learning-assisted analytics.

It focuses on three core capabilities:

1. **Blockchain Event Indexing** — Ingest and normalize on-chain events into structured records.
2. **Real-Time Analytics** — Calculate metrics such as liquidity, transaction fees, and token velocity from indexed blockchain activity.
3. **ML Forecasting** — Provide forecasting capabilities for selected blockchain metrics using historical indexed data.

The architecture is modular so that additional blockchain networks, event types, analytics models, and data providers can be added without coupling them to the core indexing pipeline.

## Goals

- Provide a reliable blockchain event indexing pipeline.
- Prioritize Stellar/Soroban as an initial ecosystem integration.
- Normalize blockchain data into a consistent internal representation.
- Support incremental and resumable indexing.
- Prevent duplicate event processing.
- Handle transient blockchain/RPC failures safely.
- Provide real-time analytics from indexed data.
- Support ML-based forecasting of selected blockchain metrics.
- Expose structured data through APIs for downstream applications.
- Keep chain-specific implementations isolated from analytics logic.
- Make the system easy for contributors to extend and test.
- Provide a foundation for blockchain-aware AI and autonomous applications.

## Architecture

The system separates blockchain ingestion, data processing, analytics, and forecasting.

```text
                         Blockchain Network
                                │
                                ▼
                    ┌────────────────────────┐
                    │    RPC / Data Source   │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │    Event Ingestion      │
                    │                         │
                    │  Ledgers / Blocks / Tx  │
                    │  Events / Logs          │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   Event Normalization  │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │    Indexed Data Store  │
                    └────────────┬───────────┘
                                 │
                         ┌───────┴────────┐
                         │                │
                         ▼                ▼
              ┌──────────────────┐ ┌──────────────────┐
              │   Real-Time      │ │   ML Analytics   │
              │   Analytics      │ │   & Forecasting  │
              └────────┬─────────┘ └────────┬─────────┘
                       │                    │
                       └─────────┬──────────┘
                                 ▼
                    ┌────────────────────────┐
                    │       Query API        │
                    └────────────────────────┘
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
│   │   ├── transaction-fees/
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
├── contract/
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
Discover Ledger / Block
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

For Stellar/Soroban, the indexing layer will progressively incorporate ledger, transaction, operation, and smart-contract event data into the normalized event model.

The indexing position should be persisted so that processing can resume safely after a restart.

### Event Identity

Every indexed event should have a deterministic identity.

Depending on the blockchain, this may include:

- Network/chain identifier.
- Ledger or block identifier.
- Transaction hash.
- Event or operation index.
- Contract identifier where applicable.

This allows the indexer to safely process the same event more than once without creating duplicate records.

## Stellar / Soroban Integration

Stellar/Soroban is the primary ecosystem integration target for the project.

The chain adapter architecture is intended to isolate Stellar-specific ingestion and normalization logic from the core analytics and forecasting layers.

The planned Stellar/Soroban integration includes:

- Ledger ingestion.
- Transaction ingestion.
- Operation/activity processing.
- Soroban smart-contract event extraction.
- Event normalization.
- Transaction-fee analytics.
- Token and asset activity tracking.
- Liquidity-related data extraction.
- Historical data collection for analytics and forecasting.
- Reliable indexing recovery and duplicate-event protection.

The implementation will be introduced incrementally as the Stellar adapter and supporting data models are developed.

### Stellar Data Flow

```text
                 Stellar Network
                       │
                       ▼
              ┌─────────────────┐
              │ Stellar Data    │
              │ Source / RPC    │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Ledger / Tx     │
              │ Ingestion       │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Soroban Events  │
              │ & Activity      │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Normalization   │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Indexed Data    │
              └────────┬────────┘
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
       Real-Time Analytics   ML Forecasting
```

## Reliability

The indexing pipeline should be designed to tolerate common blockchain infrastructure failures.

The system should support:

- RPC timeouts.
- Temporary provider failures.
- Rate limits.
- Retry with backoff.
- Resumable indexing.
- Duplicate event protection.
- Failed-event tracking.
- Basic chain reorganization handling where supported.
- Ledger/index-position recovery.
- Provider failover where practical.

Retries should be applied only to transient failures. Deterministic validation or contract errors should not be retried indefinitely.

## Analytics

The analytics layer converts indexed blockchain activity into useful metrics.

### Liquidity

Liquidity analytics may include:

- Liquidity by token.
- Liquidity by pool.
- Liquidity changes over time.
- Inflow and outflow.
- Liquidity growth or decline.
- Liquidity concentration.
- Liquidity activity across supported assets.

### Transaction Fees

Transaction-fee analytics may include:

- Total transaction fees.
- Average transaction fee.
- Minimum transaction fee.
- Maximum transaction fee.
- Transaction-fee trends over time.
- Fee distribution.
- Fee activity by transaction or contract.
- Fee behavior across supported blockchain networks.

For Stellar/Soroban, fee-related analytics will be adapted to the network's transaction and resource-fee model rather than assuming Ethereum-style gas semantics.

### Token Velocity

Token velocity measures the movement of a token through the observed ecosystem over a defined period.

The calculation and assumptions should be explicitly documented so downstream users can correctly interpret the metric.

Potential measurements include:

- Token transfer frequency.
- Transaction activity.
- Circulation-related activity.
- Changes in token movement over time.
- Velocity trends across supported assets.

## ML Forecasting

The forecasting layer uses indexed historical data to generate predictions for supported metrics.

Potential forecasting targets include:

- Liquidity trends.
- Transaction-fee trends.
- Token velocity.
- Other time-series blockchain indicators.

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

- Use clearly defined input features.
- Record the time range used for training/inference.
- Provide reproducible results where practical.
- Handle insufficient historical data safely.
- Avoid presenting predictions as guaranteed outcomes.
- Preserve the distinction between observed blockchain data and model-generated forecasts.
- Track model performance where appropriate.

## API

The API is intended to expose indexed blockchain data and analytics to downstream applications.

Planned endpoints include:

```text
GET /health

GET /events
GET /events/:id

GET /analytics/liquidity
GET /analytics/transaction-fees
GET /analytics/token-velocity

GET /forecast/liquidity
GET /forecast/transaction-fees
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

For Stellar, the exact normalized representation may use ledger-specific identifiers and terminology where appropriate.

The exact schema will depend on the supported networks and event types.

## Supported Networks

### Primary Ecosystem — Stellar / Soroban

Stellar/Soroban is the primary ecosystem integration target for Tensor Chain Indexer.

The Stellar adapter is intended to provide:

- Ledger and transaction ingestion.
- Soroban contract event indexing.
- Event normalization.
- Transaction-fee analytics.
- Token and asset activity tracking.
- Data feeds for liquidity and token-velocity analytics.
- Historical data for ML forecasting.

### Additional Networks

The architecture remains modular and is designed to support additional blockchain networks through isolated chain adapters.

Potential future integrations include:

- EVM-compatible networks.
- Other blockchain networks with suitable event and data interfaces.

Chain-specific code should remain isolated under the appropriate adapter so that adding a new network does not require changes to the core analytics engine.

## Development

### Prerequisites

Install:

- Node.js 20+
- npm
- Git

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

## Smart Contract Workspace

The repository contains a dedicated `contract/` workspace for smart contract development and testing.

The contract workspace currently provides:

- Hardhat 3 development environment.
- Solidity `0.8.34` compilation.
- TypeScript support.
- Viem-based contract interaction and testing.
- Node.js test runner support.
- Local blockchain development.
- Environment-aware testnet deployment configuration.
- Contract workspace smoke tests.

From the `contract/` directory:

```bash
cd contract
npm install
```

Compile the contracts:

```bash
npm run compile
```

Build the contract workspace:

```bash
npm run build
```

Run the contract tests:

```bash
npm test
```

Run TypeScript type checking:

```bash
npm run typecheck
```

Start a local blockchain:

```bash
npm run node
```

In another terminal, deploy the workspace contract locally:

```bash
npm run deploy:local
```

Testnet deployment configuration is documented in:

```text
contract/.env.example
```

Never commit populated `.env` files or private keys.

## Code Quality

The repository enforces consistent formatting and static checks via ESLint, Prettier, and the TypeScript compiler:

| Script | Description |
|--------|-------------|
| `npm run lint` | Run ESLint over the repository. |
| `npm run format` | Format files with Prettier. |
| `npm run format:check` | Check formatting without writing changes. |
| `npm run typecheck` | Run the TypeScript compiler with no emit. |
| `npm test` | Run the repository test suite. |

For contract-specific development, run the commands documented in the **Smart Contract Workspace** section.

Run these locally before opening a pull request:

```bash
npm install
npm run lint
npm run format:check
npm run typecheck
npm test
```

## Environment Configuration

Environment variables are split by trust boundary:

- Root `.env.example` documents backend/runtime variables such as database, RPC, and logging configuration. These are never exposed to a browser.
- `frontend/.env.example` documents only variables prefixed with `VITE_`, which are the sole variables bundled into the frontend build.
- `contract/.env.example` documents contract deployment variables required for supported testnet workflows.

Backend environment variables are validated at startup via `config/env.ts` (`loadBackendEnv`), which applies defaults and fails fast with a readable error when a required variable is missing or malformed.

`assertNoFrontendSecretExposure` guards against a `VITE_`-prefixed variable that looks like a secret, matching `SECRET`, `PRIVATE_KEY`, `API_KEY`, `PASSWORD`, or `TOKEN`, ever being introduced.

Contract deployment credentials must remain outside source control.

Run the config test suite and type checks with:

```bash
npm run typecheck
npm test
```

`.env` and other local environment files are git-ignored; only `.env.example` files should be committed.

## Testing

Testing should be separated by responsibility:

```text
tests/
├── unit/
├── integration/
└── e2e/
```

The test suite should cover:

- Event parsing.
- Event normalization.
- Duplicate event handling.
- Ledger/block processing.
- RPC failure handling.
- Retry behavior.
- Analytics calculations.
- Forecasting feature generation.
- Forecasting behavior.
- API responses.
- Persistence.
- Indexer recovery.
- Stellar/Soroban event processing.
- Contract workspace deployment and interaction.

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
feat/stellar-event-parser
feat/soroban-indexer
feat/liquidity-metrics
feat/transaction-fee-analytics
feat/token-velocity
fix/duplicate-events
fix/rpc-retry
test/indexer-recovery
docs/local-setup
chore/contract-workspace
```

### Commit Convention

Use Conventional Commits:

```text
feat: add Stellar event parser
feat: add Soroban event indexing
fix: prevent duplicate event indexing
test: add block processor tests
docs: improve local indexer setup
refactor: isolate chain event adapters
chore: initialize contract workspace
```

Commit subjects should be lowercase.

## Good First Issues

The repository is designed to support small, independently deliverable contributor tasks.

Examples include:

- Add Stellar token transfer event parser.
- Add Soroban event parser.
- Add ledger processing metrics.
- Implement failed event retry handling.
- Add duplicate event protection.
- Add basic chain reorganization handling where applicable.
- Add token velocity calculation.
- Add transaction-fee aggregation.
- Add Stellar asset activity analytics.
- Add indexer health check endpoint.
- Add event parser test fixtures.
- Document local Stellar/Soroban development setup.

Each contributor issue should contain:

- Clear problem statement.
- Technical context.
- Defined scope.
- Acceptance criteria.
- Expected tests.
- Relevant module or directory.

## Roadmap

### Phase 1 — Indexer Foundation

- [ ] Initialize indexing service.
- [ ] Establish project structure.
- [ ] Add configuration management.
- [ ] Add logging.
- [ ] Add testing infrastructure.
- [ ] Add CI checks.
- [ ] Implement health endpoint.

### Phase 2 — Stellar / Soroban Integration

- [ ] Define Stellar/Soroban chain adapter.
- [ ] Implement ledger ingestion.
- [ ] Implement transaction ingestion.
- [ ] Implement operation/activity processing.
- [ ] Implement Soroban event extraction.
- [ ] Normalize Stellar events.
- [ ] Persist Stellar indexing position.
- [ ] Add duplicate protection.
- [ ] Add retry handling.
- [ ] Add Stellar transaction-fee analytics.
- [ ] Add Stellar token activity metrics.
- [ ] Add Stellar liquidity-related data extraction.

### Phase 3 — Blockchain Ingestion

- [ ] Define common chain adapter interface.
- [ ] Implement block/ledger ingestion.
- [ ] Implement event extraction.
- [ ] Normalize blockchain events.
- [ ] Persist indexing position.
- [ ] Add duplicate protection.
- [ ] Add retry handling.
- [ ] Improve provider resilience.

### Phase 4 — Data Storage

- [ ] Define indexed event models.
- [ ] Implement repositories.
- [ ] Add database migrations.
- [ ] Add indexing queries.
- [ ] Add historical data retrieval.

### Phase 5 — Real-Time Analytics

- [ ] Implement liquidity metrics.
- [ ] Implement transaction-fee analytics.
- [ ] Implement token velocity.
- [ ] Add analytics API.
- [ ] Add metric aggregation and filtering.
- [ ] Add Stellar-specific analytics.

### Phase 6 — ML Forecasting

- [ ] Define forecasting data pipeline.
- [ ] Implement feature generation.
- [ ] Add baseline forecasting model.
- [ ] Add forecast API.
- [ ] Evaluate forecast accuracy.
- [ ] Add model monitoring.
- [ ] Evaluate forecasting performance on Stellar-derived historical data.

### Phase 7 — AI and Autonomous Applications

- [ ] Define machine-readable analytics interfaces.
- [ ] Provide structured data for AI applications.
- [ ] Support autonomous monitoring workflows.
- [ ] Explore agent-oriented analytics APIs.
- [ ] Develop intelligent blockchain activity insights.

### Phase 8 — Multi-Chain Expansion

- [ ] Expand chain adapters.
- [ ] Normalize chain-specific event differences.
- [ ] Add cross-chain analytics.
- [ ] Improve indexing scalability.
- [ ] Add additional decentralized RPC providers.

## Security and Data Integrity

Because the indexer processes externally sourced blockchain data, all incoming data should be treated as untrusted.

Contributors must:

- Validate external event data.
- Avoid trusting client-provided blockchain state.
- Prevent duplicate records.
- Avoid exposing RPC credentials.
- Never commit API keys or private credentials.
- Validate API query parameters.
- Handle malformed blockchain responses safely.
- Preserve data provenance where practical.
- Distinguish observed blockchain data from model-generated forecasts.
- Protect contract deployment credentials.

For ML analytics, forecasts should be clearly distinguished from observed blockchain data.

## Observability

The indexing service should expose operational information such as:

- Current indexed ledger/block.
- Latest observed ledger/block.
- Indexing lag.
- Ledgers/blocks processed.
- Events processed.
- Processing failures.
- Retry counts.
- Processing latency.
- Provider health.
- Data ingestion status.

These metrics will help maintainers identify stalled or degraded indexing pipelines.

## Ecosystem Positioning

Tensor Chain Indexer is intended to contribute open-source infrastructure to the broader blockchain and AI ecosystem.

The project's Stellar focus centers on providing a reusable data layer that can support:

- Stellar/Soroban developers.
- DeFi and financial applications.
- Blockchain analytics.
- AI-powered applications.
- Autonomous agents.
- Monitoring and observability systems.
- Data-driven financial intelligence.

The architecture intentionally separates blockchain-specific ingestion from analytics and forecasting so that improvements to the Stellar integration can benefit downstream applications without requiring changes to the ML and analytics layers.

## Project Status

**Early development**

`tensor-chain-indexer` is currently being established as a modular blockchain indexing and analytics platform with **Stellar/Soroban as the primary ecosystem integration target**.

The smart contract workspace has been initialized with a reproducible Hardhat-based development and testing foundation.

The broader Stellar/Soroban indexing, analytics, and forecasting capabilities are being developed incrementally.

The architecture and public APIs may evolve during initial development. Contributors should therefore prefer small, isolated changes that follow the established interfaces and project conventions.

The long-term objective is to provide a reliable blockchain data layer for the broader on-chain AI infrastructure stack, supplying structured blockchain events and analytics that can be consumed by developers, autonomous agents, monitoring systems, and other applications.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
