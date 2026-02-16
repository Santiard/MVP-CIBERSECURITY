#!/bin/sh
set -e

if [ ! -d node_modules ]; then
  echo "Installing frontend dependencies..."
  npm ci --silent
fi

DEV_CMD=${DEV_CMD:-"npm run start"}

echo "Starting frontend with: $DEV_CMD"
exec sh -c "$DEV_CMD"
