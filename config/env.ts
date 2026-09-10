import { z } from 'zod';

/**
 * Schema for backend/runtime environment variables. Values here are never
 * safe to expose to a browser bundle.
 */
const backendEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  RPC_URL_EVM: z.string().url().optional(),
  RPC_URL_STELLAR: z.string().url().optional(),
});

export type BackendEnv = z.infer<typeof backendEnvSchema>;

/**
 * Validates and normalizes backend environment variables, applying defaults
 * and failing fast with a readable error when required values are missing
 * or malformed.
 */
export function loadBackendEnv(source: NodeJS.ProcessEnv = process.env): BackendEnv {
  const result = backendEnvSchema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid backend environment configuration: ${issues}`);
  }

  return result.data;
}

const FRONTEND_ENV_PREFIX = 'VITE_';
const SECRET_KEY_PATTERN = /(SECRET|PRIVATE_KEY|API_KEY|PASSWORD|TOKEN)/i;

/**
 * Guards against server secrets accidentally leaking into frontend-exposed
 * environment variables. Only variables prefixed with VITE_ reach the
 * browser bundle, so any such key that also looks like a secret is rejected.
 */
export function assertNoFrontendSecretExposure(
  frontendEnv: Record<string, string | undefined>,
): void {
  const offending = Object.keys(frontendEnv).filter(
    (key) => key.startsWith(FRONTEND_ENV_PREFIX) && SECRET_KEY_PATTERN.test(key),
  );

  if (offending.length > 0) {
    throw new Error(
      `Frontend environment variables must not expose secrets: ${offending.join(', ')}`,
    );
  }
}
