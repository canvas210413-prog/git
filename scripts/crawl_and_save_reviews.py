#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
네이버 스마트스토어 리뷰를 크롤링하고 데이터베이스에 저장하는 통합 스크립트
중복 방지 기능 포함

사용법:
    python crawl_and_save_reviews.py <상품URL> [--pages N] [--debug]
    
예시:
    python crawl_and_save_reviews.py "https://smartstore.naver.com/..." --pages 3
    python crawl_and_save_reviews.py "https://smartstore.naver.com/..." --pages 56  # 전체 크롤링
"""

import subprocess
import json
import sys
import os

# 스크립트 경로
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CRAWLER_SCRIPT = os.path.join(SCRIPT_DIR, 'naver_review_crawler.py')
SAVE_SCRIPT = os.path.join(SCRIPT_DIR, 'save_reviews_to_db.py')

def crawl_reviews(url, max_pages=3, debug=False):
    """리뷰 크롤링 실행"""
    
    # 크롤러 스크립트의 max_pages를 임시로 변경
    with open(CRAWLER_SCRIPT, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 현재 max_pages 값 찾기 및 변경
    import re
    original_content = content
    content = re.sub(
        r'max_pages = \d+  # 최대 페이지 수 제한',
        f'max_pages = {max_pages}  # 최대 페이지 수 제한',
        content
    )
    
    with open(CRAWLER_SCRIPT, 'w', encoding='utf-8') as f:
        f.write(content)
    
    try:
        # 크롤러 실행
        cmd = [sys.executable, CRAWLER_SCRIPT, url]
        if debug:
            cmd.append('--debug')
        
        print(f"크롤링 시작 (최대 {max_pages} 페이지)...")
        result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
        
        if result.returncode != 0:
            print(f"크롤러 오류: {result.stderr}")
            return None
        
        # JSON 결과 파싱
        try:
            data = json.loads(result.stdout)
            return data
        except json.JSONDecodeError as e:
            # 여러 줄의 출력에서 마지막 JSON 찾기
            lines = result.stdout.strip().split('\n')
            for line in reversed(lines):
                try:
                    data = json.loads(line)
                    return data
                except:
                    continue
            print(f"JSON 파싱 오류: {e}")
            print(f"출력: {result.stdout[:500]}...")
            return None
    
    finally:
        # 원본 스크립트 복원
        with open(CRAWLER_SCRIPT, 'w', encoding='utf-8') as f:
            f.write(original_content)

def save_to_database(reviews_data, product_url):
    """리뷰를 데이터베이스에 저장"""
    
    if not reviews_data or not reviews_data.get('success'):
        print("저장할 리뷰 데이터가 없습니다.")
        return None
    
    reviews = reviews_data.get('reviews', [])
    if not reviews:
        print("리뷰가 없습니다.")
        return None
    
    # 저장 스크립트에 데이터 전달
    input_data = {
        'reviews': reviews,
        'product_url': product_url
    }
    
    print(f"\n데이터베이스에 {len(reviews)}개 리뷰 저장 중...")
    
    result = subprocess.run(
        [sys.executable, SAVE_SCRIPT],
        input=json.dumps(input_data, ensure_ascii=False),
        capture_output=True,
        text=True,
        encoding='utf-8'
    )
    
    if result.returncode != 0:
        print(f"저장 오류: {result.stderr}")
        return None
    
    try:
        save_result = json.loads(result.stdout)
        return save_result
    except:
        print(f"저장 결과 파싱 오류: {result.stdout}")
        return None

def main():
    """메인 함수"""
    
    if len(sys.argv) < 2:
        print("사용법: python crawl_and_save_reviews.py <상품URL> [--pages N] [--debug]")
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
    
    print(f"=" * 60)
    print(f"네이버 스마트스토어 리뷰 크롤링 및 저장")
    print(f"=" * 60)
    print(f"URL: {url}")
    print(f"최대 페이지: {max_pages}")
    print(f"디버그 모드: {debug}")
    print(f"=" * 60)
    
    # 1. 크롤링
    crawl_result = crawl_reviews(url, max_pages, debug)
    
    if not crawl_result:
        print("\n크롤링 실패!")
        sys.exit(1)
    
    if not crawl_result.get('success'):
        print(f"\n크롤링 오류: {crawl_result.get('error')}")
        sys.exit(1)
    
    reviews_count = crawl_result.get('count', 0)
    pages_crawled = crawl_result.get('pages_crawled', 0)
    
    print(f"\n크롤링 완료: {reviews_count}개 리뷰 ({pages_crawled} 페이지)")
    
    # 2. 데이터베이스 저장
    save_result = save_to_database(crawl_result, url)
    
    if save_result:
        print(f"\n저장 완료!")
        print(f"  - 새로 저장: {save_result.get('inserted', 0)}개")
        print(f"  - 중복 스킵: {save_result.get('skipped', 0)}개")
        print(f"  - 총 처리: {save_result.get('total', 0)}개")
    else:
        print("\n저장 실패!")
        sys.exit(1)
    
    print(f"\n" + "=" * 60)
    print("작업 완료!")
    print(f"=" * 60)

if __name__ == "__main__":
    main()
