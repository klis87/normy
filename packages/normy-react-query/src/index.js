import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { createNormalizer } from '@normy/core';

export const createNormalizedQueryClient = (
  reactQueryConfig,
  normalizerConfig,
) => {
  const normalizer = createNormalizer(normalizerConfig);

  const queryClient = new QueryClient({
    ...reactQueryConfig,
    queryCache: new QueryCache({
      onSuccess: (data, query) => {
        normalizer.onQuerySuccess(query.queryKey.join(','), data);
        console.log(
          'query success',
          query.queryKey,
          data,
          normalizer.getNormalizedData(),
        );
      },
    }),
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
        console.log('mutation success', data, normalizer.getNormalizedData());
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
    console.log('mutation data ipdate success', normalizer.getNormalizedData());
  };

  return queryClient;
};
