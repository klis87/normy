import '@babel/polyfill';
import * as React from 'react';
import { render } from 'react-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { QueryNormalizerProvider } from '@normy/react-query';
import { httpBatchLink } from '@trpc/client';

import App from './components/app';
import { trpc } from './trpc';

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/trpc',
      // optional
    }),
  ],
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const renderApp = () => {
  render(
    <QueryNormalizerProvider
      queryClient={queryClient}
      normalizerConfig={{ devLogging: true }}
    >
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </trpc.Provider>
    </QueryNormalizerProvider>,
    document.getElementById('root'),
  );
};

renderApp();

if (module.hot) {
  module.hot.accept('./components/app', renderApp);
}
