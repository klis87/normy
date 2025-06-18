import './assets/main.css';

import { VueQueryNormalizerPlugin } from '@normy/vue-query';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { createApp } from 'vue';
import App from './App.vue';

const queryClient = new QueryClient({
  defaultOptions: {},
});

createApp(App)
  .use(VueQueryNormalizerPlugin, {
    queryClient,
    normalizerConfig: { devLogging: true },
  })
  .use(VueQueryPlugin, { queryClient })
  .mount('#app');
