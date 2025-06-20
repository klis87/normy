import {
  createNormalizer,
  type Data,
  type NormalizerConfig,
} from '@normy/core';
import type { QueryClient, QueryKey } from '@tanstack/query-core';

const shouldBeNormalized = (
  globalNormalize: boolean,
  localNormalize: boolean | undefined,
) => {
  if (localNormalize === undefined) {
    return globalNormalize;
  }

  return localNormalize;
};

const updateQueriesFromMutationData = (
  mutationData: Data,
  normalizer: ReturnType<typeof createNormalizer>,
  queryClient: QueryClient,
) => {
  const queriesToUpdate = normalizer.getQueriesToUpdate(mutationData);

  queriesToUpdate.forEach(query => {
    const queryKey = JSON.parse(query.queryKey) as QueryKey;
    const cachedQuery = queryClient.getQueryCache().find({ queryKey });

    // react-query resets some state when setQueryData() is called.
    // We'll remember and reapply state that shouldn't
    // be reset when a query is updated via Normy.

    // dataUpdatedAt and isInvalidated determine if a query is stale or not,
    // and we only want data updates from the network to change it.
    const dataUpdatedAt = cachedQuery?.state.dataUpdatedAt;
    const isInvalidated = cachedQuery?.state.isInvalidated;
    const error = cachedQuery?.state.error;
    const status = cachedQuery?.state.status;

    queryClient.setQueryData(queryKey, () => query.data, {
      updatedAt: dataUpdatedAt,
    });

    cachedQuery?.setState({ isInvalidated, error, status });
  });
};

export const createQueryNormalizer = (
  queryClient: QueryClient,
  normalizerConfig: Omit<NormalizerConfig, 'structuralSharing'> & {
    normalize?: boolean;
  } = {},
) => {
  const normalize = normalizerConfig.normalize ?? true;
  const normalizer = createNormalizer(normalizerConfig);

  let unsubscribeQueryCache: null | (() => void) = null;
  let unsubscribeMutationCache: null | (() => void) = null;

  return {
    getNormalizedData: normalizer.getNormalizedData,
    setNormalizedData: (data: Data) =>
      updateQueriesFromMutationData(data, normalizer, queryClient),
    clear: normalizer.clearNormalizedData,
    subscribe: () => {
      unsubscribeQueryCache = queryClient.getQueryCache().subscribe(event => {
        if (event.type === 'removed') {
          normalizer.removeQuery(JSON.stringify(event.query.queryKey));
        } else if (
          event.type === 'added' &&
          event.query.state.data !== undefined &&
          shouldBeNormalized(normalize, event.query.meta?.normalize)
        ) {
          normalizer.setQuery(
            JSON.stringify(event.query.queryKey),
            event.query.state.data as Data,
          );
        } else if (
          event.type === 'updated' &&
          event.action.type === 'success' &&
          event.action.data !== undefined &&
          shouldBeNormalized(normalize, event.query.meta?.normalize)
        ) {
          normalizer.setQuery(
            JSON.stringify(event.query.queryKey),
            event.action.data as Data,
          );
        }
      });

      unsubscribeMutationCache = queryClient
        .getMutationCache()
        .subscribe(event => {
          if (
            event.type === 'updated' &&
            event.action.type === 'success' &&
            event.action.data &&
            shouldBeNormalized(normalize, event.mutation.meta?.normalize)
          ) {
            updateQueriesFromMutationData(
              event.action.data as Data,
              normalizer,
              queryClient,
            );
          } else if (
            event.type === 'updated' &&
            event.action.type === 'pending' &&
            (event.mutation.state?.context as { optimisticData?: Data })
              ?.optimisticData
          ) {
            const context = event.mutation.state.context as {
              optimisticData: Data;
              rollbackData?: Data;
            };

            if (!context.rollbackData) {
              const rollbackDataToInject = normalizer.getCurrentData(
                context.optimisticData,
              );

              normalizer.log(
                'calculated automatically rollbackData:',
                rollbackDataToInject,
              );
              context.rollbackData = rollbackDataToInject;
            }

            updateQueriesFromMutationData(
              context.optimisticData,
              normalizer,
              queryClient,
            );
          } else if (
            event.type === 'updated' &&
            event.action.type === 'error' &&
            (event.mutation.state?.context as { rollbackData?: Data })
              ?.rollbackData
          ) {
            updateQueriesFromMutationData(
              (event.mutation.state.context as { rollbackData: Data })
                .rollbackData,
              normalizer,
              queryClient,
            );
          }
        });
    },
    unsubscribe: () => {
      unsubscribeQueryCache?.();
      unsubscribeMutationCache?.();
      unsubscribeQueryCache = null;
      unsubscribeMutationCache = null;
    },
    getObjectById: normalizer.getObjectById,
    getQueryFragment: normalizer.getQueryFragment,
    getDependentQueries: (mutationData: Data) =>
      normalizer
        .getDependentQueries(mutationData)
        .map(key => JSON.parse(key) as QueryKey),
    getDependentQueriesByIds: (ids: ReadonlyArray<string>) =>
      normalizer
        .getDependentQueriesByIds(ids)
        .map(key => JSON.parse(key) as QueryKey),
  };
};
