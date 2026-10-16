# Automated PostgreSQL Restore and Verification Script using pg_restore
param (
    [string]$BackupFile = "./backups/backup_latest.dump",
    [string]$ContainerName = "my-backend-postgres",
    [string]$DbUser = "postgres",
    [string]$TargetDb = "my_backend_restore_test"
)

$ErrorActionPreference = "Continue"

if (-not (Test-Path $BackupFile)) {
    Write-Error "Backup file not found at path: $BackupFile"
    exit 1
}

Write-Host "===> Starting PostgreSQL restore into fresh database '$TargetDb'..." -ForegroundColor Cyan

# 1. Drop existing target database if present to ensure completely fresh test
Write-Host "[1/4] Dropping target database '$TargetDb' if exists..." -ForegroundColor Gray
docker exec $ContainerName psql -U $DbUser -d postgres -c "DROP DATABASE IF EXISTS $TargetDb WITH (FORCE);" 2>&1 | Out-Null

# 2. Create fresh blank database
Write-Host "[2/4] Creating fresh database '$TargetDb'..." -ForegroundColor Gray
docker exec $ContainerName psql -U $DbUser -d postgres -c "CREATE DATABASE $TargetDb;" 2>&1 | Out-Null

# 3. Copy dump file into container and execute pg_restore
Write-Host "[3/4] Copying backup into container and executing pg_restore..." -ForegroundColor Gray
$ContainerDumpPath = "/tmp/restore_temp.dump"
docker cp $BackupFile "${ContainerName}:${ContainerDumpPath}"

# Run pg_restore (clean output redirection)
docker exec $ContainerName pg_restore -U $DbUser -d $TargetDb --no-owner --no-privileges $ContainerDumpPath 2>&1 | Out-Null
docker exec $ContainerName rm -f $ContainerDumpPath

# 4. Verification and row count audit via Prisma
Write-Host "[4/4] Verifying data integrity and row counts on restored database '$TargetDb'..." -ForegroundColor Cyan
npx tsx scripts/verify-restore.ts
