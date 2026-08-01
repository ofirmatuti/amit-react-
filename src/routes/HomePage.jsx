import { useMemo, useState } from 'react';
import { usePosts } from '../context/PostsContext';
import SearchBar from '../components/SearchBar';
import PostCard from '../components/PostCard';
import NewPostForm from '../components/NewPostForm';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';


export default function HomePage() {
  const { posts, loading, error, refetch, addPost } = usePosts();
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addFailed, setAddFailed] = useState(false);

  // Derive filtered posts from the list. useMemo avoids recomputing on
  // unrelated re-renders.
  const filteredPosts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return posts;
    return posts.filter((post) => post.title.toLowerCase().includes(term));
  }, [posts, search]);


  async function handleAddPost(values) {
    setSubmitting(true);
    setAddFailed(false);
    try {
      await addPost(values);
      setShowForm(false);
    } catch (err) {
      setAddFailed(true);
      throw err; // let the form keep the values for retry
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <div className="add-post">
        <div className="add-post-header">
          <h2 className="section-heading">Add a New Post</h2>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setShowForm((prev) => !prev);
              setAddFailed(false);
            }}
            aria-expanded={showForm}
          >
            {showForm ? 'Cancel' : '+ New Post'}
          </button>
        </div>
        {showForm && (
          <>
            {addFailed && (
              <div className="error-slot">
                <ErrorMessage message="Failed to create the post. Please try again." />
              </div>
            )}
            <NewPostForm onSubmit={handleAddPost} isSubmitting={submitting} />
          </>
        )}
      </div>
      <h1 className="page-heading">Posts</h1>
      <div className="toolbar">
        <SearchBar
          value={search}
          onChange={setSearch}
          resultCount={loading ? undefined : filteredPosts.length}
        />
      </div>

      {loading && <Loader label="Loading posts…" />}

      {error && <ErrorMessage message="Could not load posts." onRetry={refetch} />}

      {!loading && !error && filteredPosts.length === 0 && (
        <p className="empty">
          No posts match “{search}”. Try a different search term.
        </p>
      )}

      {!loading && !error && filteredPosts.length > 0 && (
        <div className="posts-grid">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}
