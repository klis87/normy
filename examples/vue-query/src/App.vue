<script setup>
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';

const sleep = () => new Promise(resolve => setTimeout(resolve, 1000));

const queryClient = useQueryClient();

// Books Query
const { data: booksData } = useQuery({
  queryKey: ['books'],
  queryFn: () =>
    Promise.resolve([
      { id: '0', name: 'Name 0', author: null },
      { id: '1', name: 'Name 1', author: { id: '1000', name: 'User1' } },
      { id: '2', name: 'Name 2', author: { id: '1001', name: 'User2' } },
    ]),
  initialData: [],
});

// Book Detail Query
const { data: bookData } = useQuery({
  queryKey: ['book'],
  queryFn: () =>
    Promise.resolve({
      id: '1',
      name: 'Name 1',
      author: { id: '1000', name: 'User1' },
    }),
  select: data => ({ ...data, nameLong: data.name, name: undefined }),
});

// Mutations
const updateBookNameMutation = useMutation({
  mutationFn: async () => {
    await sleep();
    return {
      id: '1',
      name: 'Name 1 Updated',
    };
  },
});

const updateBookAuthorMutation = useMutation({
  mutationFn: async () => {
    await sleep();
    return {
      id: '0',
      author: { id: '1004', name: 'User4 new' },
    };
  },
});

const addBookMutation = useMutation({
  mutationFn: async () => {
    await sleep();
    return {
      id: '3',
      name: 'Name 3',
      author: { id: '1002', name: 'User3' },
    };
  },
  onSuccess: () => {
    queryClient.setQueryData(['books'], oldData => [
      ...oldData,
      {
        id: '3',
        name: 'Name 3',
        author: { id: '1002', name: 'User3' },
      },
    ]);
  },
});

const updateBookNameMutationOptimistic = useMutation({
  mutationFn: async () => {
    await sleep();
    return {
      id: '1',
      name: 'Name 1 Updated',
    };
  },
  onMutate: () => ({
    optimisticData: {
      id: '1',
      name: 'Name 1 Updated',
    },
    rollbackData: {
      id: '1',
      name: 'Name 1',
    },
  }),
  meta: {
    normalize: false,
  },
});
</script>

<template>
  <div>
    <h1>Vue Query example</h1>

    <button type="button" @click="updateBookNameMutation.mutate()">
      Update book name
      <span v-if="updateBookNameMutation.isLoading">loading.....</span>
    </button>

    <button type="button" @click="updateBookAuthorMutation.mutate()">
      Update book author
      <span v-if="updateBookAuthorMutation.isLoading">loading.....</span>
    </button>

    <button type="button" @click="addBookMutation.mutate()">
      Add book
      <span v-if="addBookMutation.isLoading">loading.....</span>
    </button>

    <button type="button" @click="updateBookNameMutationOptimistic.mutate()">
      Update book name optimistic
    </button>

    <hr />
    <h2>Books</h2>
    <div v-for="book in booksData" :key="book.id">
      {{ book.name }} {{ book.author?.name }}
    </div>

    <hr />
    <template v-if="bookData">
      <h2>Book detail</h2>
      {{ bookData.nameLong }} {{ bookData.author?.name }}
    </template>
  </div>
</template>
