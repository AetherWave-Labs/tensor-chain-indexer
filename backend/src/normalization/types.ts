/**
 * The normalized representation every indexed event is stored as.
 *
 * This is the boundary between chain-specific payloads and everything
 * downstream — storage, analytics, forecasting. Those layers read this shape
 * and nothing else, so a second chain can be added without any of them
 * learning its encoding.
 */
export interface NormalizedEvent {
  /**
   * Deterministic identity, derived from the on-chain coordinates.
   *
   * See `event-identity.ts`. Re-indexing the same block produces the same id,
   * which is what duplicate protection keys on.
   */
  id: string;

  /** Network the event was observed on, e.g. `evm:1`, `stellar:pubnet`. */
  chain: string;

  /**
   * Height of the containing block, decimal, as a string.
   *
   * A string rather than `number` because block heights and, more pressingly,
   * the amounts carried in event payloads routinely exceed 2^53 — and JSON has
   * no bigint, so anything that survives a round trip through the store or an
   * API response has to be a string anyway. One rule everywhere beats a
   * per-field rule nobody remembers.
   */
  blockNumber: string;

  /** Hash of the containing transaction, lower-cased. */
  transactionHash: string;

  /** Position of this event within its block; unique per block. */
  logIndex: number;

  /** Normalized event name, e.g. `transfer`. */
  eventType: string;

  /**
   * Block time in **milliseconds** since the Unix epoch, UTC.
   *
   * The unit is fixed and stated here because chains disagree — EVM reports
   * seconds — and a downstream metric that guesses wrong is out by a factor of
   * a thousand without ever failing.
   */
  timestamp: number;

  /** Decoded payload. Shape varies by `eventType`. */
  data: Readonly<Record<string, unknown>>;
}

/** One reason a candidate payload is not a valid normalized event. */
export interface EventValidationIssue {
  field: string;
  message: string;
}

export interface EventValidationResult {
  valid: boolean;
  issues: EventValidationIssue[];
}
