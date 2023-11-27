import * as React from 'react';
import { NormalizerConfig, createNormalizer, Data } from '@normy/core';
import { useSWRConfig, SWRConfig } from 'swr';

const createSwrNormalizer = (
  normalizerConfig: NormalizerConfig & {
    normalize?: (queryKey: string) => boolean;
  } = {},
) => {
  const normalizer = createNormalizer(normalizerConfig);
  // we solve chicken egg problem this way, we need normalizer to create swr context, and we cannot have mutate before it is created
  let mutate: ReturnType<typeof useSWRConfig>['mutate'] | null = null;

  return {
    ...normalizer,
    addMutate: (mutateCallback: ReturnType<typeof useSWRConfig>['mutate']) => {
      mutate = mutateCallback;
    },
    normalize: normalizerConfig.normalize,
    setNormalizedData: (data: Data) => {
      const queriesToUpdate = normalizer.getQueriesToUpdate(data);

      queriesToUpdate.forEach(query => {
        void mutate?.(query.queryKey, query.data, {
          revalidate: false,
        });
      });
    },
  };
};

const SWRNormalizerContext = React.createContext<
  undefined | ReturnType<typeof createSwrNormalizer>
>(undefined);

class CacheMap extends Map {
  normalizer: ReturnType<typeof createSwrNormalizer> | undefined;

  addNormalizer(normalizer: ReturnType<typeof createSwrNormalizer>) {
    this.normalizer = normalizer;
  }

  set(key: string, value: { data?: Data }) {
    if (value.data && (this.normalizer?.normalize?.(key) ?? true)) {
      this.normalizer?.setQuery(key, value.data);
    }

    return super.set(key, value);
  }

  delete(key: string) {
    this.normalizer?.removeQuery(key);
    return super.delete(key);
  }
}

const SWRNormalizerProviderInternal = ({
  swrNormalizer,
  children,
}: {
  swrNormalizer: ReturnType<typeof createSwrNormalizer>;
  children: React.ReactNode;
}) => {
  const { mutate } = useSWRConfig();

  React.useEffect(() => swrNormalizer.addMutate(mutate), []);

  return (
    <SWRNormalizerContext.Provider value={swrNormalizer}>
      {children}
    </SWRNormalizerContext.Provider>
  );
};

export const SWRNormalizerProvider = ({
  normalizerConfig,
  swrConfigValue,
  children,
}: {
  normalizerConfig?: NormalizerConfig & {
    normalize: (queryKey: string) => boolean;
  };
  swrConfigValue: React.ComponentProps<typeof SWRConfig>['value'];
  children: React.ReactNode;
}) => {
  const [swrNormalizer] = React.useState(() =>
    createSwrNormalizer(normalizerConfig),
  );

  const [cacheProvider] = React.useState(() => () => {
    const map = new CacheMap();
    map.addNormalizer(swrNormalizer);
    return map;
  });

  React.useEffect(() => () => swrNormalizer.clearNormalizedData(), []);

  return (
    <SWRConfig
      value={{
        ...swrConfigValue,
        provider: cacheProvider,
      }}
    >
      <SWRNormalizerProviderInternal swrNormalizer={swrNormalizer}>
        {children}
      </SWRNormalizerProviderInternal>
    </SWRConfig>
  );
};

export const useSWRNormalizer = () => {
  const swrNormalizer = React.useContext(SWRNormalizerContext);

  if (!swrNormalizer) {
    throw new Error(
      'No SWRNormalizer set, use SWRNormalizerProvider to set one',
    );
  }

  return swrNormalizer;
};
