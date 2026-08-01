import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import HomePage from './routes/HomePage.jsx';
import PostDetailPage from './routes/PostDetailPage.jsx';
import NotFoundPage from './routes/NotFoundPage.jsx';
import { PostsProvider } from './context/PostsContext.jsx';

import './styles/index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'posts/:id', element: <PostDetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PostsProvider>
      <RouterProvider router={router} />
    </PostsProvider>
  </React.StrictMode>
);
