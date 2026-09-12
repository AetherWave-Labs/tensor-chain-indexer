/**
 * Normalized RPC failures.
 *
 * Providers disagree about how to report the same problem — an HTTP 429, a
 * JSON-RPC error object, a socket reset. Callers should not have to know
 * which provider they are behind to tell "try again" from "this will never
 * work", so every failure is translated into one of these.
 */

/** What kind of failure occurred, independent of provider. */
export type RpcErrorKind = 'timeout' | 'transport' | 'http' | 'rpc';

/**
 * Base class for normalized RPC failures.
 *
 * `retryable` is the field that matters downstream. It is decided here, at
 * the point where provider-specific detail is still available, rather than
 * re-derived later from a stringified message. Retry *policy* — how many
 * times, how long to back off — is deliberately not here; that belongs to the
 * retry work in #43, which reads this flag.
 */
export abstract class RpcError extends Error {
  abstract readonly kind: RpcErrorKind;

  /** Whether retrying the identical request could plausibly succeed. */
  readonly retryable: boolean;

  /** The underlying failure, when there was one. */
  readonly cause?: unknown;

  protected constructor(message: string, retryable: boolean, cause?: unknown) {
    super(message);
    this.name = new.target.name;
    this.retryable = retryable;
    this.cause = cause;
  }
}

/** The request exceeded its deadline. */
export class RpcTimeoutError extends RpcError {
  readonly kind = 'timeout' as const;
  readonly timeoutMs: number;

  constructor(timeoutMs: number, cause?: unknown) {
    super(`RPC request timed out after ${timeoutMs}ms`, true, cause);
    this.timeoutMs = timeoutMs;
  }
}

/** The request never produced a response: DNS, TLS, socket. */
export class RpcTransportError extends RpcError {
  readonly kind = 'transport' as const;

  constructor(message: string, cause?: unknown) {
    super(`RPC transport failure: ${message}`, true, cause);
  }
}

/**
 * The endpoint answered with a non-2xx status.
 *
 * 408, 425, 429 and 5xx are treated as transient — the endpoint is saying
 * "not now". Everything else, notably 400 and 401, is a request or credential
 * problem that will fail identically forever, and retrying it only turns one
 * error into several.
 */
export class RpcHttpError extends RpcError {
  readonly kind = 'http' as const;
  readonly status: number;

  constructor(status: number, message?: string, cause?: unknown) {
    super(
      `RPC endpoint returned HTTP ${status}${message ? `: ${message}` : ''}`,
      isRetryableStatus(status),
      cause,
    );
    this.status = status;
  }
}

/** The endpoint answered with a JSON-RPC error object. */
export class RpcResponseError extends RpcError {
  readonly kind = 'rpc' as const;
  readonly code: number;

  constructor(code: number, message: string, cause?: unknown) {
    super(`RPC error ${code}: ${message}`, isRetryableRpcCode(code), cause);
    this.code = code;
  }
}

/** HTTP statuses worth trying again. */
export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

/**
 * JSON-RPC codes worth trying again.
 *
 * -32603 is "internal error" and -32005 is the de facto rate-limit code. The
 * rest of the standard range describes a malformed or unsupported request,
 * which a retry cannot fix.
 */
export function isRetryableRpcCode(code: number): boolean {
  return code === -32603 || code === -32005;
}
