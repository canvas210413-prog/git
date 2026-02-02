@echo off
chcp 65001 >nul
echo ========================================
echo MySQL 설치 + 전체 데이터 마이그레이션
echo ========================================
echo.

REM Check admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [오류] 관리자 권한이 필요합니다.
    echo 이 파일을 우클릭하여 "관리자 권한으로 실행"을 선택하세요.
    echo.
    pause
    exit /b 1
)

echo [1/7] MySQL 데이터 디렉토리 초기화...
if not exist "C:\ProgramData\MySQL\MySQL Server 8.4\Data" (
    mkdir "C:\ProgramData\MySQL\MySQL Server 8.4\Data"
    "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --initialize-insecure --datadir="C:\ProgramData\MySQL\MySQL Server 8.4\Data"
    if %errorLevel% neq 0 (
        echo [오류] MySQL 초기화 실패
        pause
        exit /b 1
    )
    echo [완료] MySQL 데이터 디렉토리 초기화 완료
) else (
    echo [건너뜀] MySQL 데이터 디렉토리가 이미 존재합니다.
)
echo.

echo [2/7] MySQL 서비스 설치...
sc query MySQL >nul 2>&1
if %errorLevel% neq 0 (
    "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --install MySQL
    if %errorLevel% neq 0 (
        echo [오류] MySQL 서비스 설치 실패
        pause
        exit /b 1
    )
    echo [완료] MySQL 서비스 설치 완료
) else (
    echo [건너뜀] MySQL 서비스가 이미 설치되어 있습니다.
)
echo.

echo [3/7] MySQL 서비스 시작...

REM First, stop any existing MySQL process
net stop MySQL >nul 2>&1
taskkill /F /IM mysqld.exe >nul 2>&1
timeout /t 2 >nul

REM Try to start MySQL service
net start MySQL >nul 2>&1
if %errorLevel% equ 0 (
    echo [완료] MySQL 서비스 시작 완료
) else (
    sc query MySQL | find "RUNNING" >nul
    if %errorLevel% equ 0 (
        echo [건너뜀] MySQL 서비스가 이미 실행 중입니다.
    ) else (
        echo [오류] MySQL 서비스 시작 실패
        echo.
        echo 문제 해결 방법:
        echo   1. quick-start-mysql.bat 실행 (자동 수정)
        echo   2. fix-mysql.bat 실행 (상세 진단)
        echo.
        if exist "C:\ProgramData\MySQL\MySQL Server 8.4\Data\*.err" (
            echo 최근 에러 로그:
            echo ----------------------------------------
            powershell -Command "Get-Content 'C:\ProgramData\MySQL\MySQL Server 8.4\Data\*.err' -Tail 10"
            echo ----------------------------------------
        )
        echo.
        set /p retry=quick-start-mysql.bat를 실행하시겠습니까? (y/n): 
        if /i "%retry%"=="y" (
            call "%~dp0quick-start-mysql.bat"
            REM Check if MySQL is now running
            sc query MySQL | find "RUNNING" >nul
            if %errorLevel% equ 0 (
                echo.
                echo [완료] MySQL 서비스가 시작되었습니다. 계속 진행합니다...
                timeout /t 2 >nul
            ) else (
                echo.
                echo [오류] 여전히 MySQL을 시작할 수 없습니다.
                pause
                exit /b 1
            )
        ) else (
            pause
            exit /b 1
        )
    )
)
echo.

echo [4/7] 데이터베이스 및 사용자 생성...
cd "C:\Program Files\MySQL\MySQL Server 8.4\bin"
echo CREATE DATABASE IF NOT EXISTS crm_ai_web CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; > "%TEMP%\mysql_setup.sql"
echo CREATE USER IF NOT EXISTS 'dbuser'@'localhost' IDENTIFIED BY 'dbpassword'; >> "%TEMP%\mysql_setup.sql"
echo GRANT ALL PRIVILEGES ON crm_ai_web.* TO 'dbuser'@'localhost'; >> "%TEMP%\mysql_setup.sql"
echo FLUSH PRIVILEGES; >> "%TEMP%\mysql_setup.sql"

mysql.exe -u root < "%TEMP%\mysql_setup.sql" 2>nul
if %errorLevel% equ 0 (
    echo [완료] 데이터베이스 'crm_ai_web' 생성 완료
) else (
    echo [경고] 데이터베이스 생성 중 경고 발생 (이미 존재할 수 있음)
)
del "%TEMP%\mysql_setup.sql"
echo.

echo [5/7] 기존 SQLite 데이터 백업...
cd /d "c:\k-project\crm-ai-web"
if exist "prisma\prisma\dev.db" (
    set timestamp=%date:~0,4%%date:~5,2%%date:~8,2%-%time:~0,2%%time:~3,2%%time:~6,2%
    set timestamp=%timestamp: =0%
    copy "prisma\prisma\dev.db" "prisma\prisma\dev.db.backup-%timestamp%" >nul
    echo [완료] SQLite 데이터베이스 백업 완료
) else (
    echo [건너뜀] 기존 SQLite 데이터베이스가 없습니다.
)
echo.

echo [6/7] Prisma 마이그레이션 실행...

REM Check if Node.js is available
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [오류] Node.js가 PATH에 없습니다.
    echo.
    echo Node.js 경로를 찾는 중...
    
    REM Common Node.js installation paths
    set "NODE_PATHS=C:\Program Files\nodejs;C:\Program Files (x86)\nodejs;%LOCALAPPDATA%\Programs\nodejs;%APPDATA%\npm"
    
    for %%p in (%NODE_PATHS%) do (
        if exist "%%p\node.exe" (
            echo Node.js를 찾았습니다: %%p
            set "PATH=%%p;%PATH%"
            goto :node_found
        )
    )
    
    echo [오류] Node.js를 찾을 수 없습니다.
    echo.
    echo Node.js 설치가 필요합니다:
    echo   1. install-nodejs.bat 실행 (자동 설치)
    echo   2. 또는 https://nodejs.org 에서 수동 설치
    echo.
    set /p install_node=install-nodejs.bat를 실행하시겠습니까? (y/n): 
    if /i "%install_node%"=="y" (
        call "%~dp0install-nodejs.bat"
        echo.
        echo Node.js 설치 후 이 스크립트를 다시 실행하세요.
    ) else (
        echo.
        echo Node.js를 설치한 후 이 스크립트를 다시 실행하세요.
    )
    pause
    exit /b 1
    
    :node_found
)

echo Node.js 버전:
call node --version

echo.
echo Prisma Client 생성 중...
call npx prisma generate
if %errorLevel% neq 0 (
    echo [오류] Prisma Client 생성 실패
    pause
    exit /b 1
)
echo [완료] Prisma Client 생성 완료
echo.

echo 마이그레이션 실행 중...
call npx prisma migrate dev --name init_mysql
if %errorLevel% neq 0 (
    echo [오류] Prisma 마이그레이션 실패
    pause
    exit /b 1
)
echo [완료] Prisma 마이그레이션 완료
echo.

echo [7/7] 기존 데이터를 MySQL로 이전...
if exist "prisma\prisma\dev.db" (
    if exist "migrate-data-sqlite-to-mysql.js" (
        echo SQLite 데이터를 MySQL로 이전하고 있습니다...
        call node migrate-data-sqlite-to-mysql.js
        if %errorLevel% equ 0 (
            echo [완료] 데이터 마이그레이션 완료
        ) else (
            echo [경고] 데이터 마이그레이션 중 일부 오류 발생
            echo 계속 진행합니다...
        )
    ) else (
        echo [건너뜀] 데이터 마이그레이션 스크립트가 없습니다.
    )
) else (
    echo [건너뜀] 이전할 SQLite 데이터가 없습니다.
)
echo.

echo ========================================
echo 🎉 MySQL 마이그레이션 완료!
echo ========================================
echo.
echo MySQL 연결 정보:
echo   호스트: localhost:3306
echo   데이터베이스: crm_ai_web
echo   사용자: dbuser
echo   비밀번호: dbpassword
echo.
echo 다음 명령으로 MySQL에 접속:
echo   mysql -u dbuser -pdbpassword crm_ai_web
echo.
echo 애플리케이션 시작:
echo   run-server.bat (더블클릭 또는 실행)
echo.
pause
