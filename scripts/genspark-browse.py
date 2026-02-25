#!/usr/bin/env python3
"""Browse Genspark.ai using undetected-chromedriver + Xvfb to bypass Cloudflare Turnstile.
Usage: xvfb-run python3 scripts/genspark-browse.py <url> [--screenshot <path>] [--html <path>]
"""
import sys
import time
import argparse
import undetected_chromedriver as uc

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('url', nargs='?', default='https://www.genspark.ai')
    parser.add_argument('--screenshot', '-s', help='Save screenshot to path')
    parser.add_argument('--html', help='Save page HTML to path')
    parser.add_argument('--wait', type=int, default=10, help='Seconds to wait after load')
    args = parser.parse_args()

    options = uc.ChromeOptions()
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1920,1080')

    driver = uc.Chrome(options=options)
    try:
        driver.get(args.url)
        # Wait for Turnstile to clear
        for i in range(12):
            time.sleep(2)
            if "just a moment" not in driver.title.lower():
                break
        
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
        else:
            # Print text content
            from selenium.webdriver.common.by import By
            body = driver.find_element(By.TAG_NAME, 'body')
            print(f"\n--- Page Text ---\n{body.text[:5000]}")
    finally:
        driver.quit()

if __name__ == '__main__':
    main()
