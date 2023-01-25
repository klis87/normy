import { QueryClient, QueryClientConfig } from '@tanstack/react-query';
import { NormalizerConfig } from '@normy/core';

export const createNormalizedQueryClient = (
  reactQueryConfig?: QueryClientConfig,
  normalizerConfig?: NormalizerConfig,
) => QueryClient;
