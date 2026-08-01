# 📰 Posts Explorer

![CI](https://github.com/amitha51111/react-app/actions/workflows/ci.yml/badge.svg)

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

## 🧪 Testing

Tests use [Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com/react)
and live in the top-level [`test/`](test) folder.

```bash
make test          # run all tests once
make test-watch    # re-run tests as files change
# (equivalent to: npm run test:run / npm test)
```

---

## 🐳 Running with Docker

The app ships with a **multi-stage** [`Dockerfile`](Dockerfile): it builds the
static bundle with Node, then serves it with **nginx**. The nginx config
([`nginx.conf`](nginx.conf)) includes an SPA fallback so client-side routes like
`/posts/1` still work on refresh.

```bash
# Build the image
make docker-build          # or: docker build -t jsonplaceholder-posts-app .

# Run the container (maps http://localhost:8080 -> nginx port 80)
make docker-run            # or: docker run --rm -p 8080:80 jsonplaceholder-posts-app
```

Then open **http://localhost:8080**.

To use a different host port:
```bash
make docker-run PORT=3000  # http://localhost:3000
```

---

## 🔄 CI/CD (GitHub Actions)

The workflow at [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on
pushes and pull requests to `main`:

1. **Test** — installs deps with `npm ci` and runs `npm run test:run`.
2. **Build & Push** — *(only on pushes to `main`, after tests pass)* builds the
   Docker image and pushes it to Docker Hub as
   [`amitha51111/react-app`](https://hub.docker.com/r/amitha51111/react-app)
   with `latest` and a short-SHA tag. Build cache is stored via GitHub Actions
   cache for faster subsequent builds.

### Required repository secrets
Add these under **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Value |
| ------ | ----- |
| `DOCKERHUB_USERNAME` | `amitha51111` |
| `DOCKERHUB_TOKEN`    | A Docker Hub **access token** (Account Settings → Security → New Access Token) with Read/Write scope |

> Pull requests run **only** the test job — they never publish an image, so
> forks/PRs can't push to your Docker Hub.

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
