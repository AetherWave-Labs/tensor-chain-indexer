import { describe, expect, it } from 'vitest';
import type {
  ChainAdapter,
  ChainBlock,
  ChainEvent,
  ChainTransaction,
  EventFilter,
} from '../../../src/chains/index.js';

/**
 * A minimal in-memory adapter.
 *
 * Its purpose is twofold: it proves the contract is implementable without a
 * network, and it pins the behaviours the interface documents but a type
 * cannot enforce — `null` for "no such thing", ordering of `getEvents`.
 */
class MemoryAdapter implements ChainAdapter {
  readonly chainId = 'evm:1';

  constructor(
    private readonly blocks: ReadonlyMap<bigint, ChainBlock>,
    private readonly events: readonly ChainEvent[] = [],
    private readonly transactions: ReadonlyMap<string, ChainTransaction> = new Map(),
  ) {}

  async getLatestBlock(): Promise<bigint> {
    return [...this.blocks.keys()].reduce((max, value) => (value > max ? value : max), 0n);
  }

  async getBlock(blockNumber: bigint): Promise<ChainBlock | null> {
    return this.blocks.get(blockNumber) ?? null;
  }

  async getEvents(filter: EventFilter): Promise<readonly ChainEvent[]> {
    return this.events
      .filter(
        (event) => event.blockNumber >= filter.fromBlock && event.blockNumber <= filter.toBlock,
      )
      .filter((event) => !filter.addresses || filter.addresses.includes(event.address))
      .sort((a, b) =>
        a.blockNumber === b.blockNumber
          ? a.logIndex - b.logIndex
          : Number(a.blockNumber - b.blockNumber),
      );
  }

  async getTransaction(transactionHash: string): Promise<ChainTransaction | null> {
    return this.transactions.get(transactionHash) ?? null;
  }
}

const block = (number: bigint): ChainBlock => ({
  chainId: 'evm:1',
  number,
  hash: `0xblock${number}`,
  parentHash: `0xblock${number - 1n}`,
  timestamp: 1_700_000_000_000 + Number(number) * 12_000,
});

const event = (blockNumber: bigint, logIndex: number, address = '0xcontract'): ChainEvent => ({
  chainId: 'evm:1',
  blockNumber,
  blockHash: `0xblock${blockNumber}`,
  transactionHash: `0xtx${blockNumber}`,
  logIndex,
  address,
  topics: ['0xtransfer'],
  data: '0x',
});

const adapter = new MemoryAdapter(
  new Map([
    [1n, block(1n)],
    [2n, block(2n)],
  ]),
  [event(2n, 1), event(1n, 1), event(2n, 0), event(1n, 0, '0xother')],
  new Map([
    [
      '0xtx1',
      {
        chainId: 'evm:1',
        hash: '0xtx1',
        blockNumber: 1n,
        blockHash: '0xblock1',
        index: 0,
        from: '0xsender',
        to: '0xcontract',
        successful: true,
      },
    ],
  ]),
);

describe('ChainAdapter contract', () => {
  it('reports the chain it is bound to', () => {
    expect(adapter.chainId).toBe('evm:1');
  });

  it('returns the highest known block height', async () => {
    await expect(adapter.getLatestBlock()).resolves.toBe(2n);
  });

  it('returns a block by height', async () => {
    const result = await adapter.getBlock(1n);

    expect(result?.number).toBe(1n);
    expect(result?.hash).toBe('0xblock1');
  });

  // "Asked a well-formed question, the chain has no such thing" is not a
  // failure — collapsing it into an exception is what makes a caller retry a
  // block that will never exist.
  it('returns null for a block that is not yet produced', async () => {
    await expect(adapter.getBlock(99n)).resolves.toBeNull();
  });

  it('returns null for an unknown transaction hash', async () => {
    await expect(adapter.getTransaction('0xmissing')).resolves.toBeNull();
  });

  it('returns a transaction by hash', async () => {
    const result = await adapter.getTransaction('0xtx1');

    expect(result?.hash).toBe('0xtx1');
    expect(result?.successful).toBe(true);
  });

  // Resumable indexing depends on recording a position and trusting that
  // everything before it has been seen, so ordering is part of the contract.
  it('orders events by block number then log index', async () => {
    const events = await adapter.getEvents({ fromBlock: 1n, toBlock: 2n });

    expect(events.map((item) => [item.blockNumber, item.logIndex])).toEqual([
      [1n, 0],
      [1n, 1],
      [2n, 0],
      [2n, 1],
    ]);
  });

  it('honours the inclusive block range', async () => {
    const events = await adapter.getEvents({ fromBlock: 2n, toBlock: 2n });

    expect(events).toHaveLength(2);
    expect(events.every((item) => item.blockNumber === 2n)).toBe(true);
  });

  it('narrows by address when asked', async () => {
    const events = await adapter.getEvents({
      fromBlock: 1n,
      toBlock: 2n,
      addresses: ['0xother'],
    });

    expect(events).toHaveLength(1);
    expect(events[0].address).toBe('0xother');
  });

  it('returns nothing for an empty range rather than failing', async () => {
    await expect(adapter.getEvents({ fromBlock: 50n, toBlock: 60n })).resolves.toEqual([]);
  });

  // Block heights and token amounts share one numeric representation so no
  // call site has to remember which rule applies where.
  it('carries block heights as bigint', async () => {
    const latest = await adapter.getLatestBlock();

    expect(typeof latest).toBe('bigint');
  });
});
