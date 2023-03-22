import { initTRPC } from '@trpc/server';

export const t = initTRPC.context().create();

export const appRouter = t.router({
  books: t.procedure.query(() => [
    { id: '0', name: 'Name 0', author: null },
    { id: '1', name: 'Name 1', author: { id: '1000', name: 'User1' } },
    { id: '2', name: 'Name 2', author: { id: '1001', name: 'User2' } },
  ]),
  book: t.procedure.query(() => ({
    id: '1',
    name: 'Name 1',
    author: { id: '1000', name: 'User1' },
  })),
  updateBookName: t.procedure.mutation(() => ({
    id: '1',
    name: 'Name 1 Updated',
  })),
  updateBookAuthor: t.procedure.mutation(() => ({
    id: '2',
    author: { id: '1002', name: 'User3' },
  })),
});

export type AppRouter = typeof appRouter;
