$query = @"
SELECT 'users' AS tbl, count(*) FROM "user"
UNION ALL
SELECT 'accounts' AS tbl, count(*) FROM "account"
UNION ALL
SELECT 'items' AS tbl, count(*) FROM "item"
UNION ALL
SELECT 'waitlist' AS tbl, count(*) FROM "waitlist_entry";
"@

docker exec -i my-backend-postgres psql -U postgres -d my_backend_db -c "$query"
