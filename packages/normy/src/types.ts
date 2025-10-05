export type DataPrimitive = string | number | boolean | null | undefined | Date;

export type DataPrimitiveArray =
  | string[]
  | number[]
  | boolean[]
  | null[]
  | undefined[]
  | Date[];

export type DataObject = {
  // eslint-disable-next-line no-use-before-define
  [index: string]: Data;
};

export type Data =
  | DataPrimitive
  | DataObject
  | DataPrimitiveArray
  | DataObject[];

export type NormalizerConfig = {
  getNormalizationObjectKey?: (obj: DataObject) => string | undefined;
  devLogging?: boolean;
  structuralSharing?: boolean;
  getArrayType?: (props: {
    array: ReadonlyArray<DataObject>;
    queryKey: string;
    parentObj?: DataObject;
    arrayKey?: string; // this is parentObj key that contains the array
  }) => string | undefined;
  // eslint-disable-next-line no-use-before-define
  customArrayOperations?: ArrayOperations;
};

export type ArrayOperation = {
  arrayType: string;
  type: string;
  props?: Record<string, unknown>;
  node: DataObject;
};

export type ArrayOperations = {
  [operationName: string]: (props: {
    array: ReadonlyArray<DataObject>;
    operation: ArrayOperation;
    config: Required<NormalizerConfig>;
    getObjectById: (
      id: string,
      exampleObject?: DataObject,
    ) => DataObject | undefined;
  }) => ReadonlyArray<DataObject>;
};

export type UsedKeys = { [path: string]: ReadonlyArray<string> };

export type NormalizedData = {
  queries: {
    [queryKey: string]: {
      data: Data;
      dependencies: ReadonlyArray<string>;
      usedKeys: UsedKeys;
      arrayTypes: ReadonlyArray<string>;
    };
  };
  objects: { [objectId: string]: DataObject };
  dependentQueries: { [objectId: string]: ReadonlyArray<string> };
  queriesWithArrays: { [arrayType: string]: ReadonlyArray<string> };
};
