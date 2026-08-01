/**
 * Graceful error display with an optional retry action.
 * @param {{ message?: string, onRetry?: () => void }} props
 */
export default function ErrorMessage({
  message = 'Something went wrong. Please try again.',
  onRetry,
}) {
  return (
    <div className="error-box" role="alert">
      <p className="error-text">⚠️ {message}</p>
      {onRetry && (
        <button type="button" className="btn btn-ghost" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
