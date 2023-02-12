import { createNormalizer } from './index';

const normalizer = createNormalizer();

const normalizedData = normalizer.getNormalizedData();

normalizer.setQuery('someKey', { id: '1', key: 'value' });

const queriesToUpdate = normalizer.getQueriesToUpdate({
  id: '1',
  key: 'value 2',
});

queriesToUpdate.forEach(({ queryKey, data }) => {
  //
}),
  normalizer.removeQuery('someKey');

const normalizerWithConfig = createNormalizer({
  getNormalisationObjectKey: obj => obj.id,
  shouldObjectBeNormalized: obj => obj.id !== undefined,
});
