export default {
  getNormalisationObjectKey: obj => obj.id,
  shouldObjectBeNormalized: obj => obj.id !== undefined,
};
