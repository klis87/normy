export type NormalizerConfig = {
  getNormalisationObjectKey?: (obj: any) => string;
  shouldObjectBeNormalized?: (obj: any) => boolean;
};

export const createNormalizer: (
  normalizerConfig?: NormalizerConfig,
) => {
  getNormalizedData: () => {
    queries: any;
    objects: any;
    dependentQueries: any;
  };
  onQuerySuccess: (queryKey: string, queryData: any) => void;
  onMutationSuccess: (
    mutationData: any,
    callback: (
      queriesToUpdate: ReadonlyArray<{ queryKey: string; data: any }>,
    ) => void,
  ) => void;
  onQueryRemoval: (queryKey: string) => void;
};
