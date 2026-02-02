@echo off
chcp 65001 >nul
title CRM AI Web (MySQL)
cd /d "%~dp0"

echo.
echo ========================================
echo   CRM AI Web - Start (MySQL)
echo ========================================
echo.

echo [1/5] Checking Node.js...
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo Node.js not found. Installing...
    winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements --silent
    echo Please restart this script after installation.
    pause
    exit /b 1
)
echo - Node.js OK

echo.
echo [2/5] Checking MySQL...
set MYSQL_DATA_DIR=%USERPROFILE%\mysql_data
set MYSQL_INI=%USERPROFILE%\my_mysql.ini
set MYSQL_EXE="C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe"

:: Check if MySQL is running
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if %errorLevel% equ 0 (
    echo - MySQL already running
) else (
    echo Starting MySQL...
    if not exist "%MYSQL_DATA_DIR%" (
        echo MySQL data directory not found.
        echo Please run MySQL initialization first.
        pause
        exit /b 1
    )
    start "" /B %MYSQL_EXE% --defaults-file="%MYSQL_INI%"
    timeout /t 3 /nobreak >nul
    echo - MySQL started
)
echo - MySQL OK

echo.
echo [3/5] Checking packages...
if not exist "node_modules" (
    echo Installing packages...
    call npm install
)
echo - Packages OK

echo.
echo [4/5] Setting up database...
call npx prisma generate >nul 2>&1
call npx prisma db push >nul 2>&1
echo - Database OK

echo.
echo [5/5] Creating admin account...
call npx tsx scripts/create-admin.ts 2>nul
echo.
echo ========================================
echo   Server starting...
echo ========================================
echo.
echo   URL: http://localhost:3000
echo.
echo   Admin Login:
echo   Email: admin@company.co.kr
echo   Password: admin1234
echo.
echo   Press Ctrl+C to stop
echo.

call npm run dev

echo.
echo Server stopped.
pause