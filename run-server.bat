@echo off
chcp 65001 >nul
title CRM AI Web - 개발 서버
color 0A

echo ========================================
echo   CRM AI Web - 개발 서버 시작
echo ========================================
echo.

REM Change to project directory
cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo [경고] node_modules가 없습니다. 패키지 설치 중...
    echo.
    call npm install
    if %errorLevel% neq 0 (
        echo [오류] 패키지 설치 실패
        pause
        exit /b 1
    )
    echo.
)

REM Check if .env file exists
if not exist ".env" (
    echo [오류] .env 파일이 없습니다.
    echo .env 파일을 생성하고 DATABASE_URL을 설정하세요.
    pause
    exit /b 1
)

REM Check MySQL connection
echo [확인] MySQL 서비스 상태...
sc query MySQL | find "RUNNING" >nul 2>&1
if %errorLevel% neq 0 (
    echo [오류] MySQL 서비스가 실행되지 않고 있습니다.
    echo.
    set /p start_db=MySQL 서비스를 시작하시겠습니까? (y/n): 
    if /i "%start_db%"=="y" (
        echo.
        echo MySQL 서비스 시작 중...
        net start MySQL >nul 2>&1
        if %errorLevel% equ 0 (
            echo [완료] MySQL 서비스 시작 완료
            timeout /t 2 >nul
        ) else (
            echo [오류] MySQL 서비스 시작 실패
            echo.
            echo 해결 방법:
            echo   1. quick-start-mysql.bat 실행 (자동 수정)
            echo   2. diagnose-database.bat 실행 (종합 진단)
            echo.
            set /p run_diag=diagnose-database.bat를 실행하시겠습니까? (y/n): 
            if /i "%run_diag%"=="y" (
                call diagnose-database.bat
                echo.
                echo 진단 완료 후 다시 서버를 시작하세요.
                pause
                exit /b 1
            ) else (
                pause
                exit /b 1
            )
        )
    ) else (
        echo.
        echo MySQL 서비스를 시작한 후 다시 실행하세요.
        pause
        exit /b 1
    )
) else (
    echo [완료] MySQL 서비스 실행 중
)

echo [확인] 데이터베이스 연결 테스트...
call npx prisma db pull --force 2>nul
if %errorLevel% neq 0 (
    echo [경고] 데이터베이스 연결에 문제가 있습니다.
    echo.
    set /p fix_db=종합 진단을 실행하시겠습니까? (y/n): 
    if /i "%fix_db%"=="y" (
        call diagnose-database.bat
        echo.
        echo 진단 완료. 문제가 해결되었다면 서버를 다시 시작하세요.
        pause
        exit /b 1
    ) else (
        echo.
        echo [경고] 데이터베이스 문제가 있을 수 있습니다.
        echo 계속 진행하려면 아무 키나 누르세요...
        pause >nul
    )
) else (
    echo [완료] 데이터베이스 연결 성공
)

echo.
echo ========================================
echo   서버 시작 중...
echo ========================================
echo.
echo 서버 주소: http://localhost:3000
echo.
echo 서버를 중지하려면 Ctrl+C를 누르세요.
echo.

REM Start Next.js development server
call npm run dev

REM If server stops
echo.
echo 서버가 중지되었습니다.
pause
