import { normalize } from './normalize';
import { denormalize } from './denormalize';
import { mergeData } from './merge-data';
import { defaultConfig } from './default-config';
import { addOrRemoveDependencies } from './add-or-remove-dependencies';
import { getQueriesDependentOnMutation } from './get-queries-dependent-on-mutation';
import { getDependenciesDiff } from './get-dependencies-diff';
import { warning } from './warning';
import { Data, NormalizerConfig, NormalizedData, DataObject } from './types';

const initialData: NormalizedData = {
  queries: {},
  objects: {},
  dependentQueries: {},
};

const isMutationObjectDifferent = (
  mutationData: Data,
  normalizedData: Data,
): boolean => {
  if (Array.isArray(mutationData) && Array.isArray(normalizedData)) {
    if (mutationData.length === 0) {
      return normalizedData.length !== 0;
    }

    return mutationData.some((v, i) =>
      isMutationObjectDifferent(v, (normalizedData as Data[])[i]),
    );
  }

  if (mutationData instanceof Date && normalizedData instanceof Date) {
    return mutationData.getTime() !== normalizedData.getTime();
  }

  if (
    mutationData !== null &&
    typeof mutationData === 'object' &&
    normalizedData !== null &&
    typeof normalizedData === 'object'
  ) {
    return Object.entries(mutationData).some(
      ([key, value]) =>
        (normalizedData as DataObject)?.[key] !== undefined &&
        isMutationObjectDifferent(
          value as Data,
          (normalizedData as DataObject)[key],
        ),
    );
  }

  return mutationData !== normalizedData;
};

export const createNormalizer = (
  normalizerConfig?: NormalizerConfig,
  initialNormalizedData?: NormalizedData,
) => {
  const config = { ...defaultConfig, ...normalizerConfig };

  let normalizedData: NormalizedData = initialNormalizedData ?? initialData;

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

  const filterMutationObjects = (
    mutationObjects: DataObject,
    normalizedDataObjects: DataObject,
  ) => {
    const differentObjects: DataObject = {};

    for (const key in mutationObjects) {
      if (
        isMutationObjectDifferent(
          mutationObjects[key],
          normalizedDataObjects[key],
        )
      ) {
        differentObjects[key] = mutationObjects[key];
      }
    }

    return differentObjects;
  };

  const getQueriesToUpdate = (mutationData: Data) => {
    const [, normalizedObjectsData] = normalize(mutationData, config);

    const updatedObjects = filterMutationObjects(
      normalizedObjectsData,
      normalizedData.objects,
    );

    const normalizedDataWithMutation = mergeData(
      normalizedData.objects,
      updatedObjects,
    );

    const foundQueries = getQueriesDependentOnMutation(
      normalizedData.dependentQueries,
      Object.keys(updatedObjects),
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

  const getQueryFragment = <T extends Data>(
    fragment: Data,
    exampleObject?: T,
  ): T | undefined => {
    let usedKeys = {};

    if (exampleObject) {
      const [, , keys] = normalize(exampleObject, config);
      usedKeys = keys;
    }

    try {
      const response = denormalize(fragment, normalizedData.objects, usedKeys);
      return response as T;
    } catch (error) {
      if (error instanceof RangeError) {
        warning(
          true,
          'Recursive dependency detected. Pass example object as second argument.',
        );

        return undefined;
      }

      throw error;
    }
  };

  const getObjectById = <T extends Data>(
    id: string,
    exampleObject?: T,
  ): T | undefined => getQueryFragment(`@@${id}`, exampleObject);

  return {
    getNormalizedData: () => normalizedData,
    clearNormalizedData: () => {
      normalizedData = initialData;
    },
    setQuery,
    removeQuery,
    getQueriesToUpdate,
    getObjectById,
    getQueryFragment,
  };
};
