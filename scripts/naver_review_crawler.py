import sys
import json
import time
import io
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import re

# UTF-8 출력 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def extract_review_from_item(item):
    """개별 리뷰 아이템에서 데이터 추출 (제공된 HTML 구조 기반)"""
    try:
        # 판매자 답변만 있는 아이템 건너뛰기
        if not item.select_one('div.AlfkEF45qI'):
            return None
        
        # === 평점 추출 === (em.n6zq2yy0KA)
        rating = 5
        rating_elem = item.select_one('em.n6zq2yy0KA')
        if rating_elem:
            try:
                rating = int(rating_elem.get_text(strip=True))
            except:
                pass
        
        # === 작성자 추출 === (div.Db9Dtnf7gY > strong.MX91DFZo2F)
        author = "익명"
        author_container = item.select_one('div.Db9Dtnf7gY')
        if author_container:
            author_elem = author_container.select_one('strong.MX91DFZo2F')
            if author_elem:
                author = author_elem.get_text(strip=True)
        
        # === 날짜 추출 === (div.Db9Dtnf7gY 내 두 번째 span.MX91DFZo2F)
        date = ""
        if author_container:
            # 작성자명과 날짜가 모두 span.MX91DFZo2F지만 날짜는 패턴으로 구분
            spans = author_container.select('span.MX91DFZo2F')
            for span in spans:
                text = span.get_text(strip=True)
                # 날짜 패턴: YY.MM.DD. 또는 YYYY.MM.DD
                if re.match(r'\d{2,4}\.\d{1,2}\.\d{1,2}\.?$', text):
                    date = text.rstrip('.')
                    break
        
        # === 옵션 추출 === (div.b_caIle8kC)
        option = ""
        option_elem = item.select_one('div.b_caIle8kC')
        if option_elem:
            # 복제본 만들어서 하위 요소 제거 (원본 수정 방지)
            option_clone = BeautifulSoup(str(option_elem), 'html.parser')
            # 주거형태 등 하위 요소 제거
            for sub in option_clone.select('div.eWRrdDdSzW, div.RVbIFwX5dY'):
                sub.decompose()
            option = option_clone.get_text(" ", strip=True)
        
        # === 리뷰 내용 추출 === (div.AlfkEF45qI > div.HakaEZ240l > div.KqJ8Qqw082 > span.MX91DFZo2F)
        content = ""
        # 사용자 리뷰 컨테이너 (판매자 답변 영역 제외)
        review_container = item.select_one('div.AlfkEF45qI div.HakaEZ240l')
        if review_container:
            content_div = review_container.select_one('div.KqJ8Qqw082')
            if content_div:
                # 내용 span 찾기 (스토어PICK, 한달사용 뱃지 제외)
                content_spans = content_div.select('span.MX91DFZo2F')
                for span in content_spans:
                    # rnrf6Xo7x2는 스토어PICK, W1IZsaUmnu는 한달사용 뱃지
                    span_classes = span.get('class', [])
                    if 'rnrf6Xo7x2' not in span_classes and 'W1IZsaUmnu' not in span_classes:
                        text = span.get_text(strip=True)
                        if len(text) > len(content):
                            content = text
        
        # 내용이 없으면 건너뛰기
        if not content or len(content) < 5:
            return None
        
        # === 이미지 추출 === (div.s30AvhHfb0 img.UpImHAUeYJ)
        images = []
        img_container = item.select_one('div.s30AvhHfb0')
        if img_container:
            for img in img_container.select('img.UpImHAUeYJ'):
                # data-src 속성을 우선 사용 (lazy loading)
                src = img.get('data-src') or img.get('src')
                if src and 'pstatic.net' in src:
                    # 타입 파라미터 제거하여 원본 이미지 URL 사용
                    clean_src = re.sub(r'\?type=.*$', '', src)
                    if clean_src not in images:
                        images.append(clean_src)
        
        # ID 생성 (data-shp-contents-id 사용)
        review_id = item.get('data-shp-contents-id', f"{author}-{date}-{len(content)}")
        
        return {
            "id": str(review_id),
            "content": content,
            "author": author,
            "date": date,
            "rating": rating,
            "option": option,
            "images": images
        }
    except Exception as e:
        return None

def extract_reviews_from_html(soup):
    """HTML에서 모든 리뷰 데이터 추출"""
    results = []
    
    # 리뷰 아이템 찾기 (여러 선택자 시도)
    # 1. data-shp-contents-type="review" 속성 (가장 정확)
    items = soup.select('li[data-shp-contents-type="review"]')
    
    # 2. 클래스 기반 선택자
    if not items:
        items = soup.select('ul.RR2FSL9wTc > li.PxsZltB5tV')
    
    # 3. HTT4L8U0CU 내부의 리스트
    if not items:
        container = soup.select_one('div.HTT4L8U0CU ul.RR2FSL9wTc')
        if container:
            items = container.select('li')
    
    for item in items:
        review = extract_review_from_item(item)
        if review:
            results.append(review)
    
    return results

def extract_reviews_from_page(driver):
    """현재 페이지에서 리뷰 추출"""
    # 스크롤하여 lazy loading 컨텐츠 로드
    for _ in range(2):
        driver.execute_script("window.scrollBy(0, 300);")
        time.sleep(0.3)
    
    page_source = driver.page_source
    soup = BeautifulSoup(page_source, 'html.parser')
    return extract_reviews_from_html(soup)

def click_next_page(driver, save_debug=False):
    """다음 페이지 버튼 클릭. 성공하면 True, 마지막 페이지면 False 반환"""
    
    def try_click(btn, method_name):
        """여러 클릭 방법 시도"""
        try:
            # 1. JavaScript 클릭
            driver.execute_script("arguments[0].click();", btn)
            time.sleep(0.5)
            return True
        except:
            pass
        
        try:
            # 2. ActionChains 클릭
            ActionChains(driver).move_to_element(btn).click().perform()
            time.sleep(0.5)
            return True
        except:
            pass
        
        try:
            # 3. 일반 클릭
            btn.click()
            time.sleep(0.5)
            return True
        except:
            pass
        
        return False
    
    try:
        # 페이지네이션 영역으로 스크롤
        try:
            pagination = driver.find_element(By.CSS_SELECTOR, "div.LiT9lKOVbw, div.L2CTE05CX2, nav[aria-label*='페이지']")
            driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", pagination)
            time.sleep(1)
        except:
            # 페이지 하단으로 스크롤
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight * 0.7);")
            time.sleep(1)
        
        # 현재 페이지 번호 확인 (여러 방법 시도)
        current_page_num = 1
        try:
            # 방법 1: aria-current="true" 또는 aria-current="page"
            current_btn = driver.find_element(By.CSS_SELECTOR, "a[aria-current='true'], a[aria-current='page']")
            current_page_num = int(current_btn.text)
        except:
            try:
                # 방법 2: 선택된 상태의 페이지 버튼 (보통 다른 스타일)
                # 페이지네이션에서 숫자만 있는 a 태그들 중 강조된 것
                page_links = driver.find_elements(By.CSS_SELECTOR, "div.LiT9lKOVbw a, div.L2CTE05CX2 a")
                for link in page_links:
                    text = link.text.strip()
                    if text.isdigit():
                        # aria-current 확인
                        aria = link.get_attribute('aria-current')
                        if aria and aria.lower() in ['true', 'page']:
                            current_page_num = int(text)
                            break
            except:
                pass
        
        if save_debug:
            print(f"[DEBUG] Current page number: {current_page_num}", file=sys.stderr, flush=True)
        
        # 방법 1: 다음 페이지 번호 버튼 직접 클릭 (가장 확실)
        try:
            next_page_num = current_page_num + 1
            # 정확한 페이지 번호 찾기
            page_btn = driver.find_element(By.XPATH, f"//div[contains(@class, 'LiT9lKOVbw') or contains(@class, 'L2CTE05CX2')]//a[text()='{next_page_num}']")
            if page_btn.is_displayed():
                if save_debug:
                    print(f"[DEBUG] Found page {next_page_num} button directly, clicking...", file=sys.stderr, flush=True)
                if try_click(page_btn, "page_num"):
                    return True
        except Exception as e:
            if save_debug:
                print(f"[DEBUG] Direct page number failed: {e}", file=sys.stderr, flush=True)
        
        # 방법 2: "다음" 텍스트를 포함한 a 태그
        try:
            next_btn = driver.find_element(By.XPATH, "//a[.//span[text()='다음']]")
            # 비활성화 클래스 확인
            btn_class = next_btn.get_attribute('class') or ''
            if 'jKodyicQKc' not in btn_class and next_btn.is_displayed():
                if save_debug:
                    print(f"[DEBUG] Found 다음 button with span, clicking...", file=sys.stderr, flush=True)
                if try_click(next_btn, "next_span"):
                    return True
        except Exception as e:
            if save_debug:
                print(f"[DEBUG] 다음 span method failed: {e}", file=sys.stderr, flush=True)
        
        # 방법 3: 페이지 번호 버튼들 중 현재+1 찾기
        try:
            all_page_links = driver.find_elements(By.CSS_SELECTOR, "div.LiT9lKOVbw a, div.L2CTE05CX2 a")
            for link in all_page_links:
                link_text = link.text.strip()
                if link_text.isdigit():
                    page_num = int(link_text)
                    if page_num == current_page_num + 1:
                        if save_debug:
                            print(f"[DEBUG] Found next page {page_num} in list, clicking...", file=sys.stderr, flush=True)
                        if try_click(link, "page_list"):
                            return True
        except Exception as e:
            if save_debug:
                print(f"[DEBUG] Page list method failed: {e}", file=sys.stderr, flush=True)
        
        # 방법 4: I3i1NSoFdB 클래스 버튼 중 "다음"
        try:
            buttons = driver.find_elements(By.CSS_SELECTOR, "a.I3i1NSoFdB")
            for btn in buttons:
                if '다음' in btn.text:
                    if save_debug:
                        print(f"[DEBUG] Found 다음 via class I3i1NSoFdB, clicking...", file=sys.stderr, flush=True)
                    if try_click(btn, "class"):
                        return True
        except Exception as e:
            if save_debug:
                print(f"[DEBUG] Class method failed: {e}", file=sys.stderr, flush=True)
        
        if save_debug:
            print(f"[DEBUG] All click methods failed, no more pages", file=sys.stderr, flush=True)
        return False
    except Exception as e:
        if save_debug:
            print(f"[DEBUG] click_next_page error: {e}", file=sys.stderr, flush=True)
        return False


def get_current_page_number(driver):
    """현재 페이지 번호 반환"""
    try:
        # aria-current="true"인 페이지 번호 찾기
        current = driver.find_element(By.CSS_SELECTOR, "a[aria-current='true']")
        return int(current.text)
    except:
        return 1

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "상품 URL이 필요합니다."}))
        sys.exit(1)
    
    url = sys.argv[1]
    save_debug = len(sys.argv) > 2 and sys.argv[2] == '--debug'
    max_pages = 3  # 최대 페이지 수 제한 (3페이지로 제한)
    
    try:
        # 1. 브라우저 설정 (Q&A 크롤러와 동일)
        options = webdriver.ChromeOptions()
        options.add_experimental_option('excludeSwitches', ['enable-logging'])
        # 봇 탐지 우회
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        # User-Agent 설정
        options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        
        # 안정성 향상 옵션
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--disable-extensions')
        options.add_argument('--remote-debugging-port=9222')
        options.add_argument('--window-size=1920,1080')
        options.page_load_strategy = 'normal'
        
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
        driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
            'source': 'Object.defineProperty(navigator, "webdriver", {get: () => undefined})'
        })

        # 2. 페이지 접속
        driver.get(url)
        time.sleep(5)  # 초기 로딩 대기 시간 증가

        # 3. 리뷰 탭 클릭 시도
        wait = WebDriverWait(driver, 15)  # 대기 시간 증가
        tab_clicked = False
        
        # 방법 1: "리뷰" 텍스트가 포함된 탭/링크 클릭
        try:
            tabs = driver.find_elements(By.CSS_SELECTOR, "a[href*='REVIEW'], button[class*='tab'], a[role='tab']")
            for tab in tabs:
                if '리뷰' in tab.text:
                    tab.click()
                    tab_clicked = True
                    break
            
            if not tab_clicked:
                review_tab = driver.find_element(By.XPATH, "//*[contains(text(), '리뷰') and (self::a or self::button or self::span)]")
                review_tab.click()
                tab_clicked = True
        except:
            pass
        
        # 방법 2: URL 해시 변경
        if not tab_clicked:
            driver.execute_script("window.location.hash = 'REVIEW';")
        
        time.sleep(3)
        
        # 4. 리뷰 섹션으로 스크롤
        try:
            review_section = driver.find_element(By.CSS_SELECTOR, "div.HTT4L8U0CU, ul.RR2FSL9wTc, div[class*='review']")
            driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", review_section)
        except:
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight / 2);")
        
        time.sleep(2)
        
        # 리뷰 리스트가 로드될 때까지 대기 (최대 10초)
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "ul.RR2FSL9wTc > li.PxsZltB5tV"))
            )
            if save_debug:
                print("[DEBUG] Review list loaded successfully", file=sys.stderr, flush=True)
        except Exception as e:
            if save_debug:
                print(f"[DEBUG] Warning: Could not find review list: {e}", file=sys.stderr, flush=True)
        
        # 추가 스크롤로 lazy loading 컨텐츠 로드
        for _ in range(3):
            driver.execute_script("window.scrollBy(0, 500);")
            time.sleep(0.5)
        
        time.sleep(2)  # 추가 안정화 대기
        
        # 5. 전체 리뷰 수집 (페이지네이션 포함)
        all_results = []
        collected_ids = set()  # 중복 방지용
        current_page = 1
        
        while current_page <= max_pages:
            # 현재 페이지에서 리뷰 추출
            page_reviews = extract_reviews_from_page(driver)
            
            # 중복 제거하며 추가
            new_count = 0
            for review in page_reviews:
                if review['id'] not in collected_ids:
                    collected_ids.add(review['id'])
                    all_results.append(review)
                    new_count += 1
            
            # 새로운 리뷰가 없으면 종료 (이미 수집한 페이지일 수 있음)
            if new_count == 0 and current_page > 1:
                break
            
            # 디버그 출력
            if save_debug:
                print(f"[DEBUG] Page {current_page}: {new_count} new reviews (Total: {len(all_results)})", file=sys.stderr, flush=True)
            
            # 다음 페이지로 이동 시도
            time.sleep(1.5)  # 페이지 안정화 대기
            
            clicked = click_next_page(driver, save_debug)
            if save_debug:
                print(f"[DEBUG] Click next page result: {clicked}", file=sys.stderr, flush=True)
            
            if not clicked:
                # 다음 버튼이 없거나 비활성화 = 마지막 페이지
                if save_debug:
                    print(f"[DEBUG] No more pages available", file=sys.stderr, flush=True)
                break
            
            # 페이지 로딩 대기 (더 길게)
            time.sleep(2)
            current_page += 1
            
            # 새 리뷰가 로드될 때까지 대기 (첫 번째 리뷰 ID가 변경되는지 확인)
            old_first_id = all_results[-1]['id'] if all_results else None  # 마지막으로 수집한 ID
            
            max_wait = 10  # 최대 10초 대기
            waited = 0
            new_reviews_loaded = False
            
            while waited < max_wait:
                time.sleep(1)
                waited += 1
                
                # 현재 페이지의 첫 리뷰 ID 확인
                current_reviews = extract_reviews_from_page(driver)
                if current_reviews:
                    first_current_id = current_reviews[0]['id']
                    # 새 리뷰가 있으면 (기존에 수집하지 않은 ID)
                    if first_current_id not in collected_ids:
                        new_reviews_loaded = True
                        if save_debug:
                            print(f"[DEBUG] New reviews detected on page {current_page} after {waited}s", file=sys.stderr, flush=True)
                        break
                
                # 스크롤하여 컨텐츠 로딩 유도
                driver.execute_script("window.scrollBy(0, 100);")
            
            if not new_reviews_loaded:
                if save_debug:
                    print(f"[DEBUG] No new reviews after {max_wait}s wait, stopping", file=sys.stderr, flush=True)
                # 그래도 한번 더 시도해보고 종료
                page_reviews = extract_reviews_from_page(driver)
                new_count_check = sum(1 for r in page_reviews if r['id'] not in collected_ids)
                if new_count_check == 0:
                    break
        
        # 디버깅용 HTML 저장
        if save_debug:
            with open('debug_review_page.html', 'w', encoding='utf-8') as f:
                f.write(driver.page_source)
        
        driver.quit()
        
        # JSON 출력
        output = {
            "success": True, 
            "data": all_results, 
            "count": len(all_results),
            "pages_crawled": current_page
        }
        
        print(json.dumps(output, ensure_ascii=False))

    except Exception as e:
        if 'driver' in locals():
            try:
                driver.quit()
            except:
                pass
        print(json.dumps({"success": False, "error": str(e)}))
