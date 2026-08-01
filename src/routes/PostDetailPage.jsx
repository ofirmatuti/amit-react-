import { Link, useParams } from 'react-router-dom';
import { usePost } from '../hooks/usePost';
import CommentList from '../components/CommentList';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

/**
 * Detail view for a single post: shows the full title and body, followed by
 * the post's comments.
 */
export default function PostDetailPage() {
  const { id } = useParams();
  const { post, loading, error, refetch } = usePost(id);

  return (
    <section className="detail-wrap">
      <Link to="/" className="back-link">
        ← Back to posts
      </Link>

      {loading && <Loader label="Loading post…" />}

      {error && (
        <ErrorMessage message="Could not load this post." onRetry={refetch} />
      )}

      {!loading && !error && post && (
        <article className="article">
          <h1 className="article-title">{post.title}</h1>
          <p className="article-body">{post.body}</p>

          <section className="comments-section">
            <h2 className="comments-heading">Comments</h2>
            <CommentList postId={id} />
          </section>
        </article>
      )}
    </section>
  );
}
