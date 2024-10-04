<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';

const sleep = () => new Promise(resolve => setTimeout(resolve, 1000));

const queryClient = useQueryClient();

// Books Query
const { data: booksQueryData } = useQuery({
  queryKey: ['books'],
  queryFn: () =>
    Promise.resolve([
      { id: '0', name: 'Name 0', author: null },
      { id: '1', name: 'Name 1', author: { id: '1000', name: 'User1' } },
      { id: '2', name: 'Name 2', author: { id: '1001', name: 'User2' } },
    ]),
  initialData: [],
});

const booksData = computed(() => booksQueryData.value);

// Book Detail Query
const { data: bookQueryData } = useQuery({
  queryKey: ['book'],
  queryFn: () =>
    Promise.resolve({
      id: '1',
      name: 'Name 1',
      author: { id: '1000', name: 'User1' },
    }),
  select: data => ({ ...data, nameLong: data.name, name: undefined }),
});

const bookData = computed(() => bookQueryData.value);

// Mutations
const { mutate: updateBookName, isPending: isUpdateBookNamePending } =
  useMutation({
    mutationFn: async () => {
      await sleep();
      return {
        id: '1',
        name: 'Name 1 Updated',
      };
    },
  });

const { mutate: updateAuthorName, isPending: isUpdateAuthorNamePending } =
  useMutation({
    mutationFn: async () => {
      await sleep();
      return {
        id: '1000',
        name: 'User1 new',
      };
    },
  });

const { mutate: updateBookAuthor, isPending: isUpdateBookAuthorPending } =
  useMutation({
    mutationFn: async () => {
      await sleep();
      return {
        id: '0',
        author: { id: '1004', name: 'User4 new' },
      };
    },
  });

const { mutate: addBook, isPending: isAddBookPending } = useMutation({
  mutationFn: async () => {
    await sleep();
    return {
      id: '3',
      name: 'Name 3',
      author: { id: '1002', name: 'User3' },
    };
  },
  onSuccess: newBook => {
    queryClient.setQueryData(['books'], (oldData: any) => [
      ...oldData,
      newBook,
    ]);
  },
});

const { mutate: updateBookNameOptimistic } = useMutation({
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

    <button type="button" @click="updateBookName()">
      Update book name
      <span v-if="isUpdateBookNamePending">loading.....</span>
    </button>

    <button type="button" @click="updateBookAuthor()">
      Update book author
      <span v-if="isUpdateBookAuthorPending">loading.....</span>
    </button>

    <button type="button" @click="addBook()">
      Add book
      <span v-if="isAddBookPending">loading.....</span>
    </button>

    <button type="button" @click="updateAuthorName()">
      Update author name
      <span v-if="isUpdateAuthorNamePending">loading.....</span>
    </button>

    <button type="button" @click="updateBookNameOptimistic()">
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
