import { getDependencies, normalize } from './normalize';

describe('getDependencies', () => {
  it('returns empty array for simple values', () => {
    expect(getDependencies('', 'query')).toEqual([[], {}, []]);
    expect(getDependencies(1, 'query')).toEqual([[], {}, []]);
    expect(getDependencies(false, 'query')).toEqual([[], {}, []]);
    expect(getDependencies(null, 'query')).toEqual([[], {}, []]);
  });

  it('returns empty array for values without ids', () => {
    expect(getDependencies({}, 'query')).toEqual([[], {}, []]);
    expect(getDependencies([], 'query')).toEqual([[], {}, []]);
    expect(getDependencies({ nested: [1, 2, 3] }, 'query')).toEqual([
      [],
      {},
      [],
    ]);
  });

  it('finds direct dependency', () => {
    expect(getDependencies({ id: 1, key: 'value' }, 'query')).toEqual([
      [
        {
          id: 1,
          key: 'value',
        },
      ],
      { '': ['id', 'key'] },
      [],
    ]);
  });

  it('finds nested dependency', () => {
    expect(
      getDependencies({ nested: { id: 1, key: 'value' } }, 'query'),
    ).toEqual([
      [
        {
          id: 1,
          key: 'value',
        },
      ],
      { '.nested': ['id', 'key'] },
      [],
    ]);
  });

  it('finds dependencies from array', () => {
    expect(
      getDependencies(
        [
          { id: '1', v: 'a' },
          { id: '2', v: 'b' },
        ],
        'query',
      ),
    ).toEqual([
      [
        { id: '1', v: 'a' },
        { id: '2', v: 'b' },
      ],
      { '': ['id', 'v'] },
      [],
    ]);
  });

  it('finds dependencies of dependencies', () => {
    expect(
      getDependencies(
        { id: '1', v: 'a', nested: { id: '2', v: 'b' } },
        'query',
      ),
    ).toEqual([
      [
        { id: '1', v: 'a', nested: { id: '2', v: 'b' } },
        { id: '2', v: 'b' },
      ],
      { '': ['id', 'v', 'nested'], '.nested': ['id', 'v'] },
      [],
    ]);
  });

  it('works for very complex cases', () => {
    expect(
      getDependencies(
        {
          id: '1',
          v: 'a',
          nested: { id: '2', v: 'b' },
          list: [
            {
              id: '3',
              nestedInList: { id: '5', v: 'c' },
              nestedList: [{ id: '6', v: 'd' }],
            },
            {
              id: '4',
              nestedInList: { id: '5', v: 'c' },
              nestedList: [{ id: '6', v: 'd' }],
            },
          ],
        },
        'query',
      ),
    ).toEqual([
      [
        {
          id: '1',
          v: 'a',
          nested: { id: '2', v: 'b' },
          list: [
            {
              id: '3',
              nestedInList: { id: '5', v: 'c' },
              nestedList: [{ id: '6', v: 'd' }],
            },
            {
              id: '4',
              nestedInList: { id: '5', v: 'c' },
              nestedList: [{ id: '6', v: 'd' }],
            },
          ],
        },
        { id: '2', v: 'b' },
        {
          id: '3',
          nestedInList: { id: '5', v: 'c' },
          nestedList: [{ id: '6', v: 'd' }],
        },
        { id: '5', v: 'c' },
        { id: '6', v: 'd' },
        {
          id: '4',
          nestedInList: { id: '5', v: 'c' },
          nestedList: [{ id: '6', v: 'd' }],
        },
        { id: '5', v: 'c' },
        { id: '6', v: 'd' },
      ],
      {
        '': ['id', 'v', 'nested', 'list'],
        '.nested': ['id', 'v'],
        '.list': ['id', 'nestedInList', 'nestedList'],
        '.list.nestedInList': ['id', 'v'],
        '.list.nestedList': ['id', 'v'],
      },
      [],
    ]);
  });
});

describe('normalize', () => {
  it('should do nothing when no id', () => {
    expect(normalize({ key: 'value' }, 'query')).toEqual([
      { key: 'value' },
      {},
      {},
      [],
    ]);
  });

  it('should normalize data with single id', () => {
    expect(normalize({ id: '1', key: 'value' }, 'query')).toEqual([
      '@@1',
      { '@@1': { id: '1', key: 'value' } },
      { '': ['id', 'key'] },
      [],
    ]);
  });

  it('should normalize data with nested single id', () => {
    expect(
      normalize({ k: 'v', nested: { id: '1', key: 'value' } }, 'query'),
    ).toEqual([
      {
        k: 'v',
        nested: '@@1',
      },
      { '@@1': { id: '1', key: 'value' } },
      { '.nested': ['id', 'key'] },
      [],
    ]);
  });

  it('should normalize data with multiple id', () => {
    expect(
      normalize(
        {
          k: 'v',
          wrapper: {
            nested: { id: '1', key: 'value' },
            anotherNested: { deeplyNested: { id: '2', a: 1 } },
          },
        },
        'query',
      ),
    ).toEqual([
      {
        k: 'v',
        wrapper: {
          nested: '@@1',
          anotherNested: { deeplyNested: '@@2' },
        },
      },
      { '@@1': { id: '1', key: 'value' }, '@@2': { id: '2', a: 1 } },
      {
        '.wrapper.nested': ['id', 'key'],
        '.wrapper.anotherNested.deeplyNested': ['id', 'a'],
      },
      [],
    ]);
  });

  it('should normalize data with id with nested dependent id', () => {
    expect(
      normalize(
        {
          id: '1',
          k: 'v',
          nested: { id: '2', key: 'value' },
        },
        'query',
      ),
    ).toEqual([
      '@@1',
      {
        '@@1': { id: '1', k: 'v', nested: '@@2' },
        '@@2': { id: '2', key: 'value' },
      },
      { '': ['id', 'k', 'nested'], '.nested': ['id', 'key'] },
      [],
    ]);
  });

  it('should normalize data with arrays', () => {
    expect(
      normalize(
        {
          arrayWithoutIds: [1, 2, 3],
          arrayWithIds: [
            { id: '1', k: 'a' },
            { id: '2', k: 'b' },
          ],
        },
        'query',
      ),
    ).toEqual([
      {
        arrayWithoutIds: [1, 2, 3],
        arrayWithIds: ['@@1', '@@2'],
      },
      { '@@1': { id: '1', k: 'a' }, '@@2': { id: '2', k: 'b' } },
      { '.arrayWithIds': ['id', 'k'] },
      [],
    ]);
  });

  it('works for very complex cases', () => {
    expect(
      normalize(
        {
          nested: {
            withoutId: { k: 'v' },
            id: '1',
            v: 'a',
            nested: { id: '2', v: 'b' },
            list: [
              {
                id: '3',
                nestedInList: { id: '5', v: 'c' },
                nestedList: [{ id: '6', v: 'd' }],
              },
              {
                id: '4',
                nestedInList: { id: '5', v: 'c' },
                nestedList: [{ id: '6', v: 'd' }],
              },
            ],
          },
        },
        'query',
      ),
    ).toEqual([
      { nested: '@@1' },
      {
        '@@1': {
          withoutId: { k: 'v' },
          id: '1',
          v: 'a',
          nested: '@@2',
          list: ['@@3', '@@4'],
        },
        '@@2': { id: '2', v: 'b' },
        '@@3': { id: '3', nestedInList: '@@5', nestedList: ['@@6'] },
        '@@4': {
          id: '4',
          nestedInList: '@@5',
          nestedList: ['@@6'],
        },
        '@@5': { id: '5', v: 'c' },
        '@@6': { id: '6', v: 'd' },
      },
      {
        '.nested': ['withoutId', 'id', 'v', 'nested', 'list'],
        '.nested.nested': ['id', 'v'],
        '.nested.list': ['id', 'nestedInList', 'nestedList'],
        '.nested.list.nestedInList': ['id', 'v'],
        '.nested.list.nestedList': ['id', 'v'],
      },
      [],
    ]);
  });

  it('should merge objects with the same id', () => {
    expect(
      normalize(
        {
          nested: { id: '1', key: 'value' },
          anotherNested: { id: '1', a: 1 },
        },
        'query',
      ),
    ).toEqual([
      {
        nested: '@@1',
        anotherNested: '@@1',
      },
      { '@@1': { id: '1', key: 'value', a: 1 } },
      {
        '.nested': ['id', 'key'],
        '.anotherNested': ['id', 'a'],
      },
      [],
    ]);
  });

  it('should deeply merge objects with the same id', () => {
    expect(
      normalize(
        {
          nested: { id: '1', a: 1, nested: { x: 1, y: 2 } },
          anotherNested: { id: '1', a: 3, b: 2, nested: { x: 2 } },
        },
        'query',
      ),
    ).toEqual([
      {
        nested: '@@1',
        anotherNested: '@@1',
      },
      { '@@1': { id: '1', a: 3, b: 2, nested: { x: 2, y: 2 } } },
      {
        '.nested': ['id', 'a', 'nested'],
        '.anotherNested': ['id', 'a', 'b', 'nested'],
      },
      [],
    ]);
  });

  it('should support configurable normalization options', () => {
    expect(
      normalize(
        [
          { id: '1', key: 'a' },
          { _id: '2', key: 'b' },
        ],
        'query',
        {
          getNormalizationObjectKey: obj =>
            obj._id && obj.key
              ? `${obj._id as string}${obj.key as string}`
              : undefined,
          devLogging: false,
          structuralSharing: true,
          getArrayType: () => undefined,
          customArrayOperations: {},
        },
      ),
    ).toEqual([
      [{ id: '1', key: 'a' }, '@@2b'],
      { '@@2b': { _id: '2', key: 'b' } },
      { '': ['_id', 'key'] },
      [],
    ]);
  });

  it('should detect array types', () => {
    expect(
      normalize(
        {
          data: {
            nodes: [{ id: '1' }, { id: '2' }],
            type: 'books',
          },
        },
        'query',
        {
          getNormalizationObjectKey: obj => obj.id as string | undefined,
          devLogging: false,
          structuralSharing: true,
          getArrayType: ({ parentObj }) =>
            typeof parentObj?.type === 'string' ? parentObj.type : undefined,
          customArrayOperations: {},
        },
      ),
    ).toEqual([
      {
        data: {
          nodes: ['@@1', '@@2'],
          type: 'books',
        },
      },
      {
        '@@1': { id: '1' },
        '@@2': { id: '2' },
      },
      {
        '.data.nodes': ['id'],
      },
      ['books'],
    ]);
  });

  it('should detect array types, even multiple', () => {
    expect(
      normalize(
        {
          books: {
            nodes: [{ id: '1' }, { id: '2' }],
            type: 'books',
          },
          likedBooks: {
            nodes: [{ id: '1' }],
            type: 'likedBooks',
          },
          allBooks: [
            {
              nodes: [{ id: '1' }, { id: '2' }],
              type: 'books',
            },
            {
              nodes: [{ id: '1' }],
              type: 'likedBooks',
            },
          ],
        },
        'query',
        {
          getNormalizationObjectKey: obj => obj.id as string | undefined,
          devLogging: false,
          structuralSharing: true,
          getArrayType: ({ parentObj, arrayKey }) =>
            arrayKey === 'nodes' && typeof parentObj?.type === 'string'
              ? parentObj.type
              : undefined,
          customArrayOperations: {},
        },
      ),
    ).toEqual([
      {
        books: {
          nodes: ['@@1', '@@2'],
          type: 'books',
        },
        likedBooks: {
          nodes: ['@@1'],
          type: 'likedBooks',
        },
        allBooks: [
          {
            nodes: ['@@1', '@@2'],
            type: 'books',
          },
          {
            nodes: ['@@1'],
            type: 'likedBooks',
          },
        ],
      },
      {
        '@@1': { id: '1' },
        '@@2': { id: '2' },
      },
      {
        '.books.nodes': ['id'],
        '.likedBooks.nodes': ['id'],
        '.allBooks.nodes': ['id'],
      },
      ['books', 'likedBooks'],
    ]);
  });

  it('should detect array types based on array content', () => {
    expect(
      normalize(
        {
          bookList: [
            { id: '1', __typename: 'Book', title: 'Book 1' },
            { id: '2', __typename: 'Book', title: 'Book 2' },
          ],
          authorList: [
            { id: '3', __typename: 'Author', name: 'Author 1' },
            { id: '4', __typename: 'Author', name: 'Author 2' },
          ],
        },
        'query',
        {
          getNormalizationObjectKey: obj => obj.id as string | undefined,
          devLogging: false,
          structuralSharing: true,
          getArrayType: ({ array }) => {
            if (array.length === 0) {
              return undefined;
            }

            const firstItem = array[0];

            if (firstItem.__typename === 'Book') {
              return 'books';
            }

            if (firstItem.__typename === 'Author') {
              return 'authors';
            }

            return undefined;
          },
          customArrayOperations: {},
        },
      ),
    ).toEqual([
      {
        bookList: ['@@1', '@@2'],
        authorList: ['@@3', '@@4'],
      },
      {
        '@@1': { id: '1', __typename: 'Book', title: 'Book 1' },
        '@@2': { id: '2', __typename: 'Book', title: 'Book 2' },
        '@@3': { id: '3', __typename: 'Author', name: 'Author 1' },
        '@@4': { id: '4', __typename: 'Author', name: 'Author 2' },
      },
      {
        '.bookList': ['id', '__typename', 'title'],
        '.authorList': ['id', '__typename', 'name'],
      },
      ['books', 'authors'],
    ]);
  });
});
