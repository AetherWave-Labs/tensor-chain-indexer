import { z } from 'zod';

/**
 * Runtime configuration schema for the indexing service.
 *
 * Mirrors the repository-level schema in `config/env.ts` for the values the
 * two share, so a variable means the same thing wherever it is read. The
 * backend keeps its own copy because it compiles as a standalone package and
 * cannot import across its `rootDir`.
 *
 * Every value the service needs is declared here. Nothing outside this module
 * should read `process.env` directly: a variable that is only consulted deep
 * in a call path is one that fails in production rather than at boot.
 */
export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  /** Connection string for the indexed data store. */
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  /** RPC endpoints. Optional so the service can boot for a chain it is not indexing. */
  RPC_URL_EVM: z.string().url().optional(),
  RPC_URL_STELLAR: z.string().url().optional(),

  /**
   * Per-request RPC timeout.
   *
   * Bounded above as well as below: an unbounded timeout is how a single
   * unresponsive endpoint stalls the whole indexer, and the cap makes that
   * misconfiguration fail at startup instead of at 3am.
   */
  RPC_TIMEOUT_MS: z.coerce.number().int().positive().max(120_000).default(10_000),
});

/** Fully resolved configuration, with defaults applied. */
export type AppConfig = Readonly<z.infer<typeof configSchema>>;

/** Raw environment shape accepted by the loader. */
export type ConfigSource = Record<string, string | undefined>;
