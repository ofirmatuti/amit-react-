import { apiClient } from './client';

export async function getCommentsByPostId(postId) {
  const { data } = await apiClient.get('/comments', {
    params: { postId },
  });
  return data;
}
