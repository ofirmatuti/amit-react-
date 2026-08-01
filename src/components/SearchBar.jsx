/**
 * Controlled search input. State is owned by the parent so filtering
 * logic stays colocated with the data it filters.
 * @param {{ value: string, onChange: (value: string) => void, resultCount?: number }} props
 */
export default function SearchBar({ value, onChange, resultCount }) {
  return (
    <div className="search-wrap">
      <label htmlFor="search" className="sr-only">
        Search posts by title
      </label>
      <div className="search-input-wrap">
        <span className="search-icon" aria-hidden="true">
          🔍
        </span>
        <input
          id="search"
          type="search"
          className="search-input"
          placeholder="Search posts by title…"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            className="search-clear"
            onClick={() => onChange('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
      {typeof resultCount === 'number' && (
        <p className="search-count" aria-live="polite">
          {resultCount} {resultCount === 1 ? 'post' : 'posts'} found
        </p>
      )}
    </div>
  );
}

