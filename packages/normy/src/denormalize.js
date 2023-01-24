export const denormalize = (data, normalizedData, usedKeys, path = '') => {
  if (typeof data === 'string' && data.startsWith('@@')) {
    return denormalize(normalizedData[data], normalizedData, usedKeys, path);
  }

  if (Array.isArray(data)) {
    return data.map(v => denormalize(v, normalizedData, usedKeys, path));
  }

  if (data !== null && typeof data === 'object') {
    const objectEntries = usedKeys[path]
      ? Object.entries(data).filter(([k]) => usedKeys[path].includes(k))
      : Object.entries(data);

    return objectEntries.reduce((prev, [k, v]) => {
      prev[k] = denormalize(v, normalizedData, usedKeys, `${path}.${k}`);
      return prev;
    }, {});
  }

  return data;
};
