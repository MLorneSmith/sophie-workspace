#!/usr/bin/env python3
"""Sign up for Genspark.ai, solve CAPTCHA, complete email verification.
Usage: xvfb-run python3 scripts/genspark-signup.py <captcha_text>
"""
import sys
import time
import json
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By

CAPTCHA_TEXT = sys.argv[1] if len(sys.argv) > 1 else None
EMAIL = 'sophie@slideheroes.com'
PASSWORD = '--RYj6IeOEYDrf576tdzXw!A1'

options = uc.ChromeOptions()
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--window-size=1920,1080')

driver = uc.Chrome(options=options)

try:
    # Navigate to signup
    print("1. Loading Genspark...")
    driver.get("https://www.genspark.ai/pricing")
    time.sleep(8)
    
    print("2. Clicking Login with email...")
    driver.find_element(By.XPATH, "//button[contains(text(),'Login with email')]").click()
    time.sleep(2)
    
    print("3. Clicking Sign up...")
    driver.find_element(By.XPATH, "//a[contains(text(),'Sign up now')]").click()
    time.sleep(3)
    
    # Fill email
    print(f"4. Filling email: {EMAIL}")
    driver.find_element(By.CSS_SELECTOR, 'input[placeholder="Email Address"]').send_keys(EMAIL)
    
    if not CAPTCHA_TEXT:
        # Save captcha for reading
        imgs = driver.find_elements(By.TAG_NAME, 'img')
        for img in imgs:
            if img.size.get('width', 0) == 200 and img.size.get('height', 0) == 100:
                img.screenshot('/tmp/gs-captcha-read.png')
                print("CAPTCHA saved to /tmp/gs-captcha-read.png")
                print("Re-run with: xvfb-run python3 scripts/genspark-signup.py <CAPTCHA_TEXT>")
                break
        driver.save_screenshot('/tmp/gs-signup-waiting.png')
        driver.quit()
        sys.exit(0)
    
    # Fill captcha
    print(f"5. Filling CAPTCHA: {CAPTCHA_TEXT}")
    captcha_input = driver.find_element(By.CSS_SELECTOR, 'input[placeholder="Enter the characters you see"]')
    captcha_input.clear()
    captcha_input.send_keys(CAPTCHA_TEXT)
    
    # Click "Send verification code"
    print("6. Sending verification code...")
    send_btn = driver.find_element(By.XPATH, "//button[contains(text(),'Send verification code')]")
    send_btn.click()
    time.sleep(5)
    
    driver.save_screenshot('/tmp/gs-after-verify-send.png')
    body = driver.find_element(By.TAG_NAME, 'body')
    print(f"Page text after send: {body.text[:500]}")
    
    # Check for verification code input
    verify_input = None
    try:
        verify_input = driver.find_element(By.CSS_SELECTOR, 'input[placeholder="Verification Code"]')
        print("7. Verification code input found! Check sophie@slideheroes.com for the code.")
        print("Waiting 60s for you to provide the code...")
        
        # Wait for code file
        import os
        code_file = '/tmp/gs-verify-code.txt'
        for i in range(60):
            if os.path.exists(code_file):
                code = open(code_file).read().strip()
                print(f"8. Entering verification code: {code}")
                verify_input.clear()
                verify_input.send_keys(code)
                
                # Click verify
                verify_btn = driver.find_element(By.XPATH, "//button[contains(text(),'Verify')]")
                verify_btn.click()
                time.sleep(3)
                break
            time.sleep(1)
        
        # Fill password
        print("9. Filling password...")
        driver.find_element(By.CSS_SELECTOR, 'input[placeholder="New Password"]').send_keys(PASSWORD)
        driver.find_element(By.CSS_SELECTOR, 'input[placeholder="Confirm New Password"]').send_keys(PASSWORD)
        
        # Click Create
        print("10. Clicking Create...")
        create_btn = driver.find_element(By.XPATH, "//button[contains(text(),'Create')]")
        create_btn.click()
        time.sleep(10)
        
        driver.save_screenshot('/tmp/gs-signup-result.png')
        print(f"Final URL: {driver.current_url}")
        print(f"Final Title: {driver.title}")
        
    except Exception as e:
        print(f"Error during verification: {e}")
        driver.save_screenshot('/tmp/gs-verify-error.png')

finally:
    driver.quit()
    print("\nCredentials:")
    print(f"  Email: {EMAIL}")
    print(f"  Password: {PASSWORD}")
