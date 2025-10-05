import {
  ArrayOperation,
  ArrayOperations,
  Data,
  DataObject,
  NormalizerConfig,
} from './types';
import { warning } from './warning';

function isStringArray(arr: unknown[]): arr is string[] {
  return arr.every(item => typeof item === 'string');
}

function isObject(item: unknown): item is {
  arrayTypes: string | ReadonlyArray<string>;
  [key: string]: unknown;
} {
  return (
    typeof item === 'object' &&
    item !== null &&
    'arrayTypes' in item &&
    (typeof item.arrayTypes === 'string' || Array.isArray(item.arrayTypes))
  );
}

function isObjectArray(
  arr: unknown[],
): arr is { arrayType: string; [key: string]: unknown }[] {
  return arr.every(
    item =>
      typeof item === 'object' &&
      item !== null &&
      'arrayType' in item &&
      typeof item.arrayType === 'string',
  );
}

const filterExcessiveProps = (
  operationNode: DataObject,
  template: DataObject,
): DataObject => {
  const filteredNode: DataObject = {};

  Object.keys(template).forEach(key => {
    if (key in operationNode) {
      filteredNode[key] = operationNode[key];
    }
  });

  return filteredNode;
};

const validateArrayStructureConsistency = (
  node: DataObject,
  templateArray: ReadonlyArray<DataObject>,
  operationType: string,
  arrayType: string,
): void => {
  if (templateArray.length === 0 || !node) {
    return;
  }

  const templateKeys = Object.keys(templateArray[0]);
  const nodeKeys = Object.keys(node);
  const missingKeys = templateKeys.filter(key => !nodeKeys.includes(key));

  warning(
    missingKeys.length > 0,
    `Array item for ${operationType} operation on array type "${arrayType}" is missing required properties: ${missingKeys.join(
      ', ',
    )}. ` +
      `All array items must have consistent structure for proper denormalization. ` +
      `Expected properties: ${templateKeys.join(', ')}, got: ${nodeKeys.join(
        ', ',
      )}`,
  );
};

const arrayOperations: ArrayOperations = {
  __insert: ({ array, operation, config, getObjectById }) => {
    if (
      operation.props?.index === undefined ||
      typeof operation.props.index !== 'number'
    ) {
      warning(true, 'Index is required for insert operation.');
      return array;
    }

    let insertIndex = operation.props.index;

    if (insertIndex < 0) {
      insertIndex = array.length + insertIndex + 1;

      if (insertIndex < 0) {
        insertIndex = 0;
      }
    } else if (insertIndex > array.length) {
      insertIndex = array.length;
    }

    const objectKey = config.getNormalizationObjectKey(
      operation.node,
    ) as string;

    const existingIndex = array.findIndex(item => {
      if (typeof item !== 'object' || item === null) {
        return false;
      }

      return config.getNormalizationObjectKey(item) === objectKey;
    });

    if (existingIndex !== -1) {
      warning(
        true,
        `Item with key ${objectKey} already exists in array at index ${existingIndex}.`,
      );
      return array;
    }

    const node =
      array.length === 0
        ? operation.node
        : {
            ...filterExcessiveProps(operation.node, array[0]),
            ...getObjectById(objectKey, array[0]),
          };

    validateArrayStructureConsistency(
      node,
      array,
      operation.type,
      operation.arrayType,
    );

    return [...array.slice(0, insertIndex), node, ...array.slice(insertIndex)];
  },
  __append: ({ array, operation, config, getObjectById }) =>
    arrayOperations.__insert({
      array,
      operation: {
        ...operation,
        props: { ...operation.props, index: array.length },
      },
      config,
      getObjectById,
    }),
  __prepend: ({ array, operation, config, getObjectById }) =>
    arrayOperations.__insert({
      array,
      operation: {
        ...operation,
        props: { ...operation.props, index: 0 },
      },
      config,
      getObjectById,
    }),
  __remove: ({ array, operation, config }) => {
    const objectKey = config.getNormalizationObjectKey(operation.node);

    return array.filter(item => {
      if (typeof item !== 'object' || item === null) {
        return true;
      }

      return config.getNormalizationObjectKey(item) !== objectKey;
    });
  },
  __clear: () => [],
  __replaceAll: ({ array, operation }) => {
    if (!Array.isArray(operation.props?.value)) {
      warning(true, 'Value is required for replaceAll operation.');
      return array;
    }

    return operation.props.value as ReadonlyArray<DataObject>;
  },
  __replace: ({ array, operation, config, getObjectById }) => {
    if (typeof operation.props?.index !== 'number') {
      warning(true, 'Index is required for replace operation.');
      return array;
    }

    const indexToRemove = operation.props.index;

    return arrayOperations.__insert({
      array: array.filter((_, index) => index !== indexToRemove),
      operation,
      config,
      getObjectById,
    });
  },
  __move: ({ array, operation, config }) => {
    if (typeof operation.props?.toIndex !== 'number') {
      warning(true, 'toIndex is required for move operation.');
      return array;
    }

    const objectKey = config.getNormalizationObjectKey(operation.node);
    const toIndex = operation.props.toIndex;

    const fromIndex = array.findIndex(item => {
      if (typeof item !== 'object' || item === null) {
        return false;
      }

      return config.getNormalizationObjectKey(item) === objectKey;
    });

    if (fromIndex === -1) {
      warning(
        true,
        `Item with key ${objectKey} not found in array for move operation.`,
      );
      return array;
    }

    if (toIndex < 0 || toIndex >= array.length) {
      warning(
        true,
        `toIndex ${toIndex} is out of bounds for array of length ${array.length}.`,
      );
      return array;
    }

    if (fromIndex === toIndex) {
      return array;
    }

    const newArray = [...array];
    const [movedItem] = newArray.splice(fromIndex, 1);
    newArray.splice(toIndex, 0, movedItem);

    return newArray;
  },
  __swap: ({ array, operation, config }) => {
    if (typeof operation.props?.toIndex !== 'number') {
      warning(true, 'toIndex is required for swap operation.');
      return array;
    }

    const objectKey = config.getNormalizationObjectKey(operation.node);
    const toIndex = operation.props.toIndex;

    const fromIndex = array.findIndex(item => {
      if (typeof item !== 'object' || item === null) {
        return false;
      }

      return config.getNormalizationObjectKey(item) === objectKey;
    });

    if (fromIndex === -1) {
      warning(
        true,
        `Item with key ${objectKey} not found in array for swap operation.`,
      );
      return array;
    }

    if (toIndex < 0 || toIndex >= array.length) {
      warning(
        true,
        `toIndex ${toIndex} is out of bounds for array of length ${array.length}.`,
      );
      return array;
    }

    if (fromIndex === toIndex) {
      return array;
    }

    const newArray = [...array];
    [newArray[fromIndex], newArray[toIndex]] = [
      newArray[toIndex],
      newArray[fromIndex],
    ];

    return newArray;
  },
};

const convertUserArrayOperation = (
  name: string,
  operation: unknown,
  node: DataObject,
  config: Required<NormalizerConfig>,
): ReadonlyArray<ArrayOperation> => {
  const allArrayOperations = {
    ...arrayOperations,
    ...config.customArrayOperations,
  };

  const filteredNode = { ...node };

  Object.keys(allArrayOperations).forEach(key => {
    delete filteredNode[key];
  });

  if (typeof operation === 'string') {
    return [
      {
        arrayType: operation,
        type: name,
        node: filteredNode,
      },
    ];
  }

  if (Array.isArray(operation) && isStringArray(operation)) {
    return operation.map(item => ({
      arrayType: item,
      type: name,
      node: filteredNode,
    }));
  }

  if (Array.isArray(operation) && isObjectArray(operation)) {
    return operation.map(item => {
      const { arrayType, ...props } = item;

      return {
        arrayType,
        type: name,
        node: filteredNode,
        props,
      };
    });
  }

  if (!isObject(operation)) {
    return [];
  }

  const { arrayTypes, ...props } = operation;

  if (typeof arrayTypes === 'string') {
    return [
      {
        arrayType: arrayTypes,
        type: name,
        node: filteredNode,
        props,
      },
    ];
  }

  return arrayTypes.map(arrayType => ({
    arrayType,
    type: name,
    node: filteredNode,
    props,
  }));
};

export const getArrayOperationsToApply = (
  mutationData: Data,
  config: Required<NormalizerConfig>,
): ReadonlyArray<ArrayOperation> => {
  const operations: ArrayOperation[] = [];

  const processData = (data: Data): void => {
    if (Array.isArray(data)) {
      data.forEach(item => processData(item));
      return;
    }

    if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
      Object.keys({
        ...arrayOperations,
        ...config.customArrayOperations,
      }).forEach(key => {
        if (key in data) {
          const operation = data[key];

          convertUserArrayOperation(key, operation, data, config).forEach(
            op => {
              operations.push(op);
            },
          );
        }
      });

      Object.values(data).forEach(value => processData(value));
    }
  };

  processData(mutationData);

  return operations;
};

const getUpdatedArray = (
  data: ReadonlyArray<DataObject>,
  operation: ArrayOperation,
  config: Required<NormalizerConfig>,
  getObjectById: (
    id: string,
    exampleObject?: DataObject,
  ) => DataObject | undefined,
) => {
  const allArrayOperations = {
    ...arrayOperations,
    ...config.customArrayOperations,
  };

  if (allArrayOperations[operation.type]) {
    return allArrayOperations[operation.type]({
      array: data,
      operation,
      config,
      getObjectById,
    });
  }

  return data;
};

export const applyArrayOperations = (
  data: Data,
  queryKey: string,
  operations: ReadonlyArray<ArrayOperation>,
  config: Required<NormalizerConfig>,
  getObjectById: (
    id: string,
    exampleObject?: DataObject,
  ) => DataObject | undefined,
  parentObj?: DataObject,
  parentObjKey?: string,
): Data => {
  if (Array.isArray(data)) {
    const arrayType = config.getArrayType?.({
      array: data as DataObject[],
      parentObj,
      arrayKey: parentObjKey,
      queryKey,
    });

    const operationsForArray = operations.filter(
      operation => operation.arrayType === arrayType,
    );

    const updatedData = operationsForArray.reduce(
      (prev, operation) =>
        getUpdatedArray(prev, operation, config, getObjectById) as DataObject[],
      data as DataObject[],
    );

    return updatedData.map(item =>
      applyArrayOperations(item, queryKey, operations, config, getObjectById),
    ) as DataObject[];
  }

  if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
    return Object.entries(data).reduce((prev, [k, v]) => {
      prev[k] = applyArrayOperations(
        v,
        queryKey,
        operations,
        config,
        getObjectById,
        data,
        k,
      );

      return prev;
    }, {} as DataObject);
  }

  return data;
};
