# Automated PostgreSQL Backup Script using pg_dump in Docker
param (
    [string]$ContainerName = "my-backend-postgres",
    [string]$DbUser = "postgres",
    [string]$DbName = "my_backend_db",
    [string]$OutputDir = "./backups"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$DumpFilename = "backup_${DbName}_${Timestamp}.dump"
$LatestFilename = "backup_latest.dump"
$HostOutputPath = Join-Path $OutputDir $DumpFilename
$LatestOutputPath = Join-Path $OutputDir $LatestFilename
$ContainerDumpPath = "/tmp/$DumpFilename"

Write-Host "===> Starting PostgreSQL backup for database '$DbName'..." -ForegroundColor Cyan

# 1. Run pg_dump in custom compressed format inside container
docker exec $ContainerName pg_dump -U $DbUser -d $DbName -F c -b -v -f $ContainerDumpPath
if ($LASTEXITCODE -ne 0) {
    Write-Error "pg_dump failed with exit code $LASTEXITCODE"
}

# 2. Copy dump file from container to host output directory
docker cp "${ContainerName}:${ContainerDumpPath}" $HostOutputPath
docker exec $ContainerName rm -f $ContainerDumpPath

# Copy to latest pointer
Copy-Item -Path $HostOutputPath -Destination $LatestOutputPath -Force

$FileSize = (Get-Item $HostOutputPath).Length / 1MB
Write-Host "===> Backup completed successfully!" -ForegroundColor Green
Write-Host "     Output file: $HostOutputPath" -ForegroundColor Yellow
Write-Host "     File size:   $([Math]::Round($FileSize, 2)) MB" -ForegroundColor Yellow
