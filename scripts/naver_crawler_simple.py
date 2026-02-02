import sys
import json
import time
import io
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup

# UTF-8 출력 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

if __name__ == "__main__":
    # 커맨드 라인 인자로 URL 받기
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "상품 URL이 필요합니다."}))
        sys.exit(1)
    
    url = sys.argv[1]
    
    try:
        # 1. 브라우저 설정
        options = webdriver.ChromeOptions()
        # Headless 모드로 안정성 향상
        options.add_argument('--headless=new')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--window-size=1920,1080')
        options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        options.add_experimental_option('excludeSwitches', ['enable-logging'])
        
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

        # 2. 페이지 접속
        driver.get(url)
        time.sleep(2)

        # 3. Q&A 탭 클릭
        wait = WebDriverWait(driver, 15)
        qa_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(., 'Q&A')] | //span[contains(., 'Q&A')]")))
        qa_tab.click()
        
        time.sleep(3)  # 데이터 로딩 대기

        # 4. XPATH로 Q&A 리스트 컨테이너(ul) 찾기
        qna_ul = driver.find_element(By.XPATH, "//div[contains(., '답변상태')]/following-sibling::ul")
        
        # 5. 찾은 요소의 HTML만 다시 파싱
        soup_list = BeautifulSoup(qna_ul.get_attribute('outerHTML'), 'html.parser')
        items = soup_list.find_all('li')
        
        results = []

        for idx, item in enumerate(items):
            row_wrapper = item.find('div', recursive=False) 
            
            if not row_wrapper:
                continue
                
            columns = row_wrapper.find_all('div', recursive=False)
            
            if len(columns) >= 4:
                status = columns[0].get_text(strip=True)
                title = columns[1].get_text(strip=True)
                author = columns[2].get_text(strip=True)
                date = columns[3].get_text(strip=True)
                
                # 제목 정제
                if "비밀글" in title:
                    is_secret = True
                    clean_title = "비밀글입니다."
                else:
                    is_secret = False
                    clean_title = title

                # 판매자 답변 확인
                answer_text = ""
                li_children = item.find_all('div', recursive=False)
                if len(li_children) > 1:
                    possible_answer = li_children[1].get_text(strip=True)
                    if "판매자" in possible_answer or "안녕하세요" in possible_answer:
                        answer_text = possible_answer.replace("신고", "").strip()

                results.append({
                    "status": status,
                    "title": clean_title,
                    "author": author,
                    "date": date,
                    "answer": answer_text,
                    "isSecret": is_secret
                })
        
        driver.quit()
        
        # JSON 형태로 출력
        print(json.dumps({"success": True, "data": results}, ensure_ascii=False))

    except Exception as e:
        if 'driver' in locals():
            try:
                driver.quit()
            except:
                pass
        print(json.dumps({"success": False, "error": str(e)}, ensure_ascii=False))
        sys.exit(1)
