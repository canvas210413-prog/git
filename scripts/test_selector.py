#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""DrissionPage 선택자 테스트"""

from DrissionPage import ChromiumPage, ChromiumOptions
import time

url = "https://smartstore.naver.com/kproject/products/7024065775"

options = ChromiumOptions()
options.set_argument('--disable-blink-features=AutomationControlled')
options.set_argument('--window-size=1920,1080')

page = ChromiumPage(options)

try:
    print(f"1. 페이지 접속: {url}")
    page.get(url)
    time.sleep(3)
    
    print("2. #REVIEW 해시로 이동")
    page.run_js("window.location.hash = 'REVIEW'")
    time.sleep(3)
    
    print("3. 스크롤")
    page.scroll.to_half()
    time.sleep(2)
    
    print("\n=== 선택자 테스트 ===")
    
    # 다양한 선택자 테스트
    selectors = [
        'li.PxsZltB5tV',
        'li[class*="PxsZltB5tV"]',
        '.PxsZltB5tV',
        'xpath://li[contains(@class, "PxsZltB5tV")]',
        'css:li.PxsZltB5tV',
    ]
    
    for sel in selectors:
        try:
            elements = page.eles(sel, timeout=3)
            print(f"  {sel}: {len(elements)} 개")
        except Exception as e:
            print(f"  {sel}: 에러 - {e}")
    
    # 리뷰 섹션이 있는지 확인
    print("\n=== 리뷰 섹션 확인 ===")
    try:
        review_section = page.ele('xpath://*[contains(@data-shp-area-id, "REVIEW") or contains(@id, "REVIEW")]', timeout=3)
        if review_section:
            print(f"  리뷰 섹션 발견: {review_section.tag}")
    except:
        print("  리뷰 섹션 없음")
    
    # 전체 HTML에서 클래스 확인
    print("\n=== HTML 직접 확인 ===")
    html = page.html
    import re
    matches = re.findall(r'<li class="PxsZltB5tV[^"]*"', html)
    print(f"  li.PxsZltB5tV 태그: {len(matches)} 개")
    
    # data-shp-contents-id 속성 확인
    ids = re.findall(r'data-shp-contents-id="(\d+)"', html)
    print(f"  data-shp-contents-id: {len(ids)} 개")
    if ids:
        print(f"  샘플 ID: {ids[:3]}")

finally:
    input("엔터키를 누르면 브라우저가 닫힙니다...")
    page.quit()
