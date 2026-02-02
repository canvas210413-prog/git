import sys
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time

options = Options()
options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")

try:
    driver = webdriver.Chrome(options=options)
    
    url = "https://smartstore.naver.com/kproject/products/7024065775"
    
    driver.execute_script("window.open('');")
    driver.switch_to.window(driver.window_handles[-1])
    
    driver.get(url)
    print("페이지 로드 중...")
    time.sleep(5)
    
    # Q&A 탭 클릭 시도
    print("\nQ&A 탭 찾기...")
    qa_clicked = False
    qa_selectors = [
        "//a[contains(text(), 'Q&A')]",
        "//button[contains(text(), 'Q&A')]",
        "//span[contains(text(), 'Q&A')]",
    ]
    
    for selector in qa_selectors:
        try:
            elements = driver.find_elements(By.XPATH, selector)
            if elements:
                print(f"찾은 요소: {len(elements)}개")
                for elem in elements:
                    print(f"  - 텍스트: '{elem.text}'")
                driver.execute_script("arguments[0].click();", elements[0])
                qa_clicked = True
                print(f"✓ 클릭 성공: {selector}")
                break
        except Exception as e:
            print(f"✗ 실패: {selector} - {e}")
    
    if not qa_clicked:
        print("Q&A 탭을 찾을 수 없음 - 페이지 HTML 저장")
    
    time.sleep(4)
    
    # 페이지 스크롤
    driver.execute_script("window.scrollTo(0, 1000);")
    time.sleep(2)
    
    # 페이지 소스 저장
    with open('page_after_qna_click.html', 'w', encoding='utf-8') as f:
        f.write(driver.page_source)
    
    print("\n✅ 페이지가 page_after_qna_click.html에 저장됨")
    
    # Q&A 요소 검색
    print("\nQ&A 관련 요소 검색...")
    all_lis = driver.find_elements(By.TAG_NAME, "li")
    print(f"전체 li 요소: {len(all_lis)}개")
    
    qna_keywords = ['문의', 'Q&A', '질문', 'inquiry', 'question']
    for li in all_lis[:50]:
        text = li.text.strip()
        if text and any(keyword in text for keyword in qna_keywords):
            print(f"  - {text[:100]}")
    
    driver.close()
    driver.switch_to.window(driver.window_handles[0])
    
except Exception as e:
    print(f"오류: {e}")
    import traceback
    traceback.print_exc()
