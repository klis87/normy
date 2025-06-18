import { QueryClient } from '@tanstack/vue-query';

import { createQueryNormalizer } from '.';

describe('createQueryNormalizer', () => {
  it('has correct default state', () => {
    const normalizer = createQueryNormalizer(new QueryClient());

    expect(normalizer.getNormalizedData()).toEqual({
      queries: {},
      dependentQueries: {},
      objects: {},
    });
  });

  it('updates normalizedData after a successful query', async () => {
    const client = new QueryClient();
    const normalizer = createQueryNormalizer(client);
    normalizer.subscribe();

    await client.prefetchQuery({
      queryKey: ['book'],
      queryFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name',
        }),
    });

    expect(normalizer.getNormalizedData()).toEqual({
      queries: {
        '["book"]': {
          data: '@@1',
          dependencies: ['@@1'],
          usedKeys: {
            '': ['id', 'name'],
          },
        },
      },
      dependentQueries: {
        '@@1': ['["book"]'],
      },
      objects: {
        '@@1': {
          id: '1',
          name: 'Name',
        },
      },
    });
  });
});
