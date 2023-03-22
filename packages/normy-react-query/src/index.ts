import {
  QueryClient,
  QueryCache,
  MutationCache,
  QueryClientConfig,
} from '@tanstack/react-query';
import { createNormalizer, NormalizerConfig } from '@normy/core';

const shouldBeNormalized = (
  globalNormalize: boolean,
  localNormalize: boolean | undefined,
) => {
  if (localNormalize === undefined) {
    return globalNormalize;
  }

  return localNormalize;
};

export const createNormalizedQueryClient = (
  reactQueryConfig: QueryClientConfig = {},
  normalizerConfig: NormalizerConfig & { normalize?: boolean } = {},
) => {
  const normalize = normalizerConfig.normalize ?? true;
  const normalizer = createNormalizer(normalizerConfig);

  const config = {
    ...reactQueryConfig,
    queryCache: reactQueryConfig.queryCache ?? new QueryCache(),
    mutationCache: reactQueryConfig.mutationCache ?? new MutationCache(),
  };

  config.queryCache.subscribe(event => {
    if (event.type === 'removed') {
      normalizer.removeQuery(JSON.stringify(event.query.queryKey));
    } else if (
      event.type === 'updated' &&
      event.action.type === 'success' &&
      event.action.data !== undefined &&
      shouldBeNormalized(
        normalize,
        event.query.meta?.normalize as boolean | undefined,
      )
    ) {
      normalizer.setQuery(
        JSON.stringify(event.query.queryKey),
        event.action.data,
      );
    }
  });

  config.mutationCache.subscribe(event => {
    if (
      event.type === 'updated' &&
      event.action.type === 'success' &&
      event.action.data &&
      shouldBeNormalized(
        normalize,
        event.mutation.meta?.normalize as boolean | undefined,
      )
    ) {
      const queriesToUpdate = normalizer.getQueriesToUpdate(event.action.data);

      queriesToUpdate.forEach(query => {
        // eslint-disable-next-line no-use-before-define
        queryClient.setQueryData(JSON.parse(query.queryKey), () => query.data);
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
        queryClient.setQueryData(JSON.parse(query.queryKey), () => query.data);
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
        queryClient.setQueryData(JSON.parse(query.queryKey), () => query.data);
      });
    }
  });

  const queryClient = new QueryClient(config);

  return Object.assign(queryClient, {
    getNormalizedData: () => normalizer.getNormalizedData(),
  });
};
