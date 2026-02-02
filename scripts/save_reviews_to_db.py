#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
네이버 스마트스토어 리뷰를 SQLite 데이터베이스에 저장하는 스크립트
중복 방지 기능 포함 (naverReviewId 기준)
"""

import sqlite3
import json
import sys
import os
from datetime import datetime
import uuid

# 데이터베이스 경로
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'prisma', 'prisma', 'dev.db')

def generate_cuid():
    """Prisma cuid 형식과 유사한 ID 생성"""
    return 'c' + uuid.uuid4().hex[:24]

def parse_date(date_str):
    """날짜 문자열을 ISO 형식으로 변환"""
    if not date_str:
        return datetime.now().isoformat()
    
    # "24.12.15." 형식 처리
    try:
        parts = date_str.strip('.').split('.')
        if len(parts) >= 3:
            year = int(parts[0])
            if year < 100:
                year += 2000
            month = int(parts[1])
            day = int(parts[2])
            return datetime(year, month, day).isoformat()
    except:
        pass
    
    return datetime.now().isoformat()

def get_existing_review_ids(conn):
    """데이터베이스에서 기존 naverReviewId 목록 조회"""
    cursor = conn.cursor()
    cursor.execute("SELECT naverReviewId FROM Review WHERE naverReviewId IS NOT NULL")
    return set(row[0] for row in cursor.fetchall())

def save_reviews_to_db(reviews, product_url=None):
    """리뷰를 데이터베이스에 저장 (중복 방지)"""
    
    # 데이터베이스 연결
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 기존 리뷰 ID 조회
    existing_ids = get_existing_review_ids(conn)
    print(f"기존 리뷰 수: {len(existing_ids)}")
    
    inserted_count = 0
    skipped_count = 0
    
    for review in reviews:
        naver_review_id = review.get('id')
        
        # 중복 체크
        if naver_review_id and naver_review_id in existing_ids:
            skipped_count += 1
            continue
        
        # 리뷰 데이터 준비
        review_id = generate_cuid()
        source = "Naver SmartStore"
        author = review.get('author', '익명')
        content = review.get('content', '')
        rating = review.get('rating', 5)
        date = parse_date(review.get('date'))
        option = review.get('option')
        images = json.dumps(review.get('images', []), ensure_ascii=False) if review.get('images') else None
        now = datetime.now().isoformat()
        
        try:
            cursor.execute("""
                INSERT INTO Review (
                    id, source, author, content, rating, date, 
                    sentiment, topics, naverReviewId, option, images, productUrl,
                    createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                review_id, source, author, content, rating, date,
                None, None, naver_review_id, option, images, product_url,
                now, now
            ))
            inserted_count += 1
            existing_ids.add(naver_review_id)  # 중복 방지를 위해 추가
        except sqlite3.IntegrityError as e:
            # UNIQUE 제약 조건 위반 (이미 존재하는 리뷰)
            skipped_count += 1
            print(f"중복 리뷰 스킵: {naver_review_id}")
        except Exception as e:
            print(f"리뷰 저장 오류: {e}")
    
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "inserted": inserted_count,
        "skipped": skipped_count,
        "total": len(reviews)
    }

def main():
    """메인 함수"""
    
    # JSON 데이터를 stdin에서 읽거나 파일에서 읽기
    if len(sys.argv) > 1:
        # 파일 경로가 제공된 경우
        json_file = sys.argv[1]
        product_url = sys.argv[2] if len(sys.argv) > 2 else None
        
        try:
            # 여러 인코딩 시도
            encodings = ['utf-8-sig', 'utf-8', 'utf-16', 'utf-16-le', 'utf-16-be']
            data = None
            
            for encoding in encodings:
                try:
                    with open(json_file, 'r', encoding=encoding) as f:
                        data = json.load(f)
                    break
                except:
                    continue
            
            if data is None:
                raise Exception("지원되는 인코딩을 찾을 수 없습니다")
        except Exception as e:
            print(json.dumps({"success": False, "error": f"JSON 파일 읽기 오류: {e}"}))
            sys.exit(1)
    else:
        # stdin에서 JSON 읽기
        try:
            input_data = sys.stdin.read()
            data = json.loads(input_data)
            product_url = None
        except Exception as e:
            print(json.dumps({"success": False, "error": f"JSON 파싱 오류: {e}"}))
            sys.exit(1)
    
    # 리뷰 데이터 추출
    if isinstance(data, dict) and 'reviews' in data:
        reviews = data['reviews']
        product_url = data.get('product_url', product_url)
    elif isinstance(data, list):
        reviews = data
    else:
        print(json.dumps({"success": False, "error": "유효하지 않은 데이터 형식"}))
        sys.exit(1)
    
    # 데이터베이스에 저장
    result = save_reviews_to_db(reviews, product_url)
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
