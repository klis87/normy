# @normy/vue-query

[![npm version](https://badge.fury.io/js/%40normy%2Fvue-query.svg)](https://badge.fury.io/js/%40normy%2Fvue-query)
[![gzip size](https://img.badgesize.io/https://unpkg.com/@normy/vue-query/dist/normy-vue-query.min.js?compression=gzip)](https://unpkg.com/@normy/vue-query)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/klis87/normy/ci.yml?branch=master)](https://github.com/klis87/normy/actions)
[![Coverage Status](https://coveralls.io/repos/github/klis87/normy/badge.svg?branch=master)](https://coveralls.io/github/klis87/normy?branch=master)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

`vue-query` integration with `normy` - automatic normalization and data updates for data fetching libraries

## Table of content

- [Introduction](#introduction-arrow_up)
- [Motivation](#motivation-arrow_up)
- [Installation](#installation-arrow_up)
- [Basic usage](#basic-usage-arrow_up)
- [Disabling of normalization per query and mutation](#disabling-of-normalization-per-query-and-mutation-arrow_up)
- [Optimistic updates](#optimistic-updates-arrow_up)
- [useQueryNormalizer and manual updates](#useQueryNormalizer-and-manual-updates-arrow_up)
- [getObjectById and getQueryFragment](#getObjectById-and-getQueryFragment-arrow_up)
- [getDependentQueries and getDependentQueriesByIds](#getDependentQueries-and-getDependentQueriesByIds-arrow_up)
- [Garbage collection](#garbage-collection-arrow_up)
- [Structural sharing](#structural-sharing-arrow_up)
- [Examples](#examples-arrow_up)

## Introduction [:arrow_up:](#table-of-content)

This is the official `vue-query` integration with `normy`, a library, which allows your application data to be normalized automatically. This documentation will cover only `vue-query` specifics, so if you did not already do that, you can
find `normy` documentation [here](https://github.com/klis87/normy/tree/master).

## Motivation [:arrow_up:](#table-of-content)

In order to understand what `@normy/vue-query` actually does, it is the best to see an example:

```diff
  import { createApp } from 'vue';
  import {
    VueQueryPlugin,
    QueryClient,
    useQueryClient,
  } from '@tanstack/react-query';
+ import { VueQueryNormalizerPlugin } from '@normy/vue-query';

  <script>
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
  </script>

  const queryClient = new QueryClient();

  createApp(App)
+   .use(VueQueryNormalizerPlugin, { queryClient })
    .use(VueQueryPlugin, { queryClient })
    .mount('#app');
```

So, as you can see, apart from top level arrays, no manual data updates are necessary anymore. This is especially handy if a given mutation
should update data for multiple queries. Not only this is verbose to do updates manually, but also you need to exactly know,
which queries to update. The more queries you have, the bigger advantages `normy` brings.

## Installation [:arrow_up:](#table-of-content)

To install the package, just run:

```
$ npm install @normy/vue-query
```

or you can just use CDN: `https://unpkg.com/@normy/vue-query`.

You do not need to install `@normy/core`, because it will be installed as `@normy/vue-query` direct dependency.

## Basic usage [:arrow_up:](#table-of-content)

For the basic usage, see `Motivation` paragraph. The only thing which you need to actually do is to pass `queryClient`
to `VueQueryNormalizerPlugin`. After doing this, you can use `vue-query` as you normally do, but you don't need to make any data updates
most of the time anymore.

`VueQueryNormalizerPlugin` accepts two options:

- `queryClient` - this is just a vue-query instance you create by `new QueryClient(config)`,
- `normalizerConfig` - this is `normy` config, which you might need to meet requirements for data normalization to work - see
  [explanation](https://github.com/klis87/normy/tree/master/#required-conditions-arrow_up) for more details. Additionally to `normy` config, you can also pass `normalize` option, which is `true` by default - if you pass `false`, nothing will be normalized unless explicitely set (see the next paragraph)

## Disabling of normalization per query and mutation [:arrow_up:](#table-of-content)

By default all your queries and mutations will be normalized. That means that for each query there will be normalized representation
of its data and for each mutation its response data will be read and all dependent normalized queries will be updated.

However, it does not always make sense to normalize all data. You might want to disable data normalization, for example for performance reason for some extreme big queries,
or just if you do not need it for a given query, for instance if a query data will be never updated.

Anyway, you might want to change this globally by passing `normalize: false` to `QueryNormalizerProvider`:

```js
createApp(App)
  .use(VueQueryNormalizerPlugin, {
    queryClient,
    normalizerConfig: { normalize: false },
  })
  .use(VueQueryPlugin, { queryClient })
  .mount('#app');
```

Then, you may override the global default `normalize` setting per query and mutation.
For this, you can use `meta` option, for example for `useQuery`:

```js
useQuery({
  queryKey: ['query-key'],
  queryFn: loadData,
  meta: {
    normalize: true,
  },
});
```

or for `useMutation`:

```js
useMutation({
  mutationFn,
  meta: {
    normalize: true,
  },
});
```

Similarly, you can have `normalize: true` set globally (default), but you could disable normalization
for a specific query or a mutation, for example:

```js
useQuery({
  queryKey: ['query-key'],
  queryFn: loadData,
  meta: {
    normalize: false,
  },
});
```

## Optimistic updates [:arrow_up:](#table-of-content)

For normal mutations there is nothing you need to do, `normy` will inspect response data, calculate dependent queries,
update normalized data and update all relevant queries. With optimistic updates though, you need to prepare optimistic data
yourself:

```js
useMutation({
  mutationFn: async () => {
    return {
      id: '1',
      name: 'Name updated',
    };
  },
  onMutate: () => {
    return {
      optimisticData: {
        id: '1',
        name: 'Name updated',
      },
      // this is optional, if not passed, it will be calculated automatically!
      rollbackData: {
        id: '1',
        name: 'Name',
      },
    };
  },
});
```

The above code will immediately update all queries which have object with `id: 1` in their data. In case of
a mutation error, data will be reverted to original `rollbackData`. Note that you do not even need to pass it,
because if not passed, `normy` will calculate it for you, automatically!

It will work at the same time as a normal mutation too, so on mutation success, all dependent queries will be updated
again. If you are sure about the response structure, you might want to disable normalization for this mutation,
so that on successful response the normalization won't be repeated unnecessarily:

```js
useMutation({
  mutationFn: async () => {
    return {
      id: '1',
      name: 'Name updated',
    };
  },
  onMutate: () => {
    return {
      optimisticData: {
        id: '1',
        name: 'Name updated',
      },
      rollbackData: {
        id: '1',
        name: 'Name',
      },
    };
  },
  meta: {
    normalize: false,
  },
});
```

## useQueryNormalizer and manual updates [:arrow_up:](#table-of-content)

Sometimes you might need to update your data manually, without having API response. One of examples could be having a websocket event that
an object name has been changed. Now, instead of manually updating all your relevant queries, instead you could do below:

```vue
<script>
import { useQueryNormalizer } from '@normy/vue-query';

const queryNormalizer = useQueryNormalizer();

const updateUser = () => {
  queryNormalizer.setNormalizedData({ id: '1', name: 'Updated name' });
};
</script>

<template>
  <button @click="updateUser()">Update user</button>
</template>
```

What it will do is updating normalized store, as well as finding all queries which contain user with `id` equal `'1'` and updating them with `name: 'Updated name'`.

## getObjectById and getQueryFragment [:arrow_up:](#table-of-content)

Sometimes it is useful to get an object from normalized store by id. You do not even need to know in which
query/queries this object could be, all you need is an id. For example, you might want to get it just to display it.
An even more interesting example is that you could use it as `initialData` or `placeholderData` for another `useQuery`,
so that you could render some data before even query is fetched:

```vue
<script>
import { useQueryNormalizer } from '@normy/vue-query';

const queryNormalizer = useQueryNormalizer();
const bookPlaceholder = queryNormalizer.getObjectById(1);
const { data } = useQuery({
  queryKey: ['books', 1],
  placeholderData: bookPlaceholder,
  ...otherOptions,
});
</script>
```

In above example, imagine you want to display a component with a book detail. You might already have this book
fetched from a book list query, so you would like to show something to your user before detail book query is even fetched. It is not even a problem that `bookPlaceholder` could have not complete data, for example you could have
`name` but not `description`. `placeholderData` is perfect for this, and instead of showing just a spinner,
you could also already show `name` for faster user experience.

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

```vue
<script>
import { useQueryNormalizer } from '@normy/vue-query';

const queryNormalizer = useQueryNormalizer();
const user = queryNormalizer.getObjectById('1', {
  id: '',
  name: '',
  bestFriend: { id: '', name: '' },
});
</script>
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
import { getId } from '@normy/vue-query';

const users = queryNormalizer.getQueryFragment([getId('1'), getId('2')]);
const usersAndBook = queryNormalizer.getQueryFragment({
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
import { getId } from '@normy/vue-query';

const usersAndBook = queryNormalizer.getQueryFragment(
  { users: [getId('1'), getId('2')], book: getId('3') },
  {
    users: [{ id: '', name: '' }],
    book: { id: '', name: '', author: '' },
  },
);
```

Notice that to define an array type, you just need to pass one item, even though we want to have two users.
This is because we care only about data structure.

## getDependentQueries and getDependentQueriesByIds [:arrow_up:](#table-of-content)

Sometimes you might have an object, or even data with multiple objects, and get an answer to the question - what queries
actually hold this object/these objects. For example, you might prefer to invalidate/refetch all queries, instead of
just relying on automatic data updates in memory. Or.... you might want to abort all pending requests from dependent queries.

For this, you can use `getObjectById` and `getQueryFragment` helpers, which both give you a list of all dependend queries.

### getDependentQueries

For example, if you have a `data`, containing some objects, you could check all dependent queries like this:

```js
const listOfDependentQueries = queryNormalizer.getDependentQueries({
  id: '1',
  name: 'x',
  nested: { id: '2' },
});
```

Now, assuming, that objects with ids `1` and `2` are both normalizable, you will receive a list of all queries holding those objects, for example `[['books'], ['book', 1], ['book', 2]]`. Then, you can do anything with them, like invalidate/abort by just
using normal `vue-query` API.

### getDependentQueriesByIds

For example, if you have a `data`, containing some objects, you could check all dependent queries like this:

```js
const listOfDependentQueries = queryNormalizer.getDependentQueriesByIds([
  '1',
  '2',
]);
```

This is the same as above, it just does not use data as argument, but a list of object ids.

## Garbage collection [:arrow_up:](#table-of-content)

`normy` know how to clean after itself. When a query is removed from the store, `normy` will do the same, removing all redundant
information.

## Structural sharing [:arrow_up:](#table-of-content)

By default, this library takes advantage over `vue-query` structural sharing feature. Structural sharing benefit is the following - if a query
is refetched, its data will remain referentially the same if it is the same structurally (when API response is the same).

Typically it was implemented in order to have optimizations like avoiding rerenders for the same data,
but `normy` also takes advantage over it, namely, if a query was just refetched but its data is the same,
`normy` will not unnecessarily normalize it (as it would normalize it to the same value it has now anyway).

This brings big performance improvements, especially during refetches on window refocus (if you use this feature), as then
potentially dozens of queries could be refetched simultaneously. In practice, most of those responses will be the same,
which will prevent data to be normalized again unnecessarily (to the very same normalized value).

So it is even more beneficial not to turn off `vue-query` structural sharing feature!

## Examples [:arrow_up:](#table-of-content)

I highly recommend to try examples how this package could be used in real applications.

There are following examples currently:

- [vue-query](https://github.com/klis87/normy/tree/master/examples/vue-query)

## Licence [:arrow_up:](#table-of-content)

MIT
