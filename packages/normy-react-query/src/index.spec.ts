import { createNormalizedQueryClient } from '.';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('createNormalizedQueryClient', () => {
  it('has correct default state', () => {
    const client = createNormalizedQueryClient({});

    expect(client.getNormalizedData()).toEqual({
      queries: {},
      dependentQueries: {},
      objects: {},
    });
  });

  it('updates normalizedData after a successful query', async () => {
    const client = createNormalizedQueryClient({});

    client.prefetchQuery({
      queryKey: ['book'],
      queryFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name ',
        }),
    });

    await sleep(100);

    expect(client.getNormalizedData()).toEqual({
      queries: {
        book: {
          data: '@@1',
          dependencies: ['@@1'],
          usedKeys: {
            '': ['id', 'name'],
          },
        },
      },
      dependentQueries: {
        '@@1': ['book'],
      },
      objects: {
        '@@1': {
          id: '1',
          name: 'Name ',
        },
      },
    });
  });

  it('clears query', async () => {
    const client = createNormalizedQueryClient(
      { defaultOptions: { queries: {} } },
      { devLogging: false },
    );

    client.prefetchQuery({
      queryKey: ['book'],
      queryFn: () =>
        Promise.resolve({
          id: '1',
          name: 'Name ',
        }),
      cacheTime: 150,
      staleTime: 150,
    });

    await sleep(100);

    expect(client.getNormalizedData()).toEqual({
      queries: {
        book: {
          data: '@@1',
          dependencies: ['@@1'],
          usedKeys: {
            '': ['id', 'name'],
          },
        },
      },
      dependentQueries: {
        '@@1': ['book'],
      },
      objects: {
        '@@1': {
          id: '1',
          name: 'Name ',
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
});
