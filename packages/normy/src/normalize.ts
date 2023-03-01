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

  if (data !== null && typeof data === 'object') {
    if (config.getNormalisationObjectKey(data) && root) {
      return `@@${config.getNormalisationObjectKey(data)}`;
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
  config = defaultConfig,
  usedKeys?: UsedKeys,
  path = '',
): [DataObject[], UsedKeys] => {
  usedKeys = usedKeys || {};

  if (Array.isArray(data)) {
    return [
      (data as DataObject[]).reduce(
        (prev: DataObject[], current: Data) => [
          ...prev,
          ...getDependencies(current, config, usedKeys, path)[0],
        ],
        [] as DataObject[],
      ),
      usedKeys,
    ];
  }

  if (data !== null && typeof data === 'object') {
    if (config.getNormalisationObjectKey(data)) {
      usedKeys[path] = Object.keys(data);
    }

    return [
      Object.entries(data).reduce(
        (prev, [k, v]) => [
          ...prev,
          ...getDependencies(v, config, usedKeys, `${path}.${k}`)[0],
        ],
        config.getNormalisationObjectKey(data) ? [data] : [],
      ),
      usedKeys,
    ];
  }

  return [[], usedKeys];
};

export const normalize = (
  data: Data,
  config = defaultConfig,
): [Data, { [objectId: string]: DataObject }, UsedKeys] => {
  const [dependencies, usedKeys] = getDependencies(data, config);

  return [
    stipFromDeps(data, config, true),
    dependencies.reduce((prev, v) => {
      const key = config.getNormalisationObjectKey(v);

      prev[`@@${key}`] = prev[`@@${key}`]
        ? mergeData(prev[`@@${key}`], stipFromDeps(v, config, false))
        : stipFromDeps(v, config, false);

      return prev;
    }, {} as { [objectId: string]: DataObject }) as {
      [objectId: string]: DataObject;
    },
    usedKeys,
  ];
};
