import type {
  BlockNumber,
  ChainBlock,
  ChainEvent,
  ChainId,
  ChainTransaction,
  EventFilter,
} from './types.js';

/**
 * The contract every chain integration implements.
 *
 * Deliberately small: four reads, no ingestion logic, no persistence, no
 * retry policy. An adapter's job is to answer questions about a chain in the
 * project's own types; deciding *when* to ask, what to do when the answer
 * fails, and where to put the result all belong to layers above it.
 *
 * Methods return `null` for "asked a well-formed question, the chain has no
 * such thing" — an unmined block, an unknown transaction hash — and throw for
 * "could not get an answer". Collapsing those two into an exception is what
 * makes a caller retry a block that will never exist.
 */
export interface ChainAdapter {
  /** Network this adapter is bound to. */
  readonly chainId: ChainId;

  /** Height of the most recent block the endpoint knows about. */
  getLatestBlock(): Promise<BlockNumber>;

  /** A block by height, or `null` when it is not yet produced. */
  getBlock(blockNumber: BlockNumber): Promise<ChainBlock | null>;

  /**
   * Events matching `filter`, ordered by block number then log index.
   *
   * The ordering is part of the contract rather than an implementation
   * detail: resumable indexing depends on being able to record a position and
   * trust that everything before it has been seen.
   */
  getEvents(filter: EventFilter): Promise<readonly ChainEvent[]>;

  /** A transaction by hash, or `null` when the chain does not know it. */
  getTransaction(transactionHash: string): Promise<ChainTransaction | null>;
}

/**
 * Constructs an adapter for a chain.
 *
 * Adapters are built from resolved configuration rather than reading the
 * environment themselves, so a test can stand one up against a fake endpoint
 * without touching `process.env`.
 */
export type ChainAdapterFactory<TOptions = unknown> = (options: TOptions) => ChainAdapter;
