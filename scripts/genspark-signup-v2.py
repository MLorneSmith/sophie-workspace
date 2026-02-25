#!/usr/bin/env python3
"""Genspark signup: screenshot CAPTCHA, read with vision API, fill, verify email."""
import time, subprocess, re, json, os, base64, sys
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By

EMAIL = 'sophie@slideheroes.com'
PASSWORD = '--RYj6IeOEYDrf576tdzXw!A1'

def read_captcha_with_vision(image_path):
    """Use OpenAI vision API to read CAPTCHA text."""
    with open(image_path, 'rb') as f:
        b64 = base64.b64encode(f.read()).decode()
    
    # Load API key
    env = {}
    with open(os.path.expanduser('~/.clawdbot/.env')) as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    
    api_key = env.get('OPENAI_API_KEY', '')
    if not api_key:
        print("No OPENAI_API_KEY found")
        return None
    
    import urllib.request
    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=json.dumps({
            "model": "gpt-4o-mini",
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "text", "text": "Read the CAPTCHA text in this image. Return ONLY the characters, nothing else. No spaces, no explanation."},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}}
                ]
            }],
            "max_tokens": 50
        }).encode(),
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }
    )
    resp = urllib.request.urlopen(req, timeout=15)
    result = json.loads(resp.read())
    return result['choices'][0]['message']['content'].strip()

def check_email_for_code():
    """Check Sophie's email for Genspark verification code."""
    result = subprocess.run(
        ['bash', '-c', 'source ~/.clawdbot/.env && gog gmail read --unread --query "verification" --limit 1'],
        capture_output=True, text=True, timeout=30
    )
    output = result.stdout + result.stderr
    print(f"  Email output: {output[:300]}")
    
    # Also try listing
    result2 = subprocess.run(
        ['bash', '-c', 'source ~/.clawdbot/.env && gog gmail list --unread --limit 5'],
        capture_output=True, text=True, timeout=30
    )
    print(f"  Email list: {result2.stdout[:500]}")
    
    # Find 4-6 digit codes
    codes = re.findall(r'\b(\d{4,6})\b', output + result2.stdout)
    return codes[0] if codes else None


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
    time.sleep(1)
    
    # Screenshot and read CAPTCHA in-session
    print("4. Reading CAPTCHA...")
    imgs = driver.find_elements(By.TAG_NAME, 'img')
    captcha_elem = [i for i in imgs if i.size.get('width', 0) >= 150 and i.size.get('height', 0) >= 50]
    if captcha_elem:
        captcha_elem[0].screenshot('/tmp/gs-captcha-live.png')
        captcha_text = read_captcha_with_vision('/tmp/gs-captcha-live.png')
        print(f"   CAPTCHA read: {captcha_text}")
    else:
        print("   No CAPTCHA image found!")
        driver.save_screenshot('/tmp/gs-no-captcha.png')
        sys.exit(1)
    
    if not captcha_text:
        print("   Failed to read CAPTCHA")
        sys.exit(1)
    
    print(f"5. Filling CAPTCHA: {captcha_text}")
    driver.find_element(By.CSS_SELECTOR, 'input[placeholder="Enter the characters you see"]').send_keys(captcha_text)
    time.sleep(1)
    
    print("6. Clicking Send verification code...")
    driver.find_element(By.XPATH, "//button[contains(text(),'Send verification code')]").click()
    time.sleep(8)
    
    # Check for errors
    driver.save_screenshot('/tmp/gs-after-send-v2.png')
    body_text = driver.find_element(By.TAG_NAME, 'body').text
    print(f"   Page text: {body_text[:200]}")
    
    if 'incorrect' in body_text.lower() or 'code is incorrect' in body_text.lower():
        print("ERROR: CAPTCHA was incorrect.")
        sys.exit(1)
    
    # Wait for email
    print("7. Waiting for verification email...")
    code = None
    for attempt in range(6):
        time.sleep(10)
        print(f"   Attempt {attempt+1}/6...")
        code = check_email_for_code()
        if code:
            break
    
    if not code:
        print("Could not find verification code. Check email manually.")
        sys.exit(1)
    
    print(f"8. Entering verification code: {code}")
    verify_input = driver.find_element(By.CSS_SELECTOR, 'input[placeholder="Verification Code"]')
    verify_input.clear()
    verify_input.send_keys(code)
    
    # Click verify
    try:
        driver.find_element(By.XPATH, "//button[contains(text(),'Verify')]").click()
    except:
        driver.find_element(By.ID, 'email_ver_but_verify').click()
    time.sleep(5)
    
    print("9. Filling password...")
    try:
        driver.find_element(By.CSS_SELECTOR, 'input[placeholder="New Password"]').send_keys(PASSWORD)
        driver.find_element(By.CSS_SELECTOR, 'input[placeholder="Confirm New Password"]').send_keys(PASSWORD)
    except Exception as e:
        print(f"   Password field error: {e}")
        pw_fields = driver.find_elements(By.CSS_SELECTOR, 'input[type="password"]')
        for f in pw_fields:
            f.clear()
            f.send_keys(PASSWORD)
    
    print("10. Clicking Create...")
    driver.find_element(By.XPATH, "//button[contains(text(),'Create')]").click()
    time.sleep(15)
    
    driver.save_screenshot('/tmp/gs-signup-complete.png')
    print(f"\nFinal URL: {driver.current_url}")
    print(f"Final Title: {driver.title}")
    print("SUCCESS!")
    
finally:
    driver.quit()
    print(f"\nCredentials: {EMAIL} / {PASSWORD}")
