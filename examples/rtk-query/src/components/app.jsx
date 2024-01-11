import React from 'react';
import { useDispatch } from 'react-redux';
import { getNormalizer } from '@normy/rtk-query';

import {
  useGetBooksQuery,
  useGetBookQuery,
  useUpdateBookMutation,
  useAddBookMutation,
  useUpdateBookOptimisticallyMutation,
} from '../api';

const Books = () => {
  const { data: booksData = [] } = useGetBooksQuery(undefined);

  return booksData.map(book => (
    <div key={book.id}>
      {book.name} {book.author && book.author.name}
    </div>
  ));
};

const BooksApp = () => {
  const dispatch = useDispatch();
  const normalizer = getNormalizer(dispatch);
  const { data: bookData } = useGetBookQuery();

  const [updateBookName] = useUpdateBookMutation();
  const [addBook] = useAddBookMutation();
  const [updateBookOptimistically] = useUpdateBookOptimisticallyMutation();

  return (
    <div>
      <button type="button" onClick={() => updateBookName()}>
        Update book name
      </button>{' '}
      <button type="button" onClick={() => addBook()}>
        Add book
      </button>{' '}
      <button type="button" onClick={() => updateBookOptimistically()}>
        Update book name optimistic
      </button>{' '}
      <button
        type="button"
        onClick={() =>
          normalizer.setNormalizedData({
            author: { id: '1000', name: 'User1 updated' },
          })
        }
      >
        Update user1 name manually
      </button>
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

const App = () => (
  <div>
    <h1>Normy rtk Query example</h1>
    <BooksApp />
  </div>
);

export default App;
