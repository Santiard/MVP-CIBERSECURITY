#!/bin/sh
set -e

DEV_CMD=${DEV_CMD:-"uvicorn app.main:app --host 0.0.0.0 --port 8000"}

exec sh -c "$DEV_CMD"
