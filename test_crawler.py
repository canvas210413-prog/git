"""
Quick test script for the Naver crawler
"""
import sys
import os

# Add scripts directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scripts'))

from naver_crawler import crawl_naver_qna

# Test URL
test_url = "https://smartstore.naver.com/kproject/products/7024065775"

print(f"Testing crawler with URL: {test_url}")
print("=" * 60)

try:
    results = crawl_naver_qna(test_url)
    print(f"\n✅ Successfully crawled {len(results)} Q&A items\n")
    
    for i, item in enumerate(results[:3], 1):  # Show first 3 items
        print(f"Item {i}:")
        print(f"  Status: {item['status']}")
        print(f"  Title: {item['title']}")
        print(f"  Author: {item['author']}")
        print(f"  Date: {item['date']}")
        print(f"  Has Answer: {'Yes' if item['answer'] else 'No'}")
        print()
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
