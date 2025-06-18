import type { NormyQueryMeta } from '@normy/query-core';

export { createQueryNormalizer } from '@normy/query-core';
export { getId } from '@normy/core';

export {
  QueryNormalizerProvider,
  useQueryNormalizer,
} from './QueryNormalizerProvider';

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: NormyQueryMeta;
    mutationMeta: NormyQueryMeta;
  }
}
