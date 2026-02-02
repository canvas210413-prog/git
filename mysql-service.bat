@echo off
chcp 65001 >nul
title MySQL 서비스 관리
color 0C

echo ========================================
echo   MySQL 서비스 관리
echo ========================================
echo.

:menu
echo 1. MySQL 서비스 시작
echo 2. MySQL 서비스 중지
echo 3. MySQL 서비스 재시작
echo 4. MySQL 서비스 상태 확인
echo 5. MySQL 접속
echo 6. 종료
echo.
set /p choice=선택 (1-6): 

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto status
if "%choice%"=="5" goto connect
if "%choice%"=="6" goto end

echo 잘못된 선택입니다.
echo.
goto menu

:start
echo.
echo MySQL 서비스 시작 중...
net start MySQL
echo.
pause
cls
goto menu

:stop
echo.
echo MySQL 서비스 중지 중...
net stop MySQL
echo.
pause
cls
goto menu

:restart
echo.
echo MySQL 서비스 재시작 중...
net stop MySQL
timeout /t 2 >nul
net start MySQL
echo.
pause
cls
goto menu

:status
echo.
echo MySQL 서비스 상태:
sc query MySQL
echo.
pause
cls
goto menu

:connect
echo.
echo MySQL 접속 중...
echo (종료하려면 'exit' 입력)
echo.
cd "C:\Program Files\MySQL\MySQL Server 8.4\bin"
mysql.exe -u dbuser -pdbpassword crm_ai_web
echo.
pause
cls
goto menu

:end
echo.
echo 종료합니다.
timeout /t 1 >nul
exit
