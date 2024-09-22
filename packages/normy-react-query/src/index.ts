export { getId } from '@normy/core';

export { createQueryNormalizer } from './create-query-normalizer';
export {
  QueryNormalizerProvider,
  useQueryNormalizer,
} from './QueryNormalizerProvider';

interface NormyReactQueryMeta extends Record<string, unknown> {
  normalize?: boolean;
}

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: NormyReactQueryMeta;
    mutationMeta: NormyReactQueryMeta;
  }
}
