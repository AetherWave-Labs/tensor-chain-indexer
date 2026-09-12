import type { EventValidationIssue, EventValidationResult, NormalizedEvent } from './types.js';

/**
 * Validation for the normalized event shape.
 *
 * Hand-written rather than schema-library based to keep the normalization
 * layer dependency-free: this runs on every event the indexer ingests, and the
 * rules are few enough that stating them explicitly is clearer than
 * configuring them.
 *
 * The point of validating here, at the boundary, is that a malformed RPC
 * payload is rejected before it reaches the store — where it would otherwise
 * become a row that every later query has to defend against.
 */

/** Decimal digits only. Rejects `0x…`, signs, exponents and empty strings. */
const DECIMAL_DIGITS = /^\d+$/;

/** Hex hash with an optional `0x` prefix; at least one digit. */
const HEX_HASH = /^(0x)?[0-9a-f]+$/i;

/** `namespace:reference`, e.g. `evm:1`. */
const CHAIN_ID = /^[a-z0-9]+:[a-zA-Z0-9_-]+$/;

/**
 * Plausible range for a block timestamp, in milliseconds.
 *
 * The bounds exist to catch unit mistakes, which is the failure this field is
 * prone to: chains disagree — EVM reports seconds — and a wrong unit produces
 * a number that is perfectly valid and wrong by a factor of a thousand.
 *
 * The floor is Bitcoin's genesis block: no blockchain event predates it, and
 * any seconds-era value for a modern date (~1.7e9) falls far below it. The
 * ceiling catches microseconds the same way.
 */
const MIN_TIMESTAMP_MS = 1_230_768_000_000; // 2009-01-01T00:00:00Z
const MAX_TIMESTAMP_MS = 4_102_444_800_000; // 2100-01-01T00:00:00Z

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks a candidate against the normalized event shape.
 *
 * Collects every problem rather than stopping at the first, so one malformed
 * payload produces one actionable report instead of a sequence of them.
 */
export function validateNormalizedEvent(candidate: unknown): EventValidationResult {
  const issues: EventValidationIssue[] = [];
  const add = (field: string, message: string) => issues.push({ field, message });

  if (!isPlainObject(candidate)) {
    return { valid: false, issues: [{ field: '(root)', message: 'must be an object' }] };
  }

  const value = candidate;

  if (typeof value.id !== 'string' || value.id.length === 0) {
    add('id', 'must be a non-empty string');
  }

  if (typeof value.chain !== 'string' || !CHAIN_ID.test(value.chain)) {
    add('chain', 'must look like `namespace:reference`, e.g. `evm:1`');
  }

  // Rejecting a numeric blockNumber is deliberate rather than lenient: silently
  // accepting one would reintroduce the 2^53 precision loss the string is there
  // to avoid, and it would do so invisibly.
  if (typeof value.blockNumber !== 'string') {
    add('blockNumber', 'must be a decimal string, not a number');
  } else if (!DECIMAL_DIGITS.test(value.blockNumber)) {
    add('blockNumber', 'must contain decimal digits only');
  }

  if (typeof value.transactionHash !== 'string' || !HEX_HASH.test(value.transactionHash)) {
    add('transactionHash', 'must be a hex string');
  }

  if (typeof value.logIndex !== 'number' || !Number.isInteger(value.logIndex)) {
    add('logIndex', 'must be an integer');
  } else if (value.logIndex < 0) {
    add('logIndex', 'must not be negative');
  }

  if (typeof value.eventType !== 'string' || value.eventType.length === 0) {
    add('eventType', 'must be a non-empty string');
  }

  if (typeof value.timestamp !== 'number' || !Number.isInteger(value.timestamp)) {
    add('timestamp', 'must be an integer number of milliseconds since the epoch');
  } else if (value.timestamp < MIN_TIMESTAMP_MS) {
    add('timestamp', 'is before any blockchain existed; check it is milliseconds, not seconds');
  } else if (value.timestamp > MAX_TIMESTAMP_MS) {
    add('timestamp', 'is beyond the supported range; check it is milliseconds, not microseconds');
  }

  if (!isPlainObject(value.data)) {
    add('data', 'must be an object');
  }

  return { valid: issues.length === 0, issues };
}

/** Raised by {@link parseNormalizedEvent} when validation fails. */
export class EventValidationError extends Error {
  readonly issues: readonly EventValidationIssue[];

  constructor(issues: readonly EventValidationIssue[]) {
    super(
      `Invalid normalized event: ${issues
        .map((issue) => `${issue.field} ${issue.message}`)
        .join('; ')}`,
    );
    this.name = 'EventValidationError';
    this.issues = issues;
  }
}

/**
 * Validates and returns a typed normalized event.
 *
 * @throws {EventValidationError} when the candidate does not match the shape.
 */
export function parseNormalizedEvent(candidate: unknown): NormalizedEvent {
  const result = validateNormalizedEvent(candidate);

  if (!result.valid) {
    throw new EventValidationError(result.issues);
  }

  return candidate as NormalizedEvent;
}

/** Non-throwing form, for callers filtering a batch rather than failing it. */
export function isNormalizedEvent(candidate: unknown): candidate is NormalizedEvent {
  return validateNormalizedEvent(candidate).valid;
}
