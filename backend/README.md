# Backend

The backend is the home for the indexing service. Its modules are intentionally
empty at this stage so chain integrations, ingestion, normalization, storage,
analytics, forecasting, and API features can be implemented independently.

## Start the service

```bash
npm install
npm run dev
```

The development server listens on `http://localhost:3000` by default and
responds with a basic health payload. Set `PORT` to use another port.

## Commands

- `npm run build` compiles TypeScript to `dist/`.
- `npm run typecheck` checks TypeScript without emitting files.
- `npm run lint` checks source and test files with ESLint.
- `npm run format:check` checks Prettier formatting.
- `npm test` runs the test suite.

Copy `.env.example` to `.env` before adding local runtime configuration.

## Configuration

Configuration is validated once at startup by `src/common/config`. Nothing
outside that module reads `process.env` directly — a variable consulted deep in
a call path is one that fails in production rather than at boot.

| Variable          | Required | Default       | Notes                                        |
| ----------------- | -------- | ------------- | -------------------------------------------- |
| `NODE_ENV`        | no       | `development` | `development` \| `test` \| `production`      |
| `PORT`            | no       | `3000`        | Positive integer                             |
| `LOG_LEVEL`       | no       | `info`        | `debug` \| `info` \| `warn` \| `error`       |
| `DATABASE_URL`    | **yes**  | —             | Connection string for the indexed data store |
| `RPC_URL_EVM`     | no       | —             | EVM JSON-RPC endpoint                        |
| `RPC_URL_STELLAR` | no       | —             | Stellar RPC endpoint                         |
| `RPC_TIMEOUT_MS`  | no       | `10000`       | Per-request deadline, capped at 120000       |

Invalid configuration fails at startup with every problem listed at once, so a
fresh checkout missing three variables takes one run to diagnose rather than
three.

```ts
import { getConfig } from './common/config/index.js';

const config = getConfig(); // validated, frozen, cached
```

## Chain adapters

`src/chains` defines the contract every chain integration implements —
`getLatestBlock`, `getBlock`, `getEvents`, `getTransaction` — expressed in the
project's own block, event and transaction types rather than any provider's
response shape. Adapters translate into those types; ingestion and analytics
read only them.

`src/chains/rpc` provides a replaceable JSON-RPC client underneath. It bounds
each request, normalizes every failure into a typed `RpcError`, and marks each
one `retryable` or not at the point where provider detail is still available.
Retry policy itself lives elsewhere so it can be changed without touching
transport.
