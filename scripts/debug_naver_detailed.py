import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
import time

url = "https://smartstore.naver.com/kproject/products/7024065775"

options = webdriver.ChromeOptions()
options.add_argument('--disable-blink-features=AutomationControlled')
options.add_experimental_option("excludeSwitches", ["enable-automation"])
options.add_experimental_option('useAutomationExtension', False)
options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36')

try:
    driver = webdriver.Chrome(options=options)
    driver.get(url)
    
    print("페이지 로드 후 5초 대기...")
    time.sleep(5)
    
    # 페이지 타이틀 확인
    print(f"\n페이지 타이틀: {driver.title}")
    
    # 페이지 URL 확인
    print(f"현재 URL: {driver.current_url}")
    
    # 'Q&A' 텍스트가 포함된 모든 요소 찾기
    elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'Q') or contains(text(), 'A') or contains(text(), '질문')]")
    
    print(f"\n'Q' 또는 'A' 또는 '질문'이 포함된 요소 ({len(elements)}개):")
    for i, elem in enumerate(elements[:20]):
        try:
            text = elem.text.strip()
            tag = elem.tag_name
            classes = elem.get_attribute('class')
            print(f"{i+1}. Tag: {tag}, Text: '{text[:50]}', Class: {classes}")
        except:
            pass
    
    # 모든 탭 요소 찾기
    print("\n\n탭처럼 보이는 요소들:")
    tab_elements = driver.find_elements(By.XPATH, "//a[@role='tab'] | //button[@role='tab'] | //div[@role='tab'] | //li[@role='tab']")
    for i, elem in enumerate(tab_elements):
        try:
            text = elem.text.strip()
            print(f"{i+1}. {text}")
        except:
            pass
    
    # 스크린샷 저장
    driver.save_screenshot('debug_screenshot.png')
    print("\n\n스크린샷이 debug_screenshot.png에 저장되었습니다.")
    
    # HTML 소스 일부 저장
    with open('debug_page.html', 'w', encoding='utf-8') as f:
        f.write(driver.page_source)
    print("페이지 소스가 debug_page.html에 저장되었습니다.")
    
    input("\n페이지를 확인하려면 Enter를 누르세요...")
    
    driver.quit()
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
