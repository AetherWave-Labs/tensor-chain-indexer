import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Loader for the blockchain event fixtures.
 *
 * The fixtures are literal JSON on disk rather than builders, so what a test
 * asserts against is exactly what a reviewer reads. Nothing here generates
 * values, and no fixture contains a timestamp or id derived from the clock —
 * a fixture that changes between runs cannot prove a parser is deterministic.
 *
 * Later parser, validation and ingestion work should load from here rather
 * than redefining its own payloads, so there is one place to update when the
 * normalized shape changes.
 */

const FIXTURE_DIR = dirname(fileURLToPath(import.meta.url));

/** Every fixture file, by name. */
export const EVENT_FIXTURES = {
  /** A single well-formed ERC-20 style transfer. */
  validTransfer: 'valid-transfer.json',
  /** Two events emitted by one transaction, distinguished by log index. */
  multipleEventsOneTransaction: 'multiple-events-one-transaction.json',
  /** A well-formed event from a non-EVM chain. */
  stellarPayment: 'stellar-payment.json',
  /** Every field present but of the wrong type or shape. */
  malformedPayload: 'malformed-payload.json',
  /** Required fields absent entirely. */
  missingFields: 'missing-fields.json',
  /** Structurally valid, but an event type nothing maps yet. */
  unknownEventType: 'unknown-event-type.json',
  /** Valid but for a seconds-based timestamp where milliseconds are required. */
  secondsTimestamp: 'seconds-timestamp.json',
} as const;

export type EventFixtureName = keyof typeof EVENT_FIXTURES;

/**
 * Reads a fixture and returns its parsed contents.
 *
 * Read fresh on each call rather than cached, so a test that mutates what it
 * receives cannot leak that mutation into the next one.
 */
export function loadEventFixture<T = unknown>(name: EventFixtureName): T {
  const path = join(FIXTURE_DIR, EVENT_FIXTURES[name]);

  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

/** Names of the fixtures that are expected to validate. */
export const VALID_FIXTURES: readonly EventFixtureName[] = [
  'validTransfer',
  'stellarPayment',
  'unknownEventType',
];

/**
 * Names of the fixtures that are expected to be rejected.
 *
 * `unknownEventType` is deliberately not here: an unrecognised event type is
 * a mapping gap, not a malformed event, and the schema's job is shape rather
 * than vocabulary.
 */
export const INVALID_FIXTURES: readonly EventFixtureName[] = [
  'malformedPayload',
  'missingFields',
  'secondsTimestamp',
];
