# Normy

[![npm version](https://badge.fury.io/js/%40normy%2Fcore.svg)](https://badge.fury.io/js/%40normy%2Fcore)
[![gzip size](https://img.badgesize.io/https://unpkg.com/@normy/core/dist/normy.min.js?compression=gzip)](https://unpkg.com/@normy/core)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

<!-- [![Build Status](https://travis-ci.org/klis87/normy.svg?branch=master)](https://travis-ci.org/klis87/normy)
[![Coverage Status](https://coveralls.io/repos/github/klis87/normy/badge.svg?branch=master)](https://coveralls.io/github/klis87/normy?branch=master) -->
<!-- [![Known Vulnerabilities](https://snyk.io/test/github/klis87/normy/badge.svg)](https://snyk.io/test/github/klis87/normy) -->

Automatic normalisation and data updates for data fetching libraries

## Table of content

- [Introduction](#introduction-arrow_up)
- [Motivation](#motivation-arrow_up)
- [Installation](#installation-arrow_up)
- [Required conditions](#required-conditions-arrow_up)
- [Normalisation of arrays](#normalisation-of-arrays-arrow_up)
- [Integrations](#examples-arrow_up)
- [Examples](#examples-arrow_up)

## Introduction [:arrow_up:](#table-of-content)

`normy` is a library, which allows your application data to be normalized automatically. Then, once data is normalized, in many cases your data can be updated automatically.

The core of `normy` - namely `@normy/core` library, which is not meant to be used directly in applications, has logic inside which allows an easily integration with your favourite data fetching libraries, be it `react-query`, `swr`, `RTK Query` and so on. For now only `@normy/react-query` exists, but there are more to come.

## Motivation [:arrow_up:](#table-of-content)

In order to understand what `normy` actually does, it is the best to see an example. Let's assume you use `react-query`. Then you could refactor a code in the following way:

```diff
  import React from 'react';
  import {
    QueryClientProvider,
-   QueryClient,
    useQueryClient,
  } from '@tanstack/react-query';
+ import { createNormalizedQueryClient } from '@normy/react-query';

- const queryClient = new QueryClient();
+ const queryClient = createNormalizedQueryClient();

const Books = () => {
  const queryClient = useQueryClient();

  const { data: booksData = [] } = useQuery(['books'], () =>
    Promise.resolve([
      { id: '1', name: 'Name 1', author: { id: '1001', name: 'User1' } },
      { id: '2', name: 'Name 2', author: { id: '1002', name: 'User2' } },
    ]),
  );

  const { data: bookData } = useQuery(['book'], () =>
    Promise.resolve({
      id: '1',
      name: 'Name 1',
      author: { id: '1001', name: 'User1' },
    }),
  );

  const updateBookNameMutation = useMutation({
    mutationFn: () => ({
      id: '1',
      name: 'Name 1 Updated',
    }),
-   onSuccess: mutationData => {
-     queryClient.setQueryData(['books'], data =>
-       data.map(book =>
-         book.id === mutationData.id ? { ...book, ...mutationData } : book,
-       ),
-     );
-     queryClient.setQueryData(['book'], data =>
-       data.id === mutationData.id ? { ...data, ...mutationData } : data,
-     );
-   },
  });

  const updateBookAuthorMutation = useMutation({
    mutationFn: () => ({
      id: '1',
      author: { id: '1004', name: 'User4' },
    }),
-   onSuccess: mutationData => {
-     queryClient.setQueryData(['books'], data =>
-       data.map(book =>
-         book.id === mutationData.id ? { ...book, ...mutationData } : book,
-       ),
-     );
-     queryClient.setQueryData(['book'], data =>
-       data.id === mutationData.id ? { ...data, ...mutationData } : data,
-     );
-   },
  });

  const addBookMutation = useMutation({
    mutationFn: () => ({
      id: '3',
      name: 'Name 3',
      author: { id: '1003', name: 'User3' },
    }),
    // with data with top level arrays, you still need to update data manually
    onSuccess: mutationData => {
      queryClient.setQueryData(['books'], data => data.concat(mutationData));
    },
  });

  // return some JSX
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Books />
  </QueryClientProvider>
);
```

So, as you can see, apart from top level arrays, no manual data updates are necessary anymore. This is especially handy if a given mutation
should update data for multiple queries. Not only this is verbose to do updates manually, but also you need to exactly know,
which queries to update. The more queries you have, the bigger advantages `normy` brings.

How does it work? By default all objects with `id` key are
organized by their ids. Now, any object with key `id`
will be normalized, which simply means stored by id. If there is already a matching object
with the same id, a new one will be deeply merged with the one already in the state.
So, if a server response data from a mutation is `{ id: '1', title: 'new title' }`,
this library will automatically figure it out to update `title` for object with `id: '1'` for all dependent queries.

It also works with nested objects with ids, no matter how deep. If an object with id has other objects
with ids, then those will be normalized separately and parent object will have just reference to those nested
objects.

## Installation [:arrow_up:](#table-of-content)

To install the package, just run:

```
$ npm install @normy/react-query
```

or you can just use CDN: `https://unpkg.com/@normy/react-query`.

If you want to write a plugin to another library than `react-query`:

```
$ npm install @normy/core
```

or you can just use CDN: `https://unpkg.com/@normy/core`.

To see how to write a plugin, for now just check source code of `@normy/react-query`, it is very easy to do,
in the future a guide will be created.

## Required conditions [:arrow_up:](#table-of-content)

In order to make automatic normalisation work, the following conditions must be met:

1. you must have a standardized way to identify your objects, usually this is done by key `id`
2. ids must be unique across the whole app, not only across object types, if not, you will need to append something to them,
   the same has to be done in GraphQL world, usually adding `_typename`
3. objects with the same ids should have a consistent structure, if an object like book in one
   query has `title` key, it should be `title` in others, not `name` out of a sudden

Two functions which can be passed to `createNormalizedQueryClient` can help to meet those requirements,
`shouldObjectBeNormalized` and `getNormalisationObjectKey`.

`shouldObjectBeNormalized` and `getNormalisationObjectKey` can help you with 1st point, if for instance you identify
objects differently, like by `_id` key, then you can pass
`shouldObjectBeNormalized: obj => obj._id !== undefined` and `getNormalisationObjectKey: obj => obj._id`.

`getNormalisationObjectKey` also allows you to pass the 2nd requirement. For example, if your ids
are unique, but not across the whole app, but within object types, you could use
`getNormalisationObjectKey: obj => obj.id + obj.type` or something similar.
If that is not possible, then you could just compute a suffix yourself, for example:

```js
const getType = obj => {
  if (obj.bookTitle) {
    return 'book';
  }

  if (obj.surname) {
    return 'user';
  }

  throw 'we support only book and user object';
};

const queryClient = createNormalizedQueryClient(reactQueryConfig, {
  getNormalisationObjectKey: obj => obj.id + getType(obj),
});
```

Point 3 should always be met, if not, your really should ask your backend developers
to keep things standardized and consistent. As a last resort, you can amend responses on your side.

## Normalisation of arrays [:arrow_up:](#table-of-content)

Unfortunately it does not mean you will never need to update data manually anymore. Some updates still need
to be done manually like usually, namely adding and removing items from array. Why? Imagine a `REMOVE_BOOK`
mutation. This book could be present in many queries, library cannot know from which queries
you would like to remove it. The same applies for `ADD_BOOK`, the library cannot know to which query a book should be added,
or even as which array index. The same thing for action like `SORT_BOOKS`. This problem affects only top
level arrays though. For instance, if you have a book with some id and another key like `likedByUsers`,
then if you return new book with updated list in `likedByUsers`, this will work again automatically.

In the future version of the library though, with some additional pointers, it will be possible to do above updates as well!

## Integrations [:arrow_up:](#table-of-content)

Currently the is only one official integration with data fetching libraries, namely with `react-query`. There are more
to come though. See dedicated documentations for specific integrations:

- [react-query](https://github.com/klis87/normy/tree/master/packages/normy-react-query)

## Examples [:arrow_up:](#table-of-content)

I highly recommend to try examples how this package could be used in real applications.

There are following examples currently:

- [react-query](https://github.com/klis87/normy/tree/master/examples/react-query)

## Licence [:arrow_up:](#table-of-content)

MIT
