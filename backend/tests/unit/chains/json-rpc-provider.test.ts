import { describe, expect, it, vi } from 'vitest';
import { JsonRpcProvider, type RpcTransport } from '../../../src/chains/rpc/json-rpc-provider.js';
import {
  RpcHttpError,
  RpcResponseError,
  RpcTimeoutError,
  RpcTransportError,
} from '../../../src/chains/rpc/errors.js';

const URL = 'https://rpc.example.com';

const respondWith = (body: unknown, status = 200): RpcTransport =>
  vi.fn(async () => ({ ok: status >= 200 && status < 300, status, json: async () => body }));

const provider = (transport: RpcTransport, timeoutMs = 1_000) =>
  new JsonRpcProvider({ url: URL, timeoutMs, transport });

describe('JsonRpcProvider.send', () => {
  it('returns the result of a successful call', async () => {
    const result = await provider(respondWith({ jsonrpc: '2.0', id: 1, result: '0x10' })).send(
      'eth_blockNumber',
    );

    expect(result).toBe('0x10');
  });

  it('posts a well-formed JSON-RPC envelope', async () => {
    const transport = respondWith({ jsonrpc: '2.0', id: 1, result: null });

    await provider(transport).send('eth_getBlockByNumber', ['0x1', false]);

    const [url, init] = vi.mocked(transport).mock.calls[0];
    expect(url).toBe(URL);
    expect(init.method).toBe('POST');
    expect(init.headers['content-type']).toBe('application/json');
    expect(JSON.parse(init.body)).toMatchObject({
      jsonrpc: '2.0',
      method: 'eth_getBlockByNumber',
      params: ['0x1', false],
    });
  });

  it('defaults params to an empty array', async () => {
    const transport = respondWith({ jsonrpc: '2.0', id: 1, result: 1 });

    await provider(transport).send('net_version');

    expect(JSON.parse(vi.mocked(transport).mock.calls[0][1].body).params).toEqual([]);
  });

  // Two concurrent calls sharing an id make responses impossible to match up.
  it('gives each request a distinct id', async () => {
    const transport = respondWith({ jsonrpc: '2.0', id: 1, result: 1 });
    const client = provider(transport);

    await client.send('a');
    await client.send('b');

    const ids = vi.mocked(transport).mock.calls.map((call) => JSON.parse(call[1].body).id);
    expect(new Set(ids).size).toBe(2);
  });

  it('passes an abort signal the caller can observe', async () => {
    const transport = respondWith({ jsonrpc: '2.0', id: 1, result: 1 });

    await provider(transport).send('net_version');

    expect(vi.mocked(transport).mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
});

describe('JsonRpcProvider failure translation', () => {
  it('raises a typed error for a JSON-RPC error object', async () => {
    const client = provider(
      respondWith({ jsonrpc: '2.0', id: 1, error: { code: -32601, message: 'method not found' } }),
    );

    await expect(client.send('nope')).rejects.toBeInstanceOf(RpcResponseError);
    await expect(client.send('nope')).rejects.toMatchObject({ code: -32601, retryable: false });
  });

  it('raises a typed error for a non-2xx status', async () => {
    const client = provider(respondWith({}, 503));

    await expect(client.send('net_version')).rejects.toBeInstanceOf(RpcHttpError);
    await expect(client.send('net_version')).rejects.toMatchObject({
      status: 503,
      retryable: true,
    });
  });

  it('marks a rate limit retryable and a bad key permanent', async () => {
    await expect(provider(respondWith({}, 429)).send('x')).rejects.toMatchObject({
      retryable: true,
    });
    await expect(provider(respondWith({}, 401)).send('x')).rejects.toMatchObject({
      retryable: false,
    });
  });

  it('raises a transport error when the request never completes', async () => {
    const transport: RpcTransport = vi.fn(async () => {
      throw new Error('ECONNRESET');
    });

    await expect(provider(transport).send('x')).rejects.toBeInstanceOf(RpcTransportError);
  });

  // A 200 carrying unparseable bytes is a broken endpoint, not a valid answer.
  it('raises a transport error for an unparseable body', async () => {
    const transport: RpcTransport = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('Unexpected token <');
      },
    }));

    await expect(provider(transport).send('x')).rejects.toBeInstanceOf(RpcTransportError);
  });

  it('raises a transport error when the body is not a JSON-RPC envelope', async () => {
    await expect(provider(respondWith({ unexpected: true })).send('x')).rejects.toThrow(
      /JSON-RPC envelope/,
    );
  });

  it('reports a non-Error rejection readably', async () => {
    const transport: RpcTransport = vi.fn(async () => {
      throw 'socket hang up';
    });

    await expect(provider(transport).send('x')).rejects.toThrow(/socket hang up/);
  });
});

describe('JsonRpcProvider timeouts', () => {
  // Our own deadline firing is a different diagnosis from a dropped socket:
  // one is fixed by a longer timeout, the other is not.
  it('raises a timeout error, not a transport error, when the deadline elapses', async () => {
    const transport: RpcTransport = (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new Error('aborted')));
      });

    const error = await provider(transport, 10)
      .send('slow')
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(RpcTimeoutError);
    expect(error).toMatchObject({ timeoutMs: 10, retryable: true });
  });

  it('aborts the in-flight request when the deadline elapses', async () => {
    let observed: AbortSignal | undefined;
    const transport: RpcTransport = (_url, init) =>
      new Promise((_resolve, reject) => {
        observed = init.signal;
        init.signal.addEventListener('abort', () => reject(new Error('aborted')));
      });

    await provider(transport, 10)
      .send('slow')
      .catch(() => undefined);

    expect(observed?.aborted).toBe(true);
  });

  it('does not fire the deadline for a call that returns in time', async () => {
    const client = provider(respondWith({ jsonrpc: '2.0', id: 1, result: 'ok' }), 50);

    await expect(client.send('fast')).resolves.toBe('ok');
  });
});
