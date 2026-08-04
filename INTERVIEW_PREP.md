# 🎯 Interview Preparation Study Guide — Posts Explorer

> **Project:** `jsonplaceholder-posts-app` (v1.0.0)
> **Stack:** React 18.3 · React Router 6.24 · Vite 5.3 · Axios 1.7 · Vitest 2.1 · Testing Library 16
> **Repo layout audited on:** the current commit
> **Test status verified:** 3 test files, 7 tests, all passing (`npm run test:run`)

This document is your complete interview defense kit. Read it end-to-end at least once, then use Section 3 as a flashcard drill and Section 4 as your "here's what I'd do next" talking points.

---

## 📑 Table of Contents

1. [Executive Project Summary](#1-executive-project-summary)
2. [Deep-Dive Code Breakdown](#2-deep-dive-code-breakdown)
   - 2.1 [Bootstrap & Routing](#21-bootstrap--routing-srcmainjsx-srcappjsx)
   - 2.2 [API Layer](#22-api-layer-srcapi)
   - 2.3 [State — `PostsContext`](#23-state--srccontextpostscontextjsx)
   - 2.4 [Custom Hooks](#24-custom-hooks-srchooks)
   - 2.5 [Route Pages](#25-route-pages-srcroutes)
   - 2.6 [Presentational Components](#26-presentational-components-srccomponents)
   - 2.7 [Tests](#27-tests-test-and-srchooksusepostjsx)
   - 2.8 [Build, Docker & CI/CD](#28-build-docker--cicd)
3. [Technical Defense & Expected Interview Questions](#3-technical-defense--expected-interview-questions)
4. [Production Readiness & Next Steps](#4-production-readiness--next-steps)
5. [Cheat Sheet — 60-Second Elevator Pitch](#5-cheat-sheet--60-second-elevator-pitch)
6. [⚠️ Known Issues You Should Volunteer](#6-️-known-issues-you-should-volunteer)

---

## 1. Executive Project Summary

### 1.1 What the app does
A single-page React application that lets a user:

1. **Browse** every post from the public [JSONPlaceholder](https://jsonplaceholder.typicode.com) API in a responsive card grid.
2. **Search** posts by title in real time (client-side, case-insensitive `includes` match).
3. **Open a post** on its own route (`/posts/:id`) to see the full body and all of its comments.
4. **Create a new post** through an inline validated form. The post is optimistically prepended to the list so it's visible instantly, even though the mock API doesn't actually persist it.

### 1.2 Core architecture at a glance

```
┌──────────────────────────────────────────────────────────────┐
│                   React 18 + StrictMode (main.jsx)           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           PostsProvider (Context)                      │  │
│  │   state: posts[], loading, error                       │  │
│  │   actions: refetch, addPost                            │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │        RouterProvider (react-router 6)           │  │  │
│  │  │  / ──► App layout                                │  │  │
│  │  │       ├── index  ──► HomePage                    │  │  │
│  │  │       ├── posts/:id ──► PostDetailPage           │  │  │
│  │  │       └── *  ──► NotFoundPage                    │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
              │                          │
              ▼                          ▼
   ┌────────────────────┐   ┌────────────────────────────┐
   │  src/hooks/*       │   │  src/api/* (axios client)  │
   │  usePost, useCom…  │──►│  posts.js  comments.js     │
   └────────────────────┘   └────────────────────────────┘
```

**Layered design (bottom-up):**

| Layer                      | Responsibility                                                    | Files                                                                                                    |
| -------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Transport**              | Configured axios instance (baseURL, timeout, JSON headers)        | [`src/api/client.js`](src/api/client.js:1)                                                               |
| **API façade**             | Thin async wrappers that unwrap `response.data`                   | [`src/api/posts.js`](src/api/posts.js:1), [`src/api/comments.js`](src/api/comments.js:1)                 |
| **Global state**           | Posts list + loading/error + `addPost` action, shared via Context | [`src/context/PostsContext.jsx`](src/context/PostsContext.jsx:1)                                         |
| **Data hooks**             | Encapsulate per-page fetch, loading/error state, and refetching   | [`src/hooks/usePost.js`](src/hooks/usePost.js:1), [`src/hooks/useComments.js`](src/hooks/useComments.js:1) |
| **Presentational**         | Stateless UI, driven purely by props (with a couple of exceptions) | [`src/components/*`](src/components)                                                                     |
| **Routing / composition**  | Route table + layout with `<Outlet />`                            | [`src/main.jsx`](src/main.jsx:1), [`src/App.jsx`](src/App.jsx:1)                                         |

### 1.3 Key technical capabilities

- **Global data caching without a cache library.** A single Context holds the posts list; detail pages read from it first and only hit the network on cache miss.
- **Optimistic UI.** New posts appear immediately with a locally generated id, avoiding a re-fetch round-trip.
- **Encapsulated data-fetching hooks.** Every fetch flow follows the same tri-state contract: `{ data, loading, error, refetch }`.
- **Accessible-first UI primitives.** `role="status"` / `aria-live="polite"` on the loader, `role="alert"` on the error box, `aria-invalid` on invalid form fields, `aria-expanded` on the collapsible form toggle, `sr-only` labels, `type="search"` input with keyboard-clearable behavior.
- **Vitest + Testing Library** with `jsdom`, auto-cleanup, and a route-aware `MemoryRouter` render helper.
- **Multi-stage-free Docker image** based on `node:20-alpine`, plus a GitHub Actions pipeline that runs tests → builds → publishes multi-tag image to Docker Hub.

---

## 2. Deep-Dive Code Breakdown

### 2.1 Bootstrap & Routing — [`src/main.jsx`](src/main.jsx:1), [`src/App.jsx`](src/App.jsx:1)

#### [`src/main.jsx`](src/main.jsx:1)

**Purpose.** Application entry point. Builds the route table with `createBrowserRouter`, wraps everything in `PostsProvider` and `React.StrictMode`, and mounts to `#root`.

**Key structure:**

```jsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,           // shared layout with <Outlet/>
    children: [
      { index: true, element: <HomePage /> },
      { path: 'posts/:id', element: <PostDetailPage /> },
      { path: '*', element: <NotFoundPage /> },   // 404 catch-all
    ],
  },
]);
```

**Why this shape?**

- **`createBrowserRouter`** (data-router API) is the modern React Router 6.4+ entry. Even though this project doesn't yet use `loader`/`action`, adopting the data-router API keeps the door open for route-level data loading and error boundaries without a rewrite.
- **Nested routes with `<Outlet />`** put the persistent header/footer in `App` exactly once, avoiding layout duplication and remount flashes on navigation.
- **`PostsProvider` wraps the router**, not the other way around. This means posts state survives every route change; navigating from `/posts/42` back to `/` doesn't re-trigger the list fetch.
- **`React.StrictMode`** intentionally double-invokes effects in dev to surface impure setup. It's a deliberate correctness safety net.

**Trade-off:** everything is wrapped in one Context provider at the top. On a larger app you'd split into feature-scoped providers or move to a query library (see §4).

---

#### [`src/App.jsx`](src/App.jsx:1)

**Purpose.** Persistent layout — header (brand link), main region (`<Outlet />` renders the active route), and footer with attribution.

**Notable:**
- Uses `NavLink` instead of `Link` for the brand — cheap because the active class isn't currently styled, but ready to be if the app grows more nav items.
- Pure presentational: no state, no effects.

---

### 2.2 API layer — [`src/api/`](src/api)

#### [`src/api/client.js`](src/api/client.js:1)

```js
export const apiClient = axios.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});
```

**Why axios over `fetch`?**
- Built-in **timeouts** (`fetch` requires manually wiring `AbortController`).
- Automatic JSON parsing and rejection on non-2xx status codes (`fetch` resolves on 404, forcing you to check `res.ok`).
- Simple **interceptor** slot for future auth headers / retries / global error logging.
- Consistent error shape (`err.response`, `err.request`, `err.message`).

**Trade-off:** ships ~14 KB gzipped extra. For a bigger app you might inline a small typed fetch wrapper.

#### [`src/api/posts.js`](src/api/posts.js:1)

Three named async functions, all one-liners that return `data`:

| Function                     | Method | URL           | Body (JSON)                         | Returns                          |
| ---------------------------- | ------ | ------------- | ----------------------------------- | -------------------------------- |
| `getPosts()`                 | GET    | `/posts`      | —                                   | `Post[]` — `{ id, userId, title, body }[]` |
| `getPost(id)`                | GET    | `/posts/{id}` | —                                   | `Post`                           |
| `createPost({ title, body })`| POST   | `/posts`      | `{ title, body, userId: 1 }` | `Post` (echoed by JSONPlaceholder) |

- `userId: 1` is a **hardcoded placeholder** because there is no auth. In a real app it'd come from an auth session.
- The layer is deliberately dumb — no caching, no retries, no error mapping — so it stays trivially testable and mockable (see the `vi.spyOn(postsApi, 'getPost')` pattern in [`src/hooks/usePost.test.jsx`](src/hooks/usePost.test.jsx:22)).

#### [`src/api/comments.js`](src/api/comments.js:1)

One function, `getCommentsByPostId(postId)`, hitting `/comments?postId={postId}` — deliberately using axios's `params` option so ids get URL-encoded automatically. Returns `Comment[]` with `{ id, postId, name, email, body }`.

---

### 2.3 State — [`src/context/PostsContext.jsx`](src/context/PostsContext.jsx:1)

The single most important file in the project. This is where most interviewer probing will happen.

#### Signature

```jsx
const value = { posts, loading, error, refetch: fetchPosts, addPost };
<PostsContext.Provider value={value}>{children}</PostsContext.Provider>
```

#### `PostsProvider({ children })`

| Piece                             | Purpose                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| `useState([])` for `posts`        | Shared list consumed by `HomePage` and (indirectly) `usePost`.                                   |
| `useState(true)` for `loading`    | Starts `true` because a fetch fires on mount — matches what the UI actually renders first.       |
| `useState(null)` for `error`      | `Error` instance or `null`, kept as-is (not stringified) so callers can inspect `.message` etc.  |
| `fetchPosts` (`useCallback`)      | Sets loading → tries `getPosts()` → stores or captures error → always clears loading.            |
| `useEffect(() => fetchPosts(), [fetchPosts])` | Runs once on mount (dep is memoized to `[]`).                                        |
| `addPost({ title, body })`        | Awaits API `createPost`, generates a **local id** with `Date.now()`, prepends optimistic post.   |

#### `addPost` — the trickiest 10 lines in the codebase

```js
const created = await createPost({ title, body });
const optimisticPost = {
  id: Date.now(),                         // ← local unique id
  userId: created.userId ?? 1,
  title,
  body,
};
setPosts((prev) => [optimisticPost, ...prev]);
return optimisticPost;
```

**Why `Date.now()` for the id?**
JSONPlaceholder always returns `id: 101` for every new post because it doesn't persist writes. Using that id would create duplicate React keys the moment the user submits a second post. `Date.now()` gives a guaranteed-unique millisecond timestamp per submission — good enough for a demo.

**Why *not* `useOptimistic`?**
That's a React 19 hook, and the project targets React 18. The current pattern is the idiomatic 18-era equivalent: mutate local state on success and let the parent handle failure via a thrown promise.

#### `usePosts()`

Named-export consumer hook that throws if used outside `PostsProvider` — a common Context safety pattern that turns a silent `null` deref into a clear error at the misuse site.

#### ⚠️ Interview snag: `PostsContext` is *not* exported

[`src/hooks/usePost.test.jsx`](src/hooks/usePost.test.jsx:4) does `import { PostsContext } from '../context/PostsContext'` — but [`src/context/PostsContext.jsx`](src/context/PostsContext.jsx:4) declares it as a **module-local `const`**, never exported. Additionally, that test file lives under `src/hooks/`, but [`vite.config.js`](vite.config.js:17) restricts test discovery to `test/**/*.test.jsx`, so **the file never runs** — that's why nobody has caught the broken import. See §6 for how to defend this.

---

### 2.4 Custom hooks — [`src/hooks/`](src/hooks)

Both hooks follow the exact same tri-state contract, which is one of the project's better design decisions:

```ts
{ data, loading, error, refetch }
```

#### [`src/hooks/usePost.js`](src/hooks/usePost.js:1)

```js
export function usePost(id) {
  const { posts } = usePosts();
  const localPost = posts.find((p) => String(p.id) === String(id));
  const [post, setPost] = useState(localPost ?? null);
  const [loading, setLoading] = useState(!localPost);
  const [error, setError] = useState(null);
  // ...fetchPost effect...
}
```

**Behavior:**
1. **Cache lookup.** Scans the Context's `posts` array for a matching id, coercing both sides to `String` because URL params are strings and post ids are numbers.
2. **Initial state is cache-aware.** If found in Context: `post = localPost, loading = false`. No spinner flash.
3. **Effect** re-runs when `id` or `localPost` changes, either short-circuits with the cached post or fetches over the network.
4. Returns `{ post, loading, error, refetch }`.

**Design win.** Someone landing on `/posts/42` via deep link with an empty Context still gets a working page. Someone clicking a card after the list loaded gets an instant, no-flash detail page. This is progressive enhancement done well.

**Design concern.** `localPost` is derived from `posts` on *every render*, and `useCallback([id, localPost])` treats it as an unstable identity because `find` returns a new object reference only when the array itself changes. Because `posts` is only replaced by new arrays (never mutated), this happens to work — but it's a subtle dependency. See §3 Q4.

#### [`src/hooks/useComments.js`](src/hooks/useComments.js:1)

Same pattern, no cache — just fetch on mount / when `postId` changes. Returns `{ comments, loading, error, refetch }`.

**Edge case handled:** `if (!postId) return;` inside `fetchComments`, defensively guarding against undefined route params.

**Edge case *not* handled:** no `AbortController` or "stale response" guard. If the user quickly navigates from `/posts/1` to `/posts/2`, the response for `/posts/1`'s comments could arrive after `/posts/2` mounted and overwrite the correct state. See §3 Q6 and §4.

---

### 2.5 Route pages — [`src/routes/`](src/routes)

#### [`src/routes/HomePage.jsx`](src/routes/HomePage.jsx:1)

**Responsibility.** The most complex page. Pulls posts from Context, owns local UI state for search + form toggle + submit status, filters the list, and orchestrates `PostCard`, `SearchBar`, `NewPostForm`, `Loader`, `ErrorMessage`.

| Local state                | Purpose                                                    |
| -------------------------- | ---------------------------------------------------------- |
| `search`                   | Current filter text (controlled input via `SearchBar`).    |
| `showForm`                 | Toggles the collapsible new-post form.                     |
| `submitting`               | Disables inputs / button while `addPost` is in flight.     |
| `addFailed`                | Surfaces an inline error banner above the form.            |

**Filtering:**

```js
const filteredPosts = useMemo(() => {
  const term = search.trim().toLowerCase();
  if (!term) return posts;
  return posts.filter((post) => post.title.toLowerCase().includes(term));
}, [posts, search]);
```

- **`useMemo`** is a modest optimization — recomputing over 100 posts on every keystroke is trivial, but the memo also gives referential stability that would matter if a child ever wrapped this in `React.memo`.
- Filter is **case-insensitive** and **only searches titles**, matching what a naive user would expect from a "search posts" box.

**`handleAddPost`:**
- Wraps the `addPost` call in try/catch to flip `submitting` and `addFailed`.
- **Re-throws** on failure so `NewPostForm` can preserve the user's typed values for retry — a small but classy UX touch.

**Rendering branches** are ordered as loading → error → empty → data, so the user never sees a stale "empty state" flash before the first spinner.

#### [`src/routes/PostDetailPage.jsx`](src/routes/PostDetailPage.jsx:1)

Very thin. Reads `:id` from the URL, delegates data-fetch to `usePost(id)`, delegates comment rendering to `<CommentList postId={id} />`. Renders back-link + loading/error/data branches.

#### [`src/routes/NotFoundPage.jsx`](src/routes/NotFoundPage.jsx:1)

Static 404 page with a "Go Home" link. Registered as the `path: '*'` catch-all.

---

### 2.6 Presentational components — [`src/components/`](src/components)

#### [`src/components/PostCard.jsx`](src/components/PostCard.jsx:1)

```jsx
export default function PostCard({ post }) { /* Link to /posts/{post.id} */ }
```

Pure. No state. Would be a legitimate `React.memo` candidate if the grid ever grew large.

#### [`src/components/SearchBar.jsx`](src/components/SearchBar.jsx:1)

**Fully controlled** — `value` and `onChange` from parent. Extras:
- Renders a clear (`✕`) button conditionally when `value` is non-empty.
- Shows `resultCount` in an `aria-live="polite"` region so screen readers hear "3 posts found" after debounced updates.
- Uses `type="search"` so browsers give a native "Escape to clear" affordance.
- Uses `sr-only` label + placeholder so sighted users see the placeholder text and screen readers get a real label.

**Design choice.** State ownership stays in `HomePage` because the *filter derived from that state* also lives there. Colocating state with derived data is a core React best practice.

#### [`src/components/NewPostForm.jsx`](src/components/NewPostForm.jsx:1)

**Local state:** `title`, `body`, `errors`.
**Contract:** `onSubmit({ title, body })` — returns a promise; if it rejects, the form keeps its values.

**Validation** is synchronous and minimal — required, whitespace-trimmed, no length caps. Errors are rendered next to the field with `aria-invalid` on the input.

**On success**, fields are reset. **On failure** (parent throws), the `try/catch` swallows and preserves the input for retry. The `isSubmitting` flag disables both fields and the button — good; prevents double-submits.

#### [`src/components/CommentList.jsx`](src/components/CommentList.jsx:1)

Owns its own data via `useComments(postId)`. This is a **conscious deviation** from "components are pure, hooks are called at the page level" — the trade-off is that the parent (`PostDetailPage`) doesn't need to know or care about comment state, and comments become drop-in reusable on any page that has a `postId`.

Renders four states: loading, error (with retry), empty ("No comments yet."), and list.

#### [`src/components/Loader.jsx`](src/components/Loader.jsx:1)

Accessible spinner. `role="status"` + `aria-live="polite"` announces the label. Spinner glyph is `aria-hidden` because the accompanying text carries the meaning.

#### [`src/components/ErrorMessage.jsx`](src/components/ErrorMessage.jsx:1)

`role="alert"` for immediate screen-reader announcement. Optional `onRetry` renders a retry button — reused wherever a fetch happens.

---

### 2.7 Tests — [`test/`](test) and [`src/hooks/usePost.test.jsx`](src/hooks/usePost.test.jsx:1)

| File                                                                                     | Component under test | Focus                                                             |
| ---------------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------- |
| [`test/setup.js`](test/setup.js:1)                                                       | (global setup)       | jest-dom matchers, `cleanup()` after each test                    |
| [`test/SearchBar.test.jsx`](test/SearchBar.test.jsx:1)                                   | `SearchBar`          | Value display, `onChange` on typing, clear-button behavior         |
| [`test/PostCard.test.jsx`](test/PostCard.test.jsx:1)                                     | `PostCard`           | Renders title/body, link points to `/posts/:id` (uses `MemoryRouter`) |
| [`test/NewPostForm.test.jsx`](test/NewPostForm.test.jsx:1)                               | `NewPostForm`        | Empty-form validation, calls `onSubmit` with correct payload      |
| [`src/hooks/usePost.test.jsx`](src/hooks/usePost.test.jsx:1) ⚠️                          | `usePost` hook       | Cache-hit path, API fallback path, error path — **but currently not run** (see §6) |

**Testing philosophy demonstrated:**
- Query by **role/label first** (`getByRole('searchbox')`, `getByLabelText('Title')`, `getByRole('link')`) — matches Testing Library's guiding principle of "test as the user perceives it."
- `userEvent.setup()` (not `fireEvent`) — closer to real browser event sequencing.
- Mocks flow through **spies on the API module** (`vi.spyOn(postsApi, 'getPost')`) rather than global fetch stubbing — decouples tests from axios.

**What's not tested (yet):**
- `PostsProvider` (create-post flow, error paths, loading transitions).
- `HomePage` filtering / empty state / add-post orchestration.
- `PostDetailPage` and `CommentList` integration.
- `useComments` hook.

---

### 2.8 Build, Docker & CI/CD

#### [`vite.config.js`](vite.config.js:1)
- `@vitejs/plugin-react` (fast refresh via Babel).
- Dev server on `5173` with `open: true`.
- Vitest config colocated: `globals: true` (no imports for `describe/test/expect`), `environment: 'jsdom'`, single setup file.
- Test include pattern: `test/**/*.test.jsx` (this is why the hook test doesn't run — see §6).

#### [`Dockerfile`](Dockerfile:1)
Single-stage `node:20-alpine` image:
```dockerfile
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
```

- **Layer caching:** `package*.json` copied first so `npm ci` is cached until deps change — sensible.
- **Serving strategy:** uses `vite preview`, which is fine for demo / preview environments but **explicitly not recommended for production** (it's a lightweight static server with no compression tuning, no proper caching headers, no health endpoint). Discussion point in §3 Q13 and §4.

#### [`.dockerignore`](.dockerignore:1)
Correctly excludes `node_modules`, `dist`, `.git`, editor caches, and markdown — keeps context small and prevents host `node_modules` from clobbering the container's Alpine-native binaries.

#### [`.github/workflows/ci.yml`](.github/workflows/ci.yml:1)
Two jobs:
1. **`test`** on every push/PR: `npm ci` → `npm run test:run` → `npm run build`.
2. **`publish`** on push to `main`/`master` only, depends on `test`: logs into Docker Hub and pushes `:latest` + `:${{ github.sha }}` tags via `docker/build-push-action@v6`.

- Uses `actions/setup-node@v4` with `cache: npm` — significant speedup on repeated runs.
- Secrets (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`) documented in README.
- Immutable `:${{ github.sha }}` tag is a nice touch — enables safe rollback to a specific commit.

---

## 3. Technical Defense & Expected Interview Questions

For each area, three to five questions an interviewer is likely to ask, with senior-level ideal answers.

### 3.1 Architecture & data flow

**Q1. Why Context for state instead of Redux, Zustand, or TanStack Query?**

> "For an app with one shared list and two simple actions, a purpose-built cache library would be over-engineering. Context is native to React, has zero bundle cost, and it's genuinely the right primitive here because I'm sharing a *value* down a subtree, not managing complex derived state. That said, if the app grew — comment writes, per-user posts, background revalidation — I'd migrate to TanStack Query immediately, because it gives me stale-while-revalidate, request deduplication, retry, and a `useMutation` primitive that makes optimistic updates trivial. My current `usePost` cache-lookup is essentially a hand-rolled 5% of what TanStack Query gives you for free."

**Q2. What's the failure mode of your single Provider at the root of the tree?**

> "Two known ones. First, every consumer re-renders when `posts` changes, even if they only care about `addPost`. In this app the consumers are `HomePage` and `usePost`, and the re-renders are cheap, so it's acceptable. If it grew, I'd split into `PostsStateContext` and `PostsActionsContext` — a common pattern — so components subscribed only to actions don't re-render on data changes. Second, my `value` object is recreated every render, meaning even a memoized consumer would re-render. For a bigger app I'd wrap `value` in `useMemo`."

**Q3. Why `createBrowserRouter` instead of `<BrowserRouter>`?**

> "It's the modern data-router API. Even though I'm not using route `loader`s or `action`s yet, I picked it so the migration path is trivial when I do. Route-level data loading would let me remove the loading spinner in `PostDetailPage` in favor of Suspense-driven UX, and route-level error boundaries would replace my ad-hoc `ErrorMessage` branches. Cost of adopting the new API early: essentially zero."

**Q4. Walk me through `usePost`. Why does it look at Context first?**

> "It's a two-tier cache. On a warm navigation from the home list, the post is already in Context, so `usePost` returns it synchronously with `loading: false` — no spinner flash. On a cold deep-link, Context is empty, so we fall through to `getPost(id)`. The `String(...)` coercion is because route params are strings but post ids are numbers. The subtle bit is the `useCallback` dep on `localPost` — because I never mutate `posts` in place, `find` returns the same object reference between renders until the array itself is replaced, so the callback stays stable. If I ever started mutating `posts`, that assumption breaks and I'd get a re-fetch on every render."

**Q5. Why does `addPost` use `Date.now()` as the id?**

> "JSONPlaceholder returns id `101` for every POST because it doesn't persist. If I used the server id I'd get duplicate React keys the second the user posts twice, which would corrupt the DOM. `Date.now()` gives me a locally unique id — good enough for this demo. In a real app the server would return a real UUID and I'd use that."

---

### 3.2 API layer & data fetching

**Q6. What happens if the user quickly navigates from `/posts/1` to `/posts/2`? Any race?**

> "Yes — there's a known race. `useComments` doesn't use an `AbortController` or a stale-response guard. If the response for post 1 arrives after post 2 has mounted, it'll `setComments` with the wrong data. I should either abort the in-flight request in the effect cleanup, or use a `useRef` mutex to ignore stale responses. In production I'd delegate this to TanStack Query, which handles it via a query key and internal AbortController. For this project it hasn't manifested because JSONPlaceholder is fast, but it's a real bug I'd flag in a PR review."

**Q7. Why axios over fetch?**

> "Three concrete reasons: built-in timeout support (`fetch` needs AbortController plumbing), automatic JSON parsing plus rejection on non-2xx (fetch resolves on 404), and interceptor slots I can bolt onto for auth headers or global error logging later without touching call sites. The trade-off is ~14 KB gzipped. For a leaner app I'd use a small typed fetch wrapper — maybe ~30 lines. For a real product, axios pays for itself."

**Q8. What error information do you lose by only setting `err` on the state?**

> "Nothing at the top level — I store the raw `Error` instance so callers can inspect `err.response?.status`, `err.code === 'ECONNABORTED'` for timeouts, etc. What I *don't* do yet is map errors to user-facing categories — the UI shows a generic 'Could not load posts.' for a 404, 500, or network timeout. In production I'd introduce an error type union — `NetworkError | NotFoundError | ServerError | TimeoutError` — and let `ErrorMessage` render different copy per type."

**Q9. How would you add authentication?**

> "One axios interceptor in `client.js` that reads the token from a secure store and attaches an `Authorization: Bearer …` header. A response interceptor that catches 401 and triggers a re-login flow. And I'd move the hardcoded `userId: 1` in `createPost` to come from the auth session — probably a `useAuth()` hook that `PostsProvider` reads."

---

### 3.3 React idioms, rendering & performance

**Q10. Is `useMemo` on `filteredPosts` actually helpful with 100 posts?**

> "Honestly, the CPU savings from memoizing an `Array.filter` over 100 short strings are negligible — probably sub-millisecond. The real benefit is *referential stability*: if I ever wrap `PostCard` in `React.memo`, or if a child hook depended on `filteredPosts` identity, the memo prevents cascading re-renders. So it's more architectural insurance than a hot-path optimization. On a 10,000-item list I'd instead go for windowing with `react-window`."

**Q11. Why aren't you using `React.memo` anywhere?**

> "Because I don't have a measured bottleneck. `React.memo` costs a shallow prop compare on every render — if the parent re-renders 5× a second, that's overhead you're paying to avoid a cheap re-render. `PostCard` is a legitimate candidate if the grid grew large, and it's easy to add — but I'd want to profile first. Premature memoization is a real anti-pattern."

**Q12. `React.StrictMode` is on. What does that do to your effects?**

> "In development, StrictMode intentionally invokes effects twice — mount, unmount, mount again — to expose impurities. My fetch effects tolerate this because they don't have side effects beyond setting local state, and setting the same state twice is a no-op. But it also means during development you'll see two network requests on mount, which is expected and doesn't happen in production. If I wired up subscriptions or timers, I'd need to make sure the cleanup is correct — StrictMode is a great forcing function for that."

---

### 3.4 UX, forms & accessibility

**Q13. Walk me through how the app is accessible.**

> "Every dynamic region is announced: `Loader` uses `role='status'` + `aria-live='polite'`, `ErrorMessage` uses `role='alert'` for immediate announcement, the search-count text is `aria-live='polite'`. Form fields have real `<label htmlFor>` associations, `aria-invalid` on validation errors, and the form toggle uses `aria-expanded`. The search input is `type='search'`, which gives users native clear-on-Escape. What's missing: I don't manage focus — after adding a post, focus should probably move to the new post or a success message; after opening the detail route, focus should jump to the article heading. That's the next iteration."

**Q14. Why does `NewPostForm` re-throw on submit failure?**

> "So the parent can update `addFailed` state and show a banner, but the form itself keeps the user's typed values. If I resolved silently and cleared the fields, the user would lose their draft on a network hiccup. Re-throwing is the cleanest cross-boundary signal: the form owns 'what to render' and the parent owns 'what does an error mean at this level.'"

**Q15. Why is validation client-side only?**

> "It's a demo against a read-only mock API, so server validation isn't meaningful here. In a real app I'd do both — client-side for immediate UX feedback, server-side because I can't trust the client. I'd probably use `zod` for a shared schema so front and back validate identically."

---

### 3.5 Testing

**Q16. Why Vitest instead of Jest?**

> "Native ESM support, uses the same Vite pipeline my app uses (so there's no separate Babel/webpack config to maintain), and Jest-compatible API (`describe/test/expect/vi.fn/vi.spyOn`), so the mental model is unchanged. It's usually 2-3× faster on real projects because it shares transformation with the dev server."

**Q17. Your tests query by `getByRole` and `getByLabelText` — why not CSS selectors or `data-testid`?**

> "It's the Testing Library principle: test the way the user perceives the app. `getByRole('searchbox')` implicitly asserts that I've used an accessible input; `getByLabelText('Title')` implicitly asserts my label-for pairing works. If I regress accessibility, the tests break. If I refactor the DOM structure but keep the semantics, they still pass. `data-testid` is my last-resort escape hatch."

**Q18. What don't you test, and why?**

> "The `PostsProvider` context, the `HomePage` filtering integration, and the `useComments` hook are all untested. The reason is time-budgeting for a take-home — I prioritized presentational components that would break most visibly, plus one hook test to prove I know the pattern. In a real PR I'd want provider-level tests that mock the API layer end-to-end and assert on the tri-state lifecycle."

**Q19. You have `src/hooks/usePost.test.jsx` — does it actually run?**

> "Great catch. It doesn't. My Vitest config restricts discovery to `test/**/*.test.jsx`, so tests colocated with source aren't picked up. That's a bug — I should either move the file into `test/` or broaden the include pattern to `['test/**/*.test.jsx', 'src/**/*.test.{js,jsx}']`. It's also why the broken `PostsContext` import in that file never blew up in CI."

---

### 3.6 Docker, CI/CD, production

**Q20. Your Dockerfile serves the app with `vite preview`. Why not nginx?**

> "Deliberately simple for a take-home — one image, one command, no reverse-proxy config. For production I'd absolutely switch to a two-stage build: a Node stage that runs `npm run build`, and a distroless nginx (or Caddy) stage that copies `dist/`. Nginx gives me gzip/brotli, correct cache-control per asset type (immutable hashes get `max-age=31536000, immutable`; `index.html` gets `no-cache`), a `/healthz` endpoint, and a much smaller final image — probably under 50 MB vs the current ~400 MB Node image."

**Q21. Any security concerns with the current image?**

> "A few. It runs as root (should add `USER node`), it's a full `node:20-alpine` rather than a minimal runtime (the multi-stage above fixes that), and it bakes source into the image (not sensitive here, but in a real product I'd want a `.dockerignore` audit + a build-time `--platform` pin). CI-wise I'd add `docker scout` or Trivy scanning before push."

**Q22. Your CI publishes on every push to main. What safeguards would you add?**

> "Right now there's nothing gating a broken commit from becoming `:latest`. I'd add: a required PR review before merging to main, coverage thresholds in the test step, an `npm audit --production` step, and probably a separate `:dev` tag on main pushes with `:latest` only bumped on tagged releases. For the container itself, I'd sign images with `cosign` and use a `docker/build-push-action` `provenance` attestation."

**Q23. How would you observe this in production?**

> "Client side: Sentry (or similar) for uncaught exceptions and unhandled promise rejections, a couple of custom breadcrumbs at fetch boundaries, and a lightweight Web Vitals report to whatever RUM tool. Server side: the static server would emit access logs to stdout, scraped by whatever's running the pod. I'd add a `/healthz` static file for readiness. If this ever gained a backend, I'd want request tracing IDs propagated from the browser into the axios interceptor."

---

## 4. Production Readiness & Next Steps

### 4.1 Edge cases — what's handled vs. what breaks

| Scenario                                          | Handled today?                                                                                                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty posts list                                  | ✅ `HomePage` shows "No posts match…" empty state when `filteredPosts.length === 0`                                                                                    |
| Search with no matches                            | ✅ Same empty-state branch                                                                                                                                             |
| API 5xx / network failure on `getPosts`           | ✅ `PostsContext` catches, sets `error`, `HomePage` shows `<ErrorMessage onRetry={refetch} />`                                                                          |
| API failure on `getPost`                          | ✅ `usePost` catches, `PostDetailPage` shows retry UI                                                                                                                  |
| API failure on `createPost`                       | ✅ `HomePage.handleAddPost` sets `addFailed`, banner appears, form keeps values                                                                                        |
| Empty comments                                    | ✅ `CommentList` shows "No comments yet."                                                                                                                              |
| Invalid `/posts/:id` (e.g. `/posts/abc`)          | ⚠️ Depends on API — JSONPlaceholder returns `{}`, so `post` becomes an empty object and the page renders empty. No dedicated "post not found" UI.                     |
| Whitespace-only new post                          | ✅ Trim + required-field validation in `NewPostForm.validate()`                                                                                                        |
| Double-click submit                               | ✅ `isSubmitting` disables inputs + button                                                                                                                             |
| Rapid navigation between post details             | ❌ Race: earlier comment/post response can overwrite later state (no AbortController)                                                                                  |
| Timeout (>10s)                                    | ⚠️ Axios throws `ECONNABORTED`, gets caught, shown as generic error — no distinct "took too long, try again" copy                                                    |
| Very long titles / bodies                         | ⚠️ No client-side length cap in `NewPostForm`; CSS should handle overflow via ellipsis, but not verified                                                              |
| XSS via post body                                 | ✅ React escapes text nodes by default; nothing uses `dangerouslySetInnerHTML`                                                                                          |
| Router `usePosts()` outside provider              | ✅ `usePosts()` throws with a clear message                                                                                                                             |
| Deep link to `/posts/42` with cold cache          | ✅ `usePost` falls back to API                                                                                                                                          |

### 4.2 Refactoring & optimizations

| Area                       | Current                                                                                                            | Better                                                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **State management**       | Hand-rolled Context + custom hooks with per-hook loading/error boilerplate                                          | TanStack Query — dedupe, cache invalidation, retry, background refetch, `useMutation` for `addPost` — deletes ~80% of my current fetch code                     |
| **Type safety**            | Plain JS with JSDoc on a couple of components                                                                      | TypeScript — model `Post`, `Comment`, hook return types once, catch broken imports (like the one in the dead test) at compile time                              |
| **Race safety**            | None                                                                                                               | `AbortController` in every fetch hook's effect cleanup, or migrate to TanStack Query which handles it                                                            |
| **Search performance**     | Filter runs on every keystroke                                                                                     | Debounce input by ~150ms with `useDeferredValue` (React 18 native) — no library needed                                                                          |
| **List rendering**         | Renders all posts in one grid                                                                                       | With >500 items, switch to `react-window` for virtualization                                                                                                    |
| **Bundle size**            | Axios (~14 KB gz) + full React DOM                                                                                 | Consider swapping axios for a ~30-line typed fetch wrapper if the extra weight matters                                                                          |
| **Split providers**        | One Provider with 5-property value object                                                                          | Split state vs. actions Contexts, wrap value in `useMemo` — avoids unnecessary consumer re-renders as the tree grows                                            |
| **Route data loading**     | Every page fetches in `useEffect`                                                                                  | Adopt React Router `loader`/`errorElement`, wire Suspense boundaries — data starts fetching *before* the component mounts, cleaner error handling                |
| **Error boundaries**       | Ad-hoc per-page error UI                                                                                           | One `<ErrorBoundary>` at the layout level + `errorElement` at the route level for `loader` failures                                                             |
| **Test coverage**          | 7 tests, all component-level                                                                                       | Add: `PostsProvider` integration (mock API, assert lifecycle), `HomePage` filtering + add-post orchestration, `useComments`, an MSW-based end-to-end happy path |

### 4.3 Scaling & production readiness checklist

| Concern                | Current state | Recommended production upgrade                                                                                                            |
| ---------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Serving**            | `vite preview` (dev-grade static server)                                       | Multi-stage build → nginx or Caddy with gzip/brotli, correct `Cache-Control` (immutable for hashed assets, `no-cache` for `index.html`)   |
| **Container**          | Runs as root, ~400 MB `node:20-alpine`                                         | `USER node`, multi-stage → nginx/distroless (<50 MB), image signing with `cosign`, Trivy/Docker Scout scan in CI                          |
| **Observability**      | None                                                                            | Sentry (or similar) for client errors, RUM for Web Vitals, structured access logs from the static server, `/healthz` endpoint             |
| **Metrics**            | None                                                                            | Report API latencies + failure rate to your metrics system; alert on 5xx spike                                                            |
| **Logging**            | `console` only                                                                  | Structured logger (`pino` server-side, wrapped `console` client-side with a Sentry sink), consistent request IDs                          |
| **Caching**            | In-memory via Context (per-tab, per-session)                                    | HTTP `Cache-Control` on the API layer + TanStack Query's cache — bonus: SW for offline shell                                              |
| **Persistent storage** | None (POSTs vanish)                                                             | Requires a real backend; the API façade is already the seam to plug it into                                                               |
| **Rate limiting**      | None (client trusts server)                                                     | Apply at the API gateway / CDN edge; UI-side: debounce search, disable submit button until cooldown                                       |
| **Security**           | Public API, no auth                                                             | HTTPS-only, strict CSP headers from the reverse proxy, `Authorization: Bearer` interceptor, refresh-token rotation, XSS/CSRF audit         |
| **CI/CD**              | Runs tests + build + push on every main push                                    | Require PR review, coverage thresholds, `npm audit`, `:latest` gated behind a Git tag, canary deploy, one-click rollback via `:${sha}` tag |
| **Env config**         | `baseURL` hardcoded in [`src/api/client.js`](src/api/client.js:4)               | Move to `import.meta.env.VITE_API_BASE_URL`, wire per-env `.env` files, document in README                                                |
| **Internationalization**| English literals hardcoded across components                                    | Extract to `react-intl` or `i18next`, prep for RTL and locale-formatted dates                                                             |
| **Accessibility**      | Good baseline (roles, labels, live regions) but no focus management             | Route-change focus (`useEffect` on `location` to move focus to `<h1>`), skip-links, keyboard-only nav test, axe-core in CI                |
| **Analytics**          | None                                                                            | Privacy-friendly (Plausible / Fathom) + opt-in behavioral                                                                                 |
| **Dependency hygiene** | Manual                                                                          | Renovate/Dependabot, weekly `npm outdated` review                                                                                         |

---

## 5. Cheat Sheet — 60-Second Elevator Pitch

> "It's a small React 18 SPA against the JSONPlaceholder public API. Users browse posts in a grid, search titles live, open any post to see its body and comments, and add their own via a validated form. Architecturally it's layered: a thin axios client, an API façade, a `PostsContext` provider that holds the shared posts list plus loading/error state and an optimistic `addPost` action, custom hooks for detail-view and comments that follow a consistent `{ data, loading, error, refetch }` contract, and presentational components driven by props. Routing is React Router 6's data-router API, styling is plain CSS with a mobile-first grid, testing is Vitest + Testing Library with role-based queries, and CI runs on GitHub Actions with tests + Docker publish to Docker Hub. I made deliberate trade-offs — Context over TanStack Query, `vite preview` in Docker over nginx — to keep the demo focused. The obvious next steps are TanStack Query for real cache semantics, TypeScript for API contracts, `AbortController` in the fetch hooks for race safety, and a multi-stage nginx container for real deployment."

---

## 6. ⚠️ Known Issues You Should Volunteer

Volunteering these before the interviewer finds them scores massive points. You look self-aware, honest, and senior.

### 6.1 A test file exists but never runs

- **Where:** [`src/hooks/usePost.test.jsx`](src/hooks/usePost.test.jsx:1)
- **Why it doesn't run:** [`vite.config.js`](vite.config.js:17) restricts test discovery to `include: ['test/**/*.test.jsx']`.
- **Bonus problem:** The file imports `PostsContext` from [`src/context/PostsContext.jsx`](src/context/PostsContext.jsx:1), but that module only exports `PostsProvider` and `usePosts` — `PostsContext` is a module-local `const`. So even if the test *did* run, it would crash at import time.
- **How to fix in one PR:**
  1. Export `PostsContext` in [`src/context/PostsContext.jsx`](src/context/PostsContext.jsx:4) → change `const PostsContext = createContext(null);` to `export const PostsContext = createContext(null);`
  2. Broaden [`vite.config.js`](vite.config.js:17) include pattern to `['test/**/*.test.jsx', 'src/**/*.test.{js,jsx}']`.
  3. Re-run `npm run test:run` and verify the count jumps from 7 to 10 passing.
- **How to talk about it:** *"I moved fast and colocated a hook test with the hook, then forgot my Vitest config only scanned `test/`. It's the kind of thing that a mandatory `tsc --noEmit` step or ESLint's `no-unresolved` rule would have caught immediately — one more reason I'd add TypeScript."*

### 6.2 Race condition in [`src/hooks/useComments.js`](src/hooks/useComments.js:1)

No `AbortController` or stale-response guard. Documented in §3 Q6 and §4.2. Say it before they ask.

### 6.3 `Dockerfile` uses `vite preview`

Documented in §3 Q20. Have the multi-stage nginx replacement described in your head — bonus if you can write it on the whiteboard:

```dockerfile
# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- serve ----
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 6.4 Hardcoded `userId: 1` in `createPost`

In [`src/api/posts.js`](src/api/posts.js:17). Fine for a demo, must move to session auth for anything real.

### 6.5 Provider `value` object is not memoized

Every render of `PostsProvider` creates a new `value = { … }`, so any consumer wrapped in `React.memo` would re-render anyway. Trivial fix — wrap in `useMemo(() => ({ posts, loading, error, refetch, addPost }), [posts, loading, error, fetchPosts, addPost])`.

### 6.6 Minor JSX whitespace bug in [`src/App.jsx`](src/App.jsx:15)

Line 15 has a stray `</div>` indentation issue — cosmetic only, but a linter would flag it. Speaks to the absence of ESLint/Prettier in the toolchain, which you should mention as a "next step."

---

## 🎓 Final Interview Strategy Tips

1. **Lead with the trade-offs.** For any architectural choice, say "*I chose X because Y, knowing the trade-off is Z, and here's when I'd revisit.*" That single sentence is worth ten defensive answers.
2. **Own the gaps.** Bring up the race condition, the dead test file, and the `vite preview` decision before the interviewer does.
3. **Show migration paths.** Interviewers love hearing *"…and here's the two-line change that takes this to TanStack Query / TypeScript / nginx."* It proves you understand the *why*, not just the *what*.
4. **Anchor claims in the code.** Cite [`src/hooks/usePost.js:8`](src/hooks/usePost.js:8) when explaining the cache lookup. It shows you actually know your code, not just your talking points.
5. **Distinguish "demo choices" from "production choices"** explicitly. Never let an interviewer conclude you'd ship this Dockerfile to prod — you already know you wouldn't.

Good luck. You've got this.
