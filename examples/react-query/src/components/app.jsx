import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useQueryNormalizer } from '@normy/react-query';

const sleep = () => new Promise(resolve => setTimeout(resolve, 10));

const Books = () => {
  const { data: booksData = [] } = useQuery({
    queryKey: ['books'],
    queryFn: () =>
      Promise.resolve([
        { id: '0', name: 'Name 0', author: null },
        { id: '1', name: 'Name 1', author: { id: '1000', name: 'User1' } },
        { id: '2', name: 'Name 2', author: { id: '1001', name: 'User2' } },
      ]),
  });

  return booksData.map(book => (
    <div key={book.id}>
      {book.name} {book.author && book.author.name}
    </div>
  ));
};

const BooksApp = () => {
  const queryClient = useQueryClient();
  const queryNormalizer = useQueryNormalizer();

  const { data: bookData } = useQuery({
    queryKey: ['book'],
    queryFn: () =>
      Promise.resolve({
        id: '1',
        name: 'Name 1',
        author: { id: '1000', name: 'User1' },
      }),
    select: data => ({ ...data, nameLong: data.name, name: undefined }),
  });
  const updateBookNameMutation = useMutation({
    mutationFn: async () => {
      await sleep();
      return {
        id: '1',
        name: 'Name 1 Updated',
      };
    },
  });
  const updateBookAuthorMutation = useMutation({
    mutationFn: async () => {
      await sleep();
      return {
        id: '0',
        author: { id: '1004', name: 'User4 new' },
      };
    },
  });
  const addBookMutation = useMutation({
    mutationFn: async () => {
      await sleep();

      return {
        id: '3',
        name: 'Name 3',
        author: { id: '1002', name: 'User3' },
      };
    },
    onSuccess: () => {
      queryClient.setQueryData(['books'], data =>
        data.concat({
          id: '3',
          name: 'Name 3',
          author: { id: '1002', name: 'User3' },
        }),
      );
    },
  });

  const updateBookNameMutationOptimistic = useMutation({
    mutationFn: async () => {
      await sleep();

      return {
        id: '1',
        name: 'Name 1 Updated',
      };
    },
    onMutate: () => ({
      optimisticData: {
        id: '1',
        name: 'Name 1 Updated',
      },
      rollbackData: {
        id: '1',
        name: 'Name 1',
      },
    }),
    meta: {
      normalize: false,
    },
  });

  return (
    <div>
      <button type="button" onClick={() => updateBookNameMutation.mutate()}>
        Update book name {updateBookNameMutation.isLoading && 'loading.....'}
      </button>{' '}
      <button type="button" onClick={() => updateBookAuthorMutation.mutate()}>
        Update book author{' '}
        {updateBookAuthorMutation.isLoading && 'loading.....'}
      </button>{' '}
      <button type="button" onClick={() => addBookMutation.mutate()}>
        Add book {addBookMutation.isLoading && 'loading.....'}
      </button>{' '}
      <button
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
      <button
        type="button"
        onClick={() =>
          console.log(queryNormalizer.getDependentQueries([{ id: '1' }]))
        }
      >
        Get dependent queries for book 1
      </button>
      <hr />
      <h2>Books</h2>
      <Books />
      <hr />
      {bookData && (
        <>
          <h2>Book detail</h2>
          {bookData.nameLong} {bookData.author && bookData.author.name}
        </>
      )}
    </div>
  );
};

const App = () => (
  <div>
    <h1>Normy React Query example</h1>
    <BooksApp />
  </div>
);

export default App;
