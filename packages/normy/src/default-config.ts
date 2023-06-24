import { NormalizerConfig } from './types';

export const defaultConfig: Required<NormalizerConfig> = {
  getNormalizationObjectKey: obj => obj.id as string | undefined,
  devLogging: false,
};
