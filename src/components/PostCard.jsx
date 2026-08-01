import { Link } from 'react-router-dom';

export default function PostCard({ post }) {
  return (
    <article className="card">
      <Link to={`/posts/${post.id}`} className="card-link">
        <h2 className="card-title">{post.title}</h2>
        <p className="card-body">{post.body}</p>
        <span className="card-more">Read more →</span>
      </Link>
    </article>
  );
}
