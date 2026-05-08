#!/bin/sh
set -e

if [ ! -d "node_modules/vite" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

DEV_CMD=${DEV_CMD:-"npm run dev -- --host 0.0.0.0 --port 5173"}

echo "Starting frontend with: $DEV_CMD"
exec sh -c "$DEV_CMD"
