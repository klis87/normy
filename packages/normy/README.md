<div align="center">
  <h1>
    <img src="https://raw.githubusercontent.com/klis87/normy/refs/heads/master/logo.webp" width="120px" align="center" alt="Normys logo" />
    <span style="font-size: 150%; vertical-align: middle;">Normy</span>
    <br />
    <br />
  </h1>
</div>
<br />

[![npm version](https://badge.fury.io/js/%40normy%2Fcore.svg)](https://badge.fury.io/js/%40normy%2Fcore)
[![gzip size](https://img.badgesize.io/https://unpkg.com/@normy/core/dist/normy.min.js?compression=gzip)](https://unpkg.com/@normy/core)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/klis87/normy/ci.yml?branch=master)](https://github.com/klis87/normy/actions)
[![Coverage Status](https://coveralls.io/repos/github/klis87/normy/badge.svg?branch=master)](https://coveralls.io/github/klis87/normy?branch=master)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

Automatic normalization and data updates for data fetching libraries (react-query, swr, rtk-query and more)

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

The core of `normy` - namely `@normy/core` library, which is not meant to be used directly in applications, has logic inside which allows an easily integration with your favourite data fetching libraries. There are already official integrations with `react-query`, `swr` and `RTK Query`. If you use another fetching library, you could raise the Github issue, so it might be added
as well.

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

    const { data: booksData } = useQuery(['books'], () =>
      Promise.resolve({
        books: [
          { id: '1', name: 'Name 1', author: { id: '1001', name: 'User1' } },
          { id: '2', name: 'Name 2', author: { id: '1002', name: 'User2' } },
        ],
      }),
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
-       queryClient.setQueryData(['books'], data => ({
-         books: data.books.map(book =>
-           book.id === mutationData.id ? { ...book, ...mutationData } : book,
-         ),
-       }));
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
-       queryClient.setQueryData(['books'], data => ({
-         books: data.books.map(book =>
-           book.id === mutationData.id ? { ...book, ...mutationData } : book,
-         ),
-       }));
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
+      __append: 'books',
      }),
-     onSuccess: mutationData => {
-       queryClient.setQueryData(['books'], data => ({ books: data.books.concat(mutationData) });
-     },
    });

    // return some JSX
  };

  const App = () => (
+   <QueryNormalizerProvider
+     queryClient={queryClient}
+     normalizerConfig={{ getArrayType: ({ arrayKey }) => arrayKey }}
+   >
      <QueryClientProvider client={queryClient}>
        <Books />
      </QueryClientProvider>
+   </QueryNormalizerProvider>
  );
```

So, as you can see, no manual data updates are necessary anymore. This is especially handy if a given mutation
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

Notice, that it even works for array operations! It requires though 2 things first, config callback to compute array types `getArrayType`
and some hints, what operations should be applied (in our case `\_\_append: 'books'). We will cover this more in arrays chapter,
but to give you some teaser, it is very flexible, we have numerous built-in operations, plus it is possible to create custom array operations. All of this should prevent any need to write any imperative code to update any data, no exceptions!

## Installation [:arrow_up:](#table-of-content)

### react-query

To install the package, just run:

```
$ npm install @normy/react-query
```

or you can just use CDN: `https://unpkg.com/@normy/react-query`.

### vue-query

To install the package, just run:

```
$ npm install @normy/vue-query
```

or you can just use CDN: `https://unpkg.com/@normy/vue-query`.

### swr

To install the package, just run:

```
$ npm install @normy/swr
```

or you can just use CDN: `https://unpkg.com/@normy/swr`.

### rtk-query

To install the package, just run:

```
$ npm install @normy/rtk-query
```

or you can just use CDN: `https://unpkg.com/@normy/rtk-query`.

### another lirary

If you want to write a plugin to another library than `react-query`, `swr` or `rtk-query`:

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

Let's say you have a data in a query like:

```ts
{
  id: '1',
  name: 'Book name',
  authors: [{ id: '2', name: 'Author name' }],
}
```

Then, updating `authors` is easy, just have a mutation with response:

```ts
{
  id: '1',
  authors: [{ id: '2', name: 'Author name 2' }, { id: '3', name: 'Author name 3' }],
}
```

Then, just `authors` array will be replaced with the new one. But what if you have some data with arrays not belonging to any object? Like:

```ts
{
  books: [{ id: '1', name: 'Book name' }],
}
```

For such cases, typically you would need to either refetch such a query or... update `books` data manually yourself. However, in the
contrary to other normalization automatic updates systems, like Apollo or Relay, Normy supports even automatic updates for such cases,
in the spirit of always following declarative data updates pirinciple. To make it work though, we need to do 2 things first, namely
providing a config function to compute array type and decorating normalized nodes in mutation responses with so-called array operation hints.

Please note, that this paragraph is quite long in comparison to others. It does not mean that array operations are hard, just it takes
many examples to explain all concepts properly. However, if you wish, at least for now, to skip this chapter, this is completely fine.
You can just update your data manually or refetch queries for array operations, if you prefer, and later, you could gradually switch to automatic array operations, once
you are ready.

### Computing array type

Typically, in the contrast to objects, array does not have anything like `id` or `type`. Therefore, we need to declare in config
how those should be calculated. For this, we can use `getArrayType` config function, for example:

```tsx
<QueryNormalizerProvider
  queryClient={queryClient}
  normalizerConfig={{ getArrayType: ({ arrayKey }) => arrayKey }}
>
  {children}
</QueryNormalizerProvider>
```

For instance, if we have a data like `{ books: [{ id: '1', name: 'Name 1' }] }`, `normalizerConfig` will set this array type as `books`.

`getArrayType` has passed the following attributes, (together with `arrayKey`), so that it should be possible to handle any data structure:

- `arrayKey` - like you probably guessed in the above example, this is just `key`, under which the array is stored in parent object
- `array` - the array itself, in case you need to compute array type based on array content
- `parentObj` - the object which holds the array
- `queryKey` - this is query key, which holds a data containing a given array, this is provided as a last resort, in case the above attributes are not enough for your case

Now, imagine you use more GraphQL style of storing arrays, like `{ type: 'books', edges: [{ id: '1', name: 'Name 1' }] }`, to cover this
case, you could do:

```ts
{
  getArrayType: ({ parentObj, arrayKey }) =>
    parentObj.type && arrayKey === 'edges' ? parentObj.type : undefined;
}
```

Other ideas, you might use an infinite scrolling feature, which would end up with data like:

```ts
[
  {
    page: 1,
    data: [
      { id: '1', name: 'Name 1' },
      { id: '2', name: 'Name 2' },
    ],
  },
  {
    page: 2,
    data: [
      { id: '3', name: 'Name 3' },
      { id: '4', name: 'Name 4' },
    ],
  },
];
```

Then, you could detect paginated data and compute array type like:

```ts
{
  getArrayType: ({ parentObj, arrayKey }) => {
    if (parentObj.page !== undefined) {
      return `${arrayKey}:${parentObj.page}`;
    }

    return arrayKey;
  };
}
```

As you can see, `getArrayType` is highly flexible and it should allow you to assign proper array types no matter what data structure you use.

### Array operation hints

Now, after you set `getArrayType` function, let's say you have a mutation `ADD_BOOK`, with response `{ id: '2', name: 'New book' }`.
You would like it to be automatically added to a books array somewhere in a query/queries. The problem is, that without some hints,
it is not possible to know what and where it should be done. For example, should we add it to every array with books? We do not know,
as one array could hold all books, but another one could hold only favourite books, is book with `id: 2` a favourite one? We could go on and on, but the point is, we need to decorate our mutation responses with what should be exactly done. We do it by using special attributes,
which we put into relevant objects. For example, in order to add book to `books` array, we can do this:

```ts
{ id: '2', name: 'New book', __append: 'books' }
```

That's it! We add a special meta property `__apend`, and put value as `books`, which is just the name of array into which the new book
will be appended to. Ok, but what, if we want this object to be added to multiple arrays? No problem:

```ts
{ id: '2', name: 'New book', __append: ['books', 'favouriteBooks'] }
```

You just provide value as array of array types.

There are more array operations than `append`, but before we learn all of them, let's discuss a way to inject props to more complex
operations. For example let's analyze `insert` operation, which allows us to put an object to a given array at given index.
How to do it? Well, as operation value, we do not just pass names of array types, but an object like this:

```ts
{ id: '2', name: 'New book', __insert: { arrayTypes: 'books', index: 1 } }
```

This way we can pass a property like `index` for operations requiring those. To insert this object to multiple arrays, of course we do:

```ts
{
  id: '2',
  name: 'New book',
 _insert: { arrayTypes: ['books', 'favouriteBooks'], index: 1 },
}
```

So like before, we can just pass array of array types. Ok, but what, if we need to set different indexes for different array types?

```ts
{
  id: '2',
  name: 'New book',
  __insert: [{ arrayType: 'books', index: 1 }, { arrayType: 'favouriteBooks', index: 2 }],
}
```

As you can see, you just pass array of operation configs, so that each array type can have dedicated properties.

And what, if you would like to multiple operations to one node? Easy:

```ts
{
  id: '2',
  name: 'New book',
  __append: 'favouriteBooks',
  __insert: { arrayTypes: 'books', index: 1 },
}
```

You just add multiple meta operation properties to the same object.

Of course, you can have multiple objects in a mutation response, each one having multiple operations. It does not matter how many,
all of them will be executed. All we care about is to mark what operation should be executed on a given node, and for which array type.
We do not care where a given array is stored, and in how many queries, this is all handled for us automatically.

Also, before we go on, we need to divide operations to node operations - like `append` and `insert`, and nodeless operations, like `clear`. `clear` operations is to clear a given array. It means that it does not belong to any specific node (which could be for instance
appended somewhere). Nodeless operations look similarly to node operations, they are objects with meta property, the difference is that
it does not extend a node, it is just a standalone object, for example `{ __clear: 'books' }`.

Moreover, to simplify the process of adding those meta properties, and also, if you use TypeScript, to give you some typesafety when adding them, you can use `arrayHelpers`, for example:

```ts
import { arayHelpers } from '@normy/react-query';

arayHelpers.append({ id: '2', name: 'New book' }, 'books');
arayHelpers.insert({ id: '2', name: 'New book' }, 'books', { index: 1 });
arayHelpers.clear('books');
```

This is the same like adding those attributes manually, so it is optional to use. To give you more examples, you
probably guessed that, but if you want to execute multiple operations for a mutation data, you can do it for example as:

```ts
import { arayHelpers } from '@normy/react-query';

const mutationData = { id: '2', name: 'New book' };

const mutationDataWithOperations = [
  arayHelpers.append(mutationData, 'books'),
  arayHelpers.clear('favouriteBooks'),
];
```

The point is, it really does not matter how you reformat mutation responses, all operations will be found anyway.

Also, you might ask a question, how to apply multiple operations into one node with `arayHelpers`? You can use `chain` for that:

```ts
arayHelpers
  .chain({ id: '2', name: 'New book' })
  .append('books')
  .insert('favouriteBooks', { index: 1 })
  .insert('soldBooks', { index: 2 })
  .apply();
```

So, you call `chain` with a node, and then you use all operations like previously (but without passing node as it was already passed to `chain`). And... after you set all methods to chain, you need to finish everything with `apply`.

Also, what is very important, obviously chaining can be done only for node operations. For nodeless operations like `__clear` it does
not make sense to chain, because nodeless operations are not executed on any node, so there is not point chaining them.

Now, after you have all bacics, how to use operations, let's analyze all built-in array operations.

#### insert

Insert allows us to inject a node to an array at given index. Like we showed above, we use it like `{ id: '2', name: 'New book', __insert: { arrayTypes: 'books', index: 0 } }`.

There are some interesting additional qualities for `insert` operation:

1. Negative indexes (like in Python) are supported, for example you can set `-1` to insert as the last item
2. Duplicates are prevented - if you try to insert a node with `id` to an array where this item is already there, the operation will be ignored - probably duplicating items
   is not what would be correct.
3. If the inserted node has more properties, that other nodes in array you insert into, they will be removed - node structure should be consistent within an array
4. For convenience, if you insert a node which miss some properties which are present in other nodes in an array, if possible, they will be picked from normalized store
   and added automatically. If not possible, a warning will be shown in the console.

#### append

This is like `insert` with `index: -1`, for example `{ id: '2', name: 'New book', __append: 'books' }`.

#### prepend

This is like `insert` with `index: 0`, for example `{ id: '2', name: 'New book', __prepend: 'books' }`.

#### remove

Allows us to remove a node from an array, for example `{ id: '2', name: 'Book', __remove: 'books' }`. Notice that no index is passed, because node is removed by id.

#### replace

Replaces a node at given `index` in an array with node you add this operation to, for example `{ id: '2', name: 'New book', __replace: { arrayTypes: 'books', index: 0 } }`.

#### move

Useful to move a node to a different array index, for example `{ id: '2', name: 'Book', __replace: { arrayTypes: 'books', toIndex: 2 } }`.

#### swap

Similar to `move`, but node at `toIndex` index will go to the initial position of node you apply operation to, for example `{ id: '2', name: 'Book', __swap: { arrayTypes: 'books', toIndex: 2 } }`.

#### clear

This is nodeless operation to clear an entire array, for example `{ __clear: 'books' }`.

#### replaceAll

This is nodeless operation to replace an array with a completely new value, for example `{ __replaceAll: { arrayType: 'books', value: [{ id: '2', name: 'Book' }] }`.

### Custom operations

In order to support maximum flexibility, you can provide your own custom operations, like sort, or whatever you can imagine. To do it, pass `customArrayOperations`, for example:

```ts
{
  getArrayType: ({ arrayKey }) => arrayKey,
  customArrayOperations: {
    // simplified append,just simplified
    __push: props => [...props.array, props.operation.node],
    // reimplementation of build-in replace
    __replaceWith: props =>
      typeof props.operation.props?.index === 'number'
        ? props.array.map((item, index) =>
            index === props.operation.props?.index
              ? props.operation.node
              : item,
          )
        : props.array,
    __reverse: props => [...props.array].reverse(),
  },
};
```

Also, you can extend array helpers with your operations:

```ts
import { createArrayHelpers } from '@normy/react-query';

const customArrayHelpers = createArrayHelpers({
  nodelessOperations: {
    reverse: (arrayType: string) => ({
      __reverse: { arrayTypes: arrayType },
    }),
  },

  nodeOperations: {
    push: (node, arrayType) => ({
      ...node,
      __push: Array.isArray(node.__push)
        ? [...node.__push, arrayType] // to support chaining
        : [arrayType],
    }),

    replaceWith: (node, arrayType, config) => ({
      ...node,
      __replaceWith: Array.isArray(node.__replaceWith)
        ? [...node.__replaceWith, { arrayType, index: config.index }]
        : [{ arrayType, index: config.index }],
    }),
  },
});
```

Note, that `nodelessOperations` will not support `chain`, while `nodeOperations` will.

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
4. Do not disable `structuralSharing` option in libraries which support it - if a query data after update is the same referentially as before update, then this query will not be normalized. This is a big performance optimization, especially after refetch on refocus, which could update multiple queries at the same time, usually to the very same data.
5. You can use `getNormalizationObjectKey` function to set globally which objects should be actually normalized. For example:

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

Currently the are three official integrations with data fetching libraries, namely `react-query`, `swr` and `rtk-query`. See dedicated documentations for specific integrations:

- [react-query](https://github.com/klis87/normy/tree/master/packages/normy-react-query)
- [vue-query](https://github.com/klis87/normy/tree/master/packages/normy-vue-query)
- [swr](https://github.com/klis87/normy/tree/master/packages/normy-swr)
- [rtk-query](https://github.com/klis87/normy/tree/master/packages/normy-rtk-query)

## Examples [:arrow_up:](#table-of-content)

I highly recommend to try examples how this package could be used in real applications.

There are following examples currently:

- [react-query](https://github.com/klis87/normy/tree/master/examples/react-query)
- [trpc](https://github.com/klis87/normy/tree/master/examples/trpc)
- [vue-query](https://github.com/klis87/normy/tree/master/examples/vue-query)
- [swr](https://github.com/klis87/normy/tree/master/examples/swr)
- [rtk-query](https://github.com/klis87/normy/tree/master/examples/rtk-query)

## Licence [:arrow_up:](#table-of-content)

MIT
