import '@babel/polyfill';
import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './components/app';

const renderApp = () => {
  const container = document.getElementById('root');
  const root = createRoot(container);
  root.render(<App />);
};

renderApp();

if (module.hot) {
  module.hot.accept('./components/app', renderApp);
}
