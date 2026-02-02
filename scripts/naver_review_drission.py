#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
네이버 스마트스토어 리뷰 크롤러 (DrissionPage 버전)
CDP 프로토콜을 사용하여 봇 탐지를 우회합니다.

사용법:
    python naver_review_drission.py <상품URL> [--pages N] [--debug]
    
주의: 크롬 브라우저가 실행 중이면 종료 후 실행하세요.
"""

import json
import sys
import time
import re
import random
from DrissionPage import ChromiumPage, ChromiumOptions


def random_delay(min_sec=1, max_sec=3):
    """랜덤 딜레이"""
    time.sleep(random.uniform(min_sec, max_sec))


def extract_reviews_from_page(page, debug=False):
    """현재 페이지에서 리뷰 추출 - JavaScript로 직접 추출 (판매자 답변 제외)"""
    reviews = []
    
    if debug:
        print("[DEBUG] Starting review extraction...")
    
    # JavaScript로 리뷰 데이터 추출 (DOM 직접 접근) - 유연한 셀렉터 사용
    # 판매자 답변(Wsm9me_nCc 또는 gCwNtyh1ki 클래스)은 제외하고 사용자 리뷰만 추출
    js_code = '''
    (function() {
        var reviews = [];
        var items = document.querySelectorAll('ul.RR2FSL9wTc > li.PxsZltB5tV');
        console.log('[JS] Found ' + items.length + ' review items');
        
        items.forEach(function(item, index) {
            var review = {};
            
            // ID
            review.id = item.getAttribute('data-shp-contents-id') || ('review_' + index);
            
            // 평점 - 여러 클래스 시도 (판매자 답변 영역 제외)
            // 판매자 답변 영역(gCwNtyh1ki)이 아닌 곳에서만 평점 추출
            var ratingElem = null;
            var ratingCandidates = item.querySelectorAll('em.n6zq2yy0KA, em[class*="n6zq2yy0KA"]');
            for (var i = 0; i < ratingCandidates.length; i++) {
                var elem = ratingCandidates[i];
                // 판매자 답변 영역의 자식이 아닌지 확인
                if (!elem.closest('.gCwNtyh1ki, div[class*="gCwNtyh1ki"]')) {
                    ratingElem = elem;
                    break;
                }
            }
            review.rating = ratingElem ? parseInt(ratingElem.textContent.trim()) : 5;
            
            // 작성자 - 판매자 답변 영역 제외하고 첫 번째 strong 요소
            var authorElem = null;
            var authorCandidates = item.querySelectorAll('strong.MX91DFZo2F, strong.K0kwJOXP06, strong[class*="MX91DFZo2F"], strong[class*="K0kwJOXP06"]');
            for (var i = 0; i < authorCandidates.length; i++) {
                var elem = authorCandidates[i];
                // 판매자 답변 영역의 자식이 아닌지 확인
                if (!elem.closest('.gCwNtyh1ki, div[class*="gCwNtyh1ki"]')) {
                    authorElem = elem;
                    break;
                }
            }
            review.author = authorElem ? authorElem.textContent.trim() : '익명';
            
            // 날짜와 옵션 - YfYso7QHys 또는 Db9Dtnf7gY 컨테이너에서 (판매자 영역 제외)
            var infoContainer = null;
            var infoCandidates = item.querySelectorAll('div.YfYso7QHys, div.Db9Dtnf7gY');
            for (var i = 0; i < infoCandidates.length; i++) {
                var elem = infoCandidates[i];
                if (!elem.closest('.gCwNtyh1ki, div[class*="gCwNtyh1ki"]')) {
                    infoContainer = elem;
                    break;
                }
            }
            if (infoContainer) {
                // span 요소들에서 날짜 패턴 찾기
                var spans = infoContainer.querySelectorAll('span');
                for (var i = 0; i < spans.length; i++) {
                    var text = spans[i].textContent.trim();
                    // 날짜 패턴: YY.MM.DD. 또는 YYYY.MM.DD
                    if (/\\d{2,4}\\.\\d{1,2}\\.\\d{1,2}/.test(text)) {
                        review.date = text;
                        break;
                    }
                }
            }
            review.date = review.date || '';
            
            // 옵션 - 날짜 이후의 span 또는 특정 클래스 (판매자 영역 제외)
            var optionSpan = null;
            var optionCandidates = item.querySelectorAll('span.K0kwJOXP06:nth-child(3), div.b_caIle8kC');
            for (var i = 0; i < optionCandidates.length; i++) {
                var elem = optionCandidates[i];
                if (!elem.closest('.gCwNtyh1ki, div[class*="gCwNtyh1ki"]')) {
                    optionSpan = elem;
                    break;
                }
            }
            if (optionSpan) {
                var optionText = optionSpan.textContent.trim();
                // 옵션 텍스트가 너무 길면 내용이므로 제외
                if (optionText.length < 200) {
                    // 주거형태 이전까지만
                    var idx = optionText.indexOf('주거형태');
                    review.option = idx > 0 ? optionText.substring(0, idx).trim() : optionText;
                }
            }
            review.option = review.option || '';
            
            // 내용 - div.AlfkEF45qI > div.uyooaw19E8 > div.Tf5fecQ5mT 하위에서 추출
            var contentContainer = null;
            var contentCandidates = item.querySelectorAll('div.AlfkEF45qI div.HakaEZ240l div.KqJ8Qqw082');
            for (var i = 0; i < contentCandidates.length; i++) {
                var elem = contentCandidates[i];
                // 판매자 답변 컨테이너(Wsm9me_nCc, gCwNtyh1ki)의 자식이 아닌 것만 선택
                if (!elem.closest('.Wsm9me_nCc, .gCwNtyh1ki, div[class*="Wsm9me_nCc"], div[class*="gCwNtyh1ki"]')) {
                    contentContainer = elem;
                    break;
                }
            }
            if (contentContainer) {
                // span.MX91DFZo2F에서 리뷰 내용 추출 (스토어PICK 뱃지 제외)
                var spans = contentContainer.querySelectorAll('span.MX91DFZo2F, span[class*="MX91DFZo2F"]');
                var longestText = '';
                for (var i = 0; i < spans.length; i++) {
                    var span = spans[i];
                    var cls = span.className || '';
                    // rnrf6Xo7x2는 스토어PICK 뱃지, W1IZsaUmnu는 한달사용 뱃지
                    if (cls.indexOf('rnrf6Xo7x2') === -1 && cls.indexOf('W1IZsaUmnu') === -1) {
                        var text = span.textContent.trim();
                        if (text.length > longestText.length && text.length > 10) {
                            longestText = text;
                        }
                    }
                }
                review.content = longestText;
            }
            review.content = review.content || '';
            
            // 이미지 - div.s30AvhHfb0에서 추출 (판매자 영역 제외)
            review.images = [];
            var imgContainers = item.querySelectorAll('div.s30AvhHfb0');
            imgContainers.forEach(function(container) {
                // 판매자 답변 영역(Wsm9me_nCc, gCwNtyh1ki)이 아닌 경우에만
                if (!container.closest('.Wsm9me_nCc, .gCwNtyh1ki, div[class*="Wsm9me_nCc"], div[class*="gCwNtyh1ki"]')) {
                    var imgs = container.querySelectorAll('img.UpImHAUeYJ');
                    imgs.forEach(function(img) {
                        var src = img.getAttribute('data-src') || img.getAttribute('src');
                        if (src && src.indexOf('pstatic.net') > -1 && review.images.indexOf(src) === -1) {
                            // 타입 파라미터 제거하여 원본 이미지 URL 사용
                            src = src.replace(/\\?type=.*$/, '');
                            review.images.push(src);
                        }
                    });
                }
            });
            
            reviews.push(review);
        });
        
        return reviews;
    })();
    '''
    
    try:
        result = page.run_js(js_code)
        if debug:
            print(f"[DEBUG] JS result type: {type(result)}, length: {len(result) if isinstance(result, list) else 'N/A'}")
        if result and isinstance(result, list) and len(result) > 0:
            reviews = result
            if debug:
                print(f"[DEBUG] JS extraction found {len(reviews)} reviews")
                if reviews:
                    print(f"[DEBUG] Sample review: {reviews[0]}")
    except Exception as e:
        if debug:
            print(f"[DEBUG] JS extraction error: {e}")
    
    # 폴백: DrissionPage 선택자 사용
    if not reviews:
        if debug:
            print("[DEBUG] Falling back to DrissionPage selectors")
        
        review_selectors = [
            'li.PxsZltB5tV',
            'li[class*="PxsZltB5tV"]',
            'xpath://li[contains(@class, "PxsZltB5tV")]',
        ]
        
        review_elements = []
        for selector in review_selectors:
            try:
                elements = page.eles(selector, timeout=5)
                if elements:
                    review_elements = elements
                    if debug:
                        print(f"[DEBUG] Found {len(elements)} elements with selector: {selector}")
                    break
            except:
                continue
        
        for elem in review_elements:
            try:
                review = {}
                
                review_id = elem.attr('data-shp-contents-id')
                if not review_id:
                    text_preview = elem.text[:50] if elem.text else ""
                    review_id = f"review_{hash(text_preview) % 100000}"
                review['id'] = review_id
                
                # 판매자 답변 영역 제외하고 사용자 리뷰만 추출
                # 판매자 답변 영역(gCwNtyh1ki) 찾기
                seller_reply_text = ""
                try:
                    seller_reply_elems = elem.eles('xpath:.//div[contains(@class, "gCwNtyh1ki")]')
                    for seller_elem in seller_reply_elems:
                        if seller_elem and seller_elem.text:
                            seller_reply_text += seller_elem.text + "\n"
                except:
                    pass
                
                # 전체 텍스트에서 판매자 답변 제거
                full_text = elem.text or ""
                if seller_reply_text:
                    # 판매자 답변 텍스트 제거
                    for seller_line in seller_reply_text.split('\n'):
                        seller_line = seller_line.strip()
                        if seller_line and len(seller_line) > 10:
                            full_text = full_text.replace(seller_line, '')
                
                # 평점 - 숫자만 추출 (판매자 답변 영역 제외)
                rating = 5
                try:
                    # 판매자 답변 영역이 아닌 곳에서 평점 추출
                    rating_elems = elem.eles('em.n6zq2yy0KA', timeout=0.5)
                    for rating_elem in rating_elems:
                        # 판매자 영역 확인 (parent chain에서 gCwNtyh1ki 클래스 찾기)
                        parent = rating_elem
                        is_seller_reply = False
                        for _ in range(5):  # 5레벨까지 확인
                            try:
                                parent = parent.parent()
                                if parent and 'gCwNtyh1ki' in (parent.attr('class') or ''):
                                    is_seller_reply = True
                                    break
                            except:
                                break
                        if not is_seller_reply and rating_elem.text:
                            rating = int(rating_elem.text.strip())
                            break
                except:
                    # 텍스트에서 평점 패턴 찾기
                    rating_match = re.search(r'평점[^\d]*(\d)', full_text)
                    if rating_match:
                        rating = int(rating_match.group(1))
                review['rating'] = rating
                
                # 작성자 - 판매자 답변 영역 제외
                author = "익명"
                try:
                    author_elems = elem.eles('xpath:.//strong[contains(@class, "MX91DFZo2F") or contains(@class, "K0kwJOXP06")]', timeout=0.3)
                    for author_elem in author_elems:
                        # 판매자 영역 확인
                        parent = author_elem
                        is_seller_reply = False
                        for _ in range(5):
                            try:
                                parent = parent.parent()
                                if parent and 'gCwNtyh1ki' in (parent.attr('class') or ''):
                                    is_seller_reply = True
                                    break
                            except:
                                break
                        if not is_seller_reply and author_elem.text:
                            author = author_elem.text.strip()
                            break
                except:
                    pass
                review['author'] = author
                
                # 날짜 - 정규식으로 추출 (정제된 텍스트에서)
                date = ""
                try:
                    date_match = re.search(r'(\d{2,4}[./]\d{1,2}[./]\d{1,2}\.?)', full_text)
                    if date_match:
                        date = date_match.group(1)
                except:
                    pass
                review['date'] = date
                
                # 옵션 - 상품 옵션 패턴 추출
                option = ""
                try:
                    # 옵션 텍스트 패턴: 상품명: 옵션 / 색상: 색상
                    option_match = re.search(r'(쉴드[^:]*:\s*[^\n]+)', full_text)
                    if option_match:
                        opt_text = option_match.group(1).strip()
                        if len(opt_text) < 200:
                            option = opt_text
                except:
                    pass
                review['option'] = option
                
                # 내용 - 사용자 리뷰만 추출 (판매자 답변 제외)
                content = ""
                try:
                    # 판매자 답변 영역이 아닌 리뷰 내용 영역 찾기
                    content_elems = elem.eles('xpath:.//div[contains(@class, "vhlVUsCtw3") or contains(@class, "KqJ8Qqw082")]', timeout=0.3)
                    for content_elem in content_elems:
                        # 판매자 영역 확인
                        parent = content_elem
                        is_seller_reply = False
                        for _ in range(5):
                            try:
                                parent = parent.parent()
                                if parent and 'gCwNtyh1ki' in (parent.attr('class') or ''):
                                    is_seller_reply = True
                                    break
                            except:
                                break
                        if not is_seller_reply and content_elem.text:
                            # 스토어PICK 제외하고 실제 리뷰 내용만
                            text = content_elem.text.strip()
                            # 판매자 답변 패턴 제외 (안녕하세요 고객님으로 시작하는 텍스트)
                            if not text.startswith('안녕하세요') and not '고객님!' in text[:30]:
                                if len(text) > len(content):
                                    content = text
                except:
                    pass
                
                # 폴백: 전체 텍스트에서 추출 (판매자 답변 제거된 버전)
                if not content:
                    try:
                        lines = full_text.split('\n')
                        for line in lines:
                            line = line.strip()
                            # 날짜, 신고, 스토어PICK, 판매자 답변 등 제외
                            if len(line) > 30:
                                if re.search(r'^\d{2}[./]\d{2}[./]|^신고$|^스토어PICK$|^평점$', line):
                                    continue
                                # 판매자 답변 패턴 제외
                                if '안녕하세요' in line and '고객님' in line:
                                    continue
                                if '쉴드 제품을 구매해 주셔서' in line:
                                    continue
                                if '구매후기 검색시 고객들의' in line:
                                    continue
                                if len(line) > len(content):
                                    content = line
                    except:
                        pass
                review['content'] = content
                
                # 이미지 - 판매자 답변 영역 제외
                images = []
                try:
                    img_elems = elem.eles('xpath:.//img')
                    for img in img_elems:
                        # 판매자 영역 확인
                        parent = img
                        is_seller_reply = False
                        for _ in range(8):  # 이미지는 더 깊이 있을 수 있음
                            try:
                                parent = parent.parent()
                                if parent and 'gCwNtyh1ki' in (parent.attr('class') or ''):
                                    is_seller_reply = True
                                    break
                            except:
                                break
                        if not is_seller_reply:
                            src = img.attr('src') or img.attr('data-src')
                            if src and 'phinf.pstatic.net' in src:
                                images.append(src)
                except:
                    pass
                review['images'] = images
                
                if review.get('content') or review.get('rating'):
                    reviews.append(review)
                    
            except Exception as e:
                continue
    
    return reviews


def click_next_page(page, current_page):
    """다음 페이지 클릭"""
    next_page = current_page + 1
    
    # 방법 1: 페이지네이션에서 다음 페이지 번호 클릭 (실제 네이버 구조)
    try:
        # div.LiT9lKOVbw 내의 a.hyY6CXtbcn 페이지 링크
        page_links = page.eles('div.LiT9lKOVbw a.hyY6CXtbcn')
        for link in page_links:
            if link.text.strip() == str(next_page):
                link.click()
                random_delay(1, 2)
                return True
    except:
        pass
    
    # 방법 2: 다음 버튼 클릭 (I3i1NSoFdB 클래스)
    try:
        next_btn = page.ele('a.I3i1NSoFdB', timeout=2)
        if next_btn and 'aria-hidden="false"' in next_btn.html:
            next_btn.click()
            random_delay(1, 2)
            return True
    except:
        pass
    
    # 방법 3: 텍스트로 찾기
    try:
        next_btn = page.ele('xpath://a[text()="다음"]', timeout=2)
        if next_btn:
            next_btn.click()
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
    
    # 브라우저 옵션 설정 - 자동화 탐지 우회 강화
    options = ChromiumOptions()
    
    # 기본 크롬 사용자 데이터 경로 설정 (기존 프로필 사용으로 탐지 우회)
    options.set_argument('--no-first-run')
    options.set_argument('--no-default-browser-check')
    options.set_argument('--disable-blink-features=AutomationControlled')
    options.set_argument('--disable-infobars')
    options.set_argument('--disable-extensions')
    options.set_argument('--disable-popup-blocking')
    options.set_argument('--disable-save-password-bubble')
    options.set_argument('--window-size=1920,1080')
    options.set_argument('--start-maximized')
    
    # 자동화 플래그 제거
    options.set_pref('credentials_enable_service', False)
    options.set_pref('profile.password_manager_enabled', False)
    
    # 브라우저 실행
    page = ChromiumPage(options)
    
    try:
        # 페이지 접속
        print(f"[DEBUG] Navigating to {url}")
        
        page.get(url)
        print(f"[DEBUG] Page loaded, current URL: {page.url}")
        random_delay(3, 5)
        print(f"[DEBUG] Initial delay completed")
        
        # 리뷰 탭 클릭 (상품 상세 탭에서)
        clicked = False
        
        # 방법 1: URL 해시로 직접 이동 (가장 안전)
        try:
            if '#REVIEW' not in page.url:
                print("[DEBUG] Attempting to navigate to #REVIEW hash...")
                page.run_js("window.location.hash = 'REVIEW'")
                random_delay(2, 3)
                clicked = True
                print(f"[DEBUG] Navigated to #REVIEW hash, current URL: {page.url}")
            else:
                print(f"[DEBUG] Already on REVIEW section: {page.url}")
        except Exception as e:
            print(f"[DEBUG] Failed to navigate to #REVIEW: {e}")
        
        # 방법 2: 탭 메뉴에서 리뷰 탭 클릭 (aria-selected 속성으로 탭 구분)
        if not clicked:
            try:
                # 상품 상세 탭 메뉴 (role="tablist"내의 요소)
                tabs = page.eles('xpath://ul[@role="tablist"]//a[contains(text(), "리뷰")]')
                for tab in tabs:
                    href = tab.attr('href') or ''
                    # 리뷰이벤트가 아닌 상품 리뷰 탭만 클릭
                    if 'review-event' not in href.lower():
                        tab.click()
                        random_delay(2, 3)
                        clicked = True
                        if debug:
                            print("[DEBUG] Review tab clicked via tablist")
                        break
            except:
                pass
        
        # 방법 3: 리뷰 섹션으로 스크롤 (탭 클릭 실패 시)
        if not clicked:
            try:
                page.run_js("document.querySelector('[data-shp-area-id=\"REVIEW\"]')?.scrollIntoView()")
                random_delay(2, 3)
                if debug:
                    print("[DEBUG] Scrolled to REVIEW section")
            except:
                pass
        
        # 리뷰 영역으로 스크롤하고 로딩 대기
        page.scroll.to_half()
        random_delay(1, 2)
        
        # 리뷰 리스트가 로드될 때까지 스크롤 및 대기
        print("[DEBUG] Scrolling to load review list...")
        for scroll_attempt in range(5):
            page.scroll.down(500)
            random_delay(1, 2)
            
            # 리뷰 리스트가 로드되었는지 확인
            try:
                review_list = page.ele('ul.RR2FSL9wTc', timeout=1)
                if review_list:
                    print(f"[DEBUG] ✓ Review list found after {scroll_attempt + 1} scroll attempts")
                    break
            except:
                print(f"[DEBUG] ✗ Review list not found, continuing scroll (attempt {scroll_attempt + 1}/5)")
        
        # 리뷰가 로드될 때까지 추가 대기
        random_delay(3, 5)
        
        # 리뷰 아이템이 실제로 렌더링되었는지 확인
        try:
            review_items = page.eles('ul.RR2FSL9wTc > li.PxsZltB5tV', timeout=5)
            print(f"[DEBUG] ✓ Found {len(review_items)} review items on page")
        except Exception as e:
            print(f"[DEBUG] ✗ Could not find review items: {e}")
            print(f"[DEBUG] Current page title: {page.title}")
        
        # 디버그: HTML 저장
        if debug:
            with open('debug_drission_page.html', 'w', encoding='utf-8') as f:
                f.write(page.html)
            print("[DEBUG] HTML saved to debug_drission_page.html")
        
        # 페이지별 크롤링
        current_page = 1
        
        while current_page <= max_pages:
            # 현재 페이지 리뷰 추출
            page_reviews = extract_reviews_from_page(page, debug)
            
            # 중복 제거
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
            
            # 다음 페이지
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
    
    finally:
        page.quit()
    
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
    
    # 결과 출력 (UTF-8 인코딩)
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
