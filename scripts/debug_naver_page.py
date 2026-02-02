import sys
import json
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
import time

url = "https://smartstore.naver.com/kproject/products/7024065775"

options = webdriver.ChromeOptions()
options.add_argument('--headless=new')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_experimental_option('excludeSwitches', ['enable-logging'])

try:
    driver = webdriver.Chrome(options=options)
    driver.get(url)
    time.sleep(3)
    
    # 페이지 소스 저장
    with open('debug_page_source.html', 'w', encoding='utf-8') as f:
        f.write(driver.page_source)
    
    # 모든 a, button, span 태그 검색
    elements = driver.find_elements(By.XPATH, "//a | //button | //span | //div[@role='tab']")
    
    print("=== 페이지의 모든 탭/버튼 요소 ===")
    for elem in elements[:50]:  # 처음 50개만
        try:
            text = elem.text.strip()
            if text and len(text) < 50:
                print(f"Tag: {elem.tag_name}, Text: {text}, Class: {elem.get_attribute('class')}")
        except:
            pass
    
    driver.quit()
    print("\nHTML 소스가 debug_page_source.html에 저장되었습니다.")
except Exception as e:
    print(f"Error: {e}")
