import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { usePost } from './usePost';
import { PostsContext } from '../context/PostsContext';
import * as postsApi from '../api/posts';


function makeWrapper(posts) {
  const value = { posts, loading: false, error: null, refetch: vi.fn(), addPost: vi.fn() };
  return function Wrapper({ children }) {
    return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('usePost', () => {
  test('returns a post already in Context without calling the API', async () => {
    const localPost = { id: 999, title: 'Local', body: 'From context' };
    const getPostSpy = vi.spyOn(postsApi, 'getPost');

    const { result } = renderHook(() => usePost('999'), {
      wrapper: makeWrapper([localPost]),
    });

    expect(result.current.post).toEqual(localPost);
    expect(result.current.loading).toBe(false);
    expect(getPostSpy).not.toHaveBeenCalled();
  });

  test('falls back to the API when the post is not in Context', async () => {
    const apiPost = { id: 1, title: 'From API', body: 'Fetched' };
    const getPostSpy = vi
      .spyOn(postsApi, 'getPost')
      .mockResolvedValue(apiPost);

    const { result } = renderHook(() => usePost('1'), {
      wrapper: makeWrapper([]),
    });

    await waitFor(() => expect(result.current.post).toEqual(apiPost));
    expect(getPostSpy).toHaveBeenCalledWith('1');
  });

  test('exposes an error when the API call fails', async () => {
    vi.spyOn(postsApi, 'getPost').mockRejectedValue(new Error('404'));

    const { result } = renderHook(() => usePost('123'), {
      wrapper: makeWrapper([]),
    });

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
  });
});
