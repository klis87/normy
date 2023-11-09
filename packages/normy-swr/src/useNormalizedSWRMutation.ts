import { Data } from '@normy/core';
import { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';

import { useSWRNormalizer } from './SWRNormalizerProvider';

export const useNormalizedSWRMutation: typeof useSWRMutation = (
  key,
  fetcher,
  options,
) => {
  const { mutate } = useSWRConfig();
  const normalizer = useSWRNormalizer();

  return useSWRMutation(key, fetcher, {
    populateCache: false,
    revalidate: false,
    ...options,
    onSuccess: (data, mutationKey, config) => {
      const queriesToUpdate = normalizer.getQueriesToUpdate(data as Data);

      queriesToUpdate.forEach(query => {
        void mutate(query.queryKey, query.data, {
          revalidate: false,
        });
      });

      return options?.onSuccess?.(data, mutationKey, config);
    },
  });
};
