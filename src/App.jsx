import { NavLink, Outlet } from 'react-router-dom';

/**
 * Root layout: persistent header with navigation and a routed <Outlet />
 * where the individual pages render.
 */
export default function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="container header-inner">
          <NavLink to="/" className="brand">
            Posts Explorer
          </NavLink>
          </div>
      </header>

      <main className="container main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container">
          <p>
            Data from{' '}
            <a
              href="https://jsonplaceholder.typicode.com"
              target="_blank"
              rel="noreferrer"
            >
              JSONPlaceholder
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
