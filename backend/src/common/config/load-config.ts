import { configSchema, type AppConfig, type ConfigSource } from './schema.js';

/**
 * Raised when the environment does not satisfy the configuration schema.
 *
 * Carries the individual problems as well as the combined message so a caller
 * that wants to render them (a startup banner, a test) does not have to parse
 * the string back apart.
 */
export class ConfigValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Invalid environment configuration: ${issues.join('; ')}`);
    this.name = 'ConfigValidationError';
    this.issues = issues;
  }
}

/**
 * Validates `source` and returns the resolved configuration.
 *
 * Reports every problem at once rather than stopping at the first, so a fresh
 * checkout with three missing variables takes one run to diagnose instead of
 * three. The result is frozen: configuration that can be mutated after boot is
 * configuration that can differ between two readers of the same value.
 */
export function loadConfig(source: ConfigSource = process.env): AppConfig {
  const result = configSchema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    });

    throw new ConfigValidationError(issues);
  }

  return Object.freeze(result.data);
}

let cached: AppConfig | undefined;

/**
 * The process-wide configuration, validated once on first use.
 *
 * Caching is what makes "validated at startup" true: re-parsing per call would
 * let a variable mutated at runtime change the answer halfway through a run.
 */
export function getConfig(): AppConfig {
  cached ??= loadConfig();
  return cached;
}

/** Drops the cached configuration. Intended for tests. */
export function resetConfigCache(): void {
  cached = undefined;
}
