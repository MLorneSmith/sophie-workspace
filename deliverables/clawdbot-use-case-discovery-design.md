# Clawdbot Use Case Discovery System: Design Document

*Prepared by Sophie | February 2026*

---

## Overview

Build a system to discover and surface interesting Clawdbot/Moltbot/AI agent use cases from the community, to replace the self-referential "Fresh Clawdbot Use Cases" section in the Morning Brief.

---

## Architecture

Extends existing Feed Monitor with new sources and scoring:

```
┌─────────────────────────────────────────────────────────┐
│              EXISTING FEED MONITOR                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Feeds (RSS)  →  FeedItems  →  Score  →  Candidates    │
│                                                         │
│  [newsletter]    [articles]    [LLM]     [daily brief] │
│                                                         │
└─────────────────────────────────────────────────────────┘
                        +
┌─────────────────────────────────────────────────────────┐
│              NEW: USE CASE SOURCES                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Reddit RSS     →  Filter by    →  Score for  →  Use   │
│  YouTube RSS       keywords        use cases     Cases  │
│  Blogs                             relevance            │
│                                                         │
│  Category: "ai-agents"                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Data Sources

### Reddit Subreddits (RSS)
| Subreddit | URL | Focus |
|-----------|-----|-------|
| r/ClaudeAI | `https://www.reddit.com/r/ClaudeAI/.rss` | Claude-specific use cases |
| r/LocalLLaMA | `https://www.reddit.com/r/LocalLLaMA/.rss` | Local AI, agents |
| r/ChatGPT | `https://www.reddit.com/r/ChatGPT/.rss` | General LLM use cases |
| r/OpenAI | `https://www.reddit.com/r/OpenAI/.rss` | OpenAI ecosystem |
| r/singularity | `https://www.reddit.com/r/singularity/.rss` | AI news, applications |
| r/MachineLearning | `https://www.reddit.com/r/MachineLearning/.rss` | Technical ML |
| r/artificial | `https://www.reddit.com/r/artificial/.rss` | AI general |

### YouTube Channels (RSS)
YouTube RSS format: `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`

| Channel | Focus |
|---------|-------|
| AI productivity creators | Tutorials, use cases |
| Claude/Anthropic official | Announcements |
| Automation/AI agent channels | Workflows |

*Note: Need to identify specific channel IDs*

### Blogs (RSS)
| Source | URL | Focus |
|--------|-----|-------|
| Simon Willison | `https://simonwillison.net/atom/entries/` | LLM tools, experiments |
| Stratechery (Ben Thompson) | Requires sub | AI analysis |
| AI-focused Substacks | Various | Use cases, tutorials |

---

## Filtering Strategy

Not all posts are use cases. Filter for:

### Include (High Signal)
- Posts containing: "I built", "I made", "I automated", "use case", "workflow", "how I use", "my setup"
- Posts with code snippets or screenshots
- Posts tagged: [Project], [Tutorial], [Show and Tell]
- Posts with high engagement (upvotes > threshold)

### Exclude (Low Signal)
- Questions asking for help
- Meta/moderation posts
- News reposts (covered by other feeds)
- Low-effort posts

### Keyword Patterns
```
INCLUDE_PATTERNS = [
  r'I (built|made|created|automated)',
  r'(my|our) (workflow|setup|system)',
  r'use case',
  r'how (I|we) use',
  r'(project|tutorial|guide)',
  r'Claude (Code|computer use)',
  r'(Clawdbot|Moltbot|OpenClaw)',
]

EXCLUDE_PATTERNS = [
  r'^(help|question|how do I)',
  r'(hiring|job|looking for)',
  r'(bug|error|issue)',
]
```

---

## Scoring System

### Use Case Relevance Score (LLM)

```markdown
Score this post for "AI agent use case" relevance (1-10):

Criteria:
- Is this a concrete example of someone using an AI agent/LLM for a real task? (+3)
- Does it describe a novel or creative application? (+2)
- Would Mike (building SlideHeroes, an AI presentation tool) find this inspiring? (+2)
- Is it actionable/replicable? (+2)
- Is it just a question or discussion (not a use case)? (-5)

Post: {title}
{content snippet}

Return JSON: {"score": N, "reason": "...", "use_case_type": "automation|workflow|integration|creative|other"}
```

### Composite Score
```
total_score = (
  llm_use_case_score * 0.5 +
  engagement_score * 0.2 +
  recency_score * 0.2 +
  source_reputation * 0.1
)
```

---

## API Endpoints

### New Endpoint: GET /api/feed-monitor/use-cases

Returns top use cases for the Morning Brief.

**Request:**
```
GET /api/feed-monitor/use-cases?max=6&lookbackHours=168
```

**Response:**
```json
{
  "useCases": [
    {
      "title": "I automated my entire email workflow with Claude",
      "link": "https://reddit.com/r/ClaudeAI/...",
      "source": "r/ClaudeAI",
      "score": 8.5,
      "useCaseType": "automation",
      "snippet": "Built a system that reads my inbox, drafts responses...",
      "pubDate": "2026-02-01T..."
    }
  ],
  "totalScanned": 150,
  "afterFiltering": 23
}
```

---

## Database Changes

### New Feed Category
Add feeds with `category: "ai-agents"`

### New FeedItem Fields
```prisma
model FeedItem {
  // existing fields...
  
  // New fields for use case scoring
  useCaseScore     Float?    // LLM use case relevance score
  useCaseType      String?   // automation, workflow, integration, creative, other
  useCaseSnippet   String?   // Extracted description
}
```

---

## Implementation Plan

### Step 1: Add RSS Feeds
```bash
# Add to feed monitor via API or direct DB insert
POST /api/feed-monitor/feeds
{
  "url": "https://www.reddit.com/r/ClaudeAI/.rss",
  "title": "r/ClaudeAI",
  "category": "ai-agents",
  "reputationScore": 0.8
}
```

### Step 2: Create Use Case Ranking Function
New file: `src/lib/feed-monitor/rankUseCases.ts`
- Query items with category="ai-agents"
- Apply keyword filters
- LLM score for use case relevance
- Return ranked candidates

### Step 3: Create API Endpoint
New file: `src/app/api/feed-monitor/use-cases/route.ts`
- Call rankUseCases()
- Return formatted response

### Step 4: Update Morning Brief
Modify the Morning Brief cron job to:
- Call `/api/feed-monitor/use-cases?max=4`
- Format results for the brief

---

## Morning Brief Integration

**Current (Self-Referential):**
```
## Fresh Clawdbot Use Cases (2-4)
- Automated Morning Briefs — you're reading it!
- Feed monitoring system — ranking articles
```

**New (Community-Sourced):**
```
## Fresh AI Agent Use Cases (2-4)
- **[r/ClaudeAI]** "I automated my entire email workflow" 
  User built a system that reads inbox, drafts responses, schedules follow-ups
  Link: https://...
  
- **[r/LocalLLaMA]** "My home assistant now plans my meals"
  Integrated local LLM with grocery API for weekly meal planning
  Link: https://...
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/feed-monitor/rankUseCases.ts` | Create | Use case scoring logic |
| `src/app/api/feed-monitor/use-cases/route.ts` | Create | API endpoint |
| `prisma/schema.prisma` | Modify | Add useCaseScore fields |
| Seeds/migration | Create | Add Reddit RSS feeds |

---

## Questions Before Implementation

1. **Which YouTube channels?** Need specific channel IDs for AI agent content
2. **Engagement threshold?** Minimum upvotes to consider? (Suggest: 10+)
3. **Lookback period?** How far back to search? (Suggest: 7 days)
4. **LLM model for scoring?** GPT-4o-mini (cost-effective) or better?

---

## Next Steps

This task requires code implementation. I'll:
1. Spawn a GPT sub-agent to implement the changes
2. Review and test the PR
3. Add the RSS feeds
4. Update the Morning Brief cron

Proceeding with implementation...
