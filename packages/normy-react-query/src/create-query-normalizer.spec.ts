import { MutationObserver, QueryClient } from '@tanstack/react-query';

import { createQueryNormalizer } from './create-query-normalizer';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

  it('does not update normalizedData after a successful query when global normalize option is false', async () => {
    const client = new QueryClient();
    const normalizer = createQueryNormalizer(client, { normalize: false });
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
      queries: {},
      dependentQueries: {},
      objects: {},
    });
  });

  it('does not update normalizedData after a successful query when query normalize option is false', async () => {
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
      meta: {
        normalize: false,
      },
    });

    expect(normalizer.getNormalizedData()).toEqual({
      queries: {},
      dependentQueries: {},
      objects: {},
    });
  });

  it('updates normalizedData after a successful query when global normalize is false but query explicitly true', async () => {
    const client = new QueryClient();
    const normalizer = createQueryNormalizer(client, { normalize: false });
    normalizer.subscribe();

    await client.prefetchQuery({
      queryKey: ['book'],
      queryFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name',
        }),
      meta: { normalize: true },
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

  it('clears query', async () => {
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
      gcTime: 10,
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

    await sleep(10);

    expect(normalizer.getNormalizedData()).toEqual({
      queries: {},
      dependentQueries: {},
      objects: {},
    });
  });

  it('updates normalizedData after a successful mutation', async () => {
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

    const mutationObserver = new MutationObserver(client, {
      mutationFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name updated',
        }),
    });

    await mutationObserver.mutate();

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
          name: 'Name updated',
        },
      },
    });
  });

  it('does not update normalizedData after a successful mutation with meta normalize as false', async () => {
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

    const mutationObserver = new MutationObserver(client, {
      mutationFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name updated',
        }),
      meta: {
        normalize: false,
      },
    });

    await mutationObserver.mutate();

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

  it('updates normalizedData after an optimistic update', async () => {
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
          name: 'Name updated',
        },
      },
    });
  });

  it('reverts normalizedData after error of an optimistic update', async () => {
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
          name: 'Name updated',
        },
      },
    });

    await mutation;

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
          name: 'Name reverted',
        },
      },
    });
  });

  it('clears data and unsubscribes from updates', async () => {
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

    normalizer.clear();
    normalizer.unsubscribe();

    await client.prefetchQuery({
      queryKey: ['book'],
      queryFn: () =>
        Promise.resolve({
          id: '2',
          name: 'Name 2',
        }),
    });

    expect(normalizer.getNormalizedData()).toEqual({
      queries: {},
      dependentQueries: {},
      objects: {},
    });
  });

  it('updates queries and normalizedData after setNormalizedData', async () => {
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

    normalizer.setNormalizedData({
      id: '1',
      name: 'Name updated',
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
          name: 'Name updated',
        },
      },
    });

    expect(client.getQueryData(['book'])).toEqual({
      id: '1',
      name: 'Name updated',
    });
  });

  it('updates normalizedData after a successful query that loads data from initialData', async () => {
    const client = new QueryClient();
    const normalizer = createQueryNormalizer(client);
    normalizer.subscribe();

    await client.prefetchQuery({
      queryKey: ['book'],
      staleTime: 10_000,
      queryFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name',
        }),
      initialData: () => ({
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

  it('keeps relevant query state on queries after setNormalizedData', async () => {
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

    // Set error state on the query.
    await client.prefetchQuery({
      queryKey: ['book'],
      queryFn: () => {
        throw new Error('Failed to fetch');
      },
    });

    // Set isInvalidated on the query.
    client.invalidateQueries({ queryKey: ['book'] });

    let state1 = client.getQueryCache().find({ queryKey: ['book'] })?.state;

    let dataUpdatedAt1 = state1?.dataUpdatedAt;
    let isInvalidated1 = state1?.isInvalidated;
    let error1 = state1?.error;
    let status1 = state1?.status;

    await sleep(1);

    normalizer.setNormalizedData({
      id: '1',
      name: 'Name updated',
    });

    let state2 = client.getQueryCache().find({ queryKey: ['book'] })?.state;

    let dataUpdatedAt2 = state2?.dataUpdatedAt;
    let isInvalidated2 = state2?.isInvalidated;
    let error2 = state2?.error;
    let status2 = state2?.status;

    expect(dataUpdatedAt1).toEqual(dataUpdatedAt2);
    expect(isInvalidated1).toEqual(isInvalidated2);
    expect(error1).toEqual(error2);
    expect(status1).toEqual(status2);
  });
});
