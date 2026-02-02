#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
네이버 스마트스토어 리뷰 크롤러 (API 직접 호출 버전)
브라우저 없이 API를 직접 호출하여 리뷰를 수집합니다.

사용법:
    python naver_review_api_crawler.py <상품URL 또는 상품ID> [--pages N] [--debug]
"""

import json
import sys
import time
import re
import random
import requests
from urllib.parse import urlparse, parse_qs


def extract_product_info(url_or_id):
    """URL 또는 상품ID에서 merchant_no와 origin_product_no 추출"""
    
    if url_or_id.isdigit():
        # 상품 ID만 제공된 경우
        return None, url_or_id
    
    # URL 파싱
    parsed = urlparse(url_or_id)
    path_parts = parsed.path.strip('/').split('/')
    
    # smartstore.naver.com/storename/products/12345678 형식
    if 'products' in path_parts:
        idx = path_parts.index('products')
        if idx + 1 < len(path_parts):
            product_id = path_parts[idx + 1]
            store_name = path_parts[0] if idx > 0 else None
            return store_name, product_id
    
    return None, None


def get_merchant_no(store_name):
    """스토어 이름으로 merchant_no 조회"""
    try:
        # 스토어 정보 API
        url = f"https://smartstore.naver.com/{store_name}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        }
        response = requests.get(url, headers=headers, timeout=10)
        
        # HTML에서 merchant_no 추출
        match = re.search(r'"merchantNo"\s*:\s*"?(\d+)"?', response.text)
        if match:
            return match.group(1)
        
        # 다른 패턴 시도
        match = re.search(r'window\.__PRELOADED_STATE__\s*=\s*({.*?});', response.text, re.DOTALL)
        if match:
            try:
                state = json.loads(match.group(1))
                return state.get('channel', {}).get('merchantNo')
            except:
                pass
                
    except Exception as e:
        print(f"[DEBUG] Error getting merchant_no: {e}", file=sys.stderr)
    
    return None


def fetch_reviews_from_api(product_id, merchant_no=None, page=1, page_size=20):
    """네이버 리뷰 API 호출"""
    
    # API URL (여러 가지 시도)
    api_urls = [
        f"https://smartstore.naver.com/i/v1/reviews/paged-reviews?page={page}&pageSize={page_size}&merchantNo={merchant_no}&originProductNo={product_id}&sortType=REVIEW_RANKING",
        f"https://smartstore.naver.com/i/v1/contents/reviews/product-reviews?page={page}&pageSize={page_size}&merchantNo={merchant_no}&originProductNo={product_id}",
        f"https://shopping.naver.com/v1/reviews/{product_id}?page={page}&pageSize={page_size}",
    ]
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': f'https://smartstore.naver.com/',
        'Origin': 'https://smartstore.naver.com',
    }
    
    for api_url in api_urls:
        try:
            response = requests.get(api_url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data
        except Exception as e:
            continue
    
    return None


def crawl_reviews_api(url, max_pages=3, debug=False):
    """API를 통한 리뷰 크롤링"""
    
    store_name, product_id = extract_product_info(url)
    
    if not product_id:
        return {"success": False, "error": "상품 ID를 추출할 수 없습니다."}
    
    if debug:
        print(f"[DEBUG] Store: {store_name}, Product ID: {product_id}")
    
    # merchant_no 조회
    merchant_no = None
    if store_name:
        merchant_no = get_merchant_no(store_name)
        if debug:
            print(f"[DEBUG] Merchant No: {merchant_no}")
    
    all_reviews = []
    collected_ids = set()
    
    for page in range(1, max_pages + 1):
        if debug:
            print(f"[DEBUG] Fetching page {page}...")
        
        data = fetch_reviews_from_api(product_id, merchant_no, page)
        
        if not data:
            if debug:
                print(f"[DEBUG] No data from API for page {page}")
            break
        
        # 리뷰 데이터 추출 (API 응답 구조에 따라 조정)
        reviews = data.get('reviews', data.get('contents', data.get('data', [])))
        
        if not reviews:
            if debug:
                print(f"[DEBUG] No reviews in response")
            break
        
        new_count = 0
        for review in reviews:
            review_id = str(review.get('id', review.get('reviewId', review.get('reviewNo', ''))))
            
            if review_id and review_id not in collected_ids:
                collected_ids.add(review_id)
                
                parsed_review = {
                    'id': review_id,
                    'rating': review.get('score', review.get('rating', review.get('starScore', 5))),
                    'author': review.get('writerNickname', review.get('buyerNickname', review.get('writer', '익명'))),
                    'date': review.get('createDate', review.get('writtenDate', review.get('registerDate', ''))),
                    'content': review.get('reviewContent', review.get('content', review.get('body', ''))),
                    'option': review.get('productOptionContent', review.get('optionValue', '')),
                    'images': review.get('reviewImages', review.get('images', [])),
                }
                
                all_reviews.append(parsed_review)
                new_count += 1
        
        if debug:
            print(f"[DEBUG] Page {page}: {new_count} new reviews (Total: {len(all_reviews)})")
        
        # 새 리뷰가 없으면 종료
        if new_count == 0:
            break
        
        # 딜레이
        time.sleep(random.uniform(0.5, 1.5))
    
    return {
        'success': True,
        'reviews': all_reviews,
        'count': len(all_reviews),
        'pages_crawled': min(page, max_pages)
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
    result = crawl_reviews_api(url, max_pages, debug)
    
    # 결과 출력
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
