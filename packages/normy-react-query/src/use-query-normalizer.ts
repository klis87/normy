import { useState, useEffect } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { NormalizerConfig } from '@normy/core';

import { createQueryNormalizer } from './create-query-normalizer';

export const useQueryNormalizer = (
  queryClient: QueryClient,
  normalizerConfig: NormalizerConfig & { normalize?: boolean } = {},
) => {
  const [queryNormalizer] = useState(() =>
    createQueryNormalizer(queryClient, normalizerConfig),
  );

  useEffect(() => {
    queryNormalizer.subscribe();

    return () => {
      queryNormalizer.unsubscribe();
      queryNormalizer.clear();
    };
  }, []);

  return queryNormalizer;
};
