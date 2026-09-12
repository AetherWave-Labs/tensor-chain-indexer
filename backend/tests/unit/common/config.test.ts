import { beforeEach, describe, expect, it } from 'vitest';
import {
  ConfigValidationError,
  getConfig,
  loadConfig,
  resetConfigCache,
} from '../../../src/common/config/index.js';

const valid = {
  DATABASE_URL: 'postgres://localhost:5432/indexer',
};

beforeEach(() => {
  resetConfigCache();
});

describe('loadConfig', () => {
  it('applies defaults for everything optional', () => {
    const config = loadConfig(valid);

    expect(config.NODE_ENV).toBe('development');
    expect(config.PORT).toBe(3000);
    expect(config.LOG_LEVEL).toBe('info');
    expect(config.RPC_TIMEOUT_MS).toBe(10_000);
  });

  it('reads the values that are supplied', () => {
    const config = loadConfig({
      ...valid,
      NODE_ENV: 'production',
      PORT: '8080',
      LOG_LEVEL: 'warn',
      RPC_URL_EVM: 'https://rpc.example.com',
      RPC_TIMEOUT_MS: '2500',
    });

    expect(config.NODE_ENV).toBe('production');
    expect(config.PORT).toBe(8080);
    expect(config.LOG_LEVEL).toBe('warn');
    expect(config.RPC_URL_EVM).toBe('https://rpc.example.com');
    expect(config.RPC_TIMEOUT_MS).toBe(2500);
  });

  it('coerces numeric variables, which arrive as strings', () => {
    expect(loadConfig({ ...valid, PORT: '5000' }).PORT).toBe(5000);
  });

  it('leaves optional RPC endpoints undefined when absent', () => {
    const config = loadConfig(valid);

    expect(config.RPC_URL_EVM).toBeUndefined();
    expect(config.RPC_URL_STELLAR).toBeUndefined();
  });

  describe('rejections', () => {
    it('rejects a missing required variable, naming it', () => {
      expect(() => loadConfig({})).toThrow(ConfigValidationError);
      expect(() => loadConfig({})).toThrow(/DATABASE_URL/);
    });

    it('rejects an empty required variable', () => {
      expect(() => loadConfig({ DATABASE_URL: '' })).toThrow(ConfigValidationError);
    });

    it('rejects a malformed URL', () => {
      expect(() => loadConfig({ ...valid, RPC_URL_EVM: 'not-a-url' })).toThrow(/RPC_URL_EVM/);
    });

    it('rejects an unknown enum value', () => {
      expect(() => loadConfig({ ...valid, LOG_LEVEL: 'verbose' })).toThrow(/LOG_LEVEL/);
    });

    it('rejects a non-numeric port', () => {
      expect(() => loadConfig({ ...valid, PORT: 'eighty' })).toThrow(/PORT/);
    });

    it('rejects a negative port', () => {
      expect(() => loadConfig({ ...valid, PORT: '-1' })).toThrow(/PORT/);
    });

    // An unbounded timeout is how one unresponsive endpoint stalls the whole
    // indexer; the cap turns that into a startup failure instead.
    it('rejects an RPC timeout beyond the cap', () => {
      expect(() => loadConfig({ ...valid, RPC_TIMEOUT_MS: '600000' })).toThrow(/RPC_TIMEOUT_MS/);
    });

    it('rejects a zero RPC timeout', () => {
      expect(() => loadConfig({ ...valid, RPC_TIMEOUT_MS: '0' })).toThrow(/RPC_TIMEOUT_MS/);
    });

    // Three missing variables should take one run to diagnose, not three.
    it('reports every problem at once', () => {
      try {
        loadConfig({ PORT: 'eighty', LOG_LEVEL: 'verbose' });
        expect.unreachable('should have thrown');
      } catch (error) {
        const issues = (error as ConfigValidationError).issues;
        expect(issues).toHaveLength(3);
        expect(issues.join(' ')).toMatch(/DATABASE_URL/);
        expect(issues.join(' ')).toMatch(/PORT/);
        expect(issues.join(' ')).toMatch(/LOG_LEVEL/);
      }
    });
  });

  // Configuration that can be mutated after boot can differ between two
  // readers of the same value.
  it('returns a frozen object', () => {
    const config = loadConfig(valid);

    expect(Object.isFrozen(config)).toBe(true);
  });
});

describe('getConfig', () => {
  it('validates once and reuses the result', () => {
    const before = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgres://localhost:5432/indexer';

    try {
      const first = getConfig();
      const second = getConfig();

      expect(second).toBe(first);
    } finally {
      if (before === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = before;
    }
  });

  it('re-reads after the cache is cleared', () => {
    const before = process.env.PORT;
    process.env.DATABASE_URL = 'postgres://localhost:5432/indexer';
    process.env.PORT = '4001';

    try {
      expect(getConfig().PORT).toBe(4001);

      resetConfigCache();
      process.env.PORT = '4002';

      expect(getConfig().PORT).toBe(4002);
    } finally {
      if (before === undefined) delete process.env.PORT;
      else process.env.PORT = before;
    }
  });
});
