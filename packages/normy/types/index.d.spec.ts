import { createNormalizer } from './index';

const normalizer = createNormalizer();

const normalizedData = normalizer.getNormalizedData();

normalizer.onQuerySuccess('someKey', { id: '1', key: 'value' });

normalizer.onMutationSuccess({ id: '1', key: 'value 2' }, queriesToUpdate =>
  queriesToUpdate.forEach(({ queryKey, data }) => {
    //
  }),
);

const normalizerWithConfig = createNormalizer({
  getNormalisationObjectKey: obj => obj.id,
  shouldObjectBeNormalized: obj => obj.id !== undefined,
});
