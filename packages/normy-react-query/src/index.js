import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { createNormalizer } from '@normy/core';

export const createNormalizedQueryClient = (
  reactQueryConfig,
  normalizerConfig,
) => {
  const normalizer = createNormalizer(normalizerConfig);

  const queryCache = new QueryCache();

  queryCache.subscribe(event => {
    if (event.type === 'removed') {
      normalizer.onQueryRemoval(event.query.queryKey.join(','));
    } else if (
      event.type === 'updated' &&
      event.action.type === 'success' &&
      event.action.data
    ) {
      normalizer.onQuerySuccess(
        event.query.queryKey.join(','),
        event.action.data,
      );
    }
  });

  const mutationCache = new MutationCache();

  mutationCache.subscribe(event => {
    if (
      event.type === 'updated' &&
      event.action.type === 'success' &&
      event.action.data
    ) {
      normalizer.onMutationSuccess(event.action.data, queriesToUpdate => {
        queriesToUpdate.forEach(query => {
          queryClient.setQueryData(query.queryKey.split(','), () => query.data);
        });
      });
    } else if (
      event.type === 'updated' &&
      event.action.type === 'loading' &&
      event.mutation.state &&
      event.mutation.state.context &&
      event.mutation.state.context.optimisticData
    ) {
      normalizer.onMutationSuccess(
        event.mutation.state.context.optimisticData,
        queriesToUpdate => {
          queriesToUpdate.forEach(query => {
            queryClient.setQueryData(
              query.queryKey.split(','),
              () => query.data,
            );
          });
        },
      );
    } else if (
      event.type === 'updated' &&
      event.action.type === 'error' &&
      event.mutation.state &&
      event.mutation.state.context &&
      event.mutation.state.context.rollbackData
    ) {
      normalizer.onMutationSuccess(
        event.mutation.state.context.rollbackData,
        queriesToUpdate => {
          queriesToUpdate.forEach(query => {
            queryClient.setQueryData(
              query.queryKey.split(','),
              () => query.data,
            );
          });
        },
      );
    }
  });

  const queryClient = new QueryClient({
    ...reactQueryConfig,
    queryCache,
    mutationCache,
  });

  return queryClient;
};
