/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  test: {
    // Use browser-like globals (describe/test/expect) without importing them.
    globals: true,
    // Simulate a browser DOM so React components can render in Node.
    environment: 'jsdom',
    // All test files live in the top-level test/ folder.
    include: ['test/**/*.test.jsx'],
    // Runs once before the tests to add nice matchers like toBeInTheDocument().
    setupFiles: './test/setup.js',
  },
});
