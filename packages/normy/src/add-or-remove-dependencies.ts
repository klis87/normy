import { NormalizedData } from './types';

export const addOrRemoveDependencies = (
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

export const addOrRemoveQueriesWithArrays = (
  queriesWithArrays: NormalizedData['queriesWithArrays'],
  queryKey: string,
  arrayTypesToAdd: ReadonlyArray<string>,
  arrayTypesToRemove: ReadonlyArray<string>,
) => {
  queriesWithArrays = { ...queriesWithArrays };

  arrayTypesToAdd.forEach(dependency => {
    if (!queriesWithArrays[dependency]) {
      queriesWithArrays[dependency] = [queryKey];
    }

    if (!queriesWithArrays[dependency].includes(queryKey)) {
      queriesWithArrays[dependency] = [
        ...queriesWithArrays[dependency],
        queryKey,
      ];
    }
  });

  arrayTypesToRemove.forEach(dependency => {
    if (queriesWithArrays[dependency].length > 1) {
      queriesWithArrays[dependency] = queriesWithArrays[dependency].filter(
        v => v !== queryKey,
      );
    } else {
      delete queriesWithArrays[dependency];
    }
  });

  return { queriesWithArrays };
};
