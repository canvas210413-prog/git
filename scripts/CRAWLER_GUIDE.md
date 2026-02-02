# 네이버 스마트스토어 Q&A 크롤링 가이드

## 🚀 사용 방법

### 1단계: Chrome Remote Debugging 모드 시작

1. `scripts\start-chrome-debug.bat` 파일을 **더블클릭**하여 실행
2. Chrome 창이 열리면 **네이버 스마트스토어에 로그인**
3. 배치 파일 창은 **닫지 말고 그대로 두기**

### 2단계: 크롤링 실행

1. 브라우저에서 `http://localhost:3000/dashboard/chat/priority` 접속
2. 네이버 상품 URL 입력 (예: `https://smartstore.naver.com/kproject/products/7024065775`)
3. **"크롤링"** 버튼 클릭
4. 새 탭이 열리면서 자동으로 Q&A 크롤링 시작

### 3단계: 결과 확인

- 크롤링된 Q&A 데이터가 자동으로 데이터베이스에 저장됨
- 우선순위 페이지에서 크롤링된 내용 확인 가능

## ⚠️ 문제 해결

### Chrome이 연결되지 않는 경우

**에러 메시지**: `Chrome Remote Debugging 모드가 실행되지 않았습니다`

**해결 방법**:
1. `start-chrome-debug.bat` 파일이 실행 중인지 확인
2. Chrome이 포트 9222로 실행 중인지 확인:
   ```powershell
   netstat -ano | findstr 9222
   ```
3. 이미 Chrome이 실행 중이라면 모두 종료 후 다시 실행

### Q&A 탭을 찾을 수 없는 경우

**해결 방법**:
1. Chrome 브라우저에서 직접 상품 페이지를 열어 Q&A 탭이 있는지 확인
2. Q&A 탭이 없거나 다른 이름인 경우, 크롤러 스크립트 수정 필요

### 엉뚱한 내용이 크롤링되는 경우

**원인**: 페이지 구조가 예상과 다름

**해결 방법**:
1. `naver_qna_remote.py` 스크립트의 선택자 확인
2. 브라우저 개발자 도구(F12)로 실제 HTML 구조 분석
3. 선택자를 실제 페이지 구조에 맞게 수정

## 🔧 고급 설정

### Chrome 프로필 위치 변경

`start-chrome-debug.bat` 파일의 `--user-data-dir` 경로를 수정:

```batch
start chrome.exe --remote-debugging-port=9222 --user-data-dir="원하는경로"
```

### 디버그 출력 확인

서버 터미널에서 다음과 같은 로그 확인:
- `🔍 Remote debugging 모드로 크롤링 시작...`
- `DEBUG: 찾은 Q&A 아이템 수: X`
- `✅ 크롤링 완료: X개의 Q&A 발견`

## 📝 참고사항

- Chrome은 크롤링이 끝나도 종료되지 않음 (계속 재사용 가능)
- 여러 번 크롤링해도 같은 Chrome 인스턴스 사용
- 네이버 로그인 세션이 유지되어 CAPTCHA 우회 가능
- 크롤링 중에는 Chrome 창을 조작하지 마세요
