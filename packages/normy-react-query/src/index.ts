import {
  QueryClient,
  QueryKey,
  SetDataOptions,
  Updater,
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

const updateQueriesFromQueryData = (
  originalQueryKey: string,
  queryData: Data,
  normalizer: ReturnType<typeof createNormalizer>,
  queryClient: QueryClient,
) => {
  const queriesToUpdate = normalizer
    .getQueriesToUpdate(queryData)
    .filter(query => query.queryKey !== originalQueryKey);
  queriesToUpdate.forEach(query => {
    queryClient.setQueryData(
      JSON.parse(query.queryKey) as QueryKey,
      () => query.data,
    );
  });
};

const updateQueriesFromMutationData = (
  mutationData: Data,
  normalizer: ReturnType<typeof createNormalizer>,
  queryClient: QueryClient,
) => {
  const queriesToUpdate = normalizer.getQueriesToUpdate(mutationData);

  queriesToUpdate.forEach(query => {
    queryClient.setQueryData(
      JSON.parse(query.queryKey) as QueryKey,
      () => query.data,
    );
  });
};

export const createQueryNormalizer = (
  queryClient: QueryClient,
  normalizerConfig: NormalizerConfig & {
    normalize?: boolean;
  } = {},
) => {
  const normalize = normalizerConfig.normalize ?? true;
  const normalizer = createNormalizer(normalizerConfig);

  const unsubscribeQueryCache = queryClient.getQueryCache().subscribe(event => {
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
      const queryKey = JSON.stringify(event.query.queryKey);
      const data = event.action.data as Data;

      normalizer.setQuery(queryKey, data);

      if (!event.action.manual) {
        updateQueriesFromQueryData(queryKey, data, normalizer, queryClient);
      }
    }
  });

  const unsubscribeMutationCache = queryClient
    .getMutationCache()
    .subscribe(event => {
      if (
        event.type === 'updated' &&
        event.action.type === 'success' &&
        event.action.data &&
        shouldBeNormalized(
          normalize,
          event.mutation.meta?.normalize as boolean | undefined,
        )
      ) {
        updateQueriesFromMutationData(
          event.action.data as Data,
          normalizer,
          queryClient,
        );
      } else if (
        event.type === 'updated' &&
        event.action.type === 'loading' &&
        (event.mutation.state?.context as { optimisticData?: Data })
          ?.optimisticData
      ) {
        updateQueriesFromMutationData(
          (event.mutation.state.context as { optimisticData: Data })
            .optimisticData,
          normalizer,
          queryClient,
        );
      } else if (
        event.type === 'updated' &&
        event.action.type === 'error' &&
        (event.mutation.state?.context as { rollbackData?: Data })?.rollbackData
      ) {
        updateQueriesFromMutationData(
          (event.mutation.state.context as { rollbackData: Data }).rollbackData,
          normalizer,
          queryClient,
        );
      }
    });

  const setQueryData = <TQueryFnData>(
    queryKey: QueryKey,
    updater: Updater<TQueryFnData | undefined, TQueryFnData | undefined>,
    options?: SetDataOptions,
  ): TQueryFnData | undefined => {
    const data = queryClient.setQueryData(queryKey, updater, options);
    const queryKeyString = JSON.stringify(queryKey);

    updateQueriesFromQueryData(
      queryKeyString,
      data as Data,
      normalizer,
      queryClient,
    );

    return data;
  };

  return {
    getNormalizedData: normalizer.getNormalizedData,
    clear: () => {
      unsubscribeQueryCache();
      unsubscribeMutationCache();
      normalizer.clearNormalizedData();
    },
    setQueryData,
  };
};
