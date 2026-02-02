@echo off
echo Chrome Remote Debugging 모드 시작...
echo.
echo 1. Chrome 창이 열리면 네이버 스마트스토어에 로그인하세요
echo 2. 로그인 후 이 창은 닫지 마세요
echo 3. 크롤링 페이지에서 "크롤링" 버튼을 클릭하세요
echo.

start chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\selenium-chrome-profile"

echo.
echo Chrome이 실행되었습니다.
echo 이 창을 닫지 마세요!
pause
