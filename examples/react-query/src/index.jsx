import '@babel/polyfill';
import React from 'react';
import { render } from 'react-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { createQueryNormalizer } from '@normy/react-query';

import App from './components/app';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});
createQueryNormalizer(queryClient, { devLogging: true });

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
