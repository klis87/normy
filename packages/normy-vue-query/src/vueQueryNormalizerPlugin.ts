import type { NormalizerConfig } from '@normy/core';
import type { QueryClient } from '@tanstack/vue-query';
import { type App, type Plugin, inject } from 'vue';
import { createQueryNormalizer } from '@normy/query-core';

interface NormalizerPluginOptions {
  queryClient: QueryClient;
  normalizerConfig?: NormalizerConfig;
}

type QueryNormalizerType = ReturnType<typeof createQueryNormalizer>;

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

export const useQueryNormalizer = (): QueryNormalizerType => {
  const queryNormalizer = inject<QueryNormalizerType>('queryNormalizer');
  if (!queryNormalizer) {
    throw new Error(
      'No query normalizer provided, this method can only be called in setup script',
    );
  }
  return queryNormalizer;
};
