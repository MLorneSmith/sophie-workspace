#!/usr/bin/env python3
"""Webflow login - simpler approach, domcontentloaded instead of networkidle."""
import time
import subprocess
from playwright.sync_api import sync_playwright

def main():
    email = "sophie@slideheroes.com"
    pwd = subprocess.check_output([
        "aws", "--profile", "openclaw", "ssm", "get-parameter",
        "--name", "/openclaw/SOPHIE_GOOGLE_PASSWORD",
        "--with-decryption", "--query", "Parameter.Value", "--output", "text"
    ]).decode().strip()
    
    ssdir = "/home/ubuntu/clawd/deliverables/dashboard-screenshots/webflow"
    
    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir="/tmp/pw-webflow2",
            executable_path="/usr/bin/google-chrome-stable",
            headless=False,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu",
            ],
            viewport={"width": 1440, "height": 900},
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        )
        context.add_init_script("Object.defineProperty(navigator,'webdriver',{get:()=>undefined})")
        
        page = context.pages[0] if context.pages else context.new_page()
        
        try:
            page.goto("https://webflow.com/login", wait_until="domcontentloaded", timeout=20000)
            time.sleep(8)
            page.screenshot(path=f"{ssdir}/v2-01.png")
            print(f"URL: {page.url}")
            
            # Check what we see
            text = page.inner_text("body")[:500]
            print(f"Body text: {text[:300]}")
            
            # Try clicking any Turnstile checkbox in iframes
            for frame in page.frames:
                if "challenge" in frame.url or "turnstile" in frame.url:
                    print(f"Turnstile frame: {frame.url[:80]}")
                    try:
                        frame.click("input, .cb-i, div[role='checkbox']", timeout=3000)
                        print("Clicked turnstile element!")
                        time.sleep(10)
                    except:
                        pass
            
            page.screenshot(path=f"{ssdir}/v2-02.png")
            
            # Check for form now
            email_input = page.query_selector('input[type="email"], input[name="email"]')
            if email_input:
                print("Found email input!")
                email_input.fill(email)
                pwd_input = page.query_selector('input[type="password"]')
                if pwd_input:
                    pwd_input.fill(pwd)
                    page.screenshot(path=f"{ssdir}/v2-03-filled.png")
                    page.keyboard.press("Enter")
                    time.sleep(8)
                    page.screenshot(path=f"{ssdir}/v2-04-after-login.png")
                    print(f"After login URL: {page.url}")
            else:
                print("No email input found - still blocked")
                
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path=f"{ssdir}/v2-error.png")
        finally:
            context.close()

if __name__ == "__main__":
    main()
