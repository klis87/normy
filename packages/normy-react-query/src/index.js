import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { createNormalizer } from '@normy/core';

export const createNormalizedQueryClient = (
  reactQueryConfig,
  normalizerConfig,
) => {
  const normalizer = createNormalizer(normalizerConfig);

  reactQueryConfig = {
    ...reactQueryConfig,
    queryCache: reactQueryConfig.queryCache || new QueryCache(),
    mutationCache: reactQueryConfig.mutationCache || new MutationCache(),
  };

  reactQueryConfig.queryCache.subscribe(event => {
    if (event.type === 'removed') {
      normalizer.removeQuery(event.query.queryKey.join(','));
    } else if (
      event.type === 'updated' &&
      event.action.type === 'success' &&
      event.action.data
    ) {
      normalizer.setQuery(event.query.queryKey.join(','), event.action.data);
    }
  });

  reactQueryConfig.mutationCache.subscribe(event => {
    if (
      event.type === 'updated' &&
      event.action.type === 'success' &&
      event.action.data
    ) {
      const queriesToUpdate = normalizer.getQueriesToUpdate(event.action.data);

      queriesToUpdate.forEach(query => {
        queryClient.setQueryData(query.queryKey.split(','), () => query.data);
      });
    } else if (
      event.type === 'updated' &&
      event.action.type === 'loading' &&
      event.mutation.state &&
      event.mutation.state.context &&
      event.mutation.state.context.optimisticData
    ) {
      const queriesToUpdate = normalizer.getQueriesToUpdate(
        event.mutation.state.context.optimisticData,
      );

      queriesToUpdate.forEach(query => {
        queryClient.setQueryData(query.queryKey.split(','), () => query.data);
      });
    } else if (
      event.type === 'updated' &&
      event.action.type === 'error' &&
      event.mutation.state &&
      event.mutation.state.context &&
      event.mutation.state.context.rollbackData
    ) {
      const queriesToUpdate = normalizer.getQueriesToUpdate(
        event.mutation.state.context.rollbackData,
      );

      queriesToUpdate.forEach(query => {
        queryClient.setQueryData(query.queryKey.split(','), () => query.data);
      });
    }
  });

  const queryClient = new QueryClient(reactQueryConfig);

  return queryClient;
};
