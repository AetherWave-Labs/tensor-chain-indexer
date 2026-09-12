import { createHash } from 'node:crypto';

/**
 * Deterministic event identity.
 *
 * An event's identity comes from where it sits on chain, not from when we
 * happened to index it. Re-processing a block after a restart, a re-org
 * rewind, or a second worker picking up the same range must produce the same
 * id every time — that is what lets duplicate protection key on it.
 *
 * Accordingly this module contains no clock, no counter, and no randomness.
 */

/** The on-chain coordinates that uniquely locate an event. */
export interface EventCoordinates {
  /** Network, e.g. `evm:1`. */
  chain: string;
  /** Containing block height, decimal string. */
  blockNumber: string;
  /** Containing transaction hash. */
  transactionHash: string;
  /** Position within the block. */
  logIndex: number;
}

/**
 * Canonical string form of the coordinates.
 *
 * A JSON array rather than a delimited string: with `chain:block:tx:index`,
 * a chain id that itself contains the delimiter could produce the same string
 * as a different event. A fixed-length array has no such ambiguity.
 *
 * Hex is lower-cased first. EVM transaction hashes are case-insensitive, and
 * two providers that disagree on casing must not yield two identities for one
 * event.
 */
export function canonicalEventKey(coordinates: EventCoordinates): string {
  const { chain, blockNumber, transactionHash, logIndex } = coordinates;

  return JSON.stringify([
    chain.trim().toLowerCase(),
    blockNumber.trim(),
    normalizeHash(transactionHash),
    logIndex,
  ]);
}

/**
 * Deterministic id for an event: sha256 of the canonical key, hex encoded.
 *
 * Hashed rather than stored as the composite itself so the id is
 * fixed-length whatever a chain's hash format is, which keeps it usable as a
 * primary key. `canonicalEventKey` remains exported for the times a human
 * needs to see which coordinates produced an id.
 */
export function eventId(coordinates: EventCoordinates): string {
  return createHash('sha256').update(canonicalEventKey(coordinates), 'utf8').digest('hex');
}

/** Lower-cases a hash and strips a leading `0x`, so both spellings agree. */
export function normalizeHash(hash: string): string {
  return hash.trim().toLowerCase().replace(/^0x/, '');
}
