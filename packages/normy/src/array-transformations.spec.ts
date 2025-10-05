import {
  getArrayOperationsToApply,
  applyArrayOperations,
} from './array-transformations';
import { defaultConfig } from './default-config';
import { arrayHelpers } from './array-helpers';

describe('getArrayOperationsToApply', () => {
  it('returns empty object when no array operations found', () => {
    expect(
      getArrayOperationsToApply({ id: '1', name: 'test' }, defaultConfig),
    ).toEqual([]);
  });

  it('extracts single remove operation', () => {
    const result = getArrayOperationsToApply(
      arrayHelpers.remove(
        {
          id: '1',
          name: 'test',
        },
        'books',
      ),
      defaultConfig,
    );

    expect(result).toEqual([
      {
        arrayType: 'books',
        type: '__remove',
        node: { id: '1', name: 'test' },
      },
    ]);
  });

  it('extracts multiple remove operations from array', () => {
    const result = getArrayOperationsToApply(
      arrayHelpers
        .chain({
          id: '1',
          name: 'test',
        })
        .remove('books')
        .remove('authors')
        .apply(),

      defaultConfig,
    );

    expect(result).toEqual([
      {
        arrayType: 'books',
        type: '__remove',
        node: { id: '1', name: 'test' },
      },
      {
        arrayType: 'authors',
        type: '__remove',
        node: { id: '1', name: 'test' },
      },
    ]);
  });

  it('extracts append operation', () => {
    const result = getArrayOperationsToApply(
      arrayHelpers.append(
        {
          id: '1',
          name: 'test',
        },
        'books',
      ),
      defaultConfig,
    );

    expect(result).toEqual([
      {
        arrayType: 'books',
        type: '__append',
        node: { id: '1', name: 'test' },
      },
    ]);
  });

  it('extracts prepend operation', () => {
    const result = getArrayOperationsToApply(
      arrayHelpers.prepend(
        {
          id: '1',
          name: 'test',
        },
        'books',
      ),
      defaultConfig,
    );

    expect(result).toEqual([
      {
        arrayType: 'books',
        type: '__prepend',
        node: { id: '1', name: 'test' },
      },
    ]);
  });

  it('extracts single clear operation', () => {
    const result = getArrayOperationsToApply(
      arrayHelpers.clear('books'),
      defaultConfig,
    );

    expect(result).toEqual([
      {
        arrayType: 'books',
        type: '__clear',
        node: {},
      },
    ]);
  });

  it('extracts multiple clear operations from array', () => {
    const result = getArrayOperationsToApply(
      [arrayHelpers.clear('books'), arrayHelpers.clear('authors')],
      defaultConfig,
    );

    expect(result).toEqual([
      {
        arrayType: 'books',
        type: '__clear',
        node: {},
      },
      {
        arrayType: 'authors',
        type: '__clear',
        node: {},
      },
    ]);
  });

  it('extracts multiple operation types on same object', () => {
    const result = getArrayOperationsToApply(
      arrayHelpers
        .chain({
          id: '1',
          name: 'test',
        })
        .append('authors')
        .remove('books')
        .apply(),
      defaultConfig,
    );

    expect(result).toEqual([
      {
        arrayType: 'authors',
        type: '__append',
        node: { id: '1', name: 'test' },
      },
      {
        arrayType: 'books',
        type: '__remove',
        node: { id: '1', name: 'test' },
      },
    ]);
  });

  it('extracts operations from nested objects', () => {
    const result = getArrayOperationsToApply(
      {
        data: {
          user: arrayHelpers.remove(
            {
              id: '1',
              name: 'test',
            },
            'books',
          ),
          book: arrayHelpers.append(
            {
              id: '2',
              title: 'Test Book',
            },
            'authors',
          ),
        },
      },
      defaultConfig,
    );

    expect(result).toEqual([
      {
        arrayType: 'books',
        type: '__remove',
        node: { id: '1', name: 'test' },
      },
      {
        arrayType: 'authors',
        type: '__append',
        node: { id: '2', title: 'Test Book' },
      },
    ]);
  });

  it('extracts operations from arrays', () => {
    const result = getArrayOperationsToApply(
      [
        arrayHelpers.remove(
          {
            id: '1',
            name: 'test1',
          },
          'books',
        ),
        arrayHelpers.append(
          {
            id: '2',
            name: 'test2',
          },
          'authors',
        ),
      ],
      defaultConfig,
    );

    expect(result).toEqual([
      {
        arrayType: 'books',
        type: '__remove',
        node: { id: '1', name: 'test1' },
      },
      {
        arrayType: 'authors',
        type: '__append',
        node: { id: '2', name: 'test2' },
      },
    ]);
  });

  it('handles multiple operations on same array type', () => {
    const result = getArrayOperationsToApply(
      [
        arrayHelpers.remove(
          {
            id: '1',
            name: 'test1',
          },
          'books',
        ),
        arrayHelpers.append(
          {
            id: '2',
            name: 'test2',
          },
          'books',
        ),
      ],
      defaultConfig,
    );

    expect(result).toEqual([
      {
        arrayType: 'books',
        type: '__remove',
        node: { id: '1', name: 'test1' },
      },
      {
        arrayType: 'books',
        type: '__append',
        node: { id: '2', name: 'test2' },
      },
    ]);
  });

  it('ignores non-string array type values', () => {
    const result = getArrayOperationsToApply(
      {
        id: '1',
        name: 'test',
        __remove: 123,
        __append: null,
        __prepend: undefined,
      },
      defaultConfig,
    );

    expect(result).toEqual([]);
  });

  it('handles deeply nested structures', () => {
    const result = getArrayOperationsToApply(
      {
        level1: {
          level2: {
            level3: [
              arrayHelpers.remove(
                {
                  id: '1',
                },
                'deep',
              ),
            ],
          },
        },
      },
      defaultConfig,
    );

    expect(result).toEqual([
      {
        arrayType: 'deep',
        type: '__remove',
        node: { id: '1' },
      },
    ]);
  });

  it('preserves legitimate keys starting with __', () => {
    const result = getArrayOperationsToApply(
      {
        id: '1',
        name: 'test',
        __remove: 'books',
        __customKey: 'should be preserved',
        __anotherKey: 'should also be preserved',
      },
      defaultConfig,
    );

    expect(result).toEqual([
      {
        arrayType: 'books',
        type: '__remove',
        node: {
          id: '1',
          name: 'test',
          __customKey: 'should be preserved',
          __anotherKey: 'should also be preserved',
        },
      },
    ]);
  });
});

describe('applyArrayOperations', () => {
  const config: typeof defaultConfig = {
    ...defaultConfig,
    getArrayType: ({ arrayKey, parentObj }) =>
      arrayKey === 'nodes' && parentObj?.type
        ? (parentObj.type as string)
        : undefined,
  };

  it('applies multiple operations in sequence', () => {
    const data = {
      books: {
        type: 'books',
        nodes: [
          { id: '1', name: 'book1' },
          { id: '2', name: 'book2' },
          { id: '3', name: 'book3' },
        ],
      },
    };

    const operations = [
      {
        arrayType: 'books',
        type: '__remove' as const,
        node: { id: '2' },
      },
      {
        arrayType: 'books',
        type: '__append' as const,
        node: { id: '4', name: 'book4' },
      },
    ];

    const result = applyArrayOperations(
      data,
      'query',
      operations,
      config,
      () => ({}),
    );

    expect(result).toEqual({
      books: {
        type: 'books',
        nodes: [
          {
            id: '1',
            name: 'book1',
          },
          { id: '3', name: 'book3' },
          { id: '4', name: 'book4' },
        ],
      },
    });
  });

  it('applies operations to multiple arrays in same data structure', () => {
    const data = {
      content: {
        books: {
          type: 'books',
          nodes: [{ id: '1', name: 'book1' }],
        },
        authors: {
          type: 'authors',
          nodes: [{ id: '2', name: 'author1' }],
        },
      },
    };

    const operations = [
      {
        arrayType: 'books',
        type: '__append' as const,
        node: { id: '3', name: 'book2' },
      },
      {
        arrayType: 'authors',
        type: '__remove' as const,
        node: { id: '2' },
      },
    ];

    const result = applyArrayOperations(
      data,
      'query',
      operations,
      config,
      () => ({}),
    );

    expect(result).toEqual({
      content: {
        books: {
          type: 'books',
          nodes: [
            { id: '1', name: 'book1' },
            { id: '3', name: 'book2' },
          ],
        },
        authors: {
          type: 'authors',
          nodes: [],
        },
      },
    });
  });

  it('handles empty operations array', () => {
    const data = {
      books: {
        type: 'books',
        nodes: [{ id: '1', name: 'book1' }],
      },
    };

    const result = applyArrayOperations(data, 'query', [], config, () => ({}));

    expect(result).toEqual(data);
  });

  it('preserves data when no matching array types found', () => {
    const data = {
      users: [
        { id: '1', name: 'user1' },
        { id: '2', name: 'user2' },
      ],
    };

    const operations = [
      {
        arrayType: 'books',
        type: '__remove' as const,
        node: { id: '1' },
      },
    ];

    const result = applyArrayOperations(
      data,
      'query',
      operations,
      config,
      () => ({}),
    );

    expect(result).toEqual(data);
  });

  it('applies prepend operations correctly', () => {
    const data = [
      { id: '2', name: 'item2' },
      { id: '3', name: 'item3' },
    ];

    const operations = [
      {
        arrayType: 'items',
        type: '__prepend' as const,
        node: { id: '1', name: 'item1' },
      },
      {
        arrayType: 'items',
        type: '__prepend' as const,
        node: { id: '0', name: 'item0' },
      },
    ];

    const customConfig = {
      ...config,
      getArrayType: () => 'items',
    };

    const result = applyArrayOperations(
      data,
      'query',
      operations,
      customConfig,
      () => ({}),
    );

    expect(result).toEqual([
      { id: '0', name: 'item0' },
      { id: '1', name: 'item1' },
      { id: '2', name: 'item2' },
      { id: '3', name: 'item3' },
    ]);
  });

  it('applies append operations correctly', () => {
    const data = [
      { id: '2', name: 'item2' },
      { id: '3', name: 'item3' },
    ];

    const operations = [
      {
        arrayType: 'items',
        type: '__append' as const,
        node: { id: '1', name: 'item1' },
      },
    ];

    const customConfig = {
      ...config,
      getArrayType: () => 'items',
    };

    const result = applyArrayOperations(
      data,
      'query',
      operations,
      customConfig,
      () => ({}),
    );

    expect(result).toEqual([
      { id: '2', name: 'item2' },
      { id: '3', name: 'item3' },
      { id: '1', name: 'item1' },
    ]);
  });

  it('applies append operations correctly with partial data', () => {
    const data = [
      { id: '1', name: 'item1' },
      { id: '2', name: 'item2' },
    ];

    const operations = [
      {
        arrayType: 'items',
        type: '__append' as const,
        node: { id: '3' },
      },
    ];

    const customConfig = {
      ...config,
      getArrayType: () => 'items',
    };

    const result = applyArrayOperations(
      data,
      'query',
      operations,
      customConfig,
      id => ({
        id,
        name: `item${id}`,
      }),
    );

    expect(result).toEqual([
      { id: '1', name: 'item1' },
      { id: '2', name: 'item2' },
      { id: '3', name: 'item3' },
    ]);
  });

  it('handles nested arrays correctly', () => {
    const data = {
      library: {
        sections: {
          fiction: {
            type: 'books',
            nodes: [
              { id: '1', name: 'book1', genre: 'fiction' },
              { id: '2', name: 'book2', genre: 'fiction' },
            ],
          },
          nonFiction: {
            type: 'books',
            nodes: [
              { id: '3', name: 'book3', genre: 'non-fiction' },
              { id: '4', name: 'book4', genre: 'non-fiction' },
            ],
          },
        },
        authors: {
          type: 'authors',
          nodes: [
            { id: '1', name: 'author1' },
            { id: '2', name: 'author2' },
          ],
        },
      },
    };

    const operations = [
      {
        arrayType: 'books',
        type: '__remove' as const,
        node: { id: '2' },
      },
      {
        arrayType: 'books',
        type: '__append' as const,
        node: { id: '5', name: 'book5', genre: 'fiction' },
      },
    ];

    const result = applyArrayOperations(
      data,
      'query',
      operations,
      config,
      () => ({}),
    );

    expect(result).toEqual({
      library: {
        sections: {
          fiction: {
            type: 'books',
            nodes: [
              { id: '1', name: 'book1', genre: 'fiction' },
              { id: '5', name: 'book5', genre: 'fiction' },
            ],
          },
          nonFiction: {
            type: 'books',
            nodes: [
              { id: '3', name: 'book3', genre: 'non-fiction' },
              { id: '4', name: 'book4', genre: 'non-fiction' },
              { id: '5', name: 'book5', genre: 'fiction' },
            ],
          },
        },
        authors: {
          type: 'authors',
          nodes: [
            { id: '1', name: 'author1' },
            { id: '2', name: 'author2' },
          ],
        },
      },
    });
  });

  it('handles arrays containing objects with nested arrays', () => {
    const data = {
      categories: {
        type: 'categories',
        nodes: [
          {
            id: '1',
            name: 'Fiction',
            books: [
              { id: '1', title: 'Book 1', author: 'Author 1' },
              { id: '2', title: 'Book 2', author: 'Author 2' },
            ],
          },
          {
            id: '2',
            name: 'Non-Fiction',
            books: [
              { id: '3', title: 'Book 3', author: 'Author 3' },
              { id: '4', title: 'Book 4', author: 'Author 4' },
            ],
          },
        ],
      },
    };

    const operations = [
      {
        arrayType: 'categories',
        type: '__append' as const,
        node: {
          id: '3',
          name: 'Science Fiction',
          books: [{ id: '6', title: 'Sci-Fi Book', author: 'Author 6' }],
        },
      },
    ];

    const result = applyArrayOperations(
      data,
      'query',
      operations,
      config,
      () => ({}),
    );

    expect(result).toEqual({
      categories: {
        type: 'categories',
        nodes: [
          {
            id: '1',
            name: 'Fiction',
            books: [
              { id: '1', title: 'Book 1', author: 'Author 1' },
              { id: '2', title: 'Book 2', author: 'Author 2' },
            ],
          },
          {
            id: '2',
            name: 'Non-Fiction',
            books: [
              { id: '3', title: 'Book 3', author: 'Author 3' },
              { id: '4', title: 'Book 4', author: 'Author 4' },
            ],
          },
          {
            id: '3',
            name: 'Science Fiction',
            books: [{ id: '6', title: 'Sci-Fi Book', author: 'Author 6' }],
          },
        ],
      },
    });
  });

  it('ignores arrays that do not pass getArrayType check', () => {
    const data = {
      content: {
        books: {
          type: 'books',
          nodes: [
            { id: '1', name: 'book1' },
            { id: '2', name: 'book2' },
          ],
        },
        // This array doesn't have the required structure for getArrayType
        simpleArray: [
          { id: '3', name: 'item3' },
          { id: '4', name: 'item4' },
        ],
        // This object doesn't have nodes array
        invalidObject: {
          type: 'books',
          items: [
            { id: '5', name: 'item5' },
            { id: '6', name: 'item6' },
          ],
        },
      },
    };

    const operations = [
      {
        arrayType: 'books',
        type: '__remove' as const,
        node: { id: '2' },
      },
      {
        arrayType: 'books',
        type: '__append' as const,
        node: { id: '7', name: 'book7' },
      },
    ];

    const result = applyArrayOperations(
      data,
      'query',
      operations,
      config,
      () => ({}),
    );

    expect(result).toEqual({
      content: {
        books: {
          type: 'books',
          nodes: [
            { id: '1', name: 'book1' },
            { id: '7', name: 'book7' },
          ],
        },
        // These should remain unchanged since they don't pass getArrayType check
        simpleArray: [
          { id: '3', name: 'item3' },
          { id: '4', name: 'item4' },
        ],
        invalidObject: {
          type: 'books',
          items: [
            { id: '5', name: 'item5' },
            { id: '6', name: 'item6' },
          ],
        },
      },
    });
  });

  it('supports Python-style negative indices for insert operation', () => {
    const data = {
      books: {
        type: 'books',
        nodes: [
          { id: '1', name: 'book1' },
          { id: '2', name: 'book2' },
          { id: '3', name: 'book3' },
        ],
      },
    };

    const result1 = applyArrayOperations(
      data,
      'query',
      [
        {
          arrayType: 'books',
          type: '__insert' as const,
          node: { id: '4', name: 'book4' },
          props: { index: -1 },
        },
      ],
      config,
      () => ({}),
    );

    expect(result1).toEqual({
      books: {
        type: 'books',
        nodes: [
          { id: '1', name: 'book1' },
          { id: '2', name: 'book2' },
          { id: '3', name: 'book3' },
          { id: '4', name: 'book4' },
        ],
      },
    });

    const result2 = applyArrayOperations(
      data,
      'query',
      [
        {
          arrayType: 'books',
          type: '__insert' as const,
          node: { id: '4', name: 'book4' },
          props: { index: -2 },
        },
      ],
      config,
      () => ({}),
    );

    expect(result2).toEqual({
      books: {
        type: 'books',
        nodes: [
          { id: '1', name: 'book1' },
          { id: '2', name: 'book2' },
          { id: '4', name: 'book4' },
          { id: '3', name: 'book3' },
        ],
      },
    });

    const result3 = applyArrayOperations(
      data,
      'query',
      [
        {
          arrayType: 'books',
          type: '__insert' as const,
          node: { id: '4', name: 'book4' },
          props: { index: -3 },
        },
      ],
      config,
      () => ({}),
    );

    expect(result3).toEqual({
      books: {
        type: 'books',
        nodes: [
          { id: '1', name: 'book1' },
          { id: '4', name: 'book4' },
          { id: '2', name: 'book2' },
          { id: '3', name: 'book3' },
        ],
      },
    });

    const result4 = applyArrayOperations(
      data,
      'query',
      [
        {
          arrayType: 'books',
          type: '__insert' as const,
          node: { id: '4', name: 'book4' },
          props: { index: -5 },
        },
      ],
      config,
      () => ({}),
    );

    expect(result4).toEqual({
      books: {
        type: 'books',
        nodes: [
          { id: '4', name: 'book4' },
          { id: '1', name: 'book1' },
          { id: '2', name: 'book2' },
          { id: '3', name: 'book3' },
        ],
      },
    });
  });

  describe('array structure consistency warnings', () => {
    it('warns when append operation node is missing required properties', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      try {
        const existingArray = [
          { id: '1', title: 'Book 1', author: 'Author 1' },
          { id: '2', title: 'Book 2', author: 'Author 2' },
        ];

        applyArrayOperations(
          { books: existingArray },
          'query',
          [
            {
              arrayType: 'books',
              type: '__append',
              node: { id: '3', title: 'Book 3' }, // Missing 'author' property
            },
          ],
          {
            ...defaultConfig,
            getArrayType: () => 'books',
          },
          () => undefined,
        );

        expect(consoleSpy).toHaveBeenCalledWith(
          'Array item for __append operation on array type "books" is missing required properties: author. ' +
            'All array items must have consistent structure for proper denormalization. ' +
            'Expected properties: id, title, author, got: id, title',
        );
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('warns when prepend operation node is missing required properties', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      try {
        const existingArray = [
          { id: '1', title: 'Book 1', author: 'Author 1' },
          { id: '2', title: 'Book 2', author: 'Author 2' },
        ];

        applyArrayOperations(
          { books: existingArray },
          'query',
          [
            {
              arrayType: 'books',
              type: '__prepend',
              node: { id: '0', title: 'Book 0' }, // Missing 'author' property
            },
          ],
          {
            ...defaultConfig,
            getArrayType: () => 'books',
          },
          () => undefined,
        );

        expect(consoleSpy).toHaveBeenCalledWith(
          'Array item for __prepend operation on array type "books" is missing required properties: author. ' +
            'All array items must have consistent structure for proper denormalization. ' +
            'Expected properties: id, title, author, got: id, title',
        );
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('does not warn when append operation node has all required properties', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      try {
        const existingArray = [
          { id: '1', title: 'Book 1', author: 'Author 1' },
          { id: '2', title: 'Book 2', author: 'Author 2' },
        ];

        applyArrayOperations(
          { books: existingArray },
          'query',
          [
            {
              arrayType: 'books',
              type: '__append',
              node: { id: '3', title: 'Book 3', author: 'Author 3' }, // Has all properties
            },
          ],
          {
            ...defaultConfig,
            getArrayType: () => 'books',
          },
          () => undefined,
        );

        expect(consoleSpy).not.toHaveBeenCalled();
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('does not warn when array is empty (no template to compare against)', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      try {
        applyArrayOperations(
          { books: [] },
          'query',
          [
            {
              arrayType: 'books',
              type: '__append',
              node: { id: '1', title: 'Book 1' }, // Any structure is fine for empty array
            },
          ],
          {
            ...defaultConfig,
            getArrayType: () => 'books',
          },
          () => undefined,
        );

        expect(consoleSpy).not.toHaveBeenCalled();
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });
});
