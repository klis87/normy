import { normalize } from './normalize';
import { denormalize } from './denormalize';
import { mergeData } from './merge-data';
import { defaultConfig } from './default-config';
import { addOrRemoveDependencies } from './add-or-remove-dependencies';
import { getQueriesDependentOnMutation } from './get-queries-dependent-on-mutation';
import { getDependenciesDiff } from './get-dependencies-diff';
import { warning } from './log';
import { Data, NormalizerConfig, NormalizedData } from './types';

export const createNormalizer = (
  normalizerConfig?: NormalizerConfig,
  initialNormalizedData?: NormalizedData,
) => {
  const config = { ...defaultConfig, ...normalizerConfig };

  let normalizedData: NormalizedData = initialNormalizedData ?? {
    queries: {},
    objects: {},
    dependentQueries: {},
  };

  const setQuery = (queryKey: string, queryData: Data) => {
    const [normalizedQueryData, normalizedObjectsData, usedKeys] = normalize(
      queryData,
      config,
    );

    const { addedDependencies, removedDependencies } = getDependenciesDiff(
      normalizedData.queries[queryKey]
        ? normalizedData.queries[queryKey].dependencies
        : [],
      Object.keys(normalizedObjectsData),
    );

    normalizedData = {
      queries: {
        ...normalizedData.queries,
        [queryKey]: {
          data: normalizedQueryData,
          usedKeys,
          dependencies: Object.keys(normalizedObjectsData),
        },
      },
      ...addOrRemoveDependencies(
        normalizedData.dependentQueries,
        mergeData(normalizedData.objects, normalizedObjectsData),
        queryKey,
        addedDependencies,
        removedDependencies,
      ),
    };

    warning(
      config.devLogging,
      'set query:',
      queryKey,
      '\nwith data:',
      queryData,
      '\nnormalizedData:',
      normalizedData,
    );
  };

  const removeQuery = (queryKey: string) => {
    setQuery(queryKey, null);

    const queries = { ...normalizedData.queries };
    delete queries[queryKey];

    normalizedData = {
      ...normalizedData,
      queries,
    };

    warning(
      config.devLogging,
      'removed query:',
      queryKey,
      '\nnormalizedData:',
      normalizedData,
    );
  };

  const getQueriesToUpdate = (mutationData: Data) => {
    const [, normalizedObjectsData] = normalize(mutationData, config);

    const normalizedDataWithMutation = mergeData(
      normalizedData.objects,
      normalizedObjectsData,
    );

    const foundQueries = getQueriesDependentOnMutation(
      normalizedData.dependentQueries,
      Object.keys(normalizedObjectsData),
    );

    return foundQueries.map(queryKey => ({
      queryKey,
      data: denormalize(
        normalizedData.queries[queryKey].data,
        normalizedDataWithMutation,
        normalizedData.queries[queryKey].usedKeys,
      ),
    }));
  };

  return {
    getNormalizedData: () => normalizedData,
    setQuery,
    removeQuery,
    getQueriesToUpdate,
  };
};
