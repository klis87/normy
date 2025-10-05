import { NormalizedData } from './types';

export const getQueriesDependentOnMutation = (
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

export const getQueriesDependentOnArrayOperations = (
  queriesWithArrays: NormalizedData['queriesWithArrays'],
  mutationDependencies: ReadonlyArray<string>,
): ReadonlyArray<string> => {
  const queries: string[] = [];

  mutationDependencies.forEach(dependency => {
    if (queriesWithArrays[dependency]) {
      queries.push(...queriesWithArrays[dependency]);
    }
  });

  return Array.from(new Set(queries));
};
