@echo off
chcp 65001 >nul
title MySQL 빠른 시작
color 0A

echo ========================================
echo   MySQL 빠른 시작
echo ========================================
echo.

REM Check admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [오류] 관리자 권한이 필요합니다.
    echo.
    echo 자동으로 관리자 권한으로 재실행합니다...
    timeout /t 2 >nul
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo [1/4] MySQL 서비스 중지...
net stop MySQL 2>nul
timeout /t 2 >nul

echo [2/4] 이전 mysqld 프로세스 종료...
taskkill /F /IM mysqld.exe 2>nul
timeout /t 1 >nul

echo [3/4] 포트 3306 확인...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3306') do (
    echo 포트 3306을 사용 중인 프로세스 종료: %%a
    taskkill /F /PID %%a 2>nul
)
timeout /t 1 >nul

echo [4/4] MySQL 서비스 시작...
net start MySQL

if %errorLevel% equ 0 (
    echo.
    echo ========================================
    echo   ✓ MySQL 서비스가 시작되었습니다!
    echo ========================================
    echo.
    echo MySQL 접속 테스트:
    cd "C:\Program Files\MySQL\MySQL Server 8.4\bin"
    mysql.exe -u root -e "SELECT VERSION();" 2>nul
    if %errorLevel% equ 0 (
        echo [성공] MySQL이 정상적으로 작동합니다.
    ) else (
        echo [경고] MySQL 접속 테스트 실패
    )
) else (
    echo.
    echo ========================================
    echo   ✗ MySQL 서비스 시작 실패
    echo ========================================
    echo.
    echo 문제 해결:
    echo   1. fix-mysql.bat 실행 (자세한 진단 도구)
    echo   2. 에러 로그 확인
    echo.
    echo 에러 로그 위치:
    echo   C:\ProgramData\MySQL\MySQL Server 8.4\Data\*.err
    echo.
    if exist "C:\ProgramData\MySQL\MySQL Server 8.4\Data\*.err" (
        echo 최근 에러 (마지막 20줄):
        echo ----------------------------------------
        powershell -Command "Get-Content 'C:\ProgramData\MySQL\MySQL Server 8.4\Data\*.err' -Tail 20"
        echo ----------------------------------------
    )
)

echo.
pause
