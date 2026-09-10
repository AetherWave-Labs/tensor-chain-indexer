import type { HealthStatus } from '../types';

export function formatHealthStatus(status: HealthStatus): string {
  return `Tensor Chain Indexer frontend: ${status}`;
}
