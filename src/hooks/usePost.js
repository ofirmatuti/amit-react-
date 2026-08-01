import { useCallback, useEffect, useState } from 'react';
import { getPost } from '../api/posts';
import { usePosts } from '../context/PostsContext';


export function usePost(id) {
  const { posts } = usePosts();
  const localPost = posts.find((p) => String(p.id) === String(id));

  const [post, setPost] = useState(localPost ?? null);
  const [loading, setLoading] = useState(!localPost);
  const [error, setError] = useState(null);

  const fetchPost = useCallback(async () => {
    if (!id) return;

    // Prefer the in-memory post (covers newly added posts).
    if (localPost) {
      setPost(localPost);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getPost(id);
      setPost(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id, localPost]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return { post, loading, error, refetch: fetchPost };
}
