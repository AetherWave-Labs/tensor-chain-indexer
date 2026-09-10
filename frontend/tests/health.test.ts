import { describe, expect, it } from 'vitest';
import { formatHealthStatus } from '../src/lib/health';

describe('formatHealthStatus', () => {
  it('formats an ok status', () => {
    expect(formatHealthStatus('ok')).toBe('Tensor Chain Indexer frontend: ok');
  });

  it('formats a degraded status', () => {
    expect(formatHealthStatus('degraded')).toBe('Tensor Chain Indexer frontend: degraded');
  });
});
