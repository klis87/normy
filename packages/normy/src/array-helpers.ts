import { DataObject } from './types';

export const createArrayHelpers = <
  NodelessOps extends Record<string, unknown>,
  NodeOps extends Record<string, unknown>,
>(
  props: {
    nodelessOperations?: NodelessOps;
    nodeOperations?: NodeOps;
  } = {},
) => {
  const { nodelessOperations, nodeOperations } = props;

  const baseHelpers = {
    remove: <N extends Record<string, unknown>>(
      node: N,
      arrayType: string,
    ): N => ({
      ...node,
      __remove: Array.isArray(node.__remove)
        ? [...(node.__remove as string[]), arrayType]
        : [arrayType],
    }),

    append: <N extends Record<string, unknown>>(
      node: N,
      arrayType: string,
    ): N => ({
      ...node,
      __append: Array.isArray(node.__append)
        ? [...(node.__append as string[]), arrayType]
        : [arrayType],
    }),

    prepend: <N extends Record<string, unknown>>(
      node: N,
      arrayType: string,
    ): N => ({
      ...node,
      __prepend: Array.isArray(node.__prepend)
        ? [...(node.__prepend as string[]), arrayType]
        : [arrayType],
    }),

    insert: <N extends Record<string, unknown>>(
      node: N,
      arrayType: string,
      config: { index: number },
    ): N => ({
      ...node,
      __insert: Array.isArray(node.__insert)
        ? [...(node.__insert as unknown[]), { arrayType, index: config.index }]
        : [{ arrayType, index: config.index }],
    }),

    replace: <N extends Record<string, unknown>>(
      node: N,
      arrayType: string,
      config: { index: number },
    ): N => ({
      ...node,
      __replace: Array.isArray(node.__replace)
        ? [...(node.__replace as unknown[]), { arrayType, index: config.index }]
        : [{ arrayType, index: config.index }],
    }),

    move: <N extends Record<string, unknown>>(
      node: N,
      arrayType: string,
      config: { toIndex: number },
    ): N => ({
      ...node,
      __move: Array.isArray(node.__move)
        ? [
            ...(node.__move as unknown[]),
            { arrayType, toIndex: config.toIndex },
          ]
        : [{ arrayType, toIndex: config.toIndex }],
    }),

    swap: <N extends Record<string, unknown>>(
      node: N,
      arrayType: string,
      config: { toIndex: number },
    ): N => ({
      ...node,
      __swap: Array.isArray(node.__swap)
        ? [
            ...(node.__swap as unknown[]),
            { arrayType, toIndex: config.toIndex },
          ]
        : [{ arrayType, toIndex: config.toIndex }],
    }),

    clear: (arrayType: string) => ({
      __clear: arrayType,
    }),

    replaceAll: (arrayType: string, config: { value: DataObject[] }) => ({
      __replaceAll: { arrayTypes: arrayType, value: config.value },
    }),
  } as const;

  const helpers = {
    ...baseHelpers,
    ...(nodelessOperations || ({} as NodelessOps)),
    ...(nodeOperations || ({} as NodeOps)),
  } as typeof baseHelpers & NodelessOps & NodeOps;

  // Extract parameter types from chainable operations, excluding the first 'node' parameter
  type ChainOpParams<T> = T extends (
    node: Record<string, unknown>,
    ...args: infer P
  ) => Record<string, unknown>
    ? P
    : never;

  type ChainApi<N> = {
    apply: () => N;
    // Base chainable operations (exclude clear and replaceAll which don't take node)
    remove: (arrayType: string) => ChainApi<N>;
    append: (arrayType: string) => ChainApi<N>;
    prepend: (arrayType: string) => ChainApi<N>;
    insert: (arrayType: string, config: { index: number }) => ChainApi<N>;
    replace: (arrayType: string, config: { index: number }) => ChainApi<N>;
    move: (arrayType: string, config: { toIndex: number }) => ChainApi<N>;
    swap: (arrayType: string, config: { toIndex: number }) => ChainApi<N>;
  } & {
    [K in keyof NodeOps]: (...args: ChainOpParams<NodeOps[K]>) => ChainApi<N>;
  };

  const callHelper = (
    fn: (
      node: Record<string, unknown>,
      ...args: ReadonlyArray<unknown>
    ) => Record<string, unknown>,
    current: Record<string, unknown>,
    args: ReadonlyArray<unknown>,
  ): Record<string, unknown> => fn(current, ...args);

  const chain = <N extends Record<string, unknown>>(node: N): ChainApi<N> => {
    const create = (current: N): ChainApi<N> => {
      const api: Record<string, unknown> & { apply: () => N } = {
        apply: () => current,
      };

      (
        [
          'remove',
          'append',
          'prepend',
          'insert',
          'replace',
          'move',
          'swap',
        ] as const
      ).forEach(key => {
        const fn = helpers[key] as unknown as (
          n: Record<string, unknown>,
          ...a: ReadonlyArray<unknown>
        ) => Record<string, unknown>;

        (api as Record<string, unknown>)[key] = (
          ...args: ReadonlyArray<unknown>
        ) => create(callHelper(fn, current, args) as N);
      });

      Object.keys(nodeOperations || {}).forEach(key => {
        (api as Record<string, unknown>)[key] = (
          ...args: ReadonlyArray<unknown>
        ) => {
          const fn = helpers[key] as (
            ...params: unknown[]
          ) => Record<string, unknown>;
          const result = fn(current, ...args);
          return create(result as N);
        };
      });

      return api as ChainApi<N>;
    };

    return create(node);
  };

  return {
    ...helpers,
    chain,
  } as typeof baseHelpers & NodelessOps & NodeOps & { chain: typeof chain };
};

export const arrayHelpers = createArrayHelpers({});
