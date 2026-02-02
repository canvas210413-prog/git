@echo off
chcp 65001 >nul
title Prisma 관리 도구
color 0D

echo ========================================
echo   Prisma 관리 도구
echo ========================================
echo.

cd /d "%~dp0"

:menu
echo 1. Prisma Client 생성
echo 2. Prisma Studio 열기 (데이터베이스 GUI)
echo 3. 마이그레이션 생성
echo 4. 마이그레이션 적용
echo 5. 마이그레이션 상태 확인
echo 6. 데이터베이스 초기화 (주의!)
echo 7. Seed 데이터 생성
echo 8. 종료
echo.
set /p choice=선택 (1-8): 

if "%choice%"=="1" goto generate
if "%choice%"=="2" goto studio
if "%choice%"=="3" goto migrate_create
if "%choice%"=="4" goto migrate_deploy
if "%choice%"=="5" goto migrate_status
if "%choice%"=="6" goto reset
if "%choice%"=="7" goto seed
if "%choice%"=="8" goto end

echo 잘못된 선택입니다.
echo.
goto menu

:generate
echo.
echo Prisma Client 생성 중...
call npx prisma generate
echo.
pause
cls
goto menu

:studio
echo.
echo Prisma Studio 시작 중...
echo 브라우저에서 http://localhost:5555 가 열립니다.
echo 종료하려면 Ctrl+C를 누르세요.
echo.
call npx prisma studio
echo.
pause
cls
goto menu

:migrate_create
echo.
set /p migration_name=마이그레이션 이름을 입력하세요: 
echo.
echo 마이그레이션 생성 중...
call npx prisma migrate dev --name %migration_name%
echo.
pause
cls
goto menu

:migrate_deploy
echo.
echo 마이그레이션 적용 중...
call npx prisma migrate deploy
echo.
pause
cls
goto menu

:migrate_status
echo.
echo 마이그레이션 상태:
call npx prisma migrate status
echo.
pause
cls
goto menu

:reset
echo.
echo [경고] 이 작업은 모든 데이터를 삭제합니다!
set /p confirm=계속하시겠습니까? (yes/no): 
if not "%confirm%"=="yes" (
    echo 취소되었습니다.
    echo.
    pause
    cls
    goto menu
)
echo.
echo 데이터베이스 초기화 중...
call npx prisma migrate reset
echo.
pause
cls
goto menu

:seed
echo.
echo Seed 데이터 생성 중...
call npx prisma db seed
echo.
pause
cls
goto menu

:end
echo.
echo 종료합니다.
timeout /t 1 >nul
exit
