#!/usr/bin/env python3
"""Genspark signup - pauses for CAPTCHA read by external vision."""
import time, subprocess, re, os, sys
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

EMAIL = 'sophie@slideheroes.com'
PASSWORD = '--RYj6IeOEYDrf576tdzXw!A1'
CAPTCHA_FILE = '/tmp/gs-captcha-text.txt'
CODE_FILE = '/tmp/gs-verify-code.txt'

def wait_for_file(path, timeout=120):
    """Wait for file to appear, return its contents."""
    for i in range(timeout):
        if os.path.exists(path):
            time.sleep(0.5)
            content = open(path).read().strip()
            os.remove(path)
            return content
        time.sleep(1)
    return None

def get_latest_code():
    r = subprocess.run(['bash', '-c',
        'gog gmail thread 19c871f7363b64f3 --account sophie@slideheroes.com 2>/dev/null'],
        capture_output=True, text=True, timeout=15)
    codes = re.findall(r'Your code is: (\d+)', r.stdout)
    return codes[-1] if codes else None

options = uc.ChromeOptions()
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--window-size=1920,1080')

driver = uc.Chrome(options=options)

try:
    print("1. Loading...")
    driver.get("https://www.genspark.ai/pricing")
    time.sleep(8)

    print("2. Navigate to signup...")
    driver.find_element(By.XPATH, "//button[contains(text(),'Login with email')]").click()
    time.sleep(2)
    driver.find_element(By.XPATH, "//a[contains(text(),'Sign up now')]").click()
    time.sleep(3)

    print("3. Fill email...")
    driver.find_element(By.CSS_SELECTOR, 'input[placeholder="Email Address"]').send_keys(EMAIL)

    print("4. Capture CAPTCHA...")
    imgs = driver.find_elements(By.TAG_NAME, 'img')
    for i in imgs:
        w, h = i.size.get('width',0), i.size.get('height',0)
        if 150 <= w <= 250 and 40 <= h <= 120:
            i.screenshot('/tmp/gs-captcha-current.png')
            print(f"   Saved: /tmp/gs-captcha-current.png ({w}x{h})")
            break

    print("5. WAITING for CAPTCHA text in /tmp/gs-captcha-text.txt...")
    captcha_text = wait_for_file(CAPTCHA_FILE, 120)

    if not captcha_text:
        print("TIMEOUT waiting for CAPTCHA!")
        driver.save_screenshot('/tmp/gs-timeout.png')
        sys.exit(1)

    print(f"   CAPTCHA: {captcha_text}")
    driver.find_element(By.CSS_SELECTOR, 'input[placeholder="Enter the characters you see"]').send_keys(captcha_text)

    print("6. Send verification code...")
    driver.execute_script("arguments[0].click();", driver.find_element(By.XPATH, "//button[contains(text(),'Send verification code')]"))
    time.sleep(10)

    body = driver.find_element(By.TAG_NAME, 'body').text
    driver.save_screenshot('/tmp/gs-after-send-final.png')

    if 'sent to your inbox' not in body.lower():
        print(f"   FAILED: {body[:200]}")
        sys.exit(1)
    print("   Code sent!")

    print("7. Getting verification code from email...")
    time.sleep(15)  # Wait for email
    code = get_latest_code()
    print(f"   Code: {code}")

    if not code:
        print("No code found!")
        sys.exit(1)

    print(f"8. Enter code: {code}")
    driver.find_element(By.CSS_SELECTOR, 'input[placeholder="Verification Code"]').send_keys(code)

    print("9. Click Verify...")
    for b in driver.find_elements(By.TAG_NAME, 'button'):
        if b.text.strip().lower() == 'verify code':
            driver.execute_script("arguments[0].click();", b)
            break
    time.sleep(5)

    body = driver.find_element(By.TAG_NAME, 'body').text
    if 'does not match' in body.lower():
        print("Wrong code!")
        driver.save_screenshot('/tmp/gs-wrong-code.png')
        sys.exit(1)

    print("10. Fill password...")
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(1)
    pw1 = driver.find_element(By.CSS_SELECTOR, 'input[placeholder="New Password"]')
    pw2 = driver.find_element(By.CSS_SELECTOR, 'input[placeholder="Confirm New Password"]')
    driver.execute_script("arguments[0].scrollIntoView(true);", pw1)
    time.sleep(0.5)
    ActionChains(driver).move_to_element(pw1).click().send_keys(PASSWORD).perform()
    ActionChains(driver).move_to_element(pw2).click().send_keys(PASSWORD).perform()

    print("11. Create account...")
    driver.execute_script("arguments[0].click();", driver.find_element(By.XPATH, "//button[contains(text(),'Create')]"))
    time.sleep(15)

    driver.save_screenshot('/tmp/gs-complete.png')
    print(f"\nURL: {driver.current_url}")
    print(f"Title: {driver.title}")

    if 'login' not in driver.current_url:
        import pickle
        pickle.dump(driver.get_cookies(), open('/tmp/genspark-cookies.pkl', 'wb'))
        print("SUCCESS! Cookies saved!")

finally:
    driver.quit()
    print(f"\nCredentials: {EMAIL} / {PASSWORD}")
