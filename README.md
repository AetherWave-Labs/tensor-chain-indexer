# tensor-chain-indexer

**Modular Stellar-focused blockchain event indexer with ML-powered analytics for real-time liquidity, transaction fee, and token velocity forecasting.**

`tensor-chain-indexer` is an open-source blockchain data and analytics infrastructure project designed to transform raw on-chain activity into structured, queryable data and actionable intelligence for blockchain applications.

The architecture is designed with **Stellar/Soroban as a first-class integration target**, while maintaining a modular chain-adapter layer that can support additional blockchain networks over time.

## Why Stellar

Stellar provides a strong foundation for fast, low-cost financial infrastructure, but applications still require reliable access to structured on-chain data for analytics, monitoring, forecasting, and intelligent automation.

Tensor Chain Indexer aims to provide that data layer by:

- Indexing Stellar/Soroban blockchain activity.
- Normalizing blockchain events into consistent, queryable records.
- Producing real-time liquidity and transaction-fee analytics.
- Measuring token movement and velocity.
- Applying ML models to historical indexed data for forecasting.
- Exposing structured blockchain data and analytics through APIs.
- Providing infrastructure that can be consumed by developers, analytics applications, autonomous agents, and AI-driven financial systems.

The Stellar/Soroban integration is being developed as part of the project's broader blockchain indexing architecture. The current repository is in early development, and implementation capabilities will evolve incrementally.

## Overview

The project combines blockchain event indexing with machine-learning-assisted analytics.

It focuses on three core capabilities:

1. **Blockchain Event Indexing** — Ingest and normalize on-chain events into structured records.
2. **Real-Time Analytics** — Calculate metrics such as liquidity, transaction fees, and token velocity from indexed blockchain activity.
3. **ML Forecasting** — Provide forecasting capabilities for selected blockchain metrics using historical indexed data.

The architecture is modular so that additional blockchain networks, event types, analytics models, and data providers can be added without coupling them to the core indexing pipeline.

## Goals

- Provide a reliable blockchain event indexing pipeline.
- Prioritize Stellar/Soroban as an initial ecosystem integration.
- Normalize blockchain data into a consistent internal representation.
- Support incremental and resumable indexing.
- Prevent duplicate event processing.
- Handle transient blockchain/RPC failures safely.
- Provide real-time analytics from indexed data.
- Support ML-based forecasting of selected blockchain metrics.
- Expose structured data through APIs for downstream applications.
- Keep chain-specific implementations isolated from analytics logic.
- Make the system easy for contributors to extend and test.
- Provide a foundation for blockchain-aware AI and autonomous applications.

## Architecture

The system separates blockchain ingestion, data processing, analytics, and forecasting.

```text
                         Blockchain Network
                                │
                                ▼
                    ┌────────────────────────┐
                    │    RPC / Data Source   │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │    Event Ingestion      │
                    │                         │
                    │  Ledgers / Blocks / Tx  │
                    │  Events / Logs          │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   Event Normalization  │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │    Indexed Data Store  │
                    └────────────┬───────────┘
                                 │
                         ┌───────┴────────┐
                         │                │
                         ▼                ▼
              ┌──────────────────┐ ┌──────────────────┐
              │   Real-Time      │ │   ML Analytics   │
              │   Analytics      │ │   & Forecasting  │
              └────────┬─────────┘ └────────┬─────────┘
                       │                    │
                       └─────────┬──────────┘
                                 ▼
                    ┌────────────────────────┐
                    │       Query API        │
                    └────────────────────────┘
