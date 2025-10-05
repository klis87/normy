import { arrayHelpers, createArrayHelpers } from './array-helpers';
import { createNormalizer } from './create-normalizer';
import { getId } from './get-id';
import { DataObject } from './types';

describe('createNormalizer', () => {
  describe('setQuery', () => {
    it('sets initial query data', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', { id: '1', name: 'name' });

      expect(normalizer.getNormalizedData()).toEqual({
        queries: {
          query: {
            data: '@@1',
            dependencies: ['@@1'],
            usedKeys: { '': ['id', 'name'] },
            arrayTypes: [],
          },
        },
        objects: { '@@1': { id: '1', name: 'name' } },
        dependentQueries: { '@@1': ['query'] },
        queriesWithArrays: {},
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
              arrayTypes: [],
            },
          },
          objects: { '@@1': { id: '1', name: 'name' } },
          dependentQueries: { '@@1': ['query'] },
          queriesWithArrays: {},
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
            arrayTypes: [],
          },
          query2: {
            data: '@@1',
            dependencies: ['@@1'],
            usedKeys: { '': ['id', 'name', 'surname'] },
            arrayTypes: [],
          },
        },
        objects: { '@@1': { id: '1', name: 'name', surname: 'surname' } },
        dependentQueries: { '@@1': ['query', 'query2'] },
        queriesWithArrays: {},
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
            arrayTypes: [],
          },
        },
        objects: {
          '@@1': { id: '1', name: 'name', nested: '@@2' },
          '@@2': { id: '2', name: 'name' },
        },
        dependentQueries: { '@@1': ['query'], '@@2': ['query'] },
        queriesWithArrays: {},
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
            arrayTypes: [],
          },
        },
        objects: {
          '@@1': { id: '1', name: 'name' },
          '@@2': { id: '2', name: 'name 2' },
        },
        dependentQueries: { '@@1': ['query'], '@@2': ['query'] },
        queriesWithArrays: {},
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
              arrayTypes: [],
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
          queriesWithArrays: {},
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
            arrayTypes: [],
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
        queriesWithArrays: {},
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
            arrayTypes: [],
          },
        },
        objects: {},
        dependentQueries: {},
        queriesWithArrays: {},
      });
    });

    it('allows to override normalization key', () => {
      const normalizer = createNormalizer({
        getNormalizationObjectKey: obj => obj._id as string,
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
            arrayTypes: [],
          },
        },
        objects: {
          '@@1': { _id: '1', name: 'name', notNormalizableObj: { id: '2' } },
        },
        dependentQueries: { '@@1': ['query'] },
        queriesWithArrays: {},
      });
    });

    it('allows to disable normalization per object', () => {
      const normalizer = createNormalizer({
        getNormalizationObjectKey: obj => obj._id as string,
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
            arrayTypes: [],
          },
        },
        objects: {
          '@@1': { _id: '1', name: 'name', notNormalizableObj: { id: '2' } },
        },
        dependentQueries: { '@@1': ['query'] },
        queriesWithArrays: {},
      });
    });

    it('does not update normalized data when using structural sharing and data is the same', () => {
      const normalizer = createNormalizer();
      const data = { id: '1', name: 'name' };
      normalizer.setQuery('query', data);
      const normalizedData = normalizer.getNormalizedData();
      normalizer.setQuery('query', data);

      expect(normalizedData).toBe(normalizer.getNormalizedData());
    });

    it('updates normalized data when using structural sharing but data is not the same', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', { id: '1', name: 'name' });
      const normalizedData = normalizer.getNormalizedData();
      normalizer.setQuery('query', { id: '1', name: 'name' });

      expect(normalizedData).not.toBe(normalizer.getNormalizedData());
    });

    it('updates normalized data when data is the same but without using structural sharing', () => {
      const normalizer = createNormalizer({ structuralSharing: false });
      const data = { id: '1', name: 'name' };
      normalizer.setQuery('query', data);
      const normalizedData = normalizer.getNormalizedData();
      normalizer.setQuery('query', data);

      expect(normalizedData).not.toBe(normalizer.getNormalizedData());
    });

    it('updates array types when query is updated', () => {
      const normalizer = createNormalizer({
        getArrayType: ({ parentObj }) =>
          typeof parentObj?.type === 'string' ? parentObj.type : undefined,
      });
      normalizer.setQuery('query', {
        data: {
          nodes: [{ id: '1' }, { id: '2' }],
          type: 'books',
        },
      });
      normalizer.setQuery('query', {
        data: {
          nodes: [{ id: '1' }, { id: '2' }],
          type: 'authors',
        },
      });

      expect(normalizer.getNormalizedData()).toEqual({
        queries: {
          query: {
            data: {
              data: {
                nodes: ['@@1', '@@2'],
                type: 'authors',
              },
            },
            dependencies: ['@@1', '@@2'],
            usedKeys: {
              '.data.nodes': ['id'],
            },
            arrayTypes: ['authors'],
          },
        },
        objects: {
          '@@1': { id: '1' },
          '@@2': { id: '2' },
        },
        dependentQueries: { '@@1': ['query'], '@@2': ['query'] },
        queriesWithArrays: {
          authors: ['query'],
        },
      });
    });

    it('handles multiple queries with array types', () => {
      const normalizer = createNormalizer({
        getArrayType: ({ parentObj }) =>
          typeof parentObj?.type === 'string' ? parentObj.type : undefined,
      });
      normalizer.setQuery('query1', {
        data: {
          nodes: [{ id: '1' }, { id: '2' }],
          type: 'books',
        },
      });
      normalizer.setQuery('query2', {
        data: {
          nodes: [{ id: '3' }, { id: '4' }],
          type: 'books',
        },
      });
      normalizer.setQuery('query3', {
        data: {
          nodes: [{ id: '5' }, { id: '6' }],
          type: 'authors',
        },
      });

      expect(normalizer.getNormalizedData()).toEqual({
        queries: {
          query1: {
            data: {
              data: {
                nodes: ['@@1', '@@2'],
                type: 'books',
              },
            },
            dependencies: ['@@1', '@@2'],
            usedKeys: {
              '.data.nodes': ['id'],
            },
            arrayTypes: ['books'],
          },
          query2: {
            data: {
              data: {
                nodes: ['@@3', '@@4'],
                type: 'books',
              },
            },
            dependencies: ['@@3', '@@4'],
            usedKeys: {
              '.data.nodes': ['id'],
            },
            arrayTypes: ['books'],
          },
          query3: {
            data: {
              data: {
                nodes: ['@@5', '@@6'],
                type: 'authors',
              },
            },
            dependencies: ['@@5', '@@6'],
            usedKeys: {
              '.data.nodes': ['id'],
            },
            arrayTypes: ['authors'],
          },
        },
        objects: {
          '@@1': { id: '1' },
          '@@2': { id: '2' },
          '@@3': { id: '3' },
          '@@4': { id: '4' },
          '@@5': { id: '5' },
          '@@6': { id: '6' },
        },
        dependentQueries: {
          '@@1': ['query1'],
          '@@2': ['query1'],
          '@@3': ['query2'],
          '@@4': ['query2'],
          '@@5': ['query3'],
          '@@6': ['query3'],
        },
        queriesWithArrays: {
          books: ['query1', 'query2'],
          authors: ['query3'],
        },
      });
    });
  });

  describe('removeQuery', () => {
    it('does nothing if a query to remove does not exist', () => {
      const state = {
        queries: {
          query: {
            data: '@@1',
            dependencies: ['@@1'],
            usedKeys: { '': ['id', 'name'] },
            arrayTypes: [],
          },
        },
        objects: { '@@1': { id: '1', name: 'name' } },
        dependentQueries: { '@@1': ['query'] },
        queriesWithArrays: {},
      };

      const normalizer = createNormalizer({}, state);
      normalizer.removeQuery('query2');

      expect(normalizer.getNormalizedData()).toEqual(state);
    });

    it('removes a query if it exists', () => {
      const normalizer = createNormalizer(
        {},
        {
          queries: {
            query: {
              data: '@@1',
              dependencies: ['@@1'],
              usedKeys: { '': ['id', 'name'] },
              arrayTypes: [],
            },
          },
          objects: { '@@1': { id: '1', name: 'name' } },
          dependentQueries: { '@@1': ['query'] },
          queriesWithArrays: {},
        },
      );
      normalizer.removeQuery('query');

      expect(normalizer.getNormalizedData()).toEqual({
        queries: {},
        objects: {},
        dependentQueries: {},
        queriesWithArrays: {},
      });
    });

    it('removes a query if it exists without affecting other queries', () => {
      const normalizer = createNormalizer(
        {},
        {
          queries: {
            query: {
              data: '@@1',
              dependencies: ['@@1'],
              usedKeys: { '': ['id', 'name'] },
              arrayTypes: [],
            },
            query2: {
              data: '@@2',
              dependencies: ['@@2'],
              usedKeys: { '': ['id', 'name'] },
              arrayTypes: [],
            },
          },
          objects: {
            '@@1': { id: '1', name: 'name' },
            '@@2': { id: '2', name: 'name' },
          },
          dependentQueries: { '@@1': ['query'], '@@2': ['query2'] },
          queriesWithArrays: {},
        },
      );
      normalizer.removeQuery('query2');

      expect(normalizer.getNormalizedData()).toEqual({
        queries: {
          query: {
            data: '@@1',
            dependencies: ['@@1'],
            usedKeys: { '': ['id', 'name'] },
            arrayTypes: [],
          },
        },
        objects: { '@@1': { id: '1', name: 'name' } },
        dependentQueries: { '@@1': ['query'] },
        queriesWithArrays: {},
      });
    });

    it('removes array types when query is removed', () => {
      const normalizer = createNormalizer({
        getArrayType: ({ parentObj }) =>
          typeof parentObj?.type === 'string' ? parentObj.type : undefined,
      });
      normalizer.setQuery('query', {
        data: {
          nodes: [{ id: '1' }, { id: '2' }],
          type: 'books',
        },
      });
      normalizer.removeQuery('query');

      expect(normalizer.getNormalizedData()).toEqual({
        queries: {},
        objects: {},
        dependentQueries: {},
        queriesWithArrays: {},
      });
    });
  });

  describe('getQueriesToUpdate', () => {
    it('returns empty array when no queries to update', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', { id: '1', name: 'name' });

      expect(
        normalizer.getQueriesToUpdate({ id: '2', name: 'name 2' }),
      ).toEqual([]);
    });

    it('returns query to update when found matching object', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        surname: 'surname',
      });

      expect(
        normalizer.getQueriesToUpdate({ id: '1', name: 'name 2' }),
      ).toEqual([
        {
          queryKey: 'query',
          data: { id: '1', name: 'name 2', surname: 'surname' },
        },
      ]);
    });

    it('can find multiple queries, even with nested dependencies', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        surname: 'surname',
      });
      normalizer.setQuery('query2', {
        id: '2',
        name: 'name',
        nested: {
          id: '1',
          name: 'name',
        },
      });
      normalizer.setQuery('query3', {
        id: '3',
        name: 'name',
      });

      expect(
        normalizer.getQueriesToUpdate({ id: '1', name: 'name 2' }),
      ).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '1',
            name: 'name 2',
            surname: 'surname',
          },
        },
        {
          queryKey: 'query2',
          data: {
            id: '2',
            name: 'name',
            nested: {
              id: '1',
              name: 'name 2',
            },
          },
        },
      ]);
    });

    it('can find dependencies in arrays', () => {
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

      expect(
        normalizer.getQueriesToUpdate({ id: '1', name: 'name updated' }),
      ).toEqual([
        {
          queryKey: 'query',
          data: [
            {
              id: '1',
              name: 'name updated',
            },
            {
              id: '2',
              name: 'name 2',
            },
          ],
        },
      ]);
    });

    it('works with one to one dependencies', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        self: {
          id: '1',
          name: 'name',
          surname: 'surname',
        },
      });

      expect(
        normalizer.getQueriesToUpdate({ id: '1', name: 'name updated' }),
      ).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '1',
            name: 'name updated',
            self: {
              id: '1',
              name: 'name updated',
              surname: 'surname',
            },
          },
        },
      ]);
    });

    it('works with null into object updates', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        nested: null,
      });

      expect(
        normalizer.getQueriesToUpdate({
          id: '1',
          nested: { id: '2', surname: 'surname' },
        }),
      ).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '1',
            name: 'name',
            nested: { id: '2', surname: 'surname' },
          },
        },
      ]);
    });

    it('works with objects into null updates', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        nested: { id: '2', surname: 'surname' },
      });

      expect(
        normalizer.getQueriesToUpdate({
          id: '1',
          nested: null,
        }),
      ).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '1',
            name: 'name',
            nested: null,
          },
        },
      ]);
    });

    it('does not return query if object did not change', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        surname: 'surname',
      });

      expect(
        normalizer.getQueriesToUpdate({
          id: '1',
          name: 'name',
        }),
      ).toEqual([]);
    });

    it('does not return query if mutation object is a superset', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
      });

      expect(
        normalizer.getQueriesToUpdate({
          id: '1',
          name: 'name',
          extraProperty: 'value',
        }),
      ).toEqual([]);
    });

    it('does not return query if both mutation data and query data have empty array', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        list: [],
      });

      expect(
        normalizer.getQueriesToUpdate({
          id: '1',
          list: [],
        }),
      ).toEqual([]);
    });

    it('returns query if mutation array is not empty and query array is empty', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        list: [],
      });

      expect(
        normalizer.getQueriesToUpdate({
          id: '1',
          list: [1],
        }),
      ).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '1',
            list: [1],
          },
        },
      ]);
    });

    it('returns query if mutation array is empty and query array is not empty', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        list: [1],
      });

      expect(
        normalizer.getQueriesToUpdate({
          id: '1',
          list: [],
        }),
      ).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '1',
            list: [],
          },
        },
      ]);
    });

    it('returns query if mutation array and query array item is different', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        list: [1],
      });

      expect(
        normalizer.getQueriesToUpdate({
          id: '1',
          list: [2],
        }),
      ).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '1',
            list: [2],
          },
        },
      ]);
    });

    it('returns query if mutation array and query array are of different length', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        list: [1, 2],
      });

      expect(
        normalizer.getQueriesToUpdate({
          id: '1',
          list: [1],
        }),
      ).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '1',
            list: [1],
          },
        },
      ]);
    });

    it('works with equal date objects', () => {
      const normalizer = createNormalizer();

      normalizer.setQuery('query', {
        id: '1',
        date: new Date(1),
      });

      expect(
        normalizer.getQueriesToUpdate({
          id: '1',
          date: new Date(1),
        }),
      ).toEqual([]);
    });

    it('works with different date objects', () => {
      const normalizer = createNormalizer();

      normalizer.setQuery('query', {
        id: '1',
        date: new Date(1),
      });

      expect(
        normalizer.getQueriesToUpdate({
          id: '1',
          date: new Date(2),
        }),
      ).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '1',
            date: new Date(2),
          },
        },
      ]);
    });

    it('supports remove array operation', () => {
      const normalizer = createNormalizer({
        getArrayType: ({ parentObj }) =>
          typeof parentObj?.type === 'string' ? parentObj.type : undefined,
      });
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        books: {
          type: 'books',
          nodes: [{ id: '2' }],
        },
      });

      expect(
        normalizer.getQueriesToUpdate(
          arrayHelpers.remove({ id: '2' }, 'books'),
        ),
      ).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '1',
            name: 'name',
            books: {
              type: 'books',
              nodes: [],
            },
          },
        },
      ]);
    });

    it('supports append array operation', () => {
      const normalizer = createNormalizer({
        getArrayType: ({ parentObj }) =>
          typeof parentObj?.type === 'string' ? parentObj.type : undefined,
      });
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        books: {
          type: 'books',
          nodes: [{ id: '2', title: 'title2' }],
        },
      });

      expect(
        normalizer.getQueriesToUpdate(
          arrayHelpers.append(
            {
              id: '3',
              title: 'title3',
            },
            'books',
          ),
        ),
      ).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '1',
            name: 'name',
            books: {
              type: 'books',
              nodes: [
                { id: '2', title: 'title2' },
                { id: '3', title: 'title3' },
              ],
            },
          },
        },
      ]);
    });

    it('supports append array operation with partial data', () => {
      const normalizer = createNormalizer({
        getArrayType: ({ parentObj }) =>
          typeof parentObj?.type === 'string' ? parentObj.type : undefined,
      });
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        books: {
          type: 'books',
          nodes: [{ id: '2', title: 'title2' }],
        },
      });
      normalizer.setQuery('query2', {
        id: '3',
        title: 'title3',
      });

      expect(
        normalizer.getQueriesToUpdate(
          arrayHelpers.append(
            {
              id: '3',
            },
            'books',
          ),
        ),
      ).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '1',
            name: 'name',
            books: {
              type: 'books',
              nodes: [
                { id: '2', title: 'title2' },
                { id: '3', title: 'title3' },
              ],
            },
          },
        },
      ]);
    });

    it('supports prepend array operation with partial data', () => {
      const normalizer = createNormalizer({
        getArrayType: ({ parentObj }) =>
          typeof parentObj?.type === 'string' ? parentObj.type : undefined,
      });
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        books: {
          type: 'books',
          nodes: [{ id: '2', title: 'title2' }],
        },
      });
      normalizer.setQuery('query2', {
        id: '0',
        title: 'title0',
      });

      expect(
        normalizer.getQueriesToUpdate(
          arrayHelpers.prepend(
            {
              id: '0',
            },
            'books',
          ),
        ),
      ).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '1',
            name: 'name',
            books: {
              type: 'books',
              nodes: [
                { id: '0', title: 'title0' },
                { id: '2', title: 'title2' },
              ],
            },
          },
        },
      ]);
    });

    it('supports insert array operation', () => {
      const normalizer = createNormalizer({
        getArrayType: ({ arrayKey }) => arrayKey,
      });
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        books: [
          { id: '2', title: 'title2' },
          { id: '3', title: 'title3' },
        ],
      });

      const result = normalizer.getQueriesToUpdate(
        arrayHelpers.insert({ id: '4', title: 'title4' }, 'books', {
          index: 1,
        }),
      );

      expect(result).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '1',
            name: 'name',
            books: [
              { id: '2', title: 'title2' },
              { id: '4', title: 'title4' },
              { id: '3', title: 'title3' },
            ],
          },
        },
      ]);
    });

    it('supports move array operation', () => {
      const normalizer = createNormalizer({
        getArrayType: ({ arrayKey }) => arrayKey,
      });
      normalizer.setQuery('query', {
        id: '0',
        name: 'name',
        books: [
          { id: '1', title: 'title1' },
          { id: '2', title: 'title2' },
          { id: '3', title: 'title3' },
        ],
      });

      const result = normalizer.getQueriesToUpdate(
        arrayHelpers.move({ id: '1' }, 'books', {
          toIndex: 2,
        }),
      );

      expect(result).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '0',
            name: 'name',
            books: [
              { id: '2', title: 'title2' },
              { id: '3', title: 'title3' },
              { id: '1', title: 'title1' },
            ],
          },
        },
      ]);
    });

    it('supports swap array operation', () => {
      const normalizer = createNormalizer({
        getArrayType: ({ arrayKey }) => arrayKey,
      });
      normalizer.setQuery('query', {
        id: '0',
        name: 'name',
        books: [
          { id: '1', title: 'title1' },
          { id: '2', title: 'title2' },
          { id: '3', title: 'title3' },
        ],
      });

      const result = normalizer.getQueriesToUpdate(
        arrayHelpers.swap({ id: '1' }, 'books', {
          toIndex: 2,
        }),
      );

      expect(result).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '0',
            name: 'name',
            books: [
              { id: '3', title: 'title3' },
              { id: '2', title: 'title2' },
              { id: '1', title: 'title1' },
            ],
          },
        },
      ]);
    });

    it('supports clear array operation', () => {
      const normalizer = createNormalizer({
        getArrayType: ({ arrayKey }) => arrayKey,
      });
      normalizer.setQuery('query', {
        id: '0',
        name: 'name',
        books: [
          { id: '1', title: 'title1' },
          { id: '2', title: 'title2' },
          { id: '3', title: 'title3' },
        ],
      });

      const result = normalizer.getQueriesToUpdate(arrayHelpers.clear('books'));

      expect(result).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '0',
            name: 'name',
            books: [],
          },
        },
      ]);
    });

    it('supports replace array operation', () => {
      const normalizer = createNormalizer({
        getArrayType: ({ arrayKey }) => arrayKey,
      });
      normalizer.setQuery('query', {
        id: '0',
        name: 'name',
        books: [
          { id: '1', title: 'title1' },
          { id: '2', title: 'title2' },
          { id: '3', title: 'title3' },
        ],
      });

      const result = normalizer.getQueriesToUpdate(
        arrayHelpers.replace({ id: '4', title: 'title4' }, 'books', {
          index: 2,
        }),
      );

      expect(result).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '0',
            name: 'name',
            books: [
              { id: '1', title: 'title1' },
              { id: '2', title: 'title2' },
              { id: '4', title: 'title4' },
            ],
          },
        },
      ]);
    });

    it('supports replaceAll array operation', () => {
      const normalizer = createNormalizer({
        getArrayType: ({ arrayKey }) => arrayKey,
      });
      normalizer.setQuery('query', {
        id: '0',
        name: 'name',
        books: [
          { id: '1', title: 'title1' },
          { id: '2', title: 'title2' },
          { id: '3', title: 'title3' },
        ],
      });

      const result = normalizer.getQueriesToUpdate(
        arrayHelpers.replaceAll('books', {
          value: [{ id: '4', title: 'title4' }],
        }),
      );

      expect(result).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '0',
            name: 'name',
            books: [{ id: '4', title: 'title4' }],
          },
        },
      ]);
    });

    it('can add queryKey to array type', () => {
      const normalizer = createNormalizer({
        getArrayType: ({ parentObj, queryKey }) =>
          typeof parentObj?.type === 'string'
            ? `${queryKey}:${parentObj.type}`
            : undefined,
      });
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        books: {
          type: 'books',
          nodes: [{ id: '2', title: 'title2' }],
        },
      });

      expect(
        normalizer.getQueriesToUpdate(
          arrayHelpers.append(
            {
              id: '3',
              title: 'title3',
            },
            'query:books',
          ),
        ),
      ).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '1',
            name: 'name',
            books: {
              type: 'books',
              nodes: [
                { id: '2', title: 'title2' },
                { id: '3', title: 'title3' },
              ],
            },
          },
        },
      ]);
    });

    it('clears excessive node props for append and prepend array operation', () => {
      const normalizer = createNormalizer({
        getArrayType: ({ parentObj }) =>
          typeof parentObj?.type === 'string' ? parentObj.type : undefined,
      });
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        books: {
          type: 'books',
          nodes: [{ id: '2', title: 'title2' }],
        },
        books2: {
          type: 'books2',
          nodes: [{ id: '2', title: 'title2' }],
        },
      });

      expect(
        normalizer.getQueriesToUpdate(
          arrayHelpers
            .chain({
              id: '3',
              title: 'title3',
              extraProperty: 'value',
            })
            .append('books')
            .prepend('books2')
            .apply(),
        ),
      ).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '1',
            name: 'name',
            books: {
              type: 'books',
              nodes: [
                { id: '2', title: 'title2' },
                { id: '3', title: 'title3' },
              ],
            },
            books2: {
              type: 'books2',
              nodes: [
                { id: '3', title: 'title3' },
                { id: '2', title: 'title2' },
              ],
            },
          },
        },
      ]);
    });

    it('supports clear array operation', () => {
      const normalizer = createNormalizer({
        getArrayType: ({ parentObj }) =>
          typeof parentObj?.type === 'string' ? parentObj.type : undefined,
      });
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        books: {
          type: 'books',
          nodes: [
            { id: '2', title: 'title2' },
            { id: '3', title: 'title3' },
          ],
        },
      });

      expect(
        normalizer.getQueriesToUpdate(arrayHelpers.clear('books')),
      ).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '1',
            name: 'name',
            books: {
              type: 'books',
              nodes: [],
            },
          },
        },
      ]);
    });

    it('supports clear multiple array types operation', () => {
      const normalizer = createNormalizer({
        getArrayType: ({ parentObj }) =>
          typeof parentObj?.type === 'string' ? parentObj.type : undefined,
      });
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        books: {
          type: 'books',
          nodes: [{ id: '2', title: 'title2' }],
        },
        authors: {
          type: 'authors',
          nodes: [{ id: '3', name: 'author3' }],
        },
      });

      expect(
        normalizer.getQueriesToUpdate([
          arrayHelpers.clear('books'),
          arrayHelpers.clear('authors'),
        ]),
      ).toEqual([
        {
          queryKey: 'query',
          data: {
            id: '1',
            name: 'name',
            books: {
              type: 'books',
              nodes: [],
            },
            authors: {
              type: 'authors',
              nodes: [],
            },
          },
        },
      ]);
    });

    it('supports arays within arrays', () => {
      const normalizer = createNormalizer({
        getArrayType: ({ parentObj, arrayKey }) =>
          typeof parentObj?.type === 'string' && arrayKey === 'nodes'
            ? parentObj.type
            : undefined,
      });
      normalizer.setQuery('query', {
        books: {
          type: 'books',
          nodes: [
            {
              id: '1',
              title: 'title1',
              authors: {
                type: 'authors:1',
                nodes: [{ id: '11', name: 'author11' }],
              },
            },
            {
              id: '2',
              title: 'title2',
              authors: {
                type: 'authors:2',
                nodes: [{ id: '21', name: 'author21' }],
              },
            },
          ],
        },
      });

      expect(
        normalizer.getQueriesToUpdate([
          arrayHelpers.append(
            {
              id: '3',
              title: 'title3',
              authors: {
                type: 'authors:3',
                nodes: [{ id: '31', name: 'author31' }],
              },
            },
            'books',
          ),
          arrayHelpers.append(
            {
              id: '12',
              name: 'author12',
            },
            'authors:1',
          ),
          arrayHelpers.prepend(
            {
              id: '20',
              name: 'author20',
            },
            'authors:2',
          ),
        ]),
      ).toEqual([
        {
          queryKey: 'query',
          data: {
            books: {
              type: 'books',
              nodes: [
                {
                  id: '1',
                  title: 'title1',
                  authors: {
                    type: 'authors:1',
                    nodes: [
                      { id: '11', name: 'author11' },
                      { id: '12', name: 'author12' },
                    ],
                  },
                },
                {
                  id: '2',
                  title: 'title2',
                  authors: {
                    type: 'authors:2',
                    nodes: [
                      { id: '20', name: 'author20' },
                      { id: '21', name: 'author21' },
                    ],
                  },
                },
                {
                  id: '3',
                  title: 'title3',
                  authors: {
                    type: 'authors:3',
                    nodes: [{ id: '31', name: 'author31' }],
                  },
                },
              ],
            },
          },
        },
      ]);
    });

    it('supports custom operations', () => {
      const customArrayHelpers = createArrayHelpers({
        nodelessOperations: {
          reverse: (arrayType: string) => ({
            __reverse: { arrayTypes: arrayType },
          }),

          replaceAllWith: (
            arrayType: string,
            config: { value: DataObject[] },
          ) => ({
            __replaceAllWith: {
              arrayTypes: arrayType,
              value: config.value,
            },
          }),
        },

        nodeOperations: {
          push: <N extends Record<string, unknown>>(
            node: N,
            arrayType: string,
          ): N => ({
            ...node,
            __push: Array.isArray(node.__push)
              ? [...(node.__push as string[]), arrayType]
              : [arrayType],
          }),

          replaceWith: <N extends Record<string, unknown>>(
            node: N,
            arrayType: string,
            config: { index: number },
          ): N => ({
            ...node,
            __replaceWith: Array.isArray(node.__replaceWith)
              ? [
                  ...(node.__replaceWith as string[]),
                  { arrayType, index: config.index },
                ]
              : [{ arrayType, index: config.index }],
          }),
        },
      });

      const normalizer = createNormalizer({
        getArrayType: ({ parentObj }) =>
          typeof parentObj?.type === 'string' ? parentObj.type : undefined,
        customArrayOperations: {
          __push: props => [...props.array, props.operation.node],
          __replaceWith: props =>
            typeof props.operation.props?.index === 'number'
              ? props.array.map((item, index) =>
                  index === props.operation.props?.index
                    ? props.operation.node
                    : item,
                )
              : props.array,
          __reverse: props => [...props.array].reverse(),
          __replaceAllWith: props =>
            (props.operation.props?.value as ReadonlyArray<DataObject>) ??
            props.array,
        },
      });
      normalizer.setQuery('query', {
        books: {
          type: 'books',
          nodes: [
            { id: '1', title: 'title1' },
            { id: '2', title: 'title2' },
          ],
        },
        authors: {
          type: 'authors',
          nodes: [
            { id: '3', name: 'author3' },
            { id: '4', name: 'author4' },
          ],
        },
        authors2: {
          type: 'authors2',
          nodes: [{ id: '10', name: 'author10' }],
        },
      });

      expect(
        normalizer.getQueriesToUpdate([
          customArrayHelpers
            .chain({ id: '5', name: 'author5' })
            .push('authors')
            .apply(),
          customArrayHelpers.reverse('books'),
          customArrayHelpers.replaceWith(
            { id: '6', name: 'author6' },
            'authors',
            { index: 0 },
          ),
          customArrayHelpers.replaceAllWith('authors2', {
            value: [{ id: '11', name: 'author11' }],
          }),
        ]),
      ).toEqual([
        {
          queryKey: 'query',
          data: {
            books: {
              type: 'books',
              nodes: [
                { id: '2', title: 'title2' },
                { id: '1', title: 'title1' },
              ],
            },
            authors: {
              type: 'authors',
              nodes: [
                { id: '6', name: 'author6' },
                { id: '4', name: 'author4' },
                { id: '5', name: 'author5' },
              ],
            },
            authors2: {
              type: 'authors2',
              nodes: [{ id: '11', name: 'author11' }],
            },
          },
        },
      ]);
    });
  });

  describe('clearNormalizedData', () => {
    it('clears normalized data', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', { id: '1', name: 'name' });
      normalizer.clearNormalizedData();

      expect(normalizer.getNormalizedData()).toEqual({
        queries: {},
        objects: {},
        dependentQueries: {},
        queriesWithArrays: {},
      });
    });
  });

  describe('getObjectById', () => {
    it('gets object without dependencies', () => {
      const normalizer = createNormalizer(
        {},
        {
          queries: {
            query: {
              data: '@@1',
              dependencies: ['@@1'],
              usedKeys: { '': ['id', 'name'] },
              arrayTypes: [],
            },
          },
          objects: { '@@1': { id: '1', name: 'name' } },
          dependentQueries: { '@@1': ['query'] },
          queriesWithArrays: {},
        },
      );

      expect(normalizer.getObjectById('1')).toEqual({ id: '1', name: 'name' });
    });

    it('returns undefined if object not found', () => {
      const normalizer = createNormalizer(
        {},
        {
          queries: {
            query: {
              data: '@@1',
              dependencies: ['@@1'],
              usedKeys: { '': ['id', 'name'] },
              arrayTypes: [],
            },
          },
          objects: { '@@1': { id: '1', name: 'name' } },
          dependentQueries: { '@@1': ['query'] },
          queriesWithArrays: {},
        },
      );

      expect(normalizer.getObjectById('2')).toBe(undefined);
    });

    it('gets object with dependencies', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        nested: {
          id: '2',
          key: 'value',
        },
      });

      expect(normalizer.getObjectById('1')).toEqual({
        id: '1',
        name: 'name',
        nested: {
          id: '2',
          key: 'value',
        },
      });
    });

    it('fails for self dependencies', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        self: {
          id: '1',
          name: 'name',
          surname: 'surname',
        },
      });

      expect(normalizer.getObjectById('1')).toBe(undefined);
    });

    it('allows defining data structure', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        nested: {
          id: '2',
          key: 'value',
        },
      });

      expect(normalizer.getObjectById('1', { id: '', name: '' })).toEqual({
        id: '1',
        name: 'name',
      });
    });

    it('works with self dependencies with defined data structure', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        self: {
          id: '1',
          name: 'name',
          surname: 'surname',
        },
      });

      expect(
        normalizer.getObjectById('1', {
          id: '',
          self: {
            id: '',
            name: '',
          },
        }),
      ).toEqual({
        id: '1',
        self: {
          id: '1',
          name: 'name',
        },
      });
    });
  });

  describe('getQueryFragment', () => {
    it('gets fragment with two objects', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
      });
      normalizer.setQuery('query2', {
        id: '2',
        name: 'name2',
      });

      expect(normalizer.getQueryFragment([getId('1'), getId('2')])).toEqual([
        {
          id: '1',
          name: 'name',
        },
        {
          id: '2',
          name: 'name2',
        },
      ]);
    });

    it('gets undefined for a missing object', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
      });

      expect(normalizer.getQueryFragment([getId('1'), getId('2')])).toEqual([
        {
          id: '1',
          name: 'name',
        },
        undefined,
      ]);
    });

    it('allows defining data structure', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        surname: 'surname',
      });

      expect(
        normalizer.getQueryFragment(
          [getId('1'), getId('2')],
          [{ id: '', name: '' }],
        ),
      ).toEqual([
        {
          id: '1',
          name: 'name',
        },
        undefined,
      ]);
    });

    it('returns undefined and shows warning for recursive dependencies', () => {
      const normalizer = createNormalizer();

      normalizer.setQuery('query', {
        id: '1',
        name: 'User 1',
        bestFriend: {
          id: '2',
          name: 'User 2',
          bestFriend: {
            id: '1',
            name: 'User 1',
            bestFriend: {
              id: '2',
              name: 'User 2',
            },
          },
        },
      });

      const originalLog = console.log;
      const logSpy = jest.fn();
      console.log = logSpy;

      try {
        const result = normalizer.getQueryFragment([getId('1')]);

        expect(result).toBe(undefined);
        expect(logSpy).toHaveBeenCalledWith(
          'Recursive dependency detected. Pass example object as second argument.',
        );
      } finally {
        console.log = originalLog;
      }
    });

    it('works correctly with recursive dependencies when example object is provided', () => {
      const normalizer = createNormalizer();

      normalizer.setQuery('query', {
        id: '1',
        name: 'User 1',
        bestFriend: {
          id: '2',
          name: 'User 2',
          bestFriend: {
            id: '1',
            name: 'User 1',
          },
        },
      });

      const result = normalizer.getQueryFragment(
        [getId('1')],
        [{ id: '', name: '', bestFriend: { id: '', name: '' } }],
      );

      expect(result).toEqual([
        {
          id: '1',
          name: 'User 1',
          bestFriend: {
            id: '2',
            name: 'User 2',
          },
        },
      ]);
    });
  });

  describe('getDependentQueriesById', () => {
    it('gets queries for 1 object', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        nested: null,
      });
      normalizer.setQuery('query2', {
        id: '2',
        name: 'name2',
        nested: null,
      });
      normalizer.setQuery('query3', {
        id: '3',
        name: 'name2',
        nested: { id: '1' },
      });

      expect(normalizer.getDependentQueriesByIds(['1'])).toEqual([
        'query',
        'query3',
      ]);
    });

    it('gets queries for 2 objects', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        nested: null,
      });
      normalizer.setQuery('query2', {
        id: '2',
        name: 'name2',
        nested: null,
      });
      normalizer.setQuery('query3', {
        id: '3',
        name: 'name3',
        nested: { id: '1' },
      });
      normalizer.setQuery('query4', {
        id: '4',
        name: 'name4',
        nested: null,
      });

      expect(normalizer.getDependentQueriesByIds(['1', '2'])).toEqual([
        'query',
        'query3',
        'query2',
      ]);
    });
  });

  describe('getDependentQueries', () => {
    it('gets queries for 1 object', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        nested: null,
      });
      normalizer.setQuery('query2', {
        id: '2',
        name: 'name2',
        nested: null,
      });
      normalizer.setQuery('query3', {
        id: '3',
        name: 'name2',
        nested: { id: '1' },
      });

      expect(normalizer.getDependentQueries({ id: '1' })).toEqual([
        'query',
        'query3',
      ]);
    });

    it('gets queries for 2 objects, for array and nested object', () => {
      const normalizer = createNormalizer();
      normalizer.setQuery('query', {
        id: '1',
        name: 'name',
        nested: null,
      });
      normalizer.setQuery('query2', {
        id: '2',
        name: 'name2',
        nested: null,
      });
      normalizer.setQuery('query3', {
        id: '3',
        name: 'name3',
        nested: { id: '1' },
      });
      normalizer.setQuery('query4', {
        id: '4',
        name: 'name4',
        nested: null,
      });

      expect(
        normalizer.getDependentQueries([
          { id: '1', nested: { id: '2' } },
          { id: '5' },
        ]),
      ).toEqual(['query', 'query3', 'query2']);
    });
  });
});
