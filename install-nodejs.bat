@echo off
chcp 65001 >nul
title Node.js 설치
color 0B

echo ========================================
echo   Node.js 설치
echo ========================================
echo.

REM Check if Node.js is already installed
where node >nul 2>&1
if %errorLevel% equ 0 (
    echo Node.js가 이미 설치되어 있습니다.
    echo.
    node --version
    npm --version
    echo.
    echo Node.js가 PATH에 없다면 컴퓨터를 재시작하세요.
    pause
    exit /b 0
)

echo Node.js가 설치되어 있지 않습니다.
echo.
echo Node.js를 설치하는 방법:
echo.
echo [옵션 1] winget으로 자동 설치 (권장)
echo   이 스크립트가 자동으로 설치합니다.
echo.
echo [옵션 2] 수동 다운로드
echo   https://nodejs.org 에서 LTS 버전 다운로드
echo.
set /p choice=자동 설치를 진행하시겠습니까? (y/n): 

if /i not "%choice%"=="y" (
    echo.
    echo 수동 설치:
    echo   1. https://nodejs.org 방문
    echo   2. LTS 버전 다운로드 및 설치
    echo   3. 컴퓨터 재시작
    echo   4. 이 스크립트를 다시 실행
    echo.
    start https://nodejs.org
    pause
    exit /b 0
)

echo.
echo ========================================
echo   Node.js 자동 설치 시작
echo ========================================
echo.

echo winget으로 Node.js 설치 중...
echo (소스 계약 동의가 필요할 수 있습니다)
echo.

winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements

if %errorLevel% equ 0 (
    echo.
    echo ========================================
    echo   ✓ Node.js 설치 완료!
    echo ========================================
    echo.
    echo [중요] 컴퓨터를 재시작하거나 새 터미널을 열어야 합니다.
    echo.
    echo 설치 확인:
    echo   새 PowerShell 창을 열고
    echo   node --version
    echo   npm --version
    echo.
    set /p restart=지금 컴퓨터를 재시작하시겠습니까? (y/n): 
    if /i "%restart%"=="y" (
        shutdown /r /t 30 /c "Node.js 설치 완료. 30초 후 재시작합니다."
        echo 재시작이 예약되었습니다. (취소: shutdown /a)
    ) else (
        echo.
        echo 재시작 또는 새 터미널을 연 후:
        echo   install-mysql-and-migrate.bat 실행
    )
) else (
    echo.
    echo ========================================
    echo   ✗ 자동 설치 실패
    echo ========================================
    echo.
    echo 수동 설치를 진행하세요:
    echo   1. https://nodejs.org 방문
    echo   2. LTS 버전 다운로드 및 설치
    echo   3. 컴퓨터 재시작
    echo.
    start https://nodejs.org
)

echo.
pause
