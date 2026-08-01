# 📰 Posts Explorer

A responsive React application that fetches data from the public
[JSONPlaceholder](https://jsonplaceholder.typicode.com) API. It lists posts,
lets you search them, view a post's details along with its comments, and add a
new post.

---

## 🚀 Tech Stack

| Concern       | Choice                                     |
| ------------- | ------------------------------------------ |
| Build tool    | [Vite](https://vitejs.dev)                 |
| UI library    | React 18 (functional components + hooks)   |
| Routing       | [React Router v6](https://reactrouter.com) |
| Data fetching | [axios](https://axios-http.com) with `useState`/`useEffect` |
| State sharing | React Context (for the posts list)         |
| Styling       | Plain CSS in a single stylesheet           |

---

## 🛠️ Running Locally

### Prerequisites
- **Node.js** 18 or newer
- **npm** (bundled with Node)

### Steps
```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```
The app opens automatically at **http://localhost:5173**.

### Other scripts
```bash
npm run build     # Production build into /dist
npm run preview   # Preview the production build locally
```

---

## ✨ Features

### 1. Display Posts
- Fetches all posts from `GET /posts` (via axios).
- Renders each post as a **card** showing its **title** and **body** in a responsive grid.

### 2. View Post Details
- Clicking a card navigates to `/posts/:id`.
- Fetches the single post (`GET /posts/:id`) and shows the full **title** and **body**.
- Fetches and lists the post's **comments** from `GET /comments?postId={postId}`.

### 3. Search
- A search bar on the home page filters posts by **title**, entirely **client-side** (`useMemo`), updating instantly as you type.

### 4. Add New Post
- An **inline form** on the home page (above the search bar, toggled by the "+ New Post" button) with **title** and **body** fields plus inline validation.
- Submitting sends `POST /posts`; the new post is then added to the top of the shared posts list so it appears immediately (mock API does not persist writes).

### 5. Loading & Error Handling
- Every data fetch shows an accessible **loading spinner**.
- Failures show a friendly **error message** with a **Retry** button.

### 6. Responsive & Accessible
- Works on mobile and desktop (fluid grid, responsive header, clamped typography).
- Semantic HTML, ARIA roles, labelled form controls, and `prefers-reduced-motion` support.

---

## 🗂️ Project Structure

```
src/
├── api/                 # axios client + endpoint functions
│   ├── client.js        # shared axios instance (baseURL, headers, timeout)
│   ├── posts.js         # getPosts, getPost, createPost
│   └── comments.js      # getCommentsByPostId
├── context/
│   └── PostsContext.jsx # posts list + loading/error/refetch + addPost
├── hooks/               # axios data hooks (useState/useEffect)
│   ├── usePost.js
│   └── useComments.js
├── components/          # Reusable UI
│   ├── PostCard.jsx
│   ├── SearchBar.jsx
│   ├── CommentList.jsx
│   ├── NewPostForm.jsx
│   ├── Loader.jsx
│   └── ErrorMessage.jsx
├── routes/              # Page-level components
│   ├── HomePage.jsx     # posts list + search + inline add-post form
│   ├── PostDetailPage.jsx
│   └── NotFoundPage.jsx
├── styles/
│   └── index.css        # Single global stylesheet (all styles + tokens)
├── App.jsx              # Layout shell with header/nav + <Outlet />
└── main.jsx             # Providers (PostsProvider + Router) and route config
```

---

## 📝 Notes

- **Data fetching:** Uses plain **axios** wrapped in small custom hooks
  (`usePost`, `useComments`) and a `PostsContext` for the shared posts list —
  no external data-fetching library.
- **Mock API caveat:** JSONPlaceholder does not persist writes. A created post
  is added to the in-memory list (with a unique local id) so it shows up for the
  current session.
- **Styling:** All CSS lives in a single [`src/styles/index.css`](src/styles/index.css)
  using plain class names and CSS custom properties — kept simple and easy to scan.
