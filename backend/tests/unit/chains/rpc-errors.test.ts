import { describe, expect, it } from 'vitest';
import {
  RpcError,
  RpcHttpError,
  RpcResponseError,
  RpcTimeoutError,
  RpcTransportError,
  isRetryableRpcCode,
  isRetryableStatus,
} from '../../../src/chains/rpc/errors.js';

describe('RpcTimeoutError', () => {
  it('is retryable and records the deadline it exceeded', () => {
    const error = new RpcTimeoutError(5_000);

    expect(error).toBeInstanceOf(RpcError);
    expect(error.kind).toBe('timeout');
    expect(error.retryable).toBe(true);
    expect(error.timeoutMs).toBe(5_000);
    expect(error.message).toContain('5000ms');
  });

  it('keeps the underlying cause', () => {
    const cause = new Error('aborted');

    expect(new RpcTimeoutError(1_000, cause).cause).toBe(cause);
  });
});

describe('RpcTransportError', () => {
  it('is retryable — no response was produced', () => {
    const error = new RpcTransportError('ECONNRESET');

    expect(error.kind).toBe('transport');
    expect(error.retryable).toBe(true);
  });
});

describe('RpcHttpError', () => {
  // The endpoint is saying "not now", which is the one case worth repeating.
  it.each([408, 425, 429, 500, 502, 503, 504])('treats HTTP %i as retryable', (status) => {
    expect(new RpcHttpError(status).retryable).toBe(true);
  });

  // A bad request or a bad key fails identically forever; retrying turns one
  // error into several.
  it.each([400, 401, 403, 404, 422])('treats HTTP %i as permanent', (status) => {
    expect(new RpcHttpError(status).retryable).toBe(false);
  });

  it('records the status', () => {
    const error = new RpcHttpError(429, 'rate limited');

    expect(error.status).toBe(429);
    expect(error.message).toContain('429');
    expect(error.message).toContain('rate limited');
  });
});

describe('RpcResponseError', () => {
  it('treats internal error and rate limit codes as retryable', () => {
    expect(new RpcResponseError(-32603, 'internal error').retryable).toBe(true);
    expect(new RpcResponseError(-32005, 'limit exceeded').retryable).toBe(true);
  });

  it.each([-32700, -32600, -32601, -32602])(
    'treats malformed-request code %i as permanent',
    (code) => {
      expect(new RpcResponseError(code, 'bad request').retryable).toBe(false);
    },
  );

  it('records the code and message', () => {
    const error = new RpcResponseError(-32601, 'method not found');

    expect(error.kind).toBe('rpc');
    expect(error.code).toBe(-32601);
    expect(error.message).toContain('method not found');
  });
});

describe('classification helpers', () => {
  it('exposes the status rule on its own', () => {
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(404)).toBe(false);
  });

  it('exposes the JSON-RPC code rule on its own', () => {
    expect(isRetryableRpcCode(-32005)).toBe(true);
    expect(isRetryableRpcCode(-32602)).toBe(false);
  });
});

describe('error identity', () => {
  // A caller that catches broadly still needs to tell RPC failures apart from
  // programming errors.
  it('every RPC failure is an Error and an RpcError', () => {
    const errors = [
      new RpcTimeoutError(1),
      new RpcTransportError('x'),
      new RpcHttpError(500),
      new RpcResponseError(-32603, 'x'),
    ];

    for (const error of errors) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(RpcError);
      expect(error.name).toBe(error.constructor.name);
    }
  });
});
