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

    await client.prefetchQuery({
      queryKey: ['book'],
      queryFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name',
        }),
    });

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

    await client.prefetchQuery({
      queryKey: ['book'],
      queryFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name',
        }),
    });

    expect(client.getNormalizedData()).toEqual({
      queries: {},
      dependentQueries: {},
      objects: {},
    });
  });

  it('does not update normalizedData after a successful query when query normalize option is false', async () => {
    const client = createNormalizedQueryClient();

    await client.prefetchQuery({
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

    expect(client.getNormalizedData()).toEqual({
      queries: {},
      dependentQueries: {},
      objects: {},
    });
  });

  it('updates normalizedData after a successful query when global normalize is false but query explicitly true', async () => {
    const client = createNormalizedQueryClient({}, { normalize: false });

    await client.prefetchQuery({
      queryKey: ['book'],
      queryFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name',
        }),
      meta: { normalize: true },
    });

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

    await client.prefetchQuery({
      queryKey: ['book'],
      queryFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name',
        }),
      cacheTime: 10,
    });

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

    await sleep(10);

    expect(client.getNormalizedData()).toEqual({
      queries: {},
      dependentQueries: {},
      objects: {},
    });
  });

  it('updates normalizedData after a successful mutation', async () => {
    const client = createNormalizedQueryClient();

    await client.prefetchQuery({
      queryKey: ['book'],
      queryFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name',
        }),
    });

    const mutationObserver = new MutationObserver(client, {
      mutationFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name updated',
        }),
    });

    await mutationObserver.mutate();

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

    await client.prefetchQuery({
      queryKey: ['book'],
      queryFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name',
        }),
    });

    const mutationObserver = new MutationObserver(client, {
      mutationFn: () => Promise.resolve(null),
      onMutate: () => ({
        optimisticData: {
          id: '1',
          name: 'Name updated',
        },
      }),
    });

    await mutationObserver.mutate();

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

    await client.prefetchQuery({
      queryKey: ['book'],
      queryFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name',
        }),
    });

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
    const mutation = mutationObserver.mutate().catch(() => {});

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

    await mutation;

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
