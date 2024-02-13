import '@babel/polyfill';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { QueryNormalizerProvider } from '@normy/react-query';

import App from './components/app';

const queryClient = new QueryClient();

const renderApp = () => {
  const container = document.getElementById('root');
  const root = createRoot(container);
  root.render(
    <QueryNormalizerProvider
      queryClient={queryClient}
      normalizerConfig={{ devLogging: true }}
    >
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </QueryNormalizerProvider>,
  );
};

renderApp();

if (module.hot) {
  module.hot.accept('./components/app', renderApp);
}
