import type { NormyQueryMeta } from '@normy/query-core';

export { createQueryNormalizer } from '@normy/query-core';
export { getId } from '@normy/core';

export {
  VueQueryNormalizerPlugin,
  useQueryNormalizer,
} from './vueQueryNormalizerPlugin';

declare module '@tanstack/vue-query' {
  interface Register {
    queryMeta: NormyQueryMeta;
    mutationMeta: NormyQueryMeta;
  }
}
