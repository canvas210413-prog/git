@echo off
echo ========================================
echo MySQL Setup - Run as Administrator
echo ========================================
echo.

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script requires administrator privileges.
    echo Please run as Administrator.
    pause
    exit /b 1
)

echo Step 1: Initialize MySQL Data Directory
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --initialize-insecure --datadir="C:\ProgramData\MySQL\MySQL Server 8.4\Data"

echo.
echo Step 2: Install MySQL Service
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --install MySQL

echo.
echo Step 3: Start MySQL Service
net start MySQL

echo.
echo Step 4: Create Database
echo CREATE DATABASE IF NOT EXISTS crm_ai_web CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; > temp_db_setup.sql
echo CREATE USER IF NOT EXISTS 'dbuser'@'localhost' IDENTIFIED BY 'dbpassword'; >> temp_db_setup.sql
echo GRANT ALL PRIVILEGES ON crm_ai_web.* TO 'dbuser'@'localhost'; >> temp_db_setup.sql
echo FLUSH PRIVILEGES; >> temp_db_setup.sql

"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root < temp_db_setup.sql
del temp_db_setup.sql

echo.
echo ========================================
echo MySQL Service Setup Complete!
echo ========================================
echo.
echo Now run in a regular PowerShell:
echo   cd c:\k-project\crm-ai-web
echo   npx prisma generate
echo   npx prisma migrate dev --name init_mysql
echo.
pause
