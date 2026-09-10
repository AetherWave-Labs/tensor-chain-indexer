import { describe, expect, it } from 'vitest';
import { assertNoFrontendSecretExposure, loadBackendEnv } from '../config/env';

describe('loadBackendEnv', () => {
  it('applies defaults and accepts required fields', () => {
    const env = loadBackendEnv({ DATABASE_URL: 'postgres://localhost/test' });

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.DATABASE_URL).toBe('postgres://localhost/test');
  });

  it('throws a readable error when required fields are missing', () => {
    expect(() => loadBackendEnv({})).toThrow(/DATABASE_URL/);
  });

  it('rejects malformed RPC URLs', () => {
    expect(() =>
      loadBackendEnv({ DATABASE_URL: 'postgres://localhost/test', RPC_URL_EVM: 'not-a-url' }),
    ).toThrow(/RPC_URL_EVM/);
  });
});

describe('assertNoFrontendSecretExposure', () => {
  it('passes for safe public frontend variables', () => {
    expect(() =>
      assertNoFrontendSecretExposure({
        VITE_API_BASE_URL: 'http://localhost:3000',
        VITE_APP_NETWORK: 'testnet',
      }),
    ).not.toThrow();
  });

  it('throws when a frontend variable looks like a secret', () => {
    expect(() =>
      assertNoFrontendSecretExposure({ VITE_API_SECRET_KEY: 'abc' }),
    ).toThrow(/secrets/);
  });
});
