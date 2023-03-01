import { createNormalizer } from './create-normalizer';

describe('createNormalizer', () => {
  it('sets initial query data', () => {
    const normalizer = createNormalizer();
    normalizer.setQuery('query', { id: '1', name: 'name' });

    expect(normalizer.getNormalizedData()).toEqual({
      queries: {
        query: {
          data: '@@1',
          dependencies: ['@@1'],
          usedKeys: { '': ['id', 'name'] },
        },
      },
      objects: { '@@1': { id: '1', name: 'name' } },
      dependentQueries: { '@@1': ['query'] },
    });
  });

  it('properly extends existing objects', () => {
    const normalizer = createNormalizer(
      {},
      {
        queries: {
          query: {
            data: '@@1',
            dependencies: ['@@1'],
            usedKeys: { '': ['id', 'name'] },
          },
        },
        objects: { '@@1': { id: '1', name: 'name' } },
        dependentQueries: { '@@1': ['query'] },
      },
    );
    normalizer.setQuery('query2', {
      id: '1',
      name: 'name',
      surname: 'surname',
    });

    expect(normalizer.getNormalizedData()).toEqual({
      queries: {
        query: {
          data: '@@1',
          dependencies: ['@@1'],
          usedKeys: { '': ['id', 'name'] },
        },
        query2: {
          data: '@@1',
          dependencies: ['@@1'],
          usedKeys: { '': ['id', 'name', 'surname'] },
        },
      },
      objects: { '@@1': { id: '1', name: 'name', surname: 'surname' } },
      dependentQueries: { '@@1': ['query', 'query2'] },
    });
  });

  it('works with nested objects', () => {
    const normalizer = createNormalizer();
    normalizer.setQuery('query', {
      topLevel: {
        id: '1',
        name: 'name',
        nested: { id: '2', name: 'name' },
      },
    });

    expect(normalizer.getNormalizedData()).toEqual({
      queries: {
        query: {
          data: { topLevel: '@@1' },
          dependencies: ['@@1', '@@2'],
          usedKeys: {
            '.topLevel': ['id', 'name', 'nested'],
            '.topLevel.nested': ['id', 'name'],
          },
        },
      },
      objects: {
        '@@1': { id: '1', name: 'name', nested: '@@2' },
        '@@2': { id: '2', name: 'name' },
      },
      dependentQueries: { '@@1': ['query'], '@@2': ['query'] },
    });
  });

  it('works with arrays', () => {
    const normalizer = createNormalizer();
    normalizer.setQuery('query', [
      {
        id: '1',
        name: 'name',
      },
      {
        id: '2',
        name: 'name 2',
      },
    ]);

    expect(normalizer.getNormalizedData()).toEqual({
      queries: {
        query: {
          data: ['@@1', '@@2'],
          dependencies: ['@@1', '@@2'],
          usedKeys: { '': ['id', 'name'] },
        },
      },
      objects: {
        '@@1': { id: '1', name: 'name' },
        '@@2': { id: '2', name: 'name 2' },
      },
      dependentQueries: { '@@1': ['query'], '@@2': ['query'] },
    });
  });

  it('properly extends arrays', () => {
    const normalizer = createNormalizer(
      {},
      {
        queries: {
          query: {
            data: '@@1',
            dependencies: ['@@1', '@@2', '@@3'],
            usedKeys: {
              '': ['id', 'list'],
              '.list': ['id', 'name'],
            },
          },
        },
        objects: {
          '@@1': { id: '1', list: ['@@2', '@@3'] },
          '@@2': {
            id: '2',
            name: 'name 2',
          },
          '@@3': {
            id: '3',
            name: 'name 3',
          },
        },
        dependentQueries: {
          '@@1': ['query'],
          '@@2': ['query'],
          '@@3': ['query'],
        },
      },
    );
    normalizer.setQuery('query', {
      id: '1',
      list: [
        {
          id: '2',
          name: 'name 2',
        },
        {
          id: '3',
          name: 'name 3',
        },
        {
          id: '4',
          name: 'name 4',
        },
      ],
    });

    expect(normalizer.getNormalizedData()).toEqual({
      queries: {
        query: {
          data: '@@1',
          dependencies: ['@@1', '@@2', '@@3', '@@4'],
          usedKeys: {
            '': ['id', 'list'],
            '.list': ['id', 'name'],
          },
        },
      },
      objects: {
        '@@1': { id: '1', list: ['@@2', '@@3', '@@4'] },
        '@@2': {
          id: '2',
          name: 'name 2',
        },
        '@@3': {
          id: '3',
          name: 'name 3',
        },
        '@@4': {
          id: '4',
          name: 'name 4',
        },
      },
      dependentQueries: {
        '@@1': ['query'],
        '@@2': ['query'],
        '@@3': ['query'],
        '@@4': ['query'],
      },
    });
  });

  it('works without objects to normalize', () => {
    const normalizer = createNormalizer();
    normalizer.setQuery('query', { name: 'name' });

    expect(normalizer.getNormalizedData()).toEqual({
      queries: {
        query: {
          data: { name: 'name' },
          dependencies: [],
          usedKeys: {},
        },
      },
      objects: {},
      dependentQueries: {},
    });
  });

  it('allows to override normalisation key', () => {
    const normalizer = createNormalizer({
      getNormalisationObjectKey: obj => obj._id as string,
      // shouldObjectBeNormalized: obj => obj._id !== undefined,
    });
    normalizer.setQuery('query', {
      _id: '1',
      name: 'name',
      notNormalizableObj: { id: '2' },
    });

    expect(normalizer.getNormalizedData()).toEqual({
      queries: {
        query: {
          data: '@@1',
          dependencies: ['@@1'],
          usedKeys: { '': ['_id', 'name', 'notNormalizableObj'] },
        },
      },
      objects: {
        '@@1': { _id: '1', name: 'name', notNormalizableObj: { id: '2' } },
      },
      dependentQueries: { '@@1': ['query'] },
    });
  });

  it('allows to disable normalisation per object', () => {
    const normalizer = createNormalizer({
      getNormalisationObjectKey: obj => obj._id as string,
      shouldObjectBeNormalized: obj => obj._id !== undefined,
    });
    normalizer.setQuery('query', {
      _id: '1',
      name: 'name',
      notNormalizableObj: { id: '2' },
    });

    expect(normalizer.getNormalizedData()).toEqual({
      queries: {
        query: {
          data: '@@1',
          dependencies: ['@@1'],
          usedKeys: { '': ['_id', 'name', 'notNormalizableObj'] },
        },
      },
      objects: {
        '@@1': { _id: '1', name: 'name', notNormalizableObj: { id: '2' } },
      },
      dependentQueries: { '@@1': ['query'] },
    });
  });
});
