// This file runs once before all tests.

// Adds friendly matchers such as `toBeInTheDocument()` and `toHaveValue()`.
import '@testing-library/jest-dom';

// Automatically clean up the rendered component after each test,
// so tests don't interfere with each other.
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
