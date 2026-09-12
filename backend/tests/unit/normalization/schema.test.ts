import { describe, expect, it } from 'vitest';
import {
  EventValidationError,
  isNormalizedEvent,
  parseNormalizedEvent,
  validateNormalizedEvent,
} from '../../../src/normalization/schema.js';
import type { NormalizedEvent } from '../../../src/normalization/types.js';

const event = (overrides: Partial<Record<keyof NormalizedEvent, unknown>> = {}) => ({
  id: 'b9d1d0c9a9cc0a0f6b2f5a6cf3cbb2ee6d3f1b5b3b4f9a1f1a51c3e59b1a2d77',
  chain: 'evm:1',
  blockNumber: '18500000',
  transactionHash: '0x3f8a1b2c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8',
  logIndex: 0,
  eventType: 'transfer',
  timestamp: 1698768000000,
  data: { value: '1' },
  ...overrides,
});

const fieldsWithIssues = (candidate: unknown) =>
  validateNormalizedEvent(candidate).issues.map((issue) => issue.field);

describe('validateNormalizedEvent', () => {
  it('accepts a well-formed event', () => {
    expect(validateNormalizedEvent(event())).toEqual({ valid: true, issues: [] });
  });

  it('accepts a non-EVM chain', () => {
    expect(
      validateNormalizedEvent(
        event({
          chain: 'stellar:pubnet',
          transactionHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
          logIndex: 2,
        }),
      ).valid,
    ).toBe(true);
  });

  it('accepts an empty data object', () => {
    expect(validateNormalizedEvent(event({ data: {} })).valid).toBe(true);
  });

  it('accepts log index zero', () => {
    expect(validateNormalizedEvent(event({ logIndex: 0 })).valid).toBe(true);
  });

  describe('rejections', () => {
    it.each([null, undefined, 'a string', 42, []])('rejects %s at the root', (candidate) => {
      expect(validateNormalizedEvent(candidate).valid).toBe(false);
    });

    it('rejects an empty id', () => {
      expect(fieldsWithIssues(event({ id: '' }))).toContain('id');
    });

    it('rejects a chain id that is not namespaced', () => {
      expect(fieldsWithIssues(event({ chain: 'ethereum' }))).toContain('chain');
    });

    // Accepting a numeric blockNumber would silently reintroduce the 2^53
    // precision loss the string representation exists to avoid.
    it('rejects a numeric block number', () => {
      expect(fieldsWithIssues(event({ blockNumber: 18500000 }))).toContain('blockNumber');
    });

    it('rejects a hex block number', () => {
      expect(fieldsWithIssues(event({ blockNumber: '0x11a5a20' }))).toContain('blockNumber');
    });

    it('rejects a negative block number', () => {
      expect(fieldsWithIssues(event({ blockNumber: '-1' }))).toContain('blockNumber');
    });

    it('accepts a block number beyond 2^53 without losing digits', () => {
      const huge = '9007199254740993';
      const candidate = event({ blockNumber: huge });

      expect(validateNormalizedEvent(candidate).valid).toBe(true);
      expect((candidate as { blockNumber: string }).blockNumber).toBe(huge);
    });

    it('rejects a non-hex transaction hash', () => {
      expect(fieldsWithIssues(event({ transactionHash: 'not-a-hash' }))).toContain(
        'transactionHash',
      );
    });

    it('rejects a negative log index', () => {
      expect(fieldsWithIssues(event({ logIndex: -1 }))).toContain('logIndex');
    });

    it('rejects a fractional log index', () => {
      expect(fieldsWithIssues(event({ logIndex: 1.5 }))).toContain('logIndex');
    });

    it('rejects an empty event type', () => {
      expect(fieldsWithIssues(event({ eventType: '' }))).toContain('eventType');
    });

    // A downstream metric that guesses seconds-vs-milliseconds wrong is out by
    // a factor of a thousand without ever failing.
    it('rejects a seconds-based timestamp as out of range', () => {
      expect(fieldsWithIssues(event({ timestamp: 1698768000 }))).toContain('timestamp');
    });

    it('rejects a microsecond timestamp', () => {
      expect(fieldsWithIssues(event({ timestamp: 1698768000000000 }))).toContain('timestamp');
    });

    it('rejects a non-object data payload', () => {
      expect(fieldsWithIssues(event({ data: 'should-be-an-object' }))).toContain('data');
      expect(fieldsWithIssues(event({ data: [] }))).toContain('data');
    });

    it('rejects a missing field', () => {
      const withoutEventType: Record<string, unknown> = { ...event() };
      delete withoutEventType.eventType;

      expect(fieldsWithIssues(withoutEventType)).toContain('eventType');
    });

    // One malformed payload should produce one actionable report, not a
    // sequence of them.
    it('reports every problem at once', () => {
      const fields = fieldsWithIssues({
        id: '',
        chain: 'ethereum',
        blockNumber: 1,
        transactionHash: 'nope',
        logIndex: -1,
        eventType: '',
        timestamp: 1,
        data: 'x',
      });

      expect(new Set(fields)).toEqual(
        new Set([
          'id',
          'chain',
          'blockNumber',
          'transactionHash',
          'logIndex',
          'eventType',
          'timestamp',
          'data',
        ]),
      );
    });

    it('explains each problem rather than only naming the field', () => {
      const issues = validateNormalizedEvent(event({ blockNumber: 1 })).issues;

      expect(issues[0].message).toMatch(/decimal string/);
    });
  });
});

describe('parseNormalizedEvent', () => {
  it('returns the typed event when valid', () => {
    expect(parseNormalizedEvent(event()).eventType).toBe('transfer');
  });

  it('throws with the issues attached', () => {
    try {
      parseNormalizedEvent(event({ chain: 'ethereum' }));
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(EventValidationError);
      expect((error as EventValidationError).issues[0].field).toBe('chain');
      expect((error as EventValidationError).message).toContain('chain');
    }
  });
});

describe('isNormalizedEvent', () => {
  it('narrows a valid candidate', () => {
    const candidate: unknown = event();

    expect(isNormalizedEvent(candidate)).toBe(true);
  });

  it('rejects an invalid candidate without throwing', () => {
    expect(isNormalizedEvent({})).toBe(false);
  });
});
