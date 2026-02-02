import sys
import json
import time
import io
import re
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup

# UTF-8 출력 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def crawl_with_existing_browser(product_url):
    """
    기존에 실행 중인 Chrome 브라우저에 연결하여 크롤링
    """
    try:
        # Remote debugging 포트에 연결
        options = Options()
        options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
        
        driver = webdriver.Chrome(options=options)
        
        # 현재 열려있는 탭 저장
        original_window = driver.current_window_handle
        
        # 새 탭 열기
        driver.execute_script("window.open('');")
        driver.switch_to.window(driver.window_handles[-1])
        
        # 상품 페이지 접속
        driver.get(product_url)
        time.sleep(4)
        
        # Q&A 탭 클릭 (data-name="QNA" 사용)
        wait = WebDriverWait(driver, 20)
        
        qa_clicked = False
        qa_selectors = [
            "//a[@data-name='QNA']",
            "//a[contains(text(), 'Q&A')]",
            "//button[@data-name='QNA']",
        ]
        
        for selector in qa_selectors:
            try:
                qa_tab = wait.until(EC.element_to_be_clickable((By.XPATH, selector)))
                # 탭을 화면에 보이도록 스크롤
                driver.execute_script("arguments[0].scrollIntoView(true);", qa_tab)
                time.sleep(1)
                # JavaScript로 클릭 (더 안정적)
                driver.execute_script("arguments[0].click();", qa_tab)
                qa_clicked = True
                print(f"DEBUG: Q&A 탭 클릭 성공", file=sys.stderr)
                break
            except Exception as e:
                print(f"DEBUG: {selector} 시도 실패: {e}", file=sys.stderr)
                continue
        
        if not qa_clicked:
            raise Exception("Q&A 탭을 찾을 수 없습니다.")
        
        # Q&A 데이터 로딩 대기 (충분히 기다리기)
        time.sleep(6)
        
        # 페이지 스크롤하여 Q&A 리스트 로드
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight - 1000);")
        time.sleep(2)
        
        # Q&A 리스트 찾기
        qna_data = []
        
        try:
            # Q&A 섹션 찾기 (#QNA)
            try:
                qna_section = driver.find_element(By.ID, "QNA")
                print(f"DEBUG: Q&A 섹션 찾음 (#QNA)", file=sys.stderr)
            except:
                print(f"DEBUG: Q&A 섹션을 ID로 찾을 수 없음, 전체 페이지 검색", file=sys.stderr)
                qna_section = driver
            
            # Q&A 아이템 리스트 찾기
            # 네이버 스마트스토어: ul.UJbMFPn3Rt > li 또는 li[class*='KR8UaQ9_Vn']
            qna_list = qna_section.find_elements(By.CSS_SELECTOR, 
                "ul[class*='UJbMFPn3Rt'] > li, ul > li[class*='KR8UaQ9_Vn']")
            
            if not qna_list:
                # 대체 선택자
                qna_list = qna_section.find_elements(By.XPATH, 
                    ".//ul//li[.//span[contains(@class, 'u5LpLpO6OE')]]")
            
            print(f"DEBUG: 찾은 Q&A 아이템 수: {len(qna_list)}", file=sys.stderr)
            
            for idx, item in enumerate(qna_list[:50]):  # 최대 50개
                try:
                    # HTML 파싱
                    item_html = item.get_attribute('outerHTML')
                    soup = BeautifulSoup(item_html, 'html.parser')
                    
                    # 제목 추출 (span.u5LpLpO6OE)
                    title_elem = soup.find('span', class_=lambda x: x and 'u5LpLpO6OE' in str(x))
                    
                    if not title_elem:
                        # 대체: strong 또는 title 클래스
                        title_elem = soup.find('strong') or \
                                    soup.find('a', class_=lambda x: x and 'title' in str(x).lower())
                    
                    if not title_elem:
                        continue
                    
                    title = title_elem.get_text(strip=True)
                    
                    # 유효성 검사
                    if not title or len(title) < 3:
                        continue
                    
                    # 비디오 플레이어 설정 제외
                    if any(skip in title for skip in ['480p', '720p', '1080p', '144p', '240p', '360p',
                                                       '배경색', '글자 크기', '자막', '화질', 
                                                       '0.5x', '1.0x', '1.5x', '2.0x', '기본']):
                        continue
                    
                    # 비밀글 체크
                    is_secret = '비밀' in title or 'secret' in item_html.lower()
                    if is_secret:
                        title = "비밀글입니다"
                    
                    # 상태 추출
                    status_elem = soup.find('span', class_=lambda x: x and ('status' in str(x).lower() or 'state' in str(x).lower()))
                    if not status_elem:
                        # 답변이 있으면 답변완료, 없으면 답변대기
                        has_answer = soup.find('div', class_=lambda x: x and 'answer' in str(x).lower())
                        status = "답변완료" if has_answer else "답변대기"
                    else:
                        status = status_elem.get_text(strip=True)
                    
                    # 작성자 추출 (div.mOPZSaJl4b)
                    author_elem = soup.find('div', class_=lambda x: x and 'mOPZSaJl4b' in str(x))
                    if not author_elem:
                        author_elem = soup.find('span', class_=lambda x: x and 'writer' in str(x).lower())
                    author = author_elem.get_text(strip=True) if author_elem else "익명"
                    
                    # 날짜 추출 (div.ysDyZDZUJu)
                    date_elem = soup.find('div', class_=lambda x: x and 'ysDyZDZUJu' in str(x))
                    if not date_elem:
                        date_elem = soup.find('span', class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_elem.get_text(strip=True) if date_elem else ""
                    
                    # 날짜 형식 정리 (YYYY.MM.DD 형식 추출)
                    date_match = re.search(r'\d{4}[.-]\d{1,2}[.-]\d{1,2}', date_text)
                    date = date_match.group(0) if date_match else date_text
                    
                    # 답변 추출
                    answer_elem = soup.find('div', class_=lambda x: x and 'answer' in str(x).lower())
                    answer = answer_elem.get_text(strip=True) if answer_elem else ""
                    
                    qna_data.append({
                        "status": status,
                        "title": title,
                        "author": author,
                        "date": date,
                        "answer": answer if answer else "답변 대기 중",
                        "isSecret": is_secret
                    })
                    
                    print(f"DEBUG: [{idx+1}] {status} - {title[:40]}...", file=sys.stderr)
                
                except Exception as e:
                    print(f"DEBUG: 아이템 {idx} 파싱 오류: {e}", file=sys.stderr)
                    continue
        
        except Exception as e:
            print(f"DEBUG: Q&A 리스트 찾기 오류: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
        
        # 탭 닫기 및 원래 탭으로 돌아가기
        driver.close()
        driver.switch_to.window(original_window)
        
        return {
            "success": True,
            "data": qna_data,
            "count": len(qna_data)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "상품 URL이 필요합니다."}, ensure_ascii=False))
        sys.exit(1)
    
    product_url = sys.argv[1]
    result = crawl_with_existing_browser(product_url)
    print(json.dumps(result, ensure_ascii=False))
    
    if not result["success"]:
        sys.exit(1)
