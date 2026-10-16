#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${1:-my-backend-postgres}"
DB_USER="${2:-postgres}"
DB_NAME="${3:-my_backend_db}"
OUTPUT_DIR="${4:-./backups}"

mkdir -p "$OUTPUT_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DUMP_FILENAME="backup_${DB_NAME}_${TIMESTAMP}.dump"
LATEST_FILENAME="backup_latest.dump"
HOST_OUTPUT_PATH="$OUTPUT_DIR/$DUMP_FILENAME"
LATEST_OUTPUT_PATH="$OUTPUT_DIR/$LATEST_FILENAME"
CONTAINER_DUMP_PATH="/tmp/$DUMP_FILENAME"

echo "===> Starting PostgreSQL backup for database '$DB_NAME'..."
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" -F c -b -v -f "$CONTAINER_DUMP_PATH"
docker cp "${CONTAINER_NAME}:${CONTAINER_DUMP_PATH}" "$HOST_OUTPUT_PATH"
docker exec "$CONTAINER_NAME" rm -f "$CONTAINER_DUMP_PATH"
cp -f "$HOST_OUTPUT_PATH" "$LATEST_OUTPUT_PATH"

echo "===> Backup completed successfully: $HOST_OUTPUT_PATH"
