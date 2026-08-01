# ---- Stage 1: Build the React app ----
# Use a Node image to install dependencies and produce the static build.
FROM node:20-alpine AS build

WORKDIR /app

# Copy only the manifest files first so Docker can cache the
# (slow) npm install layer when only source code changes.
COPY package*.json ./
RUN npm ci

# Copy the rest of the source and build the production bundle into /app/dist.
COPY . .
RUN npm run build

# ---- Stage 2: Serve the static files with nginx ----
# A tiny web server image that only contains the built assets.
FROM nginx:1.27-alpine AS runtime

# Custom nginx config: enables SPA fallback so client-side routes
# like /posts/1 don't 404 on refresh.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the compiled app from the build stage into nginx's web root.
COPY --from=build /app/dist /usr/share/nginx/html

# nginx listens on port 80 inside the container.
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
