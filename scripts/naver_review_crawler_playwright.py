#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
네이버 스마트스토어 리뷰 크롤러 (Playwright + Stealth 버전)
봇 탐지 우회 기능 강화

사용법:
    python naver_review_crawler_playwright.py <상품URL> [--pages N] [--debug]
"""

import json
import sys
import time
import re
import random
from datetime import datetime
from playwright.sync_api import sync_playwright


def random_delay(min_sec=1, max_sec=3):
    """랜덤 딜레이 (봇 탐지 우회)"""
    time.sleep(random.uniform(min_sec, max_sec))


def extract_reviews_from_page(page):
    """현재 페이지에서 리뷰 추출"""
    reviews = []
    
    # 리뷰 컨테이너 선택자들
    review_selectors = [
        "li[class*='reviewItems_review']",
        "li[class*='review_list_item']",
        "div[class*='review_item']",
        "li.review_list_v2_item",
    ]
    
    review_elements = []
    for selector in review_selectors:
        try:
            elements = page.query_selector_all(selector)
            if elements:
                review_elements = elements
                break
        except:
            continue
    
    for elem in review_elements:
        try:
            review = {}
            
            # 리뷰 ID 추출
            review_id = elem.get_attribute('data-review-id') or elem.get_attribute('id')
            if not review_id:
                # 고유 식별자 생성
                content_preview = elem.inner_text()[:50] if elem.inner_text() else ""
                review_id = f"review_{hash(content_preview) % 100000}"
            review['id'] = review_id
            
            # 평점 추출
            rating = 5
            rating_selectors = [
                "span[class*='reviewItems_average']",
                "em[class*='grade']",
                "span[class*='star_score']",
                "div[class*='rating'] span",
            ]
            for sel in rating_selectors:
                try:
                    rating_elem = elem.query_selector(sel)
                    if rating_elem:
                        rating_text = rating_elem.inner_text()
                        match = re.search(r'(\d+)', rating_text)
                        if match:
                            rating = int(match.group(1))
                            break
                except:
                    continue
            review['rating'] = rating
            
            # 작성자 추출
            author = "익명"
            author_selectors = [
                "span[class*='reviewItems_user_id']",
                "span[class*='user_id']",
                "em[class*='author']",
                "span[class*='reviewer']",
            ]
            for sel in author_selectors:
                try:
                    author_elem = elem.query_selector(sel)
                    if author_elem:
                        author = author_elem.inner_text().strip()
                        if author:
                            break
                except:
                    continue
            review['author'] = author
            
            # 날짜 추출
            date = ""
            date_selectors = [
                "span[class*='reviewItems_date']",
                "span[class*='date']",
                "em[class*='date']",
            ]
            for sel in date_selectors:
                try:
                    date_elem = elem.query_selector(sel)
                    if date_elem:
                        date = date_elem.inner_text().strip()
                        if date:
                            break
                except:
                    continue
            review['date'] = date
            
            # 옵션 추출
            option = ""
            option_selectors = [
                "span[class*='reviewItems_option']",
                "div[class*='option']",
                "span[class*='product_option']",
            ]
            for sel in option_selectors:
                try:
                    option_elem = elem.query_selector(sel)
                    if option_elem:
                        option = option_elem.inner_text().strip()
                        if option:
                            break
                except:
                    continue
            review['option'] = option
            
            # 내용 추출
            content = ""
            content_selectors = [
                "span[class*='reviewItems_review__text']",
                "div[class*='review_content']",
                "p[class*='content']",
                "div[class*='text']",
            ]
            for sel in content_selectors:
                try:
                    content_elem = elem.query_selector(sel)
                    if content_elem:
                        content = content_elem.inner_text().strip()
                        if content:
                            break
                except:
                    continue
            
            # 내용이 없으면 전체 텍스트에서 추출 시도
            if not content:
                full_text = elem.inner_text()
                # 작성자, 날짜 등을 제외한 부분 추출
                lines = [l.strip() for l in full_text.split('\n') if l.strip()]
                if len(lines) > 2:
                    content = '\n'.join(lines[2:])
            
            review['content'] = content
            
            # 이미지 추출
            images = []
            try:
                img_elements = elem.query_selector_all("img[class*='review'], img[src*='review']")
                for img in img_elements:
                    src = img.get_attribute('src')
                    if src and 'review' in src:
                        images.append(src)
            except:
                pass
            review['images'] = images
            
            if review['content'] or review['rating']:
                reviews.append(review)
                
        except Exception as e:
            continue
    
    return reviews


def click_next_page(page, current_page):
    """다음 페이지로 이동"""
    next_page = current_page + 1
    
    # 방법 1: 페이지 번호 직접 클릭
    try:
        page_link = page.query_selector(f"a:has-text('{next_page}')")
        if page_link and page_link.is_visible():
            page_link.click()
            random_delay(1, 2)
            return True
    except:
        pass
    
    # 방법 2: 다음 버튼 클릭
    next_selectors = [
        "a:has-text('다음')",
        "button:has-text('다음')",
        "a[class*='next']",
        "button[class*='next']",
    ]
    
    for selector in next_selectors:
        try:
            next_btn = page.query_selector(selector)
            if next_btn and next_btn.is_visible():
                next_btn.click()
                random_delay(1, 2)
                return True
        except:
            continue
    
    # 방법 3: JavaScript로 클릭
    try:
        result = page.evaluate(f"""
            () => {{
                const links = document.querySelectorAll('a');
                for (const link of links) {{
                    if (link.textContent.trim() === '{next_page}') {{
                        link.click();
                        return true;
                    }}
                }}
                return false;
            }}
        """)
        if result:
            random_delay(1, 2)
            return True
    except:
        pass
    
    return False


def crawl_reviews(url, max_pages=3, debug=False):
    """리뷰 크롤링 메인 함수"""
    
    all_reviews = []
    collected_ids = set()
    pages_crawled = 0
    
    with sync_playwright() as p:
        # 브라우저 실행 (봇 탐지 우회 설정)
        browser = p.chromium.launch(
            headless=False,  # 디버깅을 위해 headless=False
            args=[
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
            ]
        )
        
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale='ko-KR',
            timezone_id='Asia/Seoul',
        )
        
        page = context.new_page()
        
        # Stealth: 봇 탐지 우회 스크립트
        page.add_init_script("""
            // webdriver 속성 숨기기
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            
            // plugins 위장
            Object.defineProperty(navigator, 'plugins', {
                get: () => {
                    const plugins = [
                        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
                        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
                        { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' }
                    ];
                    plugins.length = 3;
                    return plugins;
                }
            });
            
            // languages 설정
            Object.defineProperty(navigator, 'languages', { get: () => ['ko-KR', 'ko', 'en-US', 'en'] });
            
            // chrome 객체 생성
            window.chrome = {
                runtime: {},
                loadTimes: function() {},
                csi: function() {},
                app: {}
            };
            
            // permissions 위장
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );
            
            // WebGL vendor 위장
            const getParameter = WebGLRenderingContext.prototype.getParameter;
            WebGLRenderingContext.prototype.getParameter = function(parameter) {
                if (parameter === 37445) return 'Intel Inc.';
                if (parameter === 37446) return 'Intel Iris OpenGL Engine';
                return getParameter.call(this, parameter);
            };
        """)
        
        try:
            # 페이지 접속
            page.goto(url, wait_until='networkidle', timeout=30000)
            random_delay(3, 5)
            
            # 리뷰 탭 클릭
            review_tab_clicked = False
            review_tab_selectors = [
                "a:has-text('리뷰')",
                "button:has-text('리뷰')",
                "[role='tab']:has-text('리뷰')",
            ]
            
            for selector in review_tab_selectors:
                try:
                    tab = page.query_selector(selector)
                    if tab and tab.is_visible():
                        tab.click()
                        review_tab_clicked = True
                        random_delay(2, 3)
                        break
                except:
                    continue
            
            # URL 해시로 리뷰 섹션 이동
            if not review_tab_clicked:
                page.evaluate("window.location.hash = 'REVIEW'")
                random_delay(2, 3)
            
            # 리뷰 섹션으로 스크롤
            page.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
            random_delay(1, 2)
            
            # 디버그: HTML 저장
            if debug:
                with open('debug_playwright_page.html', 'w', encoding='utf-8') as f:
                    f.write(page.content())
                print(f"[DEBUG] HTML saved to debug_playwright_page.html")
            
            # 페이지별 크롤링
            current_page = 1
            
            while current_page <= max_pages:
                # 현재 페이지 리뷰 추출
                page_reviews = extract_reviews_from_page(page)
                
                # 중복 제거하며 추가
                new_count = 0
                for review in page_reviews:
                    if review['id'] not in collected_ids:
                        collected_ids.add(review['id'])
                        all_reviews.append(review)
                        new_count += 1
                
                if debug:
                    print(f"[DEBUG] Page {current_page}: {new_count} new reviews (Total: {len(all_reviews)})")
                
                # 새 리뷰가 없으면 종료
                if new_count == 0 and current_page > 1:
                    break
                
                # 다음 페이지 이동
                if current_page < max_pages:
                    if not click_next_page(page, current_page):
                        if debug:
                            print(f"[DEBUG] No more pages after page {current_page}")
                        break
                    random_delay(1, 2)
                
                current_page += 1
            
            pages_crawled = current_page
            
        except Exception as e:
            if debug:
                print(f"[DEBUG] Error: {e}")
            pages_crawled = 0
        
        browser.close()
    
    return {
        'success': True,
        'reviews': all_reviews,
        'count': len(all_reviews),
        'pages_crawled': pages_crawled
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "상품 URL이 필요합니다."}))
        sys.exit(1)
    
    url = sys.argv[1]
    max_pages = 3
    debug = False
    
    # 인자 파싱
    i = 2
    while i < len(sys.argv):
        if sys.argv[i] == '--pages' and i + 1 < len(sys.argv):
            max_pages = int(sys.argv[i + 1])
            i += 2
        elif sys.argv[i] == '--debug':
            debug = True
            i += 1
        else:
            i += 1
    
    # 크롤링 실행
    result = crawl_reviews(url, max_pages, debug)
    
    # 결과 출력
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
