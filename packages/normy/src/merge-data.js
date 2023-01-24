import deepmerge from 'deepmerge';

const mergeOptions = {
  arrayMerge: (destinationArray, sourceArray) => sourceArray,
  clone: false,
};

export const mergeData = (oldData, newData) =>
  deepmerge(oldData, newData, mergeOptions);
