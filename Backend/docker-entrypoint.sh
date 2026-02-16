#!/bin/sh
set -e

# If node_modules is missing, install dependencies
if [ ! -d node_modules ]; then
  echo "Installing backend dependencies..."
  npm ci --silent
fi

# Default dev command can be overridden via DEV_CMD env var
DEV_CMD=${DEV_CMD:-"npm run dev"}

echo "Starting backend with: $DEV_CMD"
exec sh -c "$DEV_CMD"
