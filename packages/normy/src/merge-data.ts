import deepmerge from 'deepmerge';

import { Data } from './types';

export const mergeData = <T = Data>(oldData: T, newData: T) =>
  deepmerge<T>(oldData, newData, {
    arrayMerge: (destinationArray: Data[], sourceArray: Data[]) => sourceArray,
    clone: false,
  });
