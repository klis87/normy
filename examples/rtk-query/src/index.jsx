import '@babel/polyfill';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { createNormalizationMiddleware } from '@normy/rtk-query';

import { api } from './api';
import App from './components/app';

const normalizationMiddleware = createNormalizationMiddleware(api, {
  devLogging: true,
});

const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  middleware: getDefaultMiddleware => [
    ...getDefaultMiddleware(),
    api.middleware,
    normalizationMiddleware,
  ],
});

const renderApp = () => {
  const container = document.getElementById('root');
  const root = createRoot(container);
  root.render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
};

renderApp();

if (module.hot) {
  module.hot.accept('./components/app', renderApp);
}
