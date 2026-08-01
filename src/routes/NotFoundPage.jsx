import { Link } from 'react-router-dom';

/**
 * Fallback page for unmatched routes.
 */
export default function NotFoundPage() {
  return (
    <section className="not-found">
      <h1>404</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to="/" className="btn">
        Go Home
      </Link>
    </section>
  );
}
