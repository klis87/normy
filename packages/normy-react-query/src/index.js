import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { createNormalizer } from '@normy/core';

export const createNormalizedQueryClient = (
  reactQueryConfig,
  normalizerConfig,
) => {
  const normalizer = createNormalizer(normalizerConfig);

  const queryCache = new QueryCache({
    onSuccess: (data, query) => {
      normalizer.onQuerySuccess(query.queryKey.join(','), data);
    },
  });

  queryCache.subscribe(event => {
    if (event.type === 'removed') {
      normalizer.onQueryRemoval(event.query.queryKey.join(','));
    }
  });

  const queryClient = new QueryClient({
    ...reactQueryConfig,
    queryCache,
    mutationCache: new MutationCache({
      onSuccess: data => {
        normalizer.onMutationSuccess(data, queriesToUpdate => {
          queriesToUpdate.forEach(query => {
            queryClient.setQueryData(
              query.queryKey.split(','),
              () => query.data,
            );
          });
        });
      },
    }),
  });

  const original = queryClient.setQueryData.bind(queryClient);

  queryClient.setQueryData = (queryKey, data) => {
    original(queryKey, data);

    normalizer.onQuerySuccess(
      queryKey.join(','),
      queryClient.getQueryData(queryKey),
    );
  };

  return queryClient;
};
