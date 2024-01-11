import { getNormalizer } from '@normy/rtk-query';
import { createApi } from '@reduxjs/toolkit/query/react';

const sleep = () => new Promise(resolve => setTimeout(resolve, 1000));

export const api = createApi({
  reducerPath: 'api',
  endpoints: builder => ({
    getBooks: builder.query({
      queryFn: () => ({
        data: [
          { id: '0', name: 'Name 0', author: null },
          { id: '1', name: 'Name 1', author: { id: '1000', name: 'User1' } },
          { id: '2', name: 'Name 2', author: { id: '1001', name: 'User2' } },
        ],
      }),
    }),
    getBook: builder.query({
      queryFn: () => ({
        data: {
          id: '1',
          name: 'Name 1',
          author: { id: '1000', name: 'User1' },
        },
      }),
    }),
    updateBook: builder.mutation({
      queryFn: () => ({
        data: {
          id: '1',
          name: 'Name 1 Updated',
        },
      }),
    }),
    updateBookOptimistically: builder.mutation({
      queryFn: async () => {
        await sleep();

        return {
          data: {
            id: '1',
            name: 'Name 1 Updated',
          },
        };
      },
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        const normalizer = getNormalizer(dispatch);

        normalizer.setNormalizedData({
          id: '1',
          name: 'Name 1 Updated',
        });

        try {
          await queryFulfilled;
        } catch {
          normalizer.setNormalizedData({
            id: '1',
            name: 'Name 1',
          });
        }
      },
    }),
    addBook: builder.mutation({
      queryFn: async () => ({
        data: {
          id: '3',
          name: 'Name 3',
          author: { id: '1002', name: 'User3' },
        },
      }),
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        const { data: mutationData } = await queryFulfilled;

        dispatch(
          api.util.updateQueryData('getBooks', undefined, data => [
            ...data,
            mutationData,
          ]),
        );
      },
    }),
  }),
});

export const {
  useGetBooksQuery,
  useGetBookQuery,
  useUpdateBookMutation,
  useUpdateBookOptimisticallyMutation,
  useAddBookMutation,
} = api;
