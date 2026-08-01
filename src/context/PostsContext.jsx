import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getPosts, createPost } from '../api/posts';

const PostsContext = createContext(null);

/**
 * Provides the posts list plus loading/error state to the whole app.
 *
 * Using a small Context lets a newly created
 * post appear on the home list immediately: `addPost` prepends it to shared
 * state, so any consumer re-renders without a global cache library.
 */
export function PostsProvider({ children }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPosts();
      setPosts(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  /**
   * Create a post via the API and optimistically prepend it to the list.
   * JSONPlaceholder does not persist writes, so we generate a unique local
   * id for a stable React key.
   */
  const addPost = useCallback(async ({ title, body }) => {
    const created = await createPost({ title, body });
    const optimisticPost = {
      id: Date.now(),
      userId: created.userId ?? 1,
      title,
      body,
    };
    setPosts((prev) => [optimisticPost, ...prev]);
    return optimisticPost;
  }, []);

  const value = { posts, loading, error, refetch: fetchPosts, addPost };

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
}

/**
 * Access the posts context. Throws if used outside the provider.
 */
export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return ctx;
}
