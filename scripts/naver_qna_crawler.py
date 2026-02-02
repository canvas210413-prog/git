import sys
import json
import time
import io
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup

# UTF-8 출력 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

if __name__ == "__main__":
    # 커맨드 라인 인자로 URL 받기
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "상품 URL이 필요합니다."}, ensure_ascii=False))
        sys.exit(1)
    
    url = sys.argv[1]
    driver = None
    
    try:
        # 1. 브라우저 설정
        options = webdriver.ChromeOptions()
        
        # 봇 탐지 우회를 위한 설정
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        # 일반 브라우저처럼 동작
        options.add_argument('--window-size=1920,1080')
        options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36')
        options.add_argument('--accept-language=ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7')
        
        # 헤드리스 모드 (선택적)
        # options.add_argument('--headless=new')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--disable-logging')
        options.add_argument('--log-level=3')
        
        # ChromeDriver 자동 검색 (시스템 PATH 사용)
        try:
            driver = webdriver.Chrome(options=options)
        except Exception as e:
            # webdriver-manager 사용
            from webdriver_manager.chrome import ChromeDriverManager
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=options)
        
        # WebDriver 속성 숨기기
        driver.execute_cdp_cmd('Network.setUserAgentOverride', {
            "userAgent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
        })
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        # 2. 페이지 접속
        driver.get(url)
        time.sleep(3)

        # 3. Q&A 탭 클릭
        wait = WebDriverWait(driver, 20)
        
        # 여러 선택자 시도
        qa_clicked = False
        qa_selectors = [
            "//a[contains(., 'Q&A')]",
            "//span[contains(., 'Q&A')]",
            "//button[contains(., 'Q&A')]",
            "//*[contains(text(), 'Q&A')]"
        ]
        
        for selector in qa_selectors:
            try:
                qa_tab = wait.until(EC.element_to_be_clickable((By.XPATH, selector)))
                qa_tab.click()
                qa_clicked = True
                break
            except:
                continue
        
        if not qa_clicked:
            raise Exception("Q&A 탭을 찾을 수 없습니다.")
        
        time.sleep(4)  # 데이터 로딩 대기

        # 4. XPATH로 Q&A 리스트 컨테이너(ul) 찾기
        try:
            qna_ul = driver.find_element(By.XPATH, "//div[contains(., '답변상태')]/following-sibling::ul")
        except:
            # 대체 선택자
            qna_ul = driver.find_element(By.CSS_SELECTOR, "ul[class*='question'], ul[class*='qna']")
        
        # 5. 찾은 요소의 HTML만 다시 파싱
        soup_list = BeautifulSoup(qna_ul.get_attribute('outerHTML'), 'html.parser')
        items = soup_list.find_all('li')
        
        qna_data = []
        for item in items:
            try:
                # 제목(질문) 추출
                title_elem = item.find('strong') or item.find('div', class_=lambda x: x and 'title' in x.lower())
                title = title_elem.get_text(strip=True) if title_elem else ""
                
                # 날짜 추출
                date_elem = item.find('span', class_=lambda x: x and 'date' in x.lower())
                date = date_elem.get_text(strip=True) if date_elem else ""
                
                # 답변 상태 추출
                status_elem = item.find('span', class_=lambda x: x and 'status' in x.lower())
                status = status_elem.get_text(strip=True) if status_elem else "미답변"
                
                # 답변 내용 추출 (있는 경우)
                answer_elem = item.find('div', class_=lambda x: x and 'answer' in x.lower())
                answer = answer_elem.get_text(strip=True) if answer_elem else ""
                
                if title:  # 제목이 있는 경우만 추가
                    qna_data.append({
                        "question": title,
                        "answer": answer if answer else "답변 대기 중",
                        "date": date,
                        "status": status
                    })
            except Exception as e:
                # 개별 아이템 파싱 실패는 무시하고 계속 진행
                continue
        
        # 6. 결과 출력
        result = {
            "success": True,
            "data": qna_data,
            "count": len(qna_data)
        }
        
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)
    
    finally:
        # 7. 브라우저 종료
        if driver:
            try:
                driver.quit()
            except:
                pass
