import React from 'react';
import useSWR, { SWRConfig } from 'swr';

import {
  SWRNormalizerProvider,
  useNormalizedSWRMutation,
  useSWRNormalizer,
} from '@normy/swr';

const sleep = (x = 10) => new Promise(resolve => setTimeout(resolve, x));

const Books = () => {
  const { data: booksData = [] } = useSWR(
    '/books',
    () =>
      console.log('fetching book list') ||
      Promise.resolve([
        { id: '0', name: 'Name 0', author: null },
        { id: '1', name: 'Name 1', author: { id: '1000', name: 'User1' } },
        { id: '2', name: 'Name 2', author: { id: '1001', name: 'User2' } },
      ]),
  );

  return booksData.map(book => (
    <div key={book.id}>
      {book.name} {book.author && book.author.name}
    </div>
  ));
};

const BooksApp = () => {
  // const queryClient = useQueryClient();
  const normalizer = useSWRNormalizer();
  // const { mutate } = useSWRConfig();

  const { data: bookData } = useSWR(
    '/book',
    () =>
      console.log('fetching book detail') ||
      Promise.resolve({
        id: '1',
        name: 'Name 1',
        author: { id: '1000', name: 'User1' },
      }),
    { normalize: false },
  );

  const updateBookNameMutation = useNormalizedSWRMutation(
    '/book',
    async () => {
      await sleep(3000);
      // throw { error: true };
      return {
        id: '1',
        name: 'Name 1 Updated',
        author: { id: '1000', name: 'User1 updated' },
      };
    },
    {
      optimisticData: {
        id: '1',
        name: 'Name 1 Updated',
        author: { id: '1000', name: 'User1 updated' },
      },
      rollbackData: {
        id: '1',
        name: 'Name 1 rol',
        author: { id: '1000', name: 'User1 rol' },
      },
    },
  );
  const updateBookAuthorMutation = useNormalizedSWRMutation(
    '/book/update-author',
    async () => {
      await sleep(1000);
      return {
        id: '0',
        author: { id: '1004', name: 'User4 new' },
      };
    },
  );
  const addBookMutation = useNormalizedSWRMutation(
    '/books',
    async () => {
      await sleep(2000);

      return {
        id: '3',
        name: 'Name 3',
        author: { id: '1002', name: 'User3' },
      };
    },
    {
      populateCache: (newBook, books) => books.concat(newBook),
    },
  );

  // const updateBookNameMutationOptimistic = useMutation({
  //   mutationFn: async () => {
  //     await sleep();

  //     return {
  //       id: '1',
  //       name: 'Name 1 Updated',
  //     };
  //   },
  //   onMutate: () => ({
  //     optimisticData: {
  //       id: '1',
  //       name: 'Name 1 Updated',
  //     },
  //     rollbackData: {
  //       id: '1',
  //       name: 'Name 1',
  //     },
  //   }),
  //   meta: {
  //     normalize: false,
  //   },
  // });

  return (
    <div>
      <button type="button" onClick={() => updateBookNameMutation.trigger()}>
        Update book name {updateBookNameMutation.isMutating && 'loading.....'}
      </button>{' '}
      <button type="button" onClick={() => updateBookAuthorMutation.trigger()}>
        Update book author{' '}
        {updateBookAuthorMutation.isMutating && 'loading.....'}
      </button>{' '}
      <button type="button" onClick={() => addBookMutation.trigger()}>
        Add book {addBookMutation.isMutating && 'loading.....'}
      </button>{' '}
      {/* <button
        type="button"
        onClick={() => updateBookNameMutationOptimistic.mutate()}
      >
        Update book name optimistic
      </button>
      <button
        type="button"
        onClick={() =>
          queryNormalizer.setNormalizedData({
            author: { id: '1000', name: 'User1 updated' },
          })
        }
      >
        Update user1 name manually
      </button>
    )} */}
      <hr />
      <h2>Books</h2>
      <Books />
      <hr />
      {bookData && (
        <>
          <h2>Book detail</h2>
          {bookData.name} {bookData.author && bookData.author.name}
        </>
      )}
    </div>
  );
};

const App = () => {
  return (
    <div>
      <h1>Normy Swr example</h1>
      <SWRNormalizerProvider
        normalizerConfig={{
          devLogging: true,
          normalize: queryKey => queryKey !== '/book',
        }}
      >
        {cacheProvider => (
          <SWRConfig
            value={{
              revalidateOnFocus: false,
              provider: cacheProvider,
            }}
          >
            <BooksApp />
          </SWRConfig>
        )}
      </SWRNormalizerProvider>
    </div>
  );
};

export default App;
