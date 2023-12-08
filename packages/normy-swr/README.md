# @normy/swr

[![npm version](https://badge.fury.io/js/%40normy%2Fswr.svg)](https://badge.fury.io/js/%40normy%2Fswr)
[![gzip size](https://img.badgesize.io/https://unpkg.com/@normy/swr/dist/normy-swr.min.js?compression=gzip)](https://unpkg.com/@normy/swr)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

<!-- [![Build Status](https://travis-ci.org/klis87/normy.svg?branch=master)](https://travis-ci.org/klis87/normy)-->

<!-- [![Known Vulnerabilities](https://snyk.io/test/github/klis87/normy/badge.svg)](https://snyk.io/test/github/klis87/normy) -->

`swr` integration with `normy` - automatic normalization and data updates for data fetching libraries

## Table of content

- [Introduction](#introduction-arrow_up)
- [Motivation](#motivation-arrow_up)
- [Installation](#installation-arrow_up)
- [Basic usage](#basic-usage-arrow_up)
- [Disabling of normalization per query and mutation](#disabling-of-normalization-per-query-and-mutation-arrow_up)
- [Optimistic updates](#optimistic-updates-arrow_up)
- [useSWRNormalizer and manual updates](#useSWRNormalizer-and-manual-updates-arrow_up)
- [getObjectById and getQueryFragment](#getObjectById-and-getQueryFragment-arrow_up)
- [Garbage collection](#garbage-collection-arrow_up)
- [Clearing](#clearing-arrow_up)
- [Examples](#examples-arrow_up)

## Introduction [:arrow_up:](#table-of-content)

This is the official `swr` integration with `normy`, a library, which allows your application data to be normalized automatically. This documentation will cover only `swr` specifics, so if you did not already do that, you can
find `normy` documentation [here](https://github.com/klis87/normy/tree/master).

## Motivation [:arrow_up:](#table-of-content)

In order to understand what `@normy/swr` actually does, it is the best to see an example:

```diff
  import React from 'react';
  import useSWR, {
-   SWRConfig,
    useSWRConfig,
  } from 'swr';
- import useSWRMutation from 'swr/mutation';
+ import { SWRNormalizerProvider, useNormalizedSWRMutation } from '@normy/swr';

  const Books = () => {
    const { mutate } = useSWRConfig();

    const { data: booksData = [] } = useSWR('/books', () =>
      Promise.resolve([
        { id: '1', name: 'Name 1', author: { id: '1001', name: 'User1' } },
        { id: '2', name: 'Name 2', author: { id: '1002', name: 'User2' } },
      ]),
    );

    const { data: bookData } = useSWR('/book', () =>
      Promise.resolve({
        id: '1',
        name: 'Name 1',
        author: { id: '1001', name: 'User1' },
      }),
    );

-   const updateBookNameMutation = useSWRMutation(
+   const updateBookNameMutation = useNormalizedSWRMutation(
      '/book/update-name',
      () => Promise.resolve({
        id: '1',
        name: 'Name 1 Updated',
      }),
-     {
-       onSuccess: mutationData => {
-         mutate('/books', data =>
-           data.map(book =>
-             book.id === mutationData.id ? { ...book, ...mutationData } : book,
-           ),
-         );
-         mutate('/book', data =>
-           data.id === mutationData.id ? { ...data, ...mutationData } : data,
-         );
-       },
-     },
    });

-   const addBookMutation = useSWRMutation(
+   const addBookMutation = useNormalizedSWRMutation(
      '/books/add-book'
      () => Promise.resolve({
        id: '3',
        name: 'Name 3',
        author: { id: '1003', name: 'User3' },
      }),
      // with data with top level arrays, you still need to update data manually
      onSuccess: mutationData => {
        mutate('/books', data => [...data, mutationData]);
      },
    });

    // return some JSX
  };

  const App = () => (
-   <SWRConfig value={someSwrConfig}>
+   <SWRNormalizerProvider swrConfigValue={someSwrConfig}>
      <Books />
-   </SWRConfig>
+   </SWRNormalizerProvider>
  );
```

So, as you can see, apart from top level arrays, no manual data updates are necessary anymore. This is especially handy if a given mutation
should update data for multiple queries. Not only this is verbose to do updates manually, but also you need to exactly know,
which queries to update. The more queries you have, the bigger advantages `normy` brings.

## Installation [:arrow_up:](#table-of-content)

To install the package, just run:

```
$ npm install @normy/swr
```

or you can just use CDN: `https://unpkg.com/@normy/swr`.

You do not need to install `@normy/core`, because it will be installed as `@normy/swr` direct dependency.

## Basic usage [:arrow_up:](#table-of-content)

For the basic usage, see `Motivation` paragraph. The only thing which you need to actually do is to wrap your app
in `SWRNormalizerProvider` and to use `useNormalizedSWRMutation` to mutate data. After doing this, you can use `swr` as you normally do, but you don't need to make any data updates
most of the time anymore.

`SWRNormalizerProvider` accepts two props:

- `swrNormalizer` - this is just a config you would pass to `SWRConfig`
- `normalizerConfig` - this is `normy` config, which you might need to meet requirements for data normalization to work - see
  [explanation](https://github.com/klis87/normy/tree/master/#required-conditions-arrow_up) for more details. Additionally to `normy` config, you can also pass `normalize` option, which is `() => true` by default - you can use it
  to opt out normalization for given queries (see the next paragraph)

## Disabling of normalization per query and mutation [:arrow_up:](#table-of-content)

By default all your queries and mutations (if you use `useNormalizedSWRMutation`) will be normalized. That means that for each query there will be normalized representation
of its data and for each mutation its response data will be read and all dependent normalized queries will be updated.

However, it does not always make sense to normalize all data. You might want to disable data normalization, for example for performance reason for some extreme big queries,
or just if you do not need it for a given query, for instance if a query data will be never updated.

Anyway, you might want to change this by passing `normalize` to `SWRNormalizerProvider`:

```jsx
<SWRNormalizerProvider
  normalizerConfig={{
    normalize: queryKey => {
      if (queryKey === 'do-not-normalize-me') {
        return false;
      }

      return true;
    },
  }}
>
  {children}
</SWRNormalizerProvider>
```

Similarly, for mutations, you can use `normalize: false` to disable normalization
for a specific mutation, for example:

```js
useNormalizedSWRMutation(['mutation-key'], mutateData, {
  normalize: false,
});
```

Alternatively, you can just use native `swr` `mutate` or another method instead of `useNormalizedSWRMutation`.

## Optimistic updates [:arrow_up:](#table-of-content)

For normal mutations there is nothing you need to do, `normy` will inspect response data, calculate dependent queries,
update normalized data and update all relevant queries. With optimistic updates though, you need to prepare optimistic data
yourself:

```jsx
useNormalizedSWRMutation(
  'mutation-key',
  async () => {
    return Promise.resolve({
      id: '1',
      name: 'Name updated',
    });
  },
  {
    optimisticData: {
      id: '1',
      name: 'Name updated',
    },
    rollbackData: {
      id: '1',
      name: 'Name',
    },
  },
);
```

The above code will immediately update all queries which have object with `id: 1` in their data. In case of
a mutation error, data will be reverted to original `rollbackData`.

It will work at the same time as a normal mutation too, so on mutation success, all dependent queries will be updated
again. If you are sure about the response structure, you might want to disable normalization for this mutation,
so that on successful response the normalization won't be repeated unnecessarily:

```jsx
useNormalizedSWRMutation(
  'mutation-key',
  async () => {
    return Promise.resolve({
      id: '1',
      name: 'Name updated',
    });
  },
  {
    optimisticData: {
      id: '1',
      name: 'Name updated',
    },
    rollbackData: {
      id: '1',
      name: 'Name',
    },
    normalize: false,
  },
);
```

## useSWRNormalizer and manual updates [:arrow_up:](#table-of-content)

Sometimes you might need to update your data manually, without having API response. One of examples could be having a websocket event that
an object name has been changed. Now, instead of manually updating all your relevant queries, instead you could do below:

```jsx
import { useSWRNormalizer } from '@normy/swr';

const SomeComponent = () => {
  const normalizer = useSWRNormalizer();

  return (
    <button
      onClick={() =>
        normalizer.setNormalizedData({ id: '1', name: 'Updated name' })
      }
    >
      Update user
    </button>
  );
};
```

What it will do is updating normalized store, as well as finding all queries which contain user with `id` equal `'1'` and updating them with `name: 'Updated name'`.

## getObjectById and getQueryFragment [:arrow_up:](#table-of-content)

Sometimes it is useful to get an object from normalized store by id. You do not even need to know in which
query/queries this object could be, all you need is an id. For example, you might want to get it just to display it.

```jsx
import { useSWRNormalizer } from '@normy/swr';

const BookDetail = ({ bookId }) => {
  const normalizer = useQueryNormalizer();
  const book = queryNormalizer.getObjectById(bookId);

  //
};
```

In above example, imagine you want to display a component with a book detail. You might already have this book
fetched from a book list query, so you would like to show something to your user even before a detail book query is even fetched.

And what if book with this id does not exist? No harm done, `getObjectById` will just return `undefined`, so the user
will just wait for detail query to be finished as normally.

### getObjectById and recursive relationships

Because `getObjectById` denormalizes an object with an id, you might get some issues with recursive relationships.
Take below object:

```js
const user = {
  id: '1',
  name: 'X',
  bestFriend: {
    id: '2',
    name: 'Y',
    bestFriend: {
      id: '1',
      name: 'X',
    },
  },
};
```

Typically `normy` saves data structure for each query automatically, so that query normalization and denormalization
gives exactly the same results, even for above case. But `getObjectById` is different, as a given object could be
present in multiple queries, with different attributes.

With above example, you will end up with infinite recursion error and `getObjectById` will just return `undefined`.
You will also see a warning in the console, to use a second argument for this case, which tells `getObjectById`
what structure is should have, for example:

```js
const user = normalizer.getObjectById('1', {
  id: '',
  name: '',
  bestFriend: { id: '', name: '' },
});
```

In above case, `user` would be:

```js
const user = {
  id: '1',
  name: 'X',
  bestFriend: {
    id: '2',
    name: 'Y',
  },
};
```

Notice that 2nd argument - data structure you pass - contains empty strings. Why? Because it does not matter
what primitive values you will use there, only data type is important.

And now, for typescript users there is a gift - when you provide data structure as 2nd argument, `getObjectById`
response will be properly typed, so in our user example `user` will have type:

```ts
type User = {
  id: string;
  name: string;
  bestFriend: { id: string; name: string };
};
```

So, passing optional 2nd argument has the following use cases:

- controlling structure of returned object, for example you might be interested only in `{ id: '', name: '' }`
- preventing infinite recursions for relationships like friends
- having automatic Typescript type

### getQueryFragment

`getQueryFragment` is a more powerful version of `getObjectById`, actually `getObjectById` uses `getQueryFragment`
under the hood. Basically `getQueryFragment` allows you to get multiple objects in any data structure you need,
for example:

```js
import { getId } from '@normy/swr';

const users = normalizer.getQueryFragment([getId('1'), getId('2')]);
const usersAndBook = normalizer.getQueryFragment({
  users: [getId('1'), getId('2')],
  book: getId('3'),
});
```

Notice we need to use `getId` helper, which transform `id` you pass into its internal format.

Anyway. if any object does not exist, it will be `undefined`. For example, assuming user with id `1` exists and `2` does not,
`users` will be:

```js
[
  {
    id: '1',
    name: 'Name 1',
  },
  undefined,
];
```

Like for `getObjectById`, you can also pass data structure, for example:

```js
import { getId } from '@normy/swr';

const usersAndBook = normalizer.getQueryFragment(
  { users: [getId('1'), getId('2')], book: getId('3') },
  {
    users: [{ id: '', name: '' }],
    book: { id: '', name: '', author: '' },
  },
);
```

Notice that to define an array type, you just need to pass one item, even though we want to have two users.
This is because we care only about data structure.

## Garbage collection [:arrow_up:](#table-of-content)

`normy` know how to clean after itself. When a query is removed from the store, `normy` will do the same, removing all redundant
information.

## Clearing [:arrow_up:](#table-of-content)

When `SWRNormalizerProvider` is unmounted, all normalized data will be automatically cleared.

## Examples [:arrow_up:](#table-of-content)

I highly recommend to try examples how this package could be used in real applications.

There are following examples currently:

- [swr](https://github.com/klis87/normy/tree/master/examples/swr)

## Licence [:arrow_up:](#table-of-content)

MIT
