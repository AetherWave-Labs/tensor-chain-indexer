/**
 * Chain-independent types the adapter contract is expressed in.
 *
 * These are the project's own representation, not any provider's response
 * shape. Adapters translate into them; everything downstream of ingestion
 * reads only these. That boundary is the point: without it, the first chain
 * integrated silently becomes the interface every later chain has to imitate.
 */

/** Identifier for a supported network, e.g. `evm:1`, `stellar:pubnet`. */
export type ChainId = string;

/**
 * Block height.
 *
 * `bigint` rather than `number`: chains are nowhere near 2^53 today, but
 * amounts in event payloads routinely exceed it, and using one numeric
 * representation across the adapter avoids a silent precision cliff at the
 * one call site that forgot which rule applied.
 */
export type BlockNumber = bigint;

/** A block, reduced to what indexing needs. */
export interface ChainBlock {
  chainId: ChainId;
  number: BlockNumber;
  hash: string;
  parentHash: string;
  /** Block time in milliseconds since the Unix epoch, UTC. */
  timestamp: number;
}

/** A single log/event emitted within a transaction. */
export interface ChainEvent {
  chainId: ChainId;
  blockNumber: BlockNumber;
  blockHash: string;
  transactionHash: string;
  /** Position of this event within its block; unique per block. */
  logIndex: number;
  /** Emitting contract or account address, in the chain's canonical form. */
  address: string;
  /** Indexed fields, chain-specific in meaning but always string-encoded. */
  topics: readonly string[];
  /** Unindexed payload, still in the chain's own encoding. */
  data: string;
}

/** A transaction, reduced to what indexing needs. */
export interface ChainTransaction {
  chainId: ChainId;
  hash: string;
  blockNumber: BlockNumber;
  blockHash: string;
  /** Position within the block. */
  index: number;
  from: string;
  to: string | null;
  /** Whether the transaction succeeded on chain. */
  successful: boolean;
}

/** Inclusive block range for an event query. */
export interface BlockRange {
  fromBlock: BlockNumber;
  toBlock: BlockNumber;
}

/** Optional narrowing for an event query. */
export interface EventFilter extends BlockRange {
  /** Restrict to events emitted by these addresses. */
  addresses?: readonly string[];
  /** Restrict to events whose first topic matches one of these. */
  topics?: readonly string[];
}
