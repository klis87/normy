import {
  QueryClient,
  QueryCache,
  MutationCache,
  QueryClientConfig,
} from '@tanstack/react-query';
import { createNormalizer, NormalizerConfig } from '@normy/core';

export const createNormalizedQueryClient = (
  reactQueryConfig: QueryClientConfig,
  normalizerConfig: NormalizerConfig,
) => {
  const normalizer = createNormalizer(normalizerConfig);

  const config = {
    ...reactQueryConfig,
    queryCache: reactQueryConfig.queryCache ?? new QueryCache(),
    mutationCache: reactQueryConfig.mutationCache ?? new MutationCache(),
  };

  config.queryCache.subscribe(event => {
    if (event.type === 'removed') {
      normalizer.removeQuery(event.query.queryKey.join(','));
    } else if (
      event.type === 'updated' &&
      event.action.type === 'success' &&
      event.action.data !== undefined &&
      (event.query.meta ?? {}).normalize !== false
    ) {
      normalizer.setQuery(event.query.queryKey.join(','), event.action.data);
    }
  });

  config.mutationCache.subscribe(event => {
    if (
      event.type === 'updated' &&
      event.action.type === 'success' &&
      event.action.data &&
      (event.mutation.meta ?? {}).normalize !== false
    ) {
      const queriesToUpdate = normalizer.getQueriesToUpdate(event.action.data);

      queriesToUpdate.forEach(query => {
        // eslint-disable-next-line no-use-before-define
        queryClient.setQueryData(query.queryKey.split(','), () => query.data);
      });
    } else if (
      event.type === 'updated' &&
      event.action.type === 'loading' &&
      event.mutation.state?.context?.optimisticData
    ) {
      const queriesToUpdate = normalizer.getQueriesToUpdate(
        event.mutation.state.context.optimisticData,
      );

      queriesToUpdate.forEach(query => {
        // eslint-disable-next-line no-use-before-define
        queryClient.setQueryData(query.queryKey.split(','), () => query.data);
      });
    } else if (
      event.type === 'updated' &&
      event.action.type === 'error' &&
      event.mutation.state?.context?.rollbackData
    ) {
      const queriesToUpdate = normalizer.getQueriesToUpdate(
        event.mutation.state.context.rollbackData,
      );

      queriesToUpdate.forEach(query => {
        // eslint-disable-next-line no-use-before-define
        queryClient.setQueryData(query.queryKey.split(','), () => query.data);
      });
    }
  });

  const queryClient = new QueryClient(config);

  return queryClient;
};
