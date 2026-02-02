import sys
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time

# Remote debugging 포트에 연결
options = Options()
options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")

try:
    driver = webdriver.Chrome(options=options)
    
    url = "https://smartstore.naver.com/kproject/products/7024065775"
    
    # 새 탭 열기
    driver.execute_script("window.open('');")
    driver.switch_to.window(driver.window_handles[-1])
    
    driver.get(url)
    print(f"페이지 로드 완료: {driver.title}")
    
    time.sleep(5)
    
    # 모든 텍스트 요소 검색
    print("\n=== '상품Q&A' 또는 'Q&A' 텍스트 검색 ===")
    elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'Q') or contains(text(), '상품') or contains(text(), '문의')]")
    
    for i, elem in enumerate(elements[:30]):
        try:
            text = elem.text.strip()
            if text and len(text) < 50:
                tag = elem.tag_name
                classes = elem.get_attribute('class')
                print(f"{i+1}. [{tag}] '{text}' - class: {classes}")
        except:
            pass
    
    # 모든 a, button 태그 검색
    print("\n=== 모든 링크와 버튼 ===")
    links_and_buttons = driver.find_elements(By.XPATH, "//a | //button")
    
    for elem in links_and_buttons[:50]:
        try:
            text = elem.text.strip()
            if text:
                tag = elem.tag_name
                print(f"[{tag}] {text}")
        except:
            pass
    
    # 페이지 소스 일부 저장
    with open('debug_remote_page.html', 'w', encoding='utf-8') as f:
        f.write(driver.page_source)
    
    print("\n✅ 페이지 소스가 debug_remote_page.html에 저장되었습니다")
    print("📌 이 창은 그대로 두고 HTML 파일을 확인하세요")
    
    input("\nEnter를 누르면 탭이 닫힙니다...")
    
    driver.close()
    driver.switch_to.window(driver.window_handles[0])
    
except Exception as e:
    print(f"오류: {e}")
    import traceback
    traceback.print_exc()
