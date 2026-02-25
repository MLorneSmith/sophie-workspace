#!/usr/bin/env python3
"""Webflow login with stealth + xvfb."""
import time
import subprocess
from playwright.sync_api import sync_playwright

def main():
    email = "sophie@slideheroes.com"
    # Get password from SSM
    pwd = subprocess.check_output([
        "aws", "--profile", "openclaw", "ssm", "get-parameter",
        "--name", "/openclaw/SOPHIE_GOOGLE_PASSWORD",
        "--with-decryption", "--query", "Parameter.Value", "--output", "text"
    ]).decode().strip()
    
    ssdir = "/home/ubuntu/clawd/deliverables/dashboard-screenshots/webflow"
    
    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir="/tmp/pw-webflow-profile",
            executable_path="/usr/bin/google-chrome-stable",
            headless=False,
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
        
        context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            delete navigator.__proto__.webdriver;
            window.chrome = { runtime: {}, loadTimes: function(){}, csi: function(){} };
        """)
        
        page = context.pages[0] if context.pages else context.new_page()
        
        try:
            page.goto("https://webflow.com/login", wait_until="networkidle", timeout=30000)
            time.sleep(5)
            page.screenshot(path=f"{ssdir}/01-login-page.png")
            print(f"Step 1 - URL: {page.url}")
            print(f"Step 1 - Title: {page.title()}")
            
            # Check for Turnstile
            content = page.content()
            if "not a bot" in content.lower() or "turnstile" in content.lower():
                print("Turnstile detected - waiting 15s...")
                time.sleep(15)
                page.screenshot(path=f"{ssdir}/02-after-turnstile-wait.png")
            
            # Try to find login form
            print(f"Step 2 - URL: {page.url}")
            
            # Look for email input
            email_input = page.query_selector('input[type="email"], input[name="email"], input[placeholder*="email" i]')
            if email_input:
                print("Found email input!")
                email_input.fill(email)
                time.sleep(1)
                
                pwd_input = page.query_selector('input[type="password"]')
                if pwd_input:
                    print("Found password input!")
                    pwd_input.fill(pwd)
                    time.sleep(1)
                    page.screenshot(path=f"{ssdir}/03-filled-form.png")
                    
                    # Submit
                    submit = page.query_selector('button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")')
                    if submit:
                        submit.click()
                        time.sleep(5)
                        page.screenshot(path=f"{ssdir}/04-after-submit.png")
                        print(f"After submit - URL: {page.url}")
            else:
                print("No email input found")
                # Check for Google button
                google = page.query_selector('button:has-text("Google"), a:has-text("Google")')
                if google:
                    print("Found Google button")
                
            page.screenshot(path=f"{ssdir}/05-final.png")
            print(f"Final - URL: {page.url}")
            
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path=f"{ssdir}/error.png")
        finally:
            context.close()

if __name__ == "__main__":
    main()
