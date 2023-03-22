import '@babel/polyfill';
import * as React from 'react';
import { render } from 'react-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createNormalizedQueryClient } from '@normy/react-query';
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

const queryClient = createNormalizedQueryClient(
  {
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  },
  { devLogging: true },
);

const renderApp = () => {
  render(
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>,
    document.getElementById('root'),
  );
};

renderApp();

if (module.hot) {
  module.hot.accept('./components/app', renderApp);
}
