import '@babel/polyfill';
import React from 'react';
import { render } from 'react-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createNormalizedQueryClient } from '@normy/react-query';

import App from './components/app';

const queryClient = createNormalizedQueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const renderApp = () => {
  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
    document.getElementById('root'),
  );
};

renderApp();

if (module.hot) {
  module.hot.accept('./components/app', renderApp);
}
