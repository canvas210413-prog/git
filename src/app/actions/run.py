from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import time
import urllib.request
import os

# 이미지를 저장할 폴더 생성
if not os.path.exists("downloaded_images"):
    os.makedirs("downloaded_images")

# 봇 탐지 회피를 위한 옵션 추가 (캡차 발생 빈도를 줄여줍니다)
chrome_options = Options()
# "자동화된 소프트웨어에 의해 제어되고 있음" 알림 표시 줄 없애기
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
chrome_options.add_experimental_option('useAutomationExtension', False)
# 실제 유저인 것처럼 User-Agent 조작
chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

# 브라우저 실행 (옵션 적용)
driver = webdriver.Chrome(options=chrome_options)

# URL 설정
url = "https://smartstore.naver.com/kproject/products/7024065775?nl-ts-pid=jg%2F5UlqX6IRssTeUinw-027066&n_media=27758&n_query=%EC%BC%80%EC%9D%B4%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8&n_rank=2&n_ad_group=grp-a001-02-000000031995308&n_ad=nad-a001-02-000000239521565&n_campaign_type=2&n_mall_id=ncp_1o57lv_01&n_mall_pid=7024065775&n_ad_group_type=2&n_match=3&NaPm=ct%3Dmj6wodj5%7Cci%3DER01b30ff2%2Dd992%2D11f0%2D87fb%2D2e6deeb09c04%7Ctr%3Dpla%7Chk%3D1f1c923b7eeb02c36cb2496fd2abedd79266e297%7Cnacn%3D13qHB0gqJ4ffA"

driver.get(url)

# ==========================================
# [중요] 30초 대기 (이 시간 동안 캡차를 직접 풀어주세요)
print("30초 대기 중입니다. 브라우저에서 캡차가 떴다면 직접 해결해주세요...")
time.sleep(30) 
# ==========================================

# 스크롤 내려서 이미지 로딩 유도
print("스크롤을 시작합니다.")
driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
time.sleep(3)

# 이미지 수집 시작
try:
    # 1. 상세 페이지 내부 이미지 (우선 시도)
    images = driver.find_elements(By.CSS_SELECTOR, "div._23hmdt4MSk img") 
    
    # 만약 위에서 못 찾으면 전체 이미지에서 찾기 (대안)
    if len(images) == 0:
        print("상세 이미지를 찾지 못해 전체 이미지 태그를 검색합니다.")
        images = driver.find_elements(By.TAG_NAME, "img")

    print(f"총 {len(images)}개의 이미지를 발견했습니다.")

    count = 0
    for index, image in enumerate(images):
        src = image.get_attribute('src')
        # src가 있고, 너무 작은 아이콘이나 빈 이미지는 제외 (필터링)
        if src and "http" in src and "data:image" not in src:
            try:
                urllib.request.urlretrieve(src, f"downloaded_images/image_{count}.jpg")
                print(f"{count}번 이미지 저장 완료")
                count += 1
            except Exception as e:
                print(f"다운로드 실패: {e}")
            
except Exception as e:
    print(f"에러 발생: {e}")

print("작업 종료")
driver.quit()