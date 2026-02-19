import { Data, DataObject, DataPrimitiveArray, UsedKeys } from './types';

export const denormalize = (
  data: Data,
  normalizedData: { [key: string]: Data },
  usedKeys: UsedKeys,
  path = '',
  seenRefs = new Set<string>(),
): Data => {
  // Handle circular references
  if (typeof data === 'string' && data.startsWith('@@')) {
    // Check if we've already seen this reference in the current traversal
    if (seenRefs.has(data)) {
      // Circular reference detected, return the reference string itself
      return data;
    }
    // Add to seen set before recursing
    const newSeenRefs = new Set(seenRefs);
    newSeenRefs.add(data);
    return denormalize(normalizedData[data], normalizedData, usedKeys, path, newSeenRefs);
  } else if (Array.isArray(data)) {
    return data.map(value =>
      denormalize(value, normalizedData, usedKeys, path, seenRefs),
    ) as DataPrimitiveArray | DataObject[];
  } else if (
    data !== null &&
    typeof data === 'object' &&
    !(data instanceof Date)
  ) {
    const objectEntries = usedKeys[path]
      ? Object.entries(data).filter(([k]) => usedKeys[path].includes(k))
      : Object.entries(data);

    return objectEntries.reduce((prev, [k, v]) => {
      prev[k] = denormalize(v, normalizedData, usedKeys, `${path}.${k}`, seenRefs);

      return prev;
    }, {} as DataObject);
  }

  return data;
};
