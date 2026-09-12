import { describe, expect, it } from 'vitest';
import {
  canonicalEventKey,
  eventId,
  normalizeHash,
  type EventCoordinates,
} from '../../../src/normalization/event-identity.js';

const coordinates = (overrides: Partial<EventCoordinates> = {}): EventCoordinates => ({
  chain: 'evm:1',
  blockNumber: '18500000',
  transactionHash: '0x3f8a1b2c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8',
  logIndex: 0,
  ...overrides,
});

describe('eventId', () => {
  // The property the whole design rests on: re-indexing a block after a
  // restart or a re-org rewind must produce the same id.
  it('is repeatable for the same coordinates', () => {
    expect(eventId(coordinates())).toBe(eventId(coordinates()));
  });

  it('is stable across separately constructed inputs', () => {
    const first = eventId({
      chain: 'evm:1',
      blockNumber: '18500000',
      transactionHash: '0x3f8a1b2c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8',
      logIndex: 0,
    });
    const second = eventId({
      logIndex: 0,
      transactionHash: '0x3f8a1b2c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8',
      blockNumber: '18500000',
      chain: 'evm:1',
    });

    expect(second).toBe(first);
  });

  it('returns a fixed-length hex digest', () => {
    expect(eventId(coordinates())).toMatch(/^[0-9a-f]{64}$/);
  });

  // Two logs in one transaction are distinct events and must not collide.
  it('distinguishes two events in the same transaction', () => {
    expect(eventId(coordinates({ logIndex: 1 }))).not.toBe(eventId(coordinates({ logIndex: 0 })));
  });

  it('distinguishes events in different blocks', () => {
    expect(eventId(coordinates({ blockNumber: '18500001' }))).not.toBe(eventId(coordinates()));
  });

  it('distinguishes events in different transactions', () => {
    expect(
      eventId(
        coordinates({
          transactionHash: '0x9a8b7c6d5e4f30211203f4e5d6c7b8a99887766554433221100ffeeddccbbaa9',
        }),
      ),
    ).not.toBe(eventId(coordinates()));
  });

  // Two chains can carry the same transaction hash; without the chain in the
  // key, one would overwrite the other.
  it('does not collide across chains sharing a transaction hash', () => {
    expect(eventId(coordinates({ chain: 'evm:137' }))).not.toBe(eventId(coordinates()));
  });

  describe('normalization', () => {
    // Two providers disagreeing on hex casing must not yield two identities
    // for one event.
    it('ignores transaction hash casing', () => {
      const upper = coordinates({
        transactionHash: '0x3F8A1B2C4D5E6F708192A3B4C5D6E7F8091A2B3C4D5E6F708192A3B4C5D6E7F8',
      });

      expect(eventId(upper)).toBe(eventId(coordinates()));
    });

    it('ignores a missing 0x prefix', () => {
      const bare = coordinates({
        transactionHash: '3f8a1b2c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8',
      });

      expect(eventId(bare)).toBe(eventId(coordinates()));
    });

    it('ignores surrounding whitespace', () => {
      expect(eventId(coordinates({ chain: ' evm:1 ', blockNumber: ' 18500000 ' }))).toBe(
        eventId(coordinates()),
      );
    });

    it('ignores chain id casing', () => {
      expect(eventId(coordinates({ chain: 'EVM:1' }))).toBe(eventId(coordinates()));
    });
  });

  describe('no hidden inputs', () => {
    // A clock, counter or random source anywhere in the derivation would break
    // every property above, so assert the absence directly.
    it('does not vary with time', async () => {
      const first = eventId(coordinates());
      await new Promise((resolve) => setTimeout(resolve, 5));

      expect(eventId(coordinates())).toBe(first);
    });

    it('does not vary across many repetitions', () => {
      const ids = new Set(Array.from({ length: 100 }, () => eventId(coordinates())));

      expect(ids.size).toBe(1);
    });
  });
});

describe('canonicalEventKey', () => {
  it('encodes the four coordinates unambiguously', () => {
    expect(canonicalEventKey(coordinates())).toBe(
      '["evm:1","18500000","3f8a1b2c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8",0]',
    );
  });

  // With a delimited string, a chain id containing the delimiter could produce
  // the same key as a different event. A fixed-length array cannot.
  it('cannot be made ambiguous by a delimiter inside a field', () => {
    const sneaky = canonicalEventKey(coordinates({ chain: 'evm:1","18500000' }));

    expect(sneaky).not.toBe(canonicalEventKey(coordinates()));
  });
});

describe('normalizeHash', () => {
  it('lower-cases and strips the prefix', () => {
    expect(normalizeHash('0xABCDEF')).toBe('abcdef');
  });

  it('leaves an already-normalized hash alone', () => {
    expect(normalizeHash('abcdef')).toBe('abcdef');
  });
});
