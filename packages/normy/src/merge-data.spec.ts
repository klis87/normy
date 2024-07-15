import { mergeData } from './merge-data';

describe('mergeData', () => {
  it('merges data', () => {
    expect(mergeData({ x: 1, y: { a: 2, b: 3 } }, { x: 4 })).toEqual({
      x: 4,
      y: { a: 2, b: 3 },
    });
  });

  it('deeply merges data', () => {
    expect(mergeData({ x: 1, y: { a: 2, b: 3 } }, { y: { b: 4 } })).toEqual({
      x: 1,
      y: { a: 2, b: 4 },
    });
  });

  it('does not mutate params', () => {
    const firstParam = { x: 1, y: { a: 2, b: 3 } };
    const secondParam = { x: 1, y: { a: 2, b: 4 }, z: 5 };

    mergeData(firstParam, secondParam);

    expect(firstParam).toEqual({ x: 1, y: { a: 2, b: 3 } });
    expect(secondParam).toEqual({ x: 1, y: { a: 2, b: 4 }, z: 5 });
  });
});
