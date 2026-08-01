import { useComments } from '../hooks/useComments';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';

export default function CommentList({ postId }) {
  const { comments, loading, error, refetch } = useComments(postId);

  if (loading) {
    return <Loader label="Loading comments…" />;
  }

  if (error) {
    return <ErrorMessage message="Could not load comments." onRetry={refetch} />;
  }

  if (comments.length === 0) {
    return <p className="empty">No comments yet.</p>;
  }

  return (
    <ul className="comment-list">
      {comments.map((comment) => (
        <li key={comment.id} className="comment-item">
          <div className="comment-meta">
            <span className="comment-name">{comment.name}</span>
            <a href={`mailto:${comment.email}`} className="comment-email">
              {comment.email}
            </a>
          </div>
          <p className="comment-body">{comment.body}</p>
        </li>
      ))}
    </ul>
  );
}
