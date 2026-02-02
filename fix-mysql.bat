@echo off
chcp 65001 >nul
title MySQL 문제 해결 도구
color 0E

echo ========================================
echo   MySQL 문제 해결 도구
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

:menu
cls
echo ========================================
echo   MySQL 문제 해결 도구
echo ========================================
echo.
echo 1. MySQL 서비스 상태 확인
echo 2. MySQL 서비스 강제 시작
echo 3. MySQL 서비스 재설치
echo 4. MySQL 에러 로그 확인
echo 5. MySQL 데이터 디렉토리 권한 수정
echo 6. MySQL 서비스 완전 제거 및 재설치
echo 7. 수동으로 MySQL 시작 (디버그 모드)
echo 8. 종료
echo.
set /p choice=선택 (1-8): 

if "%choice%"=="1" goto check_status
if "%choice%"=="2" goto force_start
if "%choice%"=="3" goto reinstall_service
if "%choice%"=="4" goto check_log
if "%choice%"=="5" goto fix_permissions
if "%choice%"=="6" goto full_reinstall
if "%choice%"=="7" goto manual_start
if "%choice%"=="8" goto end

echo 잘못된 선택입니다.
timeout /t 2 >nul
goto menu

:check_status
echo.
echo [1] 서비스 상태 확인...
sc query MySQL
echo.
echo [2] 프로세스 확인...
tasklist | findstr /I mysqld
echo.
echo [3] 포트 확인 (3306)...
netstat -ano | findstr :3306
echo.
pause
goto menu

:force_start
echo.
echo MySQL 서비스 강제 시작 중...
net stop MySQL 2>nul
timeout /t 2 >nul
net start MySQL
if %errorLevel% equ 0 (
    echo.
    echo [성공] MySQL 서비스가 시작되었습니다.
) else (
    echo.
    echo [실패] MySQL 서비스 시작 실패
    echo 에러 로그를 확인하세요 (옵션 4)
)
echo.
pause
goto menu

:reinstall_service
echo.
echo MySQL 서비스 재설치 중...
echo.
echo [1/3] 기존 서비스 중지 및 제거...
net stop MySQL 2>nul
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --remove MySQL 2>nul
timeout /t 2 >nul
echo.
echo [2/3] 서비스 재설치...
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --install MySQL
timeout /t 2 >nul
echo.
echo [3/3] 서비스 시작...
net start MySQL
if %errorLevel% equ 0 (
    echo.
    echo [성공] MySQL 서비스가 재설치되고 시작되었습니다.
) else (
    echo.
    echo [실패] 서비스 시작 실패. 에러 로그를 확인하세요.
)
echo.
pause
goto menu

:check_log
echo.
echo MySQL 에러 로그 확인 중...
echo.
if exist "C:\ProgramData\MySQL\MySQL Server 8.4\Data\*.err" (
    echo 최근 에러 로그 (마지막 50줄):
    echo ----------------------------------------
    powershell -Command "Get-Content 'C:\ProgramData\MySQL\MySQL Server 8.4\Data\*.err' -Tail 50"
    echo ----------------------------------------
) else (
    echo [경고] 에러 로그 파일을 찾을 수 없습니다.
    echo 경로: C:\ProgramData\MySQL\MySQL Server 8.4\Data\
)
echo.
pause
goto menu

:fix_permissions
echo.
echo 데이터 디렉토리 권한 수정 중...
icacls "C:\ProgramData\MySQL\MySQL Server 8.4\Data" /grant "NT AUTHORITY\NETWORK SERVICE:(OI)(CI)F" /T
icacls "C:\ProgramData\MySQL\MySQL Server 8.4\Data" /grant "%USERNAME%:(OI)(CI)F" /T
echo.
echo 권한이 수정되었습니다.
echo MySQL 서비스를 다시 시작하세요 (옵션 2)
echo.
pause
goto menu

:full_reinstall
echo.
echo [경고] 이 작업은 MySQL을 완전히 제거하고 재설치합니다.
echo 데이터는 유지됩니다.
echo.
set /p confirm=계속하시겠습니까? (yes/no): 
if not "%confirm%"=="yes" (
    echo 취소되었습니다.
    timeout /t 2 >nul
    goto menu
)

echo.
echo [1/5] MySQL 서비스 중지...
net stop MySQL 2>nul
timeout /t 2 >nul

echo [2/5] mysqld 프로세스 강제 종료...
taskkill /F /IM mysqld.exe 2>nul
timeout /t 2 >nul

echo [3/5] MySQL 서비스 제거...
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --remove MySQL 2>nul
timeout /t 2 >nul

echo [4/5] 데이터 디렉토리 백업...
set timestamp=%date:~0,4%%date:~5,2%%date:~8,2%-%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%
if exist "C:\ProgramData\MySQL\MySQL Server 8.4\Data" (
    xcopy "C:\ProgramData\MySQL\MySQL Server 8.4\Data" "C:\ProgramData\MySQL\MySQL Server 8.4\Data.backup-%timestamp%\" /E /I /H /Y >nul
    echo 백업 완료: Data.backup-%timestamp%
)

echo [5/5] MySQL 재초기화 및 서비스 설치...
rmdir /S /Q "C:\ProgramData\MySQL\MySQL Server 8.4\Data" 2>nul
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --initialize-insecure --datadir="C:\ProgramData\MySQL\MySQL Server 8.4\Data"
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --install MySQL
timeout /t 2 >nul

echo.
echo MySQL 서비스 시작...
net start MySQL
if %errorLevel% equ 0 (
    echo.
    echo [성공] MySQL이 재설치되고 시작되었습니다.
    echo.
    echo [중요] 데이터베이스를 다시 생성해야 합니다.
    echo install-mysql-and-migrate.bat를 다시 실행하세요.
) else (
    echo.
    echo [실패] 여전히 문제가 있습니다.
    echo 에러 로그를 확인하세요 (옵션 4)
)
echo.
pause
goto menu

:manual_start
echo.
echo MySQL을 디버그 모드로 수동 시작합니다...
echo (Ctrl+C로 중지)
echo.
cd "C:\Program Files\MySQL\MySQL Server 8.4\bin"
mysqld.exe --console --datadir="C:\ProgramData\MySQL\MySQL Server 8.4\Data"
echo.
pause
goto menu

:end
echo.
echo 종료합니다.
timeout /t 1 >nul
exit
