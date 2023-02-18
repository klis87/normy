import { normalize } from './normalize';
import { denormalize } from './denormalize';
import { mergeData } from './merge-data';
import { defaultConfig } from './default-config';
import { Data, DataObject, NormalizerConfig, UsedKeys } from './types';

type NormalizedData = {
  queries: {
    [queryKey: string]: {
      data: Data;
      dependencies: ReadonlyArray<string>;
      usedKeys: UsedKeys;
    };
  };
  objects: { [objectId: string]: DataObject };
  dependentQueries: { [objectId: string]: ReadonlyArray<string> };
};

const addOrRemoveDependencies = (
  dependentQueries: NormalizedData['dependentQueries'],
  objects: NormalizedData['objects'],
  queryKey: string,
  dependenciesToAdd: ReadonlyArray<string>,
  dependenciesToRemove: ReadonlyArray<string>,
) => {
  dependentQueries = { ...dependentQueries };
  objects = { ...objects };

  dependenciesToAdd.forEach(dependency => {
    if (!dependentQueries[dependency]) {
      dependentQueries[dependency] = [queryKey];
    }

    if (!dependentQueries[dependency].includes(queryKey)) {
      dependentQueries[dependency] = [
        ...dependentQueries[dependency],
        queryKey,
      ];
    }
  });

  dependenciesToRemove.forEach(dependency => {
    if (dependentQueries[dependency].length > 1) {
      dependentQueries[dependency] = dependentQueries[dependency].filter(
        v => v !== queryKey,
      );
    } else {
      delete dependentQueries[dependency];
      delete objects[dependency];
    }
  });

  return { dependentQueries, objects };
};

const getQueriesDependentOnMutation = (
  dependentQueries: NormalizedData['dependentQueries'],
  mutationDependencies: ReadonlyArray<string>,
): ReadonlyArray<string> => {
  const queries: string[] = [];

  mutationDependencies.forEach(dependency => {
    if (dependentQueries[dependency]) {
      queries.push(...dependentQueries[dependency]);
    }
  });

  return Array.from(new Set(queries));
};

const getDependenciesDiff = (
  oldDependencies: ReadonlyArray<string>,
  newDependencies: ReadonlyArray<string>,
) => ({
  addedDependencies: newDependencies.filter(
    newDependency => !oldDependencies.includes(newDependency),
  ),
  removedDependencies: oldDependencies.filter(
    oldDependency => !newDependencies.includes(oldDependency),
  ),
});

export const createNormalizer = (normalizerConfig: NormalizerConfig) => {
  const config = { ...defaultConfig, ...normalizerConfig };

  let normalizedData: NormalizedData = {
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

    console.log('onQuerySuccess', queryKey, queryData, normalizedData);
  };

  const removeQuery = (queryKey: string) => {
    setQuery(queryKey, null);

    const queries = { ...normalizedData.queries };
    delete queries[queryKey];

    normalizedData = {
      ...normalizedData,
      queries,
    };

    console.log('onQueryRemoval', queryKey, normalizedData);
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
