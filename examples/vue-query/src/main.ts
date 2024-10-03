import './assets/main.css';

import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { createApp } from 'vue';
import App from './App.vue';

const queryClient = new QueryClient({
  defaultOptions: {},
});

createApp(App).use(VueQueryPlugin, { queryClient }).mount('#app');
