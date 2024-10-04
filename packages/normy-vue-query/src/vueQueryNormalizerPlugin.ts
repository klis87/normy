import type { NormalizerConfig } from '@normy/core';
import type { QueryClient } from '@tanstack/vue-query';
import { type App, type Plugin, inject } from 'vue';

import { createQueryNormalizer } from './create-query-normalizer';

// Define the options type
interface NormalizerPluginOptions {
  queryClient: QueryClient;
  normalizerConfig?: NormalizerConfig;
}

// Define the type for the normalizer result
type QueryNormalizerType = ReturnType<typeof createQueryNormalizer>;

// Augment the vue module directly
declare module 'vue' {
  interface ComponentCustomProperties {
    $queryNormalizer: QueryNormalizerType;
  }
}

export const VueQueryNormalizerPlugin: Plugin = {
  install(app: App, options: NormalizerPluginOptions) {
    const normalizer = createQueryNormalizer(
      options.queryClient,
      options.normalizerConfig,
    );
    normalizer.subscribe();
    app.provide('queryNormalizer', normalizer);
  },
};

export const useQueryNormalizer = () => {
  const queryNormalizer = inject<QueryNormalizerType>('queryNormalizer');
  if (!queryNormalizer) {
    throw new Error(
      'No query normalizer provided, this method can only be called in setup script',
    );
  }
  return queryNormalizer;
};
