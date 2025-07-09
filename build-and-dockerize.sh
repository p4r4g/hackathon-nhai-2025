#!/bin/bash
# Script to build Quasar app and generate Docker image
set -e

# Check for GitHub token argument
if [ -z "$1" ]; then
  echo "Error: GitHub token argument missing."
  echo "Usage: $0 <GITHUB_TOKEN>"
  exit 1
fi
GITHUB_TOKEN="$1"

# 1. Build the Quasar app
if [ -f pnpm-lock.yaml ]; then
  echo "Using pnpm to build..."
  pnpm install
  pnpm run build
elif [ -f yarn.lock ]; then
  echo "Using yarn to build..."
  yarn install
  yarn build
else
  echo "Using npm to build..."
  npm install
  npm run build
fi

# 2. Build the Docker image
echo "Building Docker image..."
docker build -t ghcr.io/p4r4g/nhai-hackathon-2025:latest .

echo "Docker image 'ghcr.io/p4r4g/nhai-hackathon-2025:latest' built successfully."

# 3. Login to GitHub Container Registry
echo "$GITHUB_TOKEN" | docker login ghcr.io -u USERNAME --password-stdin

# 4. Push the Docker image to GitHub Container Registry
echo "Pushing Docker image to GitHub Container Registry..."
docker push ghcr.io/p4r4g/nhai-hackathon-2025:latest

echo "Docker image pushed to ghcr.io/p4r4g/nhai-hackathon-2025:latest successfully."
