# 네이버 리뷰 크롤러 수정 사항

## 문제점
- 네이버 스마트스토어의 HTML 구조 변경으로 리뷰 데이터 추출 실패
- 리뷰 내용, 이미지 등이 제대로 추출되지 않음

## 수정 내용

### 1. HTML 선택자 업데이트
실제 네이버 리뷰 페이지의 현재 HTML 구조에 맞게 선택자 수정:

- **리뷰 컨테이너**: `ul.RR2FSL9wTc > li.PxsZltB5tV`
- **리뷰 내용**: `div.AlfkEF45qI > div.HakaEZ240l > div.KqJ8Qqw082 > span.MX91DFZo2F`
- **이미지**: `div.s30AvhHfb0 > img.UpImHAUeYJ`
- **평점**: `em.n6zq2yy0KA`
- **작성자**: `strong.MX91DFZo2F`

### 2. 판매자 답변 필터링 강화
- 판매자 답변 영역(`Wsm9me_nCc`, `gCwNtyh1ki` 클래스) 제외
- 사용자 리뷰만 정확하게 추출

### 3. 페이지 로딩 대기 로직 개선
- 리뷰 리스트가 완전히 로드될 때까지 명시적 대기 추가
- Lazy loading 컨텐츠를 위한 스크롤 및 대기 시간 증가
- 최대 10초 동안 리뷰 요소 로딩 대기

### 4. 이미지 URL 정규화
- `data-src` 속성 우선 사용 (lazy loading 지원)
- URL 타입 파라미터 제거하여 원본 이미지 사용

## 수정된 파일

1. **scripts/naver_review_drission.py** (DrissionPage 버전)
   - JavaScript 코드 선택자 업데이트
   - 페이지 로딩 대기 시간 증가 (3-5초 → 5-7초)
   - 리뷰 리스트 확인 로직 추가

2. **scripts/naver_review_crawler.py** (Selenium 버전)
   - BeautifulSoup 선택자 업데이트
   - WebDriverWait를 사용한 명시적 대기 추가
   - 스크롤 및 로딩 안정화

## 테스트 방법

### 1. DrissionPage 버전 테스트
```powershell
python scripts/naver_review_drission.py "https://smartstore.naver.com/k-project/products/10329229" --pages 1 --debug
```

### 2. Selenium 버전 테스트
```powershell
python scripts/naver_review_crawler.py "https://smartstore.naver.com/k-project/products/10329229"
```

### 3. 웹 인터페이스에서 테스트
1. `http://localhost:3000/dashboard/support` 접속
2. 네이버 리뷰 크롤링 패널에서 상품 URL 입력
3. "리뷰 수집 시작" 버튼 클릭
4. 결과 확인

## 디버그 모드

크롤러 실행 시 `--debug` 플래그를 사용하면:
- 각 단계별 상세 로그 출력
- HTML 파일 저장 (`debug_drission_page.html` 또는 `debug_review_page.html`)
- 추출된 리뷰 샘플 출력

## 주의사항

1. **크롬 브라우저 종료**: DrissionPage 사용 전 크롬 브라우저를 종료해야 합니다
2. **대기 시간**: 네이버 서버 부하를 고려하여 페이지 간 1-3초 랜덤 딜레이 적용
3. **페이지 제한**: 기본 3페이지까지만 크롤링 (과도한 요청 방지)

## 예상 결과

수정 후 다음 데이터가 정상적으로 추출됩니다:
- ✅ 리뷰 내용 (스토어PICK, 한달사용 뱃지 제외)
- ✅ 작성자명
- ✅ 평점 (1-5)
- ✅ 작성일 (YYYY.MM.DD 형식)
- ✅ 상품 옵션
- ✅ 리뷰 이미지 (원본 URL)
- ✅ 판매자 답변 제외

## 트러블슈팅

### 리뷰가 수집되지 않는 경우
1. 디버그 모드로 실행하여 HTML 구조 확인
2. 페이지 로딩 시간이 부족한 경우: `random_delay` 시간 증가
3. 네이버 봇 탐지: User-Agent 변경 또는 세션 쿠키 추가

### 빈 내용이 추출되는 경우
1. HTML 구조가 다시 변경되었을 가능성
2. JavaScript 렌더링 완료 전 추출: 대기 시간 증가
3. 선택자 확인: 저장된 HTML 파일에서 실제 클래스명 확인
