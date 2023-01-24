import defaultConfig from './default-config';
import { mergeData } from './merge-data';

const stipFromDeps = (data, config, root = true) => {
  if (Array.isArray(data)) {
    return data.map(v => stipFromDeps(v, config));
  }

  if (data !== null && typeof data === 'object') {
    if (config.shouldObjectBeNormalized(data) && root) {
      return `@@${config.getNormalisationObjectKey(data)}`;
    }

    return Object.entries(data).reduce((prev, [k, v]) => {
      prev[k] = stipFromDeps(v, config);
      return prev;
    }, {});
  }

  return data;
};

export const getDependencies = (
  data,
  config = defaultConfig,
  usedKeys,
  path = '',
) => {
  usedKeys = usedKeys || {};

  if (Array.isArray(data)) {
    return [
      data.reduce(
        (prev, current) => [
          ...prev,
          ...getDependencies(current, config, usedKeys, path)[0],
        ],
        [],
      ),
      usedKeys,
    ];
  }

  if (data !== null && typeof data === 'object') {
    if (config.shouldObjectBeNormalized(data)) {
      usedKeys[path] = Object.keys(data);
    }

    return [
      Object.entries(data).reduce(
        (prev, [k, v]) => [
          ...prev,
          ...getDependencies(v, config, usedKeys, `${path}.${k}`)[0],
        ],
        config.shouldObjectBeNormalized(data) ? [data] : [],
      ),
      usedKeys,
    ];
  }

  return [[], usedKeys];
};

export const normalize = (data, config = defaultConfig) => {
  const [dependencies, usedKeys] = getDependencies(data, config);

  return [
    stipFromDeps(data, config, true),
    dependencies.reduce((prev, v) => {
      const key = config.getNormalisationObjectKey(v);
      prev[`@@${key}`] = prev[`@@${key}`]
        ? mergeData(prev[`@@${key}`], stipFromDeps(v, config, false))
        : stipFromDeps(v, config, false);
      return prev;
    }, {}),
    usedKeys,
    dependencies,
  ];
};
