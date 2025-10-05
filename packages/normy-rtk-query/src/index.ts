import { type Dispatch, type Middleware, isAction } from '@reduxjs/toolkit';
import type { createApi } from '@reduxjs/toolkit/query';
import {
  createNormalizer,
  type Data,
  type NormalizerConfig,
} from '@normy/core';

export { getId, arrayHelpers, createArrayHelpers } from '@normy/core';

type GetNormalizerAction = {
  type: 'getNormalization';
};

export const getNormalizer = (
  dispatch: Dispatch,
): ReturnType<typeof createNormalizer> =>
  dispatch({ type: 'getNormalization' }) as unknown as ReturnType<
    typeof createNormalizer
  >;

type QueryFulfilledAction = {
  type: 'api/executeQuery/fulfilled';
  payload: Data;
  meta: {
    arg: {
      queryCacheKey: string;
      originalArgs: unknown;
    };
  };
};

type QueryRemovedAction = {
  type: 'api/queries/removeQueryResult';
  payload: {
    queryCacheKey: string;
  };
};

type MutationFulfilledAction = {
  type: 'api/executeMutation/fulfilled';
  payload: Data;
  meta: {
    arg: {
      queryCacheKey: string;
      originalArgs: unknown;
      endpointName: string;
    };
  };
};

type QueryPatchedAction = {
  type: 'api/queries/queryResultPatched';
  payload: {
    queryCacheKey: string;
  };
};

type NormalizerAction =
  | GetNormalizerAction
  | QueryFulfilledAction
  | QueryRemovedAction
  | MutationFulfilledAction
  | QueryPatchedAction;

type ActionType = NormalizerAction['type'];

const allTypes: ReadonlyArray<ActionType> = [
  'api/executeMutation/fulfilled',
  'api/executeQuery/fulfilled',
  'api/queries/queryResultPatched',
  'api/queries/removeQueryResult',
  'getNormalization',
];

const isNormalizerAction = (action: unknown): action is NormalizerAction =>
  isAction(action) && (allTypes as ReadonlyArray<string>).includes(action.type);

export const createNormalizationMiddleware = (
  api: ReturnType<typeof createApi>,
  normalizerConfig?: Omit<NormalizerConfig, 'structuralSharing'> & {
    normalizeQuery?: (queryType: string) => boolean;
    normalizeMutation?: (mutationEndpointName: string) => boolean;
  },
): Middleware => {
  const normalizer = createNormalizer({
    ...normalizerConfig,
    // TODO: we wait for rtk-query maintainers to make this work
    structuralSharing: false,
  });

  const args: Record<string, unknown> = {};

  return store => next => action => {
    if (!isNormalizerAction(action)) {
      return next(action);
    }

    if (
      action.type === 'api/queries/queryResultPatched' &&
      (normalizerConfig?.normalizeQuery?.(action.payload.queryCacheKey) ?? true)
    ) {
      const response = next(action);

      normalizer.setQuery(
        action.payload.queryCacheKey,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        store.getState()[api.reducerPath].queries[action.payload.queryCacheKey]
          .data as Data,
      );

      return response;
    }

    if (action.type === 'getNormalization') {
      return {
        ...normalizer,
        setNormalizedData: (data: Data) => {
          const queriesToUpdate = normalizer.getQueriesToUpdate(data);

          queriesToUpdate.forEach(query => {
            const endpoint = query.queryKey.split('(')[0];

            store.dispatch(
              // @ts-expect-error this is generic api, which is not typed
              api.util.updateQueryData(
                // @ts-expect-error this is generic api, which is not typed
                endpoint,
                args[query.queryKey],
                () => query.data,
              ),
            );
          });
        },
      };
    }

    if (
      action.type === 'api/executeQuery/fulfilled' &&
      (normalizerConfig?.normalizeQuery?.(action.meta.arg.queryCacheKey) ??
        true)
    ) {
      normalizer.setQuery(action.meta.arg.queryCacheKey, action.payload);
      args[action.meta.arg.queryCacheKey] = action.meta.arg.originalArgs;
    } else if (action.type === 'api/queries/removeQueryResult') {
      normalizer.removeQuery(action.payload.queryCacheKey);
      delete args[action.payload.queryCacheKey];
    } else if (
      action.type === 'api/executeMutation/fulfilled' &&
      (normalizerConfig?.normalizeMutation?.(action.meta.arg.endpointName) ??
        true)
    ) {
      const queriesToUpdate = normalizer.getQueriesToUpdate(action.payload);

      queriesToUpdate.forEach(query => {
        const endpoint = query.queryKey.split('(')[0];

        store.dispatch(
          // @ts-expect-error ddd
          api.util.updateQueryData(
            // @ts-expect-error ddd
            endpoint,
            args[query.queryKey],
            () => query.data,
          ),
        );
      });
    }

    return next(action);
  };
};
