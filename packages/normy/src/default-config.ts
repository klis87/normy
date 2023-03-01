import { NormalizerConfig } from './types';

export const defaultConfig: Required<NormalizerConfig> = {
  getNormalisationObjectKey: obj => obj.id as string,
  shouldObjectBeNormalized(obj) {
    return this.getNormalisationObjectKey(obj) !== undefined;
  },
};
