import { apiClient } from './client';

export async function getPosts() {
  const { data } = await apiClient.get('/posts');
  return data;
}

export async function getPost(id) {
  const { data } = await apiClient.get(`/posts/${id}`);
  return data;
}

export async function createPost(newPost) {
  const { data } = await apiClient.post('/posts', {
    title: newPost.title,
    body: newPost.body,
    userId: 1,
  });
  return data;
}
