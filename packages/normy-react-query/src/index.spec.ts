import { MutationObserver } from '@tanstack/react-query';

import { createNormalizedQueryClient } from '.';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('createNormalizedQueryClient', () => {
  it('has correct default state', () => {
    const client = createNormalizedQueryClient();

    expect(client.getNormalizedData()).toEqual({
      queries: {},
      dependentQueries: {},
      objects: {},
    });
  });

  it('updates normalizedData after a successful query', async () => {
    const client = createNormalizedQueryClient();

    void client.prefetchQuery({
      queryKey: ['book'],
      queryFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name',
        }),
    });

    await sleep(100);

    expect(client.getNormalizedData()).toEqual({
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

  it('does not update normalizedData after a successful query when global normalize option is false', async () => {
    const client = createNormalizedQueryClient({}, { normalize: false });

    void client.prefetchQuery({
      queryKey: ['book'],
      queryFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name',
        }),
    });

    await sleep(100);

    expect(client.getNormalizedData()).toEqual({
      queries: {},
      dependentQueries: {},
      objects: {},
    });
  });

  it('does not update normalizedData after a successful query when query normalize option is false', async () => {
    const client = createNormalizedQueryClient();

    void client.prefetchQuery({
      queryKey: ['book'],
      queryFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name',
        }),
      meta: {
        normalize: false,
      },
    });

    await sleep(100);

    expect(client.getNormalizedData()).toEqual({
      queries: {},
      dependentQueries: {},
      objects: {},
    });
  });

  it('updates normalizedData after a successful query when global normalize is false but query explicitly true', async () => {
    const client = createNormalizedQueryClient({}, { normalize: false });

    void client.prefetchQuery({
      queryKey: ['book'],
      queryFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name',
        }),
      meta: { normalize: true },
    });

    await sleep(100);

    expect(client.getNormalizedData()).toEqual({
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

  it('clears query', async () => {
    const client = createNormalizedQueryClient();

    void client.prefetchQuery({
      queryKey: ['book'],
      queryFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name',
        }),
      cacheTime: 150,
      staleTime: 150,
    });

    await sleep(100);

    expect(client.getNormalizedData()).toEqual({
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

    await sleep(100);

    expect(client.getNormalizedData()).toEqual({
      queries: {},
      dependentQueries: {},
      objects: {},
    });
  });

  it('updates normalizedData after a successful mutation', async () => {
    const client = createNormalizedQueryClient();

    void client.prefetchQuery({
      queryKey: ['book'],
      queryFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name',
        }),
    });

    await sleep(100);

    const mutationObserver = new MutationObserver(client, {
      mutationFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name updated',
        }),
    });

    void mutationObserver.mutate();

    await sleep(100);

    expect(client.getNormalizedData()).toEqual({
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
          name: 'Name updated',
        },
      },
    });
  });

  it('updates normalizedData after an optimistic update', async () => {
    const client = createNormalizedQueryClient();

    void client.prefetchQuery({
      queryKey: ['book'],
      queryFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name',
        }),
    });

    await sleep(100);

    const mutationObserver = new MutationObserver(client, {
      mutationFn: () => Promise.resolve(null),
      onMutate: () => ({
        optimisticData: {
          id: '1',
          name: 'Name updated',
        },
      }),
    });

    void mutationObserver.mutate();

    await sleep(100);

    expect(client.getNormalizedData()).toEqual({
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
          name: 'Name updated',
        },
      },
    });
  });

  it('reverts normalizedData after error of an optimistic update', async () => {
    const client = createNormalizedQueryClient({ logger: undefined });

    void client.prefetchQuery({
      queryKey: ['book'],
      queryFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name',
        }),
    });

    await sleep(100);

    const mutationObserver = new MutationObserver(client, {
      mutationFn: async () => {
        await sleep(100);
        return Promise.reject({ error: true });
      },
      onMutate: () => ({
        optimisticData: {
          id: '1',
          name: 'Name updated',
        },
        rollbackData: {
          id: '1',
          name: 'Name reverted',
        },
      }),
    });

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    mutationObserver.mutate().catch(() => {});

    await sleep(1);

    expect(client.getNormalizedData()).toEqual({
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
          name: 'Name updated',
        },
      },
    });

    await sleep(150);

    expect(client.getNormalizedData()).toEqual({
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
          name: 'Name reverted',
        },
      },
    });
  });
});
