# Morning Briefing Template
#
# HOW TO USE:
# 1. Run: ~/clawd/scripts/morning-briefing-data.sh > /tmp/briefing-data.json
# 2. Read this template
# 3. Fill every {{PLACEHOLDER}} with data from the JSON
# 4. For [COMPOSE] sections, write original content based on the data
# 5. Run validation: ~/clawd/scripts/validate-briefing.sh /tmp/briefing-draft.md
# 6. Fix any validation errors, then send
#
# RULES:
# - NEVER use localhost URLs — they don't work from Discord
# - NEVER skip a section — if no data, say "None" or "No items"
# - ALWAYS include calendar even if empty
# - Use Discord-friendly formatting (no markdown tables)

---

# ☀️ Morning Brief — {{DAY_OF_WEEK}}, {{DATE_LONG}}

## 🌡️ Toronto Weather
{{WEATHER_SUMMARY}}

## 💬 Quote of the Day
> *"{{QUOTE_TEXT}}"* — {{QUOTE_AUTHOR}}

## 📅 Today's Meetings ({{DATE_TODAY_SHORT}})
{{CALENDAR_TODAY}}
<!-- If no meetings: "No meetings scheduled." -->

## 📅 Tomorrow's Meetings ({{DATE_TOMORROW_SHORT}})
{{CALENDAR_TOMORROW}}
<!-- If no meetings: "No meetings scheduled." -->

## 📊 Model Usage (Yesterday)
{{MODEL_USAGE}}
<!-- Run ~/clawd/scripts/get-model-usage.sh for JSON data. Show each model with count and percentage. -->

## 📬 Email Highlights
{{EMAIL_SUMMARY}}
<!-- If no urgent emails: "Inbox clear — nothing urgent." -->

## 📰 Top Headlines
[COMPOSE: Pick 2-3 items relevant to SlideHeroes from news/industry. For each:]
- **🎯 Category — Headline**
  Brief description + why it matters for SlideHeroes.

## 📡 Feed Monitor Picks
{{FEED_ITEMS}}
<!-- Format each as:
1. **[Title](URL)** — Score: X
   One-line description of why it's relevant.
   [👍](upvoteUrl) · [👎](downvoteUrl)

   ⚠️ NEVER use localhost URLs for feedback links!
   Generate signed Cloudflare Worker URLs using FEEDBACK_SECRET from ~/.clawdbot/.env:
   Base: https://slideheroes-feedback.slideheroes.workers.dev/rate?item=<ID>&r=<1|-1>&sig=<HMAC>
   See ~/clawd/scripts/generate-feedback-urls.sh for the signing process.
-->

## 📸 Capture Activity (Yesterday)
{{CAPTURE_ACTIVITY}}
<!-- If none: "No captures processed yesterday." -->

## 💰 AWS Costs
{{AWS_COSTS}}

## 🌙 Overnight Work
{{OVERNIGHT_SUMMARY}}
<!-- From state/current.md and nightly logs. What got done, what's in progress. -->

## ✅ Sophie Can Do Today
[COMPOSE: 3-5 actionable items based on backlog + current priorities]

## 📋 Mike's Agenda
[COMPOSE: 2-4 items Mike should review/decide on today. Keep light on weekends.]
