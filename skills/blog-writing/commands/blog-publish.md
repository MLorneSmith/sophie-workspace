# Blog Publish Command

Publish (or create a draft of) a Markdown blog post to Payload CMS.

## Usage

```
/blog-publish [slug] [--draft | --publish] [--task-id <id>]
```

### Examples

Create a draft in Payload:
```
/blog-publish ai-slide-decks --draft
```

Publish immediately:
```
/blog-publish ai-slide-decks --publish
```

Publish + update a Mission Control task:
```
/blog-publish ai-slide-decks --publish --task-id 123
```

### Arguments: $ARGUMENTS

---

## What it does

1. Loads the post Markdown from:
   
   ```
   /home/ubuntu/clawd/.ai/content/blog/posts/[slug].md
   ```

2. Parses YAML front matter:
   - `title` (required)
   - `slug` (optional; defaults to argument slug)
   - `meta_description` (maps to Payload `description`)
   - `date` (maps to Payload `publishedAt` when publishing)
   - `categories` (list of strings)
   - `tags` (list of strings)

3. Converts Markdown body to HTML.

4. Calls Payload REST API to create a post:
   - `POST {PAYLOAD_PUBLIC_SERVER_URL}/api/posts`

5. Status behavior:
   - Default is **draft**
   - `--publish` sets `status=published` and sets `publishedAt`

6. Mission Control integration (optional):
   - If `--task-id` is provided, PATCH the task with the created post URL / ID.

---

## Environment variables

Required:
- `PAYLOAD_PUBLIC_SERVER_URL` — e.g. `https://your-payload.example.com`
- `PAYLOAD_API_KEY` — API key (or set `PAYLOAD_JWT` instead)

Optional:
- `PAYLOAD_API_KEY_COLLECTION` — collection slug used for API key auth (default: `users`)
- `PAYLOAD_VERIFY_TLS` — `true|false` (default `true`)

Auth header behavior:
- If `PAYLOAD_JWT` is set: `Authorization: Bearer <jwt>`
- Else if `PAYLOAD_API_KEY` is set: `Authorization: <collection> API-Key <apiKey>`

---

## Payload field mapping

Payload collection `posts` fields:
- `title` ← front matter `title`
- `slug` ← front matter `slug` (or argument slug)
- `description` ← front matter `meta_description`
- `content` ← HTML-converted body (best-effort; see limitations below)
- `status` ← `draft` unless `--publish`
- `publishedAt` ← front matter `date` (or now) when `--publish`
- `categories` ← `[{"category": "..."}, ...]`
- `tags` ← `[{"tag": "..."}, ...]`

---

## Content format limitations (Lexical)

Payload’s `richText` field is stored as Lexical JSON.

This workflow uses a **best-effort** approach:
- Converts Markdown → HTML.
- Sends `content` as HTML **first**.
- If the API rejects HTML for `content`, the script falls back to a simple Lexical document containing the **plain text** of the post.

If you need full-fidelity rich text (headings, links, lists), you’ll likely need a proper HTML→Lexical (or Markdown→Lexical) conversion step server-side.

---

## Implementation

This command is implemented by:

```
/home/ubuntu/.openclaw/skills/blog-writing/scripts/publish_to_payload.py
```

Suggested invocation (from shell):

```bash
python3 /home/ubuntu/.openclaw/skills/blog-writing/scripts/publish_to_payload.py \
  --slug "[slug]" \
  --status draft

python3 /home/ubuntu/.openclaw/skills/blog-writing/scripts/publish_to_payload.py \
  --slug "[slug]" \
  --status published \
  --task-id "[task_id]"
```

---

## Mission Control task update (optional)

If `--task-id` is provided, update the task with an activity note:

```bash
curl -s -X PATCH "http://localhost:3001/api/v1/tasks/[task_id]" \
  -H "Content-Type: application/json" \
  -d '{
    "activity_note": "Published to Payload: [url] (id=[id])"
  }'
```
