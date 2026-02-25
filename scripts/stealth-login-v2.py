#!/usr/bin/env python3
"""Stealth login v2 - uses system Chrome + persistent context to look more human."""
import sys
import time
from playwright.sync_api import sync_playwright

def main():
    email = "sophie@slideheroes.com"
    screenshot_dir = "/home/ubuntu/clawd/deliverables/dashboard-screenshots/linear"
    
    with sync_playwright() as p:
        # Use persistent context with system Chrome - looks more like a real user
        context = p.chromium.launch_persistent_context(
            user_data_dir="/tmp/playwright-stealth-profile",
            executable_path="/usr/bin/google-chrome-stable",
            headless=False,  # Use headed mode via Xvfb
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--window-size=1440,900",
            ],
            viewport={"width": 1440, "height": 900},
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            locale="en-US",
            timezone_id="America/New_York",
        )
        
        # Anti-detection scripts
        context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            delete navigator.__proto__.webdriver;
            window.chrome = { runtime: {}, loadTimes: function(){}, csi: function(){} };
            Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3,4,5] });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US','en'] });
        """)
        
        page = context.pages[0] if context.pages else context.new_page()
        
        try:
            page.goto("https://linear.app/login", wait_until="networkidle")
            time.sleep(2)
            page.screenshot(path=f"{screenshot_dir}/v2-01-login.png")
            
            page.click("text=Continue with email")
            time.sleep(1)
            
            page.fill('input[placeholder*="email"]', email)
            page.click("text=Continue with email")
            time.sleep(2)
            
            page.screenshot(path=f"{screenshot_dir}/v2-02-turnstile.png")
            
            # Try clicking the Turnstile checkbox via iframe
            frames = page.frames
            print(f"Found {len(frames)} frames")
            for i, frame in enumerate(frames):
                print(f"  Frame {i}: {frame.url[:80]}")
                if "turnstile" in frame.url or "challenges" in frame.url:
                    print(f"  -> Found Turnstile frame!")
                    try:
                        checkbox = frame.locator('input[type="checkbox"]')
                        if checkbox.count() > 0:
                            checkbox.click()
                            print("  -> Clicked checkbox!")
                    except Exception as e:
                        print(f"  -> Checkbox error: {e}")
            
            # Wait longer
            print("Waiting 15s for Turnstile...")
            time.sleep(15)
            
            page.screenshot(path=f"{screenshot_dir}/v2-03-after-wait.png")
            print(f"URL: {page.url}")
            print(f"Title: {page.title()}")
            
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path=f"{screenshot_dir}/v2-error.png")
        finally:
            context.close()

if __name__ == "__main__":
    main()
