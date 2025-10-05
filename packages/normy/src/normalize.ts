import { defaultConfig } from './default-config';
import { mergeData } from './merge-data';
import {
  Data,
  NormalizerConfig,
  DataPrimitiveArray,
  DataObject,
  UsedKeys,
} from './types';

const stipFromDeps = (
  data: Data,
  config: Required<NormalizerConfig>,
  root = true,
): Data => {
  if (Array.isArray(data)) {
    return data.map(v => stipFromDeps(v, config)) as
      | DataPrimitiveArray
      | DataObject[];
  }

  if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
    const objectKey = config.getNormalizationObjectKey(data);

    if (objectKey !== undefined && root) {
      return `@@${objectKey}`;
    }

    return Object.entries(data).reduce((prev, [k, v]) => {
      prev[k] = stipFromDeps(v, config);

      return prev;
    }, {} as DataObject);
  }

  return data;
};

export const getDependencies = (
  data: Data,
  queryKey: string,
  config = defaultConfig,
  usedKeys?: UsedKeys,
  arrayTypes?: string[],
  path = '',
  parentObj?: DataObject,
  parentObjKey?: string,
): [DataObject[], UsedKeys, string[]] => {
  usedKeys = usedKeys || {};
  arrayTypes = arrayTypes || [];

  if (Array.isArray(data)) {
    const arrayType = config.getArrayType({
      array: data as DataObject[],
      parentObj: parentObj as DataObject,
      arrayKey: parentObjKey as string,
      queryKey,
    });

    if (arrayType !== undefined && !arrayTypes.includes(arrayType)) {
      arrayTypes.push(arrayType);
    }

    return [
      (data as DataObject[]).reduce(
        (prev: DataObject[], current: Data) => [
          ...prev,
          ...getDependencies(
            current,
            queryKey,
            config,
            usedKeys,
            arrayTypes,
            path,
          )[0],
        ],
        [] as DataObject[],
      ),
      usedKeys,
      arrayTypes,
    ];
  }

  if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
    if (config.getNormalizationObjectKey(data) !== undefined) {
      usedKeys[path] = Object.keys(data);
    }

    return [
      Object.entries(data).reduce(
        (prev, [k, v]) => [
          ...prev,
          ...getDependencies(
            v,
            queryKey,
            config,
            usedKeys,
            arrayTypes,
            `${path}.${k}`,
            data,
            k,
          )[0],
        ],
        config.getNormalizationObjectKey(data) !== undefined ? [data] : [],
      ),
      usedKeys,
      arrayTypes,
    ];
  }

  return [[], usedKeys, arrayTypes];
};

export const normalize = (
  data: Data,
  queryKey: string,
  config = defaultConfig,
): [Data, { [objectId: string]: DataObject }, UsedKeys, string[]] => {
  const [dependencies, usedKeys, arrayTypes] = getDependencies(
    data,
    queryKey,
    config,
    undefined,
    undefined,
    '',
  );

  return [
    stipFromDeps(data, config, true),
    dependencies.reduce(
      (prev, v) => {
        const key = config.getNormalizationObjectKey(v) as string;

        prev[`@@${key}`] = prev[`@@${key}`]
          ? mergeData(prev[`@@${key}`], stipFromDeps(v, config, false))
          : stipFromDeps(v, config, false);

        return prev;
      },
      {} as { [objectId: string]: DataObject },
    ) as {
      [objectId: string]: DataObject;
    },
    usedKeys,
    arrayTypes,
  ];
};
