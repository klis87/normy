import '@babel/polyfill';
import express from 'express';
import webpack from 'webpack';
// @ts-ignore
import webpackDevMiddleware from 'webpack-dev-middleware';
import { createExpressMiddleware } from '@trpc/server/adapters/express';

// @ts-ignore
import webpackConfig from './webpack.config';
import { appRouter } from './src/server';

const app = express();

const createContext = () => ({}); // no context

app.use(
  webpackDevMiddleware(webpack(webpackConfig), {
    publicPath: '/',
  }),
);

app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

app.listen(3000, () => {
  console.log('Listening on port 3000!');
});
