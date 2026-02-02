# MySQL Setup and Migration Script
# Run as Administrator

Write-Host "MySQL Setup and DB Migration Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Check admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "This script requires administrator privileges." -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "`nStep 1: Install and Start MySQL Service" -ForegroundColor Cyan

# Check MySQL service
$mysqlService = Get-Service -Name MySQL* -ErrorAction SilentlyContinue

if ($null -eq $mysqlService) {
    Write-Host "Installing MySQL service..." -ForegroundColor Yellow
    
    # Create data directory
    $dataDir = "C:\ProgramData\MySQL\MySQL Server 8.4\Data"
    if (-not (Test-Path $dataDir)) {
        New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
        Write-Host "Data directory created: $dataDir" -ForegroundColor Green
    }
    
    # Initialize MySQL
    Write-Host "Initializing MySQL database..." -ForegroundColor Yellow
    & "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --initialize-insecure --datadir=$dataDir
    
    # Install MySQL service
    Write-Host "Installing MySQL service..." -ForegroundColor Yellow
    & "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --install MySQL
    
    Start-Sleep -Seconds 2
}

# Start MySQL service
Write-Host "Starting MySQL service..." -ForegroundColor Yellow
Start-Service -Name MySQL -ErrorAction SilentlyContinue
Start-Sleep -Seconds 5

$mysqlService = Get-Service -Name MySQL -ErrorAction SilentlyContinue
if ($mysqlService.Status -eq "Running") {
    Write-Host "MySQL service is running." -ForegroundColor Green
} else {
    Write-Host "Failed to start MySQL service" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 2: Create Database" -ForegroundColor Cyan

# Create database
$createDbScript = @"
CREATE DATABASE IF NOT EXISTS crm_ai_web CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'dbuser'@'localhost' IDENTIFIED BY 'dbpassword';
GRANT ALL PRIVILEGES ON crm_ai_web.* TO 'dbuser'@'localhost';
FLUSH PRIVILEGES;
"@

$createDbScript | & "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database 'crm_ai_web' created successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to create database" -ForegroundColor Red
}

Write-Host "`nStep 3: Backup SQLite Data" -ForegroundColor Cyan

$sqliteDb = ".\prisma\prisma\dev.db"
if (Test-Path $sqliteDb) {
    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $backupPath = ".\prisma\prisma\dev.db.backup-$timestamp"
    Copy-Item $sqliteDb $backupPath
    Write-Host "SQLite database backed up: $backupPath" -ForegroundColor Green
} else {
    Write-Host "No existing SQLite database found." -ForegroundColor Yellow
}

Write-Host "`nStep 4: Check Node.js" -ForegroundColor Cyan

try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed." -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "`nStep 5: Generate Prisma Client" -ForegroundColor Cyan
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "Prisma Client generated successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 6: Run MySQL Migration" -ForegroundColor Cyan
npx prisma migrate dev --name init_mysql

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migration completed successfully" -ForegroundColor Green
} else {
    Write-Host "Migration failed" -ForegroundColor Red
    Write-Host "Run manually: npx prisma migrate dev --name init_mysql" -ForegroundColor Yellow
}

Write-Host "`n=====================================" -ForegroundColor Green
Write-Host "MySQL Migration Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "MySQL Connection Info:" -ForegroundColor Cyan
Write-Host "  Host: localhost:3306"
Write-Host "  Database: crm_ai_web"
Write-Host "  User: dbuser"
Write-Host "  Password: dbpassword"
Write-Host ""
Write-Host "Connect to MySQL:" -ForegroundColor Yellow
Write-Host "  mysql -u dbuser -pdbpassword crm_ai_web" -ForegroundColor Cyan
Write-Host ""

if (Test-Path $sqliteDb) {
    Write-Host "To migrate existing SQLite data to MySQL:" -ForegroundColor Yellow
    Write-Host "  1. Create data export/import script" -ForegroundColor White
    Write-Host "  2. Or regenerate test data with seed script" -ForegroundColor White
    Write-Host "     npx prisma db seed" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "Start your application:" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor Cyan
Write-Host ""
