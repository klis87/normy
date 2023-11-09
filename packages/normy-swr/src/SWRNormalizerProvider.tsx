import * as React from 'react';
import { NormalizerConfig, createNormalizer, Data } from '@normy/core';

const SWRNormalizerContext = React.createContext<
  undefined | ReturnType<typeof createNormalizer>
>(undefined);

class CacheMap extends Map {
  normalizer: ReturnType<typeof createNormalizer> | undefined;

  addNormalizer(normalizer: ReturnType<typeof createNormalizer>) {
    this.normalizer = normalizer;
  }

  get(key: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return super.get(key);
  }

  set(key: string, value: { data?: Data }) {
    // console.log('set', key, value);
    if (value.data) {
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
  children: (cacheProvider: () => CacheMap) => React.ReactNode;
  normalizerConfig?: NormalizerConfig;
}) => {
  const [normalizer] = React.useState(() => createNormalizer(normalizerConfig));
  const [cacheProvider] = React.useState(() => () => {
    const map = new CacheMap();
    map.addNormalizer(normalizer);
    return map;
  });

  React.useEffect(() => () => normalizer.clearNormalizedData(), []);

  return (
    <SWRNormalizerContext.Provider value={normalizer}>
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
