@echo off
chcp 65001 >nul
title CRM AI Web - 빌드
color 0E

echo ========================================
echo   CRM AI Web - 프로덕션 빌드
echo ========================================
echo.

REM Change to project directory
cd /d "%~dp0"

echo [1/3] 패키지 설치 확인...
if not exist "node_modules" (
    echo 패키지 설치 중...
    call npm install
    if %errorLevel% neq 0 (
        echo [오류] 패키지 설치 실패
        pause
        exit /b 1
    )
)
echo [완료] 패키지 준비 완료
echo.

echo [2/3] Prisma Client 생성...
call npx prisma generate
if %errorLevel% neq 0 (
    echo [오류] Prisma Client 생성 실패
    pause
    exit /b 1
)
echo [완료] Prisma Client 생성 완료
echo.

echo [3/3] Next.js 빌드...
call npm run build
if %errorLevel% neq 0 (
    echo [오류] 빌드 실패
    pause
    exit /b 1
)
echo.

echo ========================================
echo   빌드 완료!
echo ========================================
echo.
echo 프로덕션 서버를 시작하려면:
echo   run-server-production.bat
echo.
pause
