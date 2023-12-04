/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Data as NormyData } from '@normy/core';
import { useSWRConfig, type Key } from 'swr';
import useSWRMutation, {
  type MutationFetcher,
  type SWRMutationConfiguration,
  type SWRMutationResponse,
} from 'swr/mutation';

import { useSWRNormalizer } from './SWRNormalizerProvider';

type NormyOptions = {
  normalize?: boolean;
  optimisticData?: NormyData;
  rollbackData?: NormyData;
};

interface NormalizedSWRMutationHook {
  <
    Data = any,
    Error = any,
    SWRMutationKey extends Key = Key,
    ExtraArg = never,
    SWRData = Data,
  >(
    key: SWRMutationKey,
    fetcher: MutationFetcher<Data, SWRMutationKey, ExtraArg>,
    options?: SWRMutationConfiguration<
      Data,
      Error,
      SWRMutationKey,
      ExtraArg,
      SWRData
    > &
      NormyOptions,
  ): SWRMutationResponse<Data, Error, SWRMutationKey, ExtraArg>;
  <
    Data = any,
    Error = any,
    SWRMutationKey extends Key = Key,
    ExtraArg = never,
    SWRData = Data,
  >(
    key: SWRMutationKey,
    fetcher: MutationFetcher<Data, SWRMutationKey, ExtraArg>,
    options?: SWRMutationConfiguration<
      Data,
      Error,
      SWRMutationKey,
      ExtraArg,
      SWRData
    > & { throwOnError: false } & NormyOptions,
  ): SWRMutationResponse<Data | undefined, Error, SWRMutationKey, ExtraArg>;
  <
    Data = any,
    Error = any,
    SWRMutationKey extends Key = Key,
    ExtraArg = never,
    SWRData = Data,
  >(
    key: SWRMutationKey,
    fetcher: MutationFetcher<Data, SWRMutationKey, ExtraArg>,
    options?: SWRMutationConfiguration<
      Data,
      Error,
      SWRMutationKey,
      ExtraArg,
      SWRData
    > & { throwOnError: true } & NormyOptions,
  ): SWRMutationResponse<Data, Error, SWRMutationKey, ExtraArg>;
}

export const useNormalizedSWRMutation: NormalizedSWRMutationHook = (
  key,
  fetcher,
  options,
) => {
  const { mutate } = useSWRConfig();
  const normalizer = useSWRNormalizer();

  return useSWRMutation(
    key,
    // @ts-expect-error swr types compatiblity issue, perhaps due to ts version mismatch
    (k, opts) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      if (options?.optimisticData) {
        const queriesToUpdate = normalizer.getQueriesToUpdate(
          options?.optimisticData as NormyData,
        );

        queriesToUpdate.forEach(query => {
          void mutate(query.queryKey, query.data, {
            revalidate: false,
          });
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return fetcher(k, opts);
    },
    {
      populateCache: false,
      revalidate: false,
      ...options,
      optimisticData: undefined,
      onSuccess: (data, mutationKey, config) => {
        if (options?.normalize ?? true) {
          const queriesToUpdate = normalizer.getQueriesToUpdate(
            data as NormyData,
          );

          queriesToUpdate.forEach(query => {
            void mutate(query.queryKey, query.data, {
              revalidate: false,
            });
          });
        }

        return options?.onSuccess?.(data, mutationKey, config);
      },
      onError: (error, mutationKey, config) => {
        if (options?.rollbackData) {
          const queriesToUpdate = normalizer.getQueriesToUpdate(
            options?.rollbackData as NormyData,
          );

          queriesToUpdate.forEach(query => {
            void mutate(query.queryKey, query.data, {
              revalidate: false,
            });
          });
        }

        return options?.onError?.(error, mutationKey, config);
      },
    },
  );
};
