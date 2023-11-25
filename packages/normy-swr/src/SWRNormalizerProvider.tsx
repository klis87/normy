import * as React from 'react';
import { NormalizerConfig, createNormalizer, Data } from '@normy/core';

const createSwrNormalizer = (
  normalizerConfig: NormalizerConfig & {
    normalize?: (queryKey: string) => boolean;
  } = {},
) => {
  const normalizer = createNormalizer(normalizerConfig);

  return { ...normalizer, normalize: normalizerConfig.normalize };
};

const SWRNormalizerContext = React.createContext<
  undefined | ReturnType<typeof createSwrNormalizer>
>(undefined);

class CacheMap extends Map {
  normalizer: ReturnType<typeof createSwrNormalizer> | undefined;

  addNormalizer(normalizer: ReturnType<typeof createSwrNormalizer>) {
    this.normalizer = normalizer;
  }

  get(key: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return super.get(key);
  }

  set(key: string, value: { data?: Data }) {
    if (value.data && (this.normalizer?.normalize?.(key) ?? true)) {
      this.normalizer?.setQuery(key, value.data);
    }

    return super.set(key, value);
  }

  delete(key: string) {
    this.normalizer?.removeQuery(key);
    const exists = !!super.get(key);
    super.delete(key);
    return exists;
  }
}

export const SWRNormalizerProvider = ({
  normalizerConfig,
  children,
}: {
  normalizerConfig?: NormalizerConfig & {
    normalize: (queryKey: string) => boolean;
  };
  children: (cacheProvider: () => CacheMap) => React.ReactNode;
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
    <SWRNormalizerContext.Provider value={swrNormalizer}>
      {children(cacheProvider)}
    </SWRNormalizerContext.Provider>
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
