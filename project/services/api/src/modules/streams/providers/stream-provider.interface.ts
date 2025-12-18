import { Platform } from '../../../prisma-client';
import type { StreamSummary } from '../types';

export interface ProviderFetchOptions {
  limit: number;
  category?: string;
}

export interface StreamProvider {
  readonly platform: Platform;
  fetchTrendingStreams(options: ProviderFetchOptions): Promise<StreamSummary[]>;
}
