# Current situation
We are getting errors when we run our e2e accessibility tests.

  ⎿  Error: turbo 2.5.6

     web-e2e:test: ERROR: command finished with error: command (/home/msmith/projects/2025slideheroes/apps/e2e) /home/msmith/.nvm/versions/node/v22.16.0/bin/pnpm run test exited (1)
     web-e2e#test: command (/home/msmith/projects/2025slideheroes/apps/e2e) /home/msmith/.nvm/versions/node/v22.16.0/bin/pnpm run test exited (1)
      ERROR  run failed: command  exited (1)


     > slideheroes@2.12.3 test:e2e /home/msmith/projects/2025slideheroes
     > turbo test --filter=web-e2e

     • Packages in scope: web-e2e
     • Running test in 1 packages
     • Remote caching enabled
     web-e2e:test: cache miss, executing e038e870d55cca24
     web-e2e:test: 
     web-e2e:test: > web-e2e@1.0.0 test /home/msmith/projects/2025slideheroes/apps/e2e
     web-e2e:test: > playwright test --max-failures=1
     web-e2e:test: 
     web-e2e:test: [dotenv@17.2.1] injecting env (2) from .env -- tip: 📡 auto-backup env with Radar: https://dotenvx.com/radar
                   [Frontend] 
     web-e2e:test: [Frontend] > web@0.1.0 dev:test /home/msmith/projects/2025slideheroes/apps/web
     web-e2e:test: [Frontend] > NODE_ENV=test next dev --turbo
     web-e2e:test: [Frontend] 
                   [Frontend]    ▲ Next.js 15.3.4 (Turbopack)
                   [Frontend]    - Local:        http://localhost:3000
     web-e2e:test: [Frontend]    - Network:      http://10.255.255.254:3000
     web-e2e:test: [Frontend]    - Environments: .env.test, .env
     web-e2e:test: [Frontend]    - Experiments (use with caution):
     web-e2e:test: [Frontend]      ⨯ reactCompiler
     web-e2e:test: [Frontend] 
                   [Frontend]  ✓ Starting...
                   [Frontend]  ○ Compiling instrumentation Node.js ...
                   [Frontend]  ✓ Compiled instrumentation Node.js in 688ms
                   [Frontend]  ✓ Compiled instrumentation Edge in 264ms
                   [Frontend]  ✓ Compiled middleware in 196ms
                   [Frontend]  ✓ Ready in 2s
                   [Frontend]  ○ Compiling / ...
                   [Frontend]  ✓ Compiled / in 3.4s
                   [Frontend] [NULL_ANALYTICS_SERVICE-DEBUG] 2025-08-21T16:59:33.430Z Noop analytics service called with event: initialize args=[]
                   [Frontend] {"level":30,"time":1755795573489,"env":"development","name":"testimonials-fetch","component":"TestimonialsMasonaryGridServer","msg":"Fetching 
     testimonials from Supabase"}
                   [Frontend] {"level":30,"time":1755795574483,"env":"development","name":"testimonials-fetch","component":"TestimonialsMasonaryGridServer","msg":"Successfully 
     fetched 3 testimonials"}
                   [Frontend]  GET / 200 in 4895ms
     web-e2e:test: [Frontend]  │ HEAD http://127.0.0.1:55321/rest/v1/testimonials?select=count 206 in 956ms (cache skip)
     web-e2e:test: [Frontend]  │ │ Cache skipped reason: (auto no cache)
     web-e2e:test: [Frontend]  │ GET http://127.0.0.1:55321/rest/v1/testimonials?select=*&rating=gte.3&status=eq.approved&order=created_at.desc&limit=12 200 in 36ms (cache skip)
     web-e2e:test: [Frontend]  │ │ Cache skipped reason: (auto no cache)
                   [Backend] 
     web-e2e:test: [Backend] > payload@3.52.0 dev:test /home/msmith/projects/2025slideheroes/apps/payload
     web-e2e:test: [Backend] > dotenv -e .env.test -- cross-env PORT=3020 NODE_OPTIONS=--no-deprecation next dev
     web-e2e:test: [Backend] 
                   [Backend]    ▲ Next.js 15.3.4
                   [Backend]    - Local:        http://localhost:3020
     web-e2e:test: [Backend]    - Network:      http://10.255.255.254:3020
     web-e2e:test: [Backend]    - Environments: .env.test, .env
     web-e2e:test: [Backend] 
     web-e2e:test: [Backend]  ✓ Starting...
                   [Backend]  ✓ Ready in 1028ms
                   [Backend]  ○ Compiling / ...
                   [Backend]  ✓ Compiled / in 3.2s (3301 modules)
     web-e2e:test: 

     ... [72520 characters truncated] ...

        },%0A    +             "id": "color-contrast",%0A    +             "impact": "serious",%0A    +             "message": "Element has insufficient color contrast of 1.69 
     (foreground color: #c7c7c7, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",%0A    +             "relatedNodes": 
     Array [%0A    +               Object {%0A    +                 "html": "<button class=\"focus-visible:ring-ring items-center justify-center rounded-md text-sm font-medium 
     whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 border-input bg-background 
     hover:bg-accent hover:text-accent-foreground border shadow-xs h-9 px-4 py-2 flex w-full gap-x-3 text-center\" data-provider=\"google\" data-test=\"auth-provider-button\">",%0A 
        +                 "target": Array [%0A    +                   ".hover\\:bg-accent",%0A    +                 ],%0A    +               },%0A    +             ],%0A    +       
         },%0A    +         ],%0A    +         "failureSummary": "Fix any of the following:%0A    +   Element has insufficient color contrast of 1.69 (foreground color: #c7c7c7, 
     background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",%0A    +         "html": "<span class=\"font-medium\" 
     style=\"color:hsl(0 0% 15%)\">Sign in with Google</span>",%0A    +         "impact": "serious",%0A    +         "none": Array [],%0A    +         "target": Array [%0A    +     
           ".hover\\:bg-accent > span",%0A    +         ],%0A    +       },%0A    +       Object {%0A    +         "all": Array [],%0A    +         "any": Array [%0A    +           
     Object {%0A    +             "data": Object {%0A    +               "bgColor": "#ffffff",%0A    +               "contrastRatio": 1.76,%0A    +               
     "expectedContrastRatio": "4.5:1",%0A    +               "fgColor": "#c1c3c8",%0A    +               "fontSize": "9.0pt (12px)",%0A    +               "fontWeight": "normal",%0A
         +               "messageKey": null,%0A    +             },%0A    +             "id": "color-contrast",%0A    +             "impact": "serious",%0A    +             
     "message": "Element has insufficient color contrast of 1.76 (foreground color: #c1c3c8, background color: #ffffff, font size: 9.0pt (12px), font weight: normal). Expected 
     contrast ratio of 4.5:1",%0A    +             "relatedNodes": Array [%0A    +               Object {%0A    +                 "html": "<div class=\"bg-background flex w-full 
     max-w-[23rem] flex-col gap-y-6 rounded-lg px-6 md:w-8/12 md:px-8 md:py-6 lg:w-5/12 lg:px-8 xl:w-4/12 xl:gap-y-8 xl:py-8\">",%0A    +                 "target": Array [%0A    +  
                      ".max-w-\\[23rem\\]",%0A    +                 ],%0A    +               },%0A    +             ],%0A    +           },%0A    +         ],%0A    +         
     "failureSummary": "Fix any of the following:%0A    +   Element has insufficient color contrast of 1.76 (foreground color: #c1c3c8, background color: #ffffff, font size: 9.0pt 
     (12px), font weight: normal). Expected contrast ratio of 4.5:1",%0A    +         "html": "<a class=\"focus-visible:ring-ring inline-flex items-center justify-center font-medium
      whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 decoration-primary underline-offset-4 
     hover:underline h-8 rounded-md px-3 text-xs text-foreground\" href=\"/auth/sign-up\">",%0A    +         "impact": "serious",%0A    +         "none": Array [],%0A    +         
     "target": Array [%0A    +           "a[href$=\"sign-up\"]",%0A    +         ],%0A    +       },%0A    +     ],%0A    +     "tags": Array [%0A    +       "cat.color",%0A    +   
         "wcag2aa",%0A    +       "wcag143",%0A    +       "TTv5",%0A    +       "TT13.c",%0A    +       "EN-301-549",%0A    +       "EN-9.1.4.3",%0A    +       "ACT",%0A    +     
     ],%0A    +   },%0A    + ]%0A%0A      57 | 			.analyze();%0A      58 |%0A    > 59 | 		expect(accessibilityScanResults.violations).toEqual([]);%0A         | 	                          
                       ^%0A      60 |%0A      61 | 		// Sign up page%0A      62 | 		await page.goto("/auth/sign-up");%0A        at 
     /home/msmith/projects/2025slideheroes/apps/e2e/tests/accessibility/accessibility.spec.ts:59:47
     web-e2e:test: ::notice title=🎭 Playwright Run Summary::  1 failed%0A    [chromium] › tests/accessibility/accessibility.spec.ts:50:6 › Accessibility Tests - WCAG 2.1 AA › 
     Authentication pages accessibility %0A  82 did not run%0A  1 passed (22.4s)
     web-e2e:test: 
     web-e2e:test: To open last HTML report run:
     web-e2e:test: 
     web-e2e:test:   pnpm exec playwright show-report
     web-e2e:test: 
     web-e2e:test:  ELIFECYCLE  Test failed. See above for more details.

      Tasks:    0 successful, 1 total
     Cached:    0 cached, 1 total
       Time:    24.619s 
     Failed:    web-e2e#test

      ELIFECYCLE  Command failed with exit code 1.


# Similar issue previously
This seems to be related to github issues #115 and #124

# Your Task
1. run the /log-issue command to create a github issue for this problem
2. include reference to the error and past related github issues