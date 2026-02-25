#!/usr/bin/env python3
"""Full Genspark signup: fill CAPTCHA, send verification, read email, complete."""
import sys, time, subprocess, json
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By

CAPTCHA = sys.argv[1]
EMAIL = 'sophie@slideheroes.com'
PASSWORD = '--RYj6IeOEYDrf576tdzXw!A1'

options = uc.ChromeOptions()
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--window-size=1920,1080')

driver = uc.Chrome(options=options)

try:
    print("1. Loading Genspark...")
    driver.get("https://www.genspark.ai/pricing")
    time.sleep(8)
    
    print("2. Navigating to signup...")
    driver.find_element(By.XPATH, "//button[contains(text(),'Login with email')]").click()
    time.sleep(2)
    driver.find_element(By.XPATH, "//a[contains(text(),'Sign up now')]").click()
    time.sleep(3)
    
    print(f"3. Filling email: {EMAIL}")
    driver.find_element(By.CSS_SELECTOR, 'input[placeholder="Email Address"]').send_keys(EMAIL)
    
    print(f"4. Filling CAPTCHA: {CAPTCHA}")
    driver.find_element(By.CSS_SELECTOR, 'input[placeholder="Enter the characters you see"]').send_keys(CAPTCHA)
    
    print("5. Clicking Send verification code...")
    driver.find_element(By.XPATH, "//button[contains(text(),'Send verification code')]").click()
    time.sleep(8)
    
    driver.save_screenshot('/tmp/gs-after-send.png')
    body_text = driver.find_element(By.TAG_NAME, 'body').text
    print(f"Page after send: {body_text[:300]}")
    
    # Check if there's an error
    if 'incorrect' in body_text.lower() or 'invalid' in body_text.lower() or 'try again' in body_text.lower():
        print("ERROR: CAPTCHA or email issue. Check /tmp/gs-after-send.png")
        driver.quit()
        sys.exit(1)
    
    # Wait for email to arrive, then check it
    print("6. Waiting 15s for email to arrive...")
    time.sleep(15)
    
    print("7. Checking Sophie's email for verification code...")
    result = subprocess.run(
        ['bash', '-c', 'source ~/.clawdbot/.env && gog gmail list --unread --query "from:genspark OR from:mainfunc OR from:microsoft OR subject:verification" --limit 5'],
        capture_output=True, text=True, timeout=30
    )
    print(f"Email search: {result.stdout[:500]}")
    
    # Try to get the most recent email with verification code
    result2 = subprocess.run(
        ['bash', '-c', 'source ~/.clawdbot/.env && gog gmail list --unread --limit 3'],
        capture_output=True, text=True, timeout=30
    )
    print(f"Recent emails: {result2.stdout[:500]}")
    
    # Read the verification email
    result3 = subprocess.run(
        ['bash', '-c', 'source ~/.clawdbot/.env && gog gmail list --unread --query "verification code" --limit 1 --body'],
        capture_output=True, text=True, timeout=30
    )
    print(f"Verification email body: {result3.stdout[:1000]}")
    
    # Try to extract the code (usually 4-6 digits)
    import re
    all_output = result.stdout + result2.stdout + result3.stdout
    codes = re.findall(r'\b(\d{4,6})\b', all_output)
    if codes:
        code = codes[0]
        print(f"8. Found verification code: {code}")
        
        verify_input = driver.find_element(By.CSS_SELECTOR, 'input[placeholder="Verification Code"]')
        verify_input.clear()
        verify_input.send_keys(code)
        
        # Click verify button
        try:
            verify_btn = driver.find_element(By.XPATH, "//button[contains(text(),'Verify')]")
            verify_btn.click()
        except:
            verify_btn = driver.find_element(By.XPATH, "//button[contains(text(),'verify')]")
            verify_btn.click()
        time.sleep(5)
        
        print("9. Filling password...")
        pw_fields = driver.find_elements(By.CSS_SELECTOR, 'input[type="password"]')
        for f in pw_fields:
            placeholder = f.get_attribute('placeholder') or ''
            if 'new' in placeholder.lower() or 'password' in placeholder.lower():
                f.clear()
                f.send_keys(PASSWORD)
        
        # Also try by placeholder
        try:
            driver.find_element(By.CSS_SELECTOR, 'input[placeholder="New Password"]').send_keys(PASSWORD)
        except:
            pass
        try:
            driver.find_element(By.CSS_SELECTOR, 'input[placeholder="Confirm New Password"]').send_keys(PASSWORD)
        except:
            pass
        
        print("10. Clicking Create...")
        try:
            driver.find_element(By.XPATH, "//button[contains(text(),'Create')]").click()
        except:
            driver.find_element(By.ID, 'continue').click()
        time.sleep(10)
        
        driver.save_screenshot('/tmp/gs-signup-complete.png')
        print(f"Final URL: {driver.current_url}")
        print(f"Final Title: {driver.title}")
    else:
        print("Could not find verification code in emails. Check manually.")
        print(f"All output searched: {all_output[:500]}")

finally:
    driver.quit()
    print(f"\nCredentials: {EMAIL} / {PASSWORD}")
