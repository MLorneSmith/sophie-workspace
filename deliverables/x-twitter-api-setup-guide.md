# X/Twitter API Setup Guide for Sophie

**Purpose:** Enable Sophie to check mentions, post tweets (with approval), and monitor conversations.

---

## What Mike Needs To Do

### 1. Create Developer Account
- Go to https://developer.x.com
- Sign in with SlideHeroes Twitter account (or personal)
- Apply for developer access (Basic tier is free, 1500 tweets/mo read)

### 2. Create a Project + App
- In Developer Portal → Projects & Apps → Create Project
- Name: "Sophie Assistant" or similar
- Use case: Making a bot
- Create App within the project

### 3. Get Credentials
You'll need these values for Sophie's config:
```
X_API_KEY=...
X_API_SECRET=...
X_ACCESS_TOKEN=...
X_ACCESS_TOKEN_SECRET=...
X_BEARER_TOKEN=...
```

### 4. Set App Permissions
- In App Settings → User authentication settings
- Enable OAuth 1.0a (for posting)
- Set App permissions to "Read and write"
- Generate Access Token and Secret

### 5. Add to Sophie's Environment
Add the credentials to `~/.clawdbot/config.yaml` or environment variables.

---

## API Tiers (as of 2024)

| Tier | Cost | Read Limit | Write Limit |
|------|------|------------|-------------|
| Free | $0 | 1,500 tweets/mo | 1,500 tweets/mo |
| Basic | $100/mo | 10,000 tweets/mo | 3,000 tweets/mo |
| Pro | $5,000/mo | 1M tweets/mo | 300,000 tweets/mo |

**Recommendation:** Start with Free tier — sufficient for monitoring mentions and occasional posting.

---

## What Sophie Will Use It For

1. **Heartbeat checks:** Monitor @SlideHeroes mentions
2. **Post tweets:** With Mike's approval (never autonomous)
3. **Research:** Track industry conversations, competitor activity

---

## References
- https://developer.x.com/en/docs/tutorials/how-to-create-a-twitter-bot-with-twitter-api-v2
- https://developer.x.com/en/support/x-api/v2
