# Simple Makefile for common project commands.
#
# Tests:   make test
# Docker:  make docker-build && make docker-run

# Name and tag used for the Docker image.
IMAGE ?= jsonplaceholder-posts-app
# Host port -> container port 80 (nginx). Change with: make docker-run PORT=3000
PORT ?= 8080

.PHONY: install test test-watch docker-build docker-run docker-stop

# Install all dependencies.
install:
	npm install

# Run all tests once and exit (good for CI / a quick check).
test:
	npm run test:run

# Run tests in watch mode (re-runs when files change).
test-watch:
	npm test

# Build the production Docker image.
docker-build:
	docker build -t $(IMAGE) .

# Run the app in a container, mapping http://localhost:$(PORT) to nginx.
docker-run:
	docker run --rm -p $(PORT):80 --name $(IMAGE) $(IMAGE)

# Stop the running container (if started without --rm cleanup).
docker-stop:
	docker stop $(IMAGE)
