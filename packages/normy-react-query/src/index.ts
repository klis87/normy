import {
  QueryClient,
  QueryClientConfig,
  QueryKey,
} from '@tanstack/react-query';
import { createNormalizer, NormalizerConfig, Data } from '@normy/core';

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

  const queryClient = new QueryClient(reactQueryConfig);

  queryClient.getQueryCache().subscribe(event => {
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
        event.action.data as Data,
      );
    }
  });

  queryClient.getMutationCache().subscribe(event => {
    if (
      event.type === 'updated' &&
      event.action.type === 'success' &&
      event.action.data &&
      shouldBeNormalized(
        normalize,
        event.mutation.meta?.normalize as boolean | undefined,
      )
    ) {
      const queriesToUpdate = normalizer.getQueriesToUpdate(
        event.action.data as Data,
      );

      queriesToUpdate.forEach(query => {
        queryClient.setQueryData(
          JSON.parse(query.queryKey) as QueryKey,
          () => query.data,
        );
      });
    } else if (
      event.type === 'updated' &&
      event.action.type === 'loading' &&
      (event.mutation.state?.context as { optimisticData?: Data })
        ?.optimisticData
    ) {
      const queriesToUpdate = normalizer.getQueriesToUpdate(
        (event.mutation.state.context as { optimisticData: Data })
          .optimisticData,
      );

      queriesToUpdate.forEach(query => {
        queryClient.setQueryData(
          JSON.parse(query.queryKey) as QueryKey,
          () => query.data,
        );
      });
    } else if (
      event.type === 'updated' &&
      event.action.type === 'error' &&
      (event.mutation.state?.context as { rollbackData?: Data })?.rollbackData
    ) {
      const queriesToUpdate = normalizer.getQueriesToUpdate(
        (event.mutation.state.context as { rollbackData: Data }).rollbackData,
      );

      queriesToUpdate.forEach(query => {
        queryClient.setQueryData(
          JSON.parse(query.queryKey) as QueryKey,
          () => query.data,
        );
      });
    }
  });

  return Object.assign(queryClient, {
    getNormalizedData: () => normalizer.getNormalizedData(),
  });
};
