import sys
import json
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup

def crawl_naver_qna(product_url):
    """
    네이버 스마트스토어 Q&A 크롤링
    
    Args:
        product_url: 상품 URL (예: https://smartstore.naver.com/kproject/products/7024065775)
    
    Returns:
        JSON 형태의 Q&A 리스트
    """
    # 브라우저 설정
    options = webdriver.ChromeOptions()
    # options.add_argument('--headless')  # ChromeDriver 안정성을 위해 headless 비활성화
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_experimental_option('excludeSwitches', ['enable-logging'])
    
    driver = None
    
    try:
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
        
        # 페이지 접속
        driver.get(product_url)
        time.sleep(2)

        # Q&A 탭 클릭
        wait = WebDriverWait(driver, 15)
        qa_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(., 'Q&A')] | //span[contains(., 'Q&A')]")))
        qa_tab.click()
        
        # 데이터 로딩 대기
        time.sleep(3)

        # [확실한 방법] XPATH로 Q&A 리스트 컨테이너(ul) 찾기
        # "답변상태" 텍스트가 있는 헤더 영역 다음에 나오는 ul 태그
        qna_ul = driver.find_element(By.XPATH, "//div[contains(., '답변상태')]/following-sibling::ul")
        
        # 찾은 요소의 HTML만 다시 파싱
        soup_list = BeautifulSoup(qna_ul.get_attribute('outerHTML'), 'html.parser')
        items = soup_list.find_all('li')
        
        results = []

        for idx, item in enumerate(items):
            # li 바로 아래에 있는 첫번째 div가 행(row) 역할을 합니다.
            row_wrapper = item.find('div', recursive=False) 
            
            if not row_wrapper:
                continue
                
            # 그 안의 4개의 컬럼(div)을 가져옵니다.
            # [답변상태, 제목, 작성자, 작성일]
            columns = row_wrapper.find_all('div', recursive=False)
            
            if len(columns) >= 4:
                status = columns[0].get_text(strip=True)
                title = columns[1].get_text(strip=True)
                author = columns[2].get_text(strip=True)
                date = columns[3].get_text(strip=True)
                
                # 제목 정제 (비밀글 아이콘 텍스트 등 제거)
                if "비밀글" in title:
                    is_secret = True
                    clean_title = "비밀글입니다."
                else:
                    is_secret = False
                    clean_title = title

                # 판매자 답변(Answer)이 달려있는지 확인
                answer_text = ""
                li_children = item.find_all('div', recursive=False)
                if len(li_children) > 1:
                    # 두번째 div 안에서 텍스트 추출
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
        
        return results
        
    except Exception as e:
        raise Exception(f"크롤링 중 오류 발생: {str(e)}")
        
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    # 커맨드 라인 인자로 URL 받기
    if len(sys.argv) < 2:
        print(json.dumps({"error": "상품 URL이 필요합니다."}))
        sys.exit(1)
    
    product_url = sys.argv[1]
    
    try:
        results = crawl_naver_qna(product_url)
        # JSON 형태로 출력 (stdout)
        print(json.dumps({"success": True, "data": results}, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}, ensure_ascii=False))
        sys.exit(1)
