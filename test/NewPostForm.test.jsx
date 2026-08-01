// Tests for the NewPostForm component.
// The form has a Title and Body field. It validates that both are filled,
// and calls onSubmit with the values when they are.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewPostForm from '../src/components/NewPostForm';

test('shows validation messages when the form is empty', async () => {
  const user = userEvent.setup();
  const handleSubmit = vi.fn();

  render(<NewPostForm onSubmit={handleSubmit} />);

  // Click Publish without typing anything.
  await user.click(screen.getByRole('button', { name: /publish post/i }));

  // Both required-field messages should appear...
  expect(screen.getByText('Title is required.')).toBeInTheDocument();
  expect(screen.getByText('Body is required.')).toBeInTheDocument();

  // ...and onSubmit should NOT have been called.
  expect(handleSubmit).not.toHaveBeenCalled();
});

test('calls onSubmit with the typed values', async () => {
  const user = userEvent.setup();
  const handleSubmit = vi.fn();

  render(<NewPostForm onSubmit={handleSubmit} />);

  // Fill in both fields (found by their label text).
  await user.type(screen.getByLabelText('Title'), 'Hello');
  await user.type(screen.getByLabelText('Body'), 'World');

  // Submit the form.
  await user.click(screen.getByRole('button', { name: /publish post/i }));

  // onSubmit should receive exactly what the user typed.
  expect(handleSubmit).toHaveBeenCalledWith({ title: 'Hello', body: 'World' });
});
