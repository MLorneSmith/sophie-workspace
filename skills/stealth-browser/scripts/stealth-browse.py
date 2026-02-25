#!/usr/bin/env python3
"""Browse any website using undetected-chromedriver + Xvfb to bypass Cloudflare.
Must be run via: xvfb-run python3 stealth-browse.py <url> [options]
"""
import sys, time, argparse
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By

def main():
    parser = argparse.ArgumentParser(description='Stealth browser for Cloudflare-protected sites')
    parser.add_argument('url', help='URL to visit')
    parser.add_argument('--screenshot', '-s', help='Save screenshot to path')
    parser.add_argument('--html', help='Save full HTML to path')
    parser.add_argument('--wait', type=int, default=10, help='Seconds to wait after load (default: 10)')
    parser.add_argument('--window', default='1920,1080', help='Window size WxH (default: 1920,1080)')
    args = parser.parse_args()

    w, h = args.window.split(',')
    options = uc.ChromeOptions()
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument(f'--window-size={w},{h}')

    driver = uc.Chrome(options=options)
    try:
        driver.get(args.url)

        # Wait for Cloudflare Turnstile to auto-solve (up to 30s)
        for i in range(15):
            time.sleep(2)
            if 'just a moment' not in driver.title.lower():
                break

        # Additional wait for JS rendering
        time.sleep(args.wait)

        print(f"URL: {driver.current_url}")
        print(f"Title: {driver.title}")

        if args.screenshot:
            driver.save_screenshot(args.screenshot)
            print(f"Screenshot: {args.screenshot}")

        if args.html:
            with open(args.html, 'w') as f:
                f.write(driver.page_source)
            print(f"HTML: {args.html}")

        if not args.screenshot and not args.html:
            body = driver.find_element(By.TAG_NAME, 'body')
            print(f"\n--- Page Text ---\n{body.text[:5000]}")

    finally:
        driver.quit()

if __name__ == '__main__':
    main()
