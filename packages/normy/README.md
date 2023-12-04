# Normy

[![npm version](https://badge.fury.io/js/%40normy%2Fcore.svg)](https://badge.fury.io/js/%40normy%2Fcore)
[![gzip size](https://img.badgesize.io/https://unpkg.com/@normy/core/dist/normy.min.js?compression=gzip)](https://unpkg.com/@normy/core)
[![Coverage Status](https://coveralls.io/repos/github/klis87/normy/badge.svg?branch=master)](https://coveralls.io/github/klis87/normy?branch=master)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

<!-- [![Build Status](https://travis-ci.org/klis87/normy.svg?branch=master)](https://travis-ci.org/klis87/normy) -->

<!-- [![Known Vulnerabilities](https://snyk.io/test/github/klis87/normy/badge.svg)](https://snyk.io/test/github/klis87/normy) -->

Automatic normalization and data updates for data fetching libraries

## Table of content

- [Introduction](#introduction-arrow_up)
- [Motivation](#motivation-arrow_up)
- [Installation](#installation-arrow_up)
- [Required conditions](#required-conditions-arrow_up)
- [Normalization of arrays](#normalization-of-arrays-arrow_up)
- [Debugging](#debugging-arrow_up)
- [Performance](#performance-arrow_up)
- [Integrations](#examples-arrow_up)
- [Examples](#examples-arrow_up)

## Introduction [:arrow_up:](#table-of-content)

`normy` is a library, which allows your application data to be normalized automatically. Then, once data is normalized, in many cases your data can be updated automatically.

The core of `normy` - namely `@normy/core` library, which is not meant to be used directly in applications, has logic inside which allows an easily integration with your favourite data fetching libraries, be it `react-query`, `swr`, `RTK Query` and so on. For now only `@normy/react-query` and `@normy/swr` exist, but there are more to come.

## Motivation [:arrow_up:](#table-of-content)

In order to understand what `normy` actually does, it is the best to see an example. Let's assume you use `react-query`. Then you could refactor a code in the following way:

```diff
  import React from 'react';
  import {
    QueryClientProvider,
    QueryClient,
    useQueryClient,
  } from '@tanstack/react-query';
+ import { QueryNormalizerProvider } from '@normy/react-query';

  const queryClient = new QueryClient();

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
-     onSuccess: mutationData => {
-       queryClient.setQueryData(['books'], data =>
-         data.map(book =>
-           book.id === mutationData.id ? { ...book, ...mutationData } : book,
-         ),
-       );
-       queryClient.setQueryData(['book'], data =>
-         data.id === mutationData.id ? { ...data, ...mutationData } : data,
-       );
-     },
    });

    const updateBookAuthorMutation = useMutation({
      mutationFn: () => ({
        id: '1',
        author: { id: '1004', name: 'User4' },
      }),
-     onSuccess: mutationData => {
-       queryClient.setQueryData(['books'], data =>
-         data.map(book =>
-           book.id === mutationData.id ? { ...book, ...mutationData } : book,
-         ),
-       );
-       queryClient.setQueryData(['book'], data =>
-         data.id === mutationData.id ? { ...data, ...mutationData } : data,
-       );
-     },
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
+   <QueryNormalizerProvider queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Books />
      </QueryClientProvider>
+   </QueryNormalizerProvider>
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

### react-query

To install the package, just run:

```
$ npm install @normy/react-query
```

or you can just use CDN: `https://unpkg.com/@normy/react-query`.

### swr

To install the package, just run:

```
$ npm install @normy/swr
```

or you can just use CDN: `https://unpkg.com/@normy/swr`.

### another lirary

If you want to write a plugin to another library than `react-query` or `swr`:

```
$ npm install @normy/core
```

or you can just use CDN: `https://unpkg.com/@normy/core`.

To see how to write a plugin, for now just check source code of `@normy/react-query`, it is very easy to do,
in the future a guide will be created.

## Required conditions [:arrow_up:](#table-of-content)

In order to make automatic normalization work, the following conditions must be met:

1. you must have a standardized way to identify your objects, usually this is done by key `id`
2. ids must be unique across the whole app, not only across object types, if not, you will need to append something to them,
   the same has to be done in GraphQL world, usually adding `_typename`
3. objects with the same ids should have a consistent structure, if an object like book in one
   query has `title` key, it should be `title` in others, not `name` out of a sudden

There is a function which can be passed to `createQueryNormalizer` to meet those requirements, namely `getNormalizationObjectKey`.

`getNormalizationObjectKey` can help you with 1st point, if for instance you identify
objects differently, like by `_id` key, then you can pass `getNormalizationObjectKey: obj => obj._id`.

`getNormalizationObjectKey` also allows you to pass the 2nd requirement. For example, if your ids
are unique, but not across the whole app, but within object types, you could use
`getNormalizationObjectKey: obj => obj.id && obj.type ? obj.id + obj.type : undefined` or something similar.
If that is not possible, then you could just compute a suffix yourself, for example:

```js
const getType = obj => {
  if (obj.bookTitle) {
    return 'book';
  }

  if (obj.surname) {
    return 'user';
  }

  return undefined;
};

createQueryNormalizer(queryClient, {
  getNormalizationObjectKey: obj =>
    obj.id && getType(obj) && obj.id + getType(obj),
});
```

Point 3 should always be met, if not, your really should ask your backend developers
to keep things standardized and consistent. As a last resort, you can amend responses on your side.

## Normalization of arrays [:arrow_up:](#table-of-content)

Unfortunately it does not mean you will never need to update data manually anymore. Some updates still need
to be done manually like usually, namely adding and removing items from array. Why? Imagine a `REMOVE_BOOK`
mutation. This book could be present in many queries, library cannot know from which queries
you would like to remove it. The same applies for `ADD_BOOK`, the library cannot know to which query a book should be added,
or even as which array index. The same thing for action like `SORT_BOOKS`. This problem affects only top
level arrays though. For instance, if you have a book with some id and another key like `likedByUsers`,
then if you return new book with updated list in `likedByUsers`, this will work again automatically.

In the future version of the library though, with some additional pointers, it will be possible to do above updates as well!

## Debugging [:arrow_up:](#table-of-content)

If you are interested, what data manipulations `normy` actually does, you can use `devLogging` option:

```jsx
<QueryNormalizerProvider
  queryClient={queryClient}
  normalizerConfig={{ devLogging: true }}
>
  {children}
</QueryNormalizerProvider>
```

`false` by default, if set to `true`, you could see in the console information, when queries are set or removed.

Note that this works only in development, even if you pass `true`, no logging will be done in production
(when precisely `process.env.NODE_ENV === 'production'`). `NODE_ENV` is usually set by module bundlers like
`webpack` for you, so probably you do not need to worry about setting `NODE_ENV` yourself.

## Performance [:arrow_up:](#table-of-content)

As always, any automatisation comes with a cost. In the future some benchmarks could be added, but for now manual tests
showed that unless in your data you have tens of thousands of normalized objects, then the overhead should be not noticable.
However, you have several flexible ways to improve performance:

1. You can normalize only queries which have data updates, and only mutations which should update data - that's it,
   you can have only part of your data normalized. Check an integration documentation how to do it.
2. Like `1.`, but for queries and mutations with extremely big data.
3. There is a built-in optimalization, which checks data from mutation responses if they are actually different than data
   in the normalized store. If it is the same, dependent queries will not be updated. So, it is good for mutation data to
   include only things which could actually be different, which could prevent unnecessary normalization and queries updates.
4. You can use `getNormalizationObjectKey` function to set globally which objects should be actually normalized. For example:

```jsx
<QueryNormalizerProvider
  queryClient={queryClient}
  normalizerConfig={{
    getNormalizationObjectKey: obj => (obj.normalizable ? obj.id : undefined),
  }}
>
  {children}
</QueryNormalizerProvider>
```

Moreover, in the future some additional performance specific options will be added.

## Integrations [:arrow_up:](#table-of-content)

Currently the is only two official integrations with data fetching libraries, namely with `react-query` and `swr`. There are more
to come though. See dedicated documentations for specific integrations:

- [react-query](https://github.com/klis87/normy/tree/master/packages/normy-react-query)
- [swr](https://github.com/klis87/normy/tree/master/packages/swr)

## Examples [:arrow_up:](#table-of-content)

I highly recommend to try examples how this package could be used in real applications.

There are following examples currently:

- [react-query](https://github.com/klis87/normy/tree/master/examples/react-query)
- [trpc](https://github.com/klis87/normy/tree/master/examples/trpc)
- [swr](https://github.com/klis87/normy/tree/master/examples/swr)

## Licence [:arrow_up:](#table-of-content)

MIT
