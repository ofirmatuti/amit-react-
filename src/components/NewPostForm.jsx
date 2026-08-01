import { useState } from 'react';


export default function NewPostForm({ onSubmit, isSubmitting = false }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState({});

  function validate() {
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = 'Title is required.';
    if (!body.trim()) nextErrors.body = 'Body is required.';
    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await onSubmit({ title: title.trim(), body: body.trim() });
      setTitle('');
      setBody('');
    } catch {
      // Parent surfaces the error; keep the field values for retry.
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="title" className="label">
          Title
        </label>
        <input
          id="title"
          type="text"
          className="input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter a post title"
          aria-invalid={Boolean(errors.title)}
          disabled={isSubmitting}
        />
        {errors.title && <span className="field-error">{errors.title}</span>}
      </div>

      <div className="field">
        <label htmlFor="body" className="label">
          Body
        </label>
        <textarea
          id="body"
          className="textarea"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write the post content…"
          rows={4}
          aria-invalid={Boolean(errors.body)}
          disabled={isSubmitting}
        />
        {errors.body && <span className="field-error">{errors.body}</span>}
      </div>

      <button type="submit" className="btn" disabled={isSubmitting}>
        {isSubmitting ? 'Publishing…' : 'Publish Post'}
      </button>
    </form>
  );
}
