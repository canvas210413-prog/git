import time
import requests
import os
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# ==========================================
# 1. 설정 정보 (사용자 환경에 맞게 수정)
# ==========================================
USERNAME = "do"       # 1번 이미지: 로그인 ID
PASSWORD = "do"       # 1번 이미지: 로그인 PW (추측됨, 다르면 수정하세요)
SEARCH_KEYWORD = "137정"  # 검색할 단어

# 파일 저장 경로
SAVE_DIR = r"C:\RND\r\downloaded_pdfs"  # 윈도우 경로 예시
if not os.path.exists(SAVE_DIR):
    os.makedirs(SAVE_DIR)

# ==========================================
# 2. 브라우저 설정 및 접속
# ==========================================
options = webdriver.ChromeOptions()
options.add_argument("--start-maximized") # 창 최대화
options.add_argument("--ignore-certificate-errors") # 인증서 에러 무시

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
wait = WebDriverWait(driver, 20) # 대기 시간 20초로 넉넉하게 설정

# Basic Auth 우회 접속
base_url = "ec2-43-200-192-22.ap-northeast-2.compute.amazonaws.com/static/web/"
auth_url = f"http://{USERNAME}:{PASSWORD}@{base_url}"

try:
    print(">>> [1/5] 사이트 접속 중...")
    driver.get(auth_url)
    
    # ==========================================
    # 3. 입장 버튼 클릭 (오류 수정된 부분)
    # ==========================================
    print(">>> [2/5] '입장' 버튼 찾는 중...")
    
    # 수정 핵심: 태그 종류(button, a, div) 상관없이 '입장' 글자가 포함된 요소를 찾음
    enter_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), '입장')]")))
    enter_btn.click()
    print(">>> 입장 버튼 클릭 완료!")
    
    time.sleep(2) # 화면 전환 대기

    # ==========================================
    # 4. 검색어 입력
    # ==========================================
    print(f">>> [3/5] '{SEARCH_KEYWORD}' 검색 중...")
    
    # input 태그를 찾습니다. (만약 여기서 에러나면 input의 ID나 Class를 확인해야 함)
    search_box = wait.until(EC.presence_of_element_located((By.TAG_NAME, "input")))
    search_box.clear()
    search_box.send_keys(SEARCH_KEYWORD)
    search_box.send_keys(Keys.RETURN) # 엔터키 입력
    
    time.sleep(3) # 검색 결과(리스트)가 뜰 때까지 대기

    # ==========================================
    # 5. PDF 목록 조회 및 다운로드
    # ==========================================
    print(">>> [4/5] 검색 결과 목록 확인 중...")

    # 테이블의 행(tr)들을 찾습니다. 
    # 검색 결과가 없거나 로딩이 느리면 여기서 타임아웃이 날 수 있습니다.
    rows = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "tbody tr")))
    
    total_files = len(rows)
    print(f">>> 총 {total_files}개의 파일을 발견했습니다.")

    original_window = driver.current_window_handle # 원래 탭(리스트 화면) 저장

    # 반복문으로 각 행 처리
    for index in range(total_files):
        try:
            # DOM이 변경되었을 수 있으므로 다시 요소를 찾습니다.
            current_rows = driver.find_elements(By.CSS_SELECTOR, "tbody tr")
            if index >= len(current_rows):
                break
            
            target_row = current_rows[index]
            
            print(f"\n[{index+1}/{total_files}] 파일 여는 중...")
            target_row.click()

            # 새 탭이 열릴 때까지 대기
            wait.until(EC.number_of_windows_to_be(2))

            # 새 탭으로 포커스 이동
            for window_handle in driver.window_handles:
                if window_handle != original_window:
                    driver.switch_to.window(window_handle)
                    break
            
            # PDF URL 확보
            pdf_url = driver.current_url
            
            # 다운로드 (requests 사용 + 쿠키 동기화)
            session = requests.Session()
            # Selenium의 쿠키를 requests 세션에 복사 (로그인 정보 유지)
            for cookie in driver.get_cookies():
                session.cookies.set(cookie['name'], cookie['value'])
            
            # 파일명 결정
            file_name = pdf_url.split("/")[-1]
            if not file_name.lower().endswith(".pdf"):
                file_name = f"file_{index+1}.pdf"
            
            save_path = os.path.join(SAVE_DIR, file_name)

            # 실제 다운로드 수행
            print(f"   -> 다운로드 시작: {file_name}")
            response = session.get(pdf_url, stream=True)
            if response.status_code == 200:
                with open(save_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                print("   -> 저장 성공")
            else:
                print(f"   -> 다운로드 실패 (상태코드: {response.status_code})")

            # 탭 닫고 복귀
            driver.close()
            driver.switch_to.window(original_window)
            time.sleep(1) # 너무 빠른 요청 방지

        except Exception as e:
            print(f"   -> [Error] 처리 중 문제 발생: {e}")
            # 에러 발생 시 탭 정리 후 복귀 시도
            if len(driver.window_handles) > 1:
                driver.close()
                driver.switch_to.window(original_window)

except Exception as e:
    print("\n!!! 치명적 오류 발생 !!!")
    print(e)

finally:
    print("\n>>> 모든 작업이 종료되었습니다.")
    # driver.quit() # 브라우저를 끄고 싶으면 주석 해제