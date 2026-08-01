// Tests for the SearchBar component.
// SearchBar is a simple controlled input: the parent owns the value,
// and SearchBar tells the parent when the user types or clears.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '../src/components/SearchBar';

test('shows the text passed in through the value prop', () => {
  // Render the component with a starting value of "hello".
  render(<SearchBar value="hello" onChange={() => {}} />);

  // The search box on screen should contain that text.
  expect(screen.getByRole('searchbox')).toHaveValue('hello');
});

test('calls onChange when the user types', async () => {
  const user = userEvent.setup();

  // vi.fn() creates a fake function so we can check if/how it was called.
  const handleChange = vi.fn();
  render(<SearchBar value="" onChange={handleChange} />);

  // Simulate the user typing the letter "a".
  await user.type(screen.getByRole('searchbox'), 'a');

  // We expect the component to report the new text back to the parent.
  expect(handleChange).toHaveBeenCalledWith('a');
});

test('clear button empties the search', async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn();

  // Give it a value so the clear (✕) button appears.
  render(<SearchBar value="hello" onChange={handleChange} />);

  // Click the button labelled "Clear search".
  await user.click(screen.getByRole('button', { name: /clear search/i }));

  // Clearing should ask the parent to set the value back to "".
  expect(handleChange).toHaveBeenCalledWith('');
});
