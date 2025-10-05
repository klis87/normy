import { createArrayHelpers, arrayHelpers } from './array-helpers';

describe('createArrayHelpers', () => {
  const testNode = { id: 1, name: 'test' };

  describe('Base Operations', () => {
    test('remove operation', () => {
      const result = arrayHelpers.remove(testNode, 'items');
      expect(result).toEqual({
        id: 1,
        name: 'test',
        __remove: ['items'],
      });
    });

    test('append operation', () => {
      const result = arrayHelpers.append(testNode, 'items');
      expect(result).toEqual({
        id: 1,
        name: 'test',
        __append: ['items'],
      });
    });

    test('prepend operation', () => {
      const result = arrayHelpers.prepend(testNode, 'items');
      expect(result).toEqual({
        id: 1,
        name: 'test',
        __prepend: ['items'],
      });
    });

    test('insert operation', () => {
      const result = arrayHelpers.insert(testNode, 'items', { index: 2 });
      expect(result).toEqual({
        id: 1,
        name: 'test',
        __insert: [{ arrayType: 'items', index: 2 }],
      });
    });

    test('replace operation', () => {
      const result = arrayHelpers.replace(testNode, 'items', { index: 1 });
      expect(result).toEqual({
        id: 1,
        name: 'test',
        __replace: [{ arrayType: 'items', index: 1 }],
      });
    });

    test('move operation', () => {
      const result = arrayHelpers.move(testNode, 'items', { toIndex: 3 });
      expect(result).toEqual({
        id: 1,
        name: 'test',
        __move: [{ arrayType: 'items', toIndex: 3 }],
      });
    });

    test('swap operation', () => {
      const result = arrayHelpers.swap(testNode, 'items', { toIndex: 2 });
      expect(result).toEqual({
        id: 1,
        name: 'test',
        __swap: [{ arrayType: 'items', toIndex: 2 }],
      });
    });

    test('clear operation', () => {
      const result = arrayHelpers.clear('items');
      expect(result).toEqual({
        __clear: 'items',
      });
    });

    test('replaceAll operation', () => {
      const newItems = [{ id: 1 }, { id: 2 }];
      const result = arrayHelpers.replaceAll('items', { value: newItems });
      expect(result).toEqual({
        __replaceAll: { arrayTypes: 'items', value: newItems },
      });
    });
  });

  describe('Base Operations - chaining', () => {
    test('remove operation', () => {
      expect(arrayHelpers.chain(testNode).remove('items').apply()).toEqual({
        id: 1,
        name: 'test',
        __remove: ['items'],
      });

      expect(
        arrayHelpers.chain(testNode).remove('items').remove('items2').apply(),
      ).toEqual({
        id: 1,
        name: 'test',
        __remove: ['items', 'items2'],
      });
    });

    test('append operation', () => {
      expect(arrayHelpers.chain(testNode).append('items').apply()).toEqual({
        id: 1,
        name: 'test',
        __append: ['items'],
      });

      expect(
        arrayHelpers.chain(testNode).append('items').append('items2').apply(),
      ).toEqual({
        id: 1,
        name: 'test',
        __append: ['items', 'items2'],
      });
    });

    test('prepend operation', () => {
      expect(arrayHelpers.chain(testNode).prepend('items').apply()).toEqual({
        id: 1,
        name: 'test',
        __prepend: ['items'],
      });

      expect(
        arrayHelpers.chain(testNode).prepend('items').prepend('items2').apply(),
      ).toEqual({
        id: 1,
        name: 'test',
        __prepend: ['items', 'items2'],
      });
    });

    test('insert operation', () => {
      expect(
        arrayHelpers.chain(testNode).insert('items', { index: 1 }).apply(),
      ).toEqual({
        id: 1,
        name: 'test',
        __insert: [{ arrayType: 'items', index: 1 }],
      });

      expect(
        arrayHelpers
          .chain(testNode)
          .insert('items', { index: 1 })
          .insert('items2', { index: 2 })
          .apply(),
      ).toEqual({
        id: 1,
        name: 'test',
        __insert: [
          { arrayType: 'items', index: 1 },
          { arrayType: 'items2', index: 2 },
        ],
      });
    });

    test('replace operation', () => {
      expect(
        arrayHelpers.chain(testNode).replace('items', { index: 1 }).apply(),
      ).toEqual({
        id: 1,
        name: 'test',
        __replace: [{ arrayType: 'items', index: 1 }],
      });

      expect(
        arrayHelpers
          .chain(testNode)
          .replace('items', { index: 1 })
          .replace('items2', { index: 2 })
          .apply(),
      ).toEqual({
        id: 1,
        name: 'test',
        __replace: [
          { arrayType: 'items', index: 1 },
          { arrayType: 'items2', index: 2 },
        ],
      });
    });

    test('move operation', () => {
      expect(
        arrayHelpers.chain(testNode).move('items', { toIndex: 3 }).apply(),
      ).toEqual({
        id: 1,
        name: 'test',
        __move: [{ arrayType: 'items', toIndex: 3 }],
      });

      expect(
        arrayHelpers
          .chain(testNode)
          .move('items', { toIndex: 1 })
          .move('items2', { toIndex: 2 })
          .apply(),
      ).toEqual({
        id: 1,
        name: 'test',
        __move: [
          { arrayType: 'items', toIndex: 1 },
          { arrayType: 'items2', toIndex: 2 },
        ],
      });
    });

    test('swap operation', () => {
      expect(
        arrayHelpers.chain(testNode).swap('items', { toIndex: 3 }).apply(),
      ).toEqual({
        id: 1,
        name: 'test',
        __swap: [{ arrayType: 'items', toIndex: 3 }],
      });

      expect(
        arrayHelpers
          .chain(testNode)
          .swap('items', { toIndex: 1 })
          .swap('items2', { toIndex: 2 })
          .apply(),
      ).toEqual({
        id: 1,
        name: 'test',
        __swap: [
          { arrayType: 'items', toIndex: 1 },
          { arrayType: 'items2', toIndex: 2 },
        ],
      });
    });

    test('clear operation should not be chainable', () => {
      const chain = arrayHelpers.chain({ id: 1, name: 'test' });
      expect('clear' in chain).toBe(false);
    });

    test('replaceAll operation should not be chainable', () => {
      const chain = arrayHelpers.chain({ id: 1, name: 'test' });
      expect('replaceAll' in chain).toBe(false);
    });
  });

  describe('Custom Operations', () => {
    const helpers = createArrayHelpers({
      nodelessOperations: {
        sort: (arrayType: string) => ({
          __sort: arrayType,
        }),
        replaceWith: (arrayType: string, value: unknown) => ({
          __replaceWith: arrayType,
          value,
        }),
      },
      nodeOperations: {
        inject: <N extends Record<string, unknown>>(
          nodeParam: N,
          arrayType: string,
          config: { index: number },
        ): N => ({
          ...nodeParam,
          __inject: { arrayType, index: config.index },
        }),
        reverse: <N extends Record<string, unknown>>(
          nodeParam: N,
          arrayType: string,
        ): N => ({
          ...nodeParam,
          __reverse: arrayType,
        }),
      },
    });

    test('sort custom operation (nodeless)', () => {
      const result = helpers.sort('items');
      expect(result).toEqual({
        __sort: 'items',
      });
    });

    test('inject custom operation (chainable)', () => {
      const result = helpers.inject(testNode, 'items', { index: 5 });
      expect(result).toEqual({
        id: 1,
        name: 'test',
        __inject: { arrayType: 'items', index: 5 },
      });
    });

    test('reverse custom operation (chainable)', () => {
      const result = helpers.reverse(testNode, 'items');
      expect(result).toEqual({
        id: 1,
        name: 'test',
        __reverse: 'items',
      });
    });

    test('replaceWith custom operation (nodeless)', () => {
      const result = helpers.replaceWith('items', [1, 2, 3]);
      expect(result).toEqual({
        __replaceWith: 'items',
        value: [1, 2, 3],
      });
    });

    test('includes all base operations', () => {
      expect(typeof helpers.remove).toBe('function');
      expect(typeof helpers.append).toBe('function');
      expect(typeof helpers.prepend).toBe('function');
      expect(typeof helpers.insert).toBe('function');
      expect(typeof helpers.replace).toBe('function');
      expect(typeof helpers.move).toBe('function');
      expect(typeof helpers.swap).toBe('function');
      expect(typeof helpers.clear).toBe('function');
      expect(typeof helpers.replaceAll).toBe('function');
    });
  });

  describe('Chain Operations - Base Only', () => {
    const baseHelpers = createArrayHelpers();

    test('single operation chain', () => {
      const result = baseHelpers.chain(testNode).append('items').apply();

      expect(result).toEqual({
        id: 1,
        name: 'test',
        __append: ['items'],
      });
    });

    test('multiple operations chain', () => {
      const result = baseHelpers
        .chain(testNode)
        .append('items')
        .remove('oldItems')
        .remove('oldItems2')
        .insert('newItems', { index: 2 })
        .apply();

      expect(result).toEqual({
        id: 1,
        name: 'test',
        __append: ['items'],
        __remove: ['oldItems', 'oldItems2'],
        __insert: [{ arrayType: 'newItems', index: 2 }],
      });
    });

    test('operations with configs', () => {
      const result = baseHelpers
        .chain(testNode)
        .insert('items', { index: 1 })
        .replace('items', { index: 2 })
        .move('items', { toIndex: 3 })
        .swap('items', { toIndex: 4 })
        .apply();

      expect(result).toEqual({
        id: 1,
        name: 'test',
        __insert: [{ arrayType: 'items', index: 1 }],
        __replace: [{ arrayType: 'items', index: 2 }],
        __move: [{ arrayType: 'items', toIndex: 3 }],
        __swap: [{ arrayType: 'items', toIndex: 4 }],
      });
    });

    test('chain does NOT include clear and replaceAll (they are standalone)', () => {
      const chain = baseHelpers.chain(testNode);
      expect('clear' in chain).toBe(false);
      expect('replaceAll' in chain).toBe(false);
    });
  });

  describe('Chain Operations - With Custom Operations', () => {
    const chainHelpers = createArrayHelpers({
      nodelessOperations: {
        reverse: (nodeParam: Record<string, unknown>, arrayType: string) => ({
          ...nodeParam,
          __reverse: arrayType,
        }),
      },
      nodeOperations: {
        inject: (
          nodeParam: Record<string, unknown>,
          arrayType: string,
          config: { index: number },
        ) => ({
          ...nodeParam,
          __inject: { arrayType, index: config.index },
        }),
      },
    });

    test('chain with custom operations', () => {
      const result = chainHelpers
        .chain(testNode)
        .append('items')
        .inject('items', { index: 3 })
        .apply();

      expect(result).toEqual({
        id: 1,
        name: 'test',
        __append: ['items'],
        __inject: { arrayType: 'items', index: 3 },
      });
    });

    test('complex chain mixing base and custom operations', () => {
      const result = chainHelpers
        .chain(testNode)
        .prepend('newItems')
        .insert('middleItems', { index: 1 })
        .replace('items', { index: 0 })
        .inject('items', { index: 2 })
        .apply();

      expect(result).toEqual({
        id: 1,
        name: 'test',
        __prepend: ['newItems'],
        __insert: [{ arrayType: 'middleItems', index: 1 }],
        __replace: [{ arrayType: 'items', index: 0 }],
        __inject: { arrayType: 'items', index: 2 },
      });
    });

    test('custom operations requiring configs work in chain', () => {
      const result = chainHelpers
        .chain(testNode)
        .inject('items', { index: 5 })
        .apply();

      expect(result).toEqual({
        id: 1,
        name: 'test',
        __inject: { arrayType: 'items', index: 5 },
      });
    });
  });
});
