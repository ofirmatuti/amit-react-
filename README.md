# 📰 Posts Explorer

![CI](https://github.com/ofirmatuti/amit-react-/actions/workflows/ci.yml/badge.svg)

A small React app that fetches posts and comments from the
[JSONPlaceholder](https://jsonplaceholder.typicode.com) API. You can browse
posts, search them, open a post to read it with its comments, and add a new post.

Built with **Vite**, **React 18**, **React Router**, and **axios**.

## Features

- **Display posts** — shows all posts as cards in a responsive grid.
- **View post details** — click a post to read it in full along with its comments.
- **Search** — filter posts by title as you type.
- **Add new post** — create a post through an inline form; it appears at the top of the list right away.

## Running locally

Requires Node.js 18+.

```bash
npm install
npm run dev
```

The app opens at **http://localhost:5173**.

## Testing

```bash
npm run test:run   # run once
npm test           # watch mode
```

## Docker

Pull and run the published image from Docker Hub:

```bash
docker run --rm -p 4173:4173 amitha51111/react-app:latest
```

Or build it yourself:

```bash
docker build -t react-app .
docker run --rm -p 4173:4173 react-app
```

Then open **http://localhost:4173**.

## CI/CD

[GitHub Actions](.github/workflows/ci.yml) runs the tests and build on every push
and PR. On pushes it also publishes the Docker image to
[`amitha51111/react-app`](https://hub.docker.com/r/amitha51111/react-app).
Publishing needs the `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` repository secrets.
