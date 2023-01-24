# ![Redux-Requests](https://raw.githubusercontent.com/klis87/redux-requests/master/images/logo.png)

[![npm version](https://badge.fury.io/js/%40redux-requests%2Fcore.svg)](https://badge.fury.io/js/%40redux-requests%2Fcore)
[![gzip size](https://img.badgesize.io/https://unpkg.com/@redux-requests/core/dist/redux-requests.min.js?compression=gzip)](https://unpkg.com/@redux-requests/core)
[![dependencies](https://david-dm.org/klis87/redux-requests.svg?path=packages/redux-requests)](https://david-dm.org/klis87/redux-requests?path=packages/redux-requests)
[![dev dependencies](https://david-dm.org/klis87/redux-requests/dev-status.svg?path=packages/redux-requests)](https://david-dm.org/klis87/redux-requests?path=packages/redux-requests&type=dev)
[![peer dependencies](https://david-dm.org/klis87/redux-requests/peer-status.svg?path=packages/redux-requests)](https://david-dm.org/klis87/redux-requests?path=packages/redux-requests&type=peer)
[![Build Status](https://travis-ci.org/klis87/redux-requests.svg?branch=master)](https://travis-ci.org/klis87/redux-requests)
[![Coverage Status](https://coveralls.io/repos/github/klis87/redux-requests/badge.svg?branch=master)](https://coveralls.io/github/klis87/redux-requests?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/klis87/redux-requests/badge.svg)](https://snyk.io/test/github/klis87/redux-requests)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

Declarative AJAX requests and automatic network state management for single-page applications

![Redux-Requests showcase](https://raw.githubusercontent.com/klis87/redux-requests/master/images/showcase.gif)

## Table of content

- [Motivation](#motivation-arrow_up)
- [Features](#features-arrow_up)
- [Installation](#installation-arrow_up)
- [Usage](#usage-arrow_up)
- [Examples](#examples-arrow_up)
- [Companion libraries](#examples-arrow_up)

## Motivation [:arrow_up:](#table-of-content)

With `redux-requests`, assuming you use `axios` (you could use it with anything else too!) you could refactor a code in the following way:

```diff
  import axios from 'axios';
- import thunk from 'redux-thunk';
+ import { handleRequests } from '@redux-requests/core';
+ import { createDriver } from '@redux-requests/axios'; // or another driver

  const FETCH_BOOKS = 'FETCH_BOOKS';
- const FETCH_BOOKS_SUCCESS = 'FETCH_BOOKS_SUCCESS';
- const FETCH_BOOKS_ERROR = 'FETCH_BOOKS_ERROR';
-
- const fetchBooksRequest = () => ({ type: FETCH_BOOKS });
- const fetchBooksSuccess = data => ({ type: FETCH_BOOKS_SUCCESS, data });
- const fetchBooksError = error => ({ type: FETCH_BOOKS_ERROR, error });

- const fetchBooks = () => dispatch => {
-   dispatch(fetchBooksRequest());
-
-   return axios.get('/books').then(response => {
-     dispatch(fetchBooksSuccess(response.data));
-     return response;
-   }).catch(error => {
-     dispatch(fetchBooksError(error));
-     throw error;
-   });
- }

+ const fetchBooks = () => ({
+   type: FETCH_BOOKS,
+   request: {
+     url: '/books',
+     // you can put here other Axios config attributes, like method, data, headers etc.
+   },
+ });

- const defaultState = {
-   data: null,
-   pending: 0, // number of pending FETCH_BOOKS requests
-   error: null,
- };
-
- const booksReducer = (state = defaultState, action) => {
-   switch (action.type) {
-     case FETCH_BOOKS:
-       return { ...defaultState, pending: state.pending + 1 };
-     case FETCH_BOOKS_SUCCESS:
-       return { ...defaultState, data: action.data, pending: state.pending - 1 };
-     case FETCH_BOOKS_ERROR:
-       return { ...defaultState, error: action.error, pending: state.pending - 1 };
-     default:
-       return state;
-   }
- };

  const configureStore = () => {
+   const { requestsReducer, requestsMiddleware } = handleRequests({
+     driver: createDriver(axios),
+   });
+
    const reducers = combineReducers({
-     books: booksReducer,
+     requests: requestsReducer,
    });

    const store = createStore(
      reducers,
-     applyMiddleware(thunk),
+     applyMiddleware(...requestsMiddleware),
    );

    return store;
  };
```

## Features [:arrow_up:](#table-of-content)

### Just actions

Just dispatch actions and enjoy automatic AJAX requests and network state management

### First class aborts support

Automatic and configurable requests aborts, which increases performance
and prevents race condition bugs before they even happen

### Drivers driven

Compatible with anything for server communication. Axios, Fetch API,
GraphQL, promise libraries, mocking? No problem! You can also integrate
it with other ways by writing a custom driver!

### Batch requests

Define multiple requests in single action

### Optimistic updates

Update remote data before receiving server response to improve perceived performance

### Cache

Cache server response forever or for a defined time period to decrease
amount of network calls

### Data normalisation

Use automatic data normalisation in GraphQL Apollo fashion, but for anything, including REST!

### Server side rendering

Configure SSR totally on Redux level and write truly universal code
between client and server

### React bindings

Use react bindings to decrease code amount with React even more

### Typescript friendly

It has many utilities to make Typescript experience even greater, for example all data generics are inferred in selectors
and dispatch results automatically.

## Installation [:arrow_up:](#table-of-content)

To install the package, just run:

```
$ npm install @redux-requests/core
```

or you can just use CDN: `https://unpkg.com/@redux-requests/core`.

Also, you need to install a driver:

- if you use Axios, install `axios` and `@redux-requests/axios`:

  ```
  $ npm install axios @redux-requests/axios
  ```

  or CDN: `https://unpkg.com/@redux-requests/axios`.

- if you use Fetch API, install `isomorphic-fetch` (or a different Fetch polyfill) and `@redux-requests/fetch`:

  ```
  $ npm install isomorphic-fetch redux-requests/fetch
  ```

  or CDN: `https://unpkg.com/@redux-requests/fetch`.

Also, you have to install `reselect`, which probably you use anyway.

## Usage [:arrow_up:](#table-of-content)

For usage, see [documentation](https://redux-requests.klisiczynski.com/docs/introduction/motivation)

## Examples [:arrow_up:](#table-of-content)

I highly recommend to try examples how this package could be used in real applications. You could play with those demos
and see what actions are being sent with [redux-devtools](https://github.com/zalmoxisus/redux-devtools-extension).

There are following examples currently:

- [basic](https://github.com/klis87/redux-requests/tree/master/examples/basic)
- [advanced](https://github.com/klis87/redux-requests/tree/master/examples/advanced)
- [mutations](https://github.com/klis87/redux-requests/tree/master/examples/mutations)
- [normalisation](https://github.com/klis87/redux-requests/tree/master/examples/normalisation)
- [Fetch API](https://github.com/klis87/redux-requests/tree/master/examples/fetch-api)
- [GraphQL](https://github.com/klis87/redux-requests/tree/master/examples/graphql)
- [actions-creator](https://github.com/klis87/redux-requests/tree/master/examples/actions-creator)
- [mock-and-multiple-drivers](https://github.com/klis87/redux-requests/tree/master/examples/mock-and-multiple-drivers)
- [server-side-rendering](https://github.com/klis87/redux-requests/tree/master/examples/server-side-rendering)
- [suspense-ssr](https://github.com/klis87/redux-requests/tree/master/examples/suspense-ssr)
- [promise driver](https://github.com/klis87/redux-requests/tree/master/examples/promise-driver)
- [showcase](https://github.com/klis87/redux-requests/tree/master/examples/showcase)

## Companion libraries [:arrow_up:](#table-of-content)

- [redux-smart-actions](https://github.com/klis87/redux-smart-actions) - Redux addon to create actions and thunks with minimum boilerplate, you can use it to create requests actions faster and in a less verbose way, without constants,
  useful especially to create thunks without constants, so you have access to Redux state in request actions without
  any need to pass them with action arguments

## Licence [:arrow_up:](#table-of-content)

MIT
