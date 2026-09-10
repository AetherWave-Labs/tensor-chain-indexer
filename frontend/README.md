# Frontend

Independently runnable frontend foundation for `tensor-chain-indexer`. This package contains
no product features yet — it establishes the directory structure, tooling, and quality checks
that future dashboard/analytics UI work will build on.

## Directory Structure

```text
frontend/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── styles/
│   └── types/
├── public/
├── tests/
├── .env.example
├── package.json
└── tsconfig.json
```

## Prerequisites

* Node.js 20+
* npm

## Setup

```bash
cd frontend
npm install
cp .env.example .env
```

## Scripts

| Script                 | Description                          |
|------------------------|---------------------------------------|
| `npm run dev`          | Start the Vite development server.    |
| `npm run build`        | Type-check and build for production.  |
| `npm run typecheck`    | Run the TypeScript compiler.          |
| `npm run lint`         | Run ESLint over `src/`.               |
| `npm run format`       | Format files with Prettier.           |
| `npm run format:check` | Check formatting without writing.     |
| `npm test`             | Run the Vitest test suite.            |

## Environment Variables

See `.env.example`. Only variables prefixed with `VITE_` are exposed to the browser bundle.
Never add RPC, database, or other backend secrets to this file — the frontend must not have
access to server-side credentials.
