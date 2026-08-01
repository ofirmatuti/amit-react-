// Tests for the PostCard component.
// PostCard shows a post's title + body and links to that post's detail page.

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PostCard from '../src/components/PostCard';

// A fake post to render.
const post = { id: 42, title: 'My Title', body: 'My body text' };

// PostCard uses a <Link>, which only works inside a Router.
// MemoryRouter is a lightweight router made for tests.
function renderCard() {
  render(
    <MemoryRouter>
      <PostCard post={post} />
    </MemoryRouter>
  );
}

test('shows the post title and body', () => {
  renderCard();

  expect(screen.getByText('My Title')).toBeInTheDocument();
  expect(screen.getByText('My body text')).toBeInTheDocument();
});

test('links to the correct post detail page', () => {
  renderCard();

  // The link should point to /posts/42 (the post id).
  expect(screen.getByRole('link')).toHaveAttribute('href', '/posts/42');
});
