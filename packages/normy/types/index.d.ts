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
  setQuery: (queryKey: string, queryData: any) => void;
  removeQuery: (queryKey: string) => void;
  getQueriesToUpdate: (
    mutationData: any,
  ) => ReadonlyArray<{ queryKey: string; data: any }>;
};
