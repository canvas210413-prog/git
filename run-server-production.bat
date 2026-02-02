@echo off
chcp 65001 >nul
title CRM AI Web - 프로덕션 서버
color 0B

echo ========================================
echo   CRM AI Web - 프로덕션 서버
echo ========================================
echo.

REM Change to project directory
cd /d "%~dp0"

REM Check if .next folder exists
if not exist ".next" (
    echo [경고] 빌드 파일이 없습니다. 빌드 중...
    echo.
    call npm run build
    if %errorLevel% neq 0 (
        echo [오류] 빌드 실패
        pause
        exit /b 1
    )
    echo.
)

echo.
echo ========================================
echo   프로덕션 서버 시작 중...
echo ========================================
echo.
echo 서버 주소: http://localhost:3000
echo.
echo 서버를 중지하려면 Ctrl+C를 누르세요.
echo.

REM Start Next.js production server
call npm run start

REM If server stops
echo.
echo 서버가 중지되었습니다.
pause
