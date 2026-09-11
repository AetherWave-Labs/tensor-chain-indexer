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
