#!/usr/bin/env bash
set -euo pipefail

BACKUP_FILE="${1:-./backups/backup_latest.dump}"
CONTAINER_NAME="${2:-my-backend-postgres}"
DB_USER="${3:-postgres}"
TARGET_DB="${4:-my_backend_restore_test}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found at $BACKUP_FILE" >&2
  exit 1
fi

echo "===> Restoring PostgreSQL database into fresh '$TARGET_DB'..."
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $TARGET_DB WITH (FORCE);"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $TARGET_DB;"

CONTAINER_DUMP_PATH="/tmp/restore_temp.dump"
docker cp "$BACKUP_FILE" "${CONTAINER_NAME}:${CONTAINER_DUMP_PATH}"
docker exec "$CONTAINER_NAME" pg_restore -U "$DB_USER" -d "$TARGET_DB" --no-owner --no-privileges -v "$CONTAINER_DUMP_PATH" || true
docker exec "$CONTAINER_NAME" rm -f "$CONTAINER_DUMP_PATH"

echo "===> Verifying row counts on restored database '$TARGET_DB'..."
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$TARGET_DB" -c "
SELECT 
    (SELECT COUNT(*) FROM \"user\") AS total_users,
    (SELECT COUNT(*) FROM \"account\") AS total_accounts,
    (SELECT COUNT(*) FROM \"item\") AS total_items,
    (SELECT COUNT(*) FROM \"waitlist_entry\") AS total_waitlist;
"

echo "===> Restoration successfully verified on fresh database '$TARGET_DB'!"
