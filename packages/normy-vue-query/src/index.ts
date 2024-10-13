export { getId } from '@normy/core';

export { createQueryNormalizer } from './create-query-normalizer';
export {
  VueQueryNormalizerPlugin,
  useQueryNormalizer,
} from './vueQueryNormalizerPlugin';

interface NormyVueQueryMeta extends Record<string, unknown> {
  normalize?: boolean;
}

declare module '@tanstack/vue-query' {
  interface Register {
    queryMeta: NormyVueQueryMeta;
    mutationMeta: NormyVueQueryMeta;
  }
}
