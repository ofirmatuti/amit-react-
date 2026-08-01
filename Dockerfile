# Build the app and serve it with Vite's built-in static server.
FROM node:20-alpine

WORKDIR /app

# Install dependencies first so this layer is cached when only source changes.
COPY package*.json ./
RUN npm ci

# Copy the source and build the production bundle into /app/dist.
COPY . .
RUN npm run build

# vite preview serves /app/dist on port 4173.
EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
