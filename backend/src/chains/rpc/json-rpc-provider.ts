import { RpcHttpError, RpcResponseError, RpcTimeoutError, RpcTransportError } from './errors.js';

/**
 * The transport a provider sends requests over.
 *
 * Injectable and defaulted to `fetch` so tests exercise the provider's own
 * behaviour — timeouts, error translation, response validation — without a
 * network, and so a different transport can be dropped in later without
 * touching callers.
 */
export type RpcTransport = (
  url: string,
  init: { method: 'POST'; headers: Record<string, string>; body: string; signal: AbortSignal },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export interface JsonRpcProviderOptions {
  url: string;
  /** Per-request deadline. Comes from validated configuration, not the environment. */
  timeoutMs: number;
  transport?: RpcTransport;
}

interface JsonRpcSuccess {
  jsonrpc: '2.0';
  id: number;
  result: unknown;
}

interface JsonRpcFailure {
  jsonrpc: '2.0';
  id: number;
  error: { code: number; message: string };
}

function isJsonRpcFailure(value: unknown): value is JsonRpcFailure {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as JsonRpcFailure).error === 'object' &&
    (value as JsonRpcFailure).error !== null
  );
}

function isJsonRpcSuccess(value: unknown): value is JsonRpcSuccess {
  return typeof value === 'object' && value !== null && 'result' in value;
}

/**
 * A replaceable JSON-RPC client.
 *
 * Holds exactly three responsibilities: bound the wait, translate every
 * failure into an `RpcError`, and confirm the response is a JSON-RPC envelope
 * before handing back a result. It does not retry, cache, batch, or know what
 * any method means — those belong to the adapter and retry layers above it,
 * and keeping them out is what makes this swappable.
 */
export class JsonRpcProvider {
  private readonly url: string;
  private readonly timeoutMs: number;
  private readonly transport: RpcTransport;
  private nextId = 1;

  constructor(options: JsonRpcProviderOptions) {
    this.url = options.url;
    this.timeoutMs = options.timeoutMs;
    this.transport = options.transport ?? defaultTransport;
  }

  /**
   * Sends a single JSON-RPC call and returns its result.
   *
   * @throws {RpcTimeoutError} the deadline elapsed
   * @throws {RpcTransportError} no response was produced
   * @throws {RpcHttpError} a non-2xx status came back
   * @throws {RpcResponseError} a JSON-RPC error object came back
   */
  async send<TResult>(method: string, params: readonly unknown[] = []): Promise<TResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Awaited<ReturnType<RpcTransport>>;
    try {
      response = await this.transport(this.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: this.nextId++, method, params }),
        signal: controller.signal,
      });
    } catch (error) {
      // An abort here is our own deadline firing, not a caller cancelling —
      // reporting it as a transport failure would lose the distinction that
      // decides whether a longer timeout is the fix.
      if (controller.signal.aborted) {
        throw new RpcTimeoutError(this.timeoutMs, error);
      }
      throw new RpcTransportError(messageOf(error), error);
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      throw new RpcHttpError(response.status);
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (error) {
      // A 200 carrying unparseable bytes is a broken endpoint or a captive
      // portal, not a valid negative answer.
      throw new RpcTransportError('response body was not valid JSON', error);
    }

    if (isJsonRpcFailure(body)) {
      throw new RpcResponseError(body.error.code, body.error.message);
    }

    if (!isJsonRpcSuccess(body)) {
      throw new RpcTransportError('response was not a JSON-RPC envelope');
    }

    return body.result as TResult;
  }
}

const defaultTransport: RpcTransport = (url, init) =>
  fetch(url, init) as unknown as ReturnType<RpcTransport>;

/** `String(error)` on a plain object yields "[object Object]", which helps nobody. */
function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'unknown error';
}
