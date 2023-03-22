import * as React from 'react';
import { useMutation } from '@tanstack/react-query';

import { trpc } from '../trpc';

const sleep = () => new Promise(resolve => setTimeout(resolve, 10));

const Books = () => {
  const { data: booksData = [] } = trpc.books.useQuery();

  return booksData.map(book => (
    <div key={book.id}>
      {book.name} {book.author && book.author.name}
    </div>
  ));
};

const BooksApp = () => {
  const trpcContext = trpc.useContext();

  const { data: bookData } = trpc.book.useQuery(undefined, {
    select: data => ({ ...data, nameLong: data.name, name: undefined }),
  });

  const updateBookNameMutation = trpc.updateBookName.useMutation();
  const updateBookAuthorMutation = trpc.updateBookAuthor.useMutation();
  const addBookMutation = useMutation({
    mutationFn: async () => {
      await sleep();

      return {
        id: '3',
        name: 'Name 3',
        author: { id: '1002', name: 'User3' },
      };
    },
    onSuccess: newData => {
      trpcContext.books.setData(undefined, data => data.concat(newData));
    },
  });

  const updateBookNameMutationOptimistic = trpc.updateBookName.useMutation({
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
