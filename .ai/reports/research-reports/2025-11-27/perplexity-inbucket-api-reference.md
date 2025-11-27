# Perplexity Research: Inbucket Email Testing Server REST API

**Date**: 2025-11-27
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro)

## Query Summary

Researched the Inbucket email testing server REST API to determine:
1. Correct API endpoints for listing messages, getting messages, and deleting messages
2. URL structure (email local part vs full email)
3. Response format and JSON schema

## Findings

### API Endpoints

Inbucket provides a RESTful API v1 with the following endpoints:

#### 1. List Mailbox Contents
```
GET /api/v1/mailbox/{name}
```
Returns an array of message objects with header information for each message in the mailbox.

#### 2. Get Specific Message
```
GET /api/v1/mailbox/{name}/{id}
```
Returns complete message details including parsed headers and MIME data converted to JSON.

**Special Feature**: Use `latest` as the `{id}` parameter to retrieve the most recent message.

#### 3. Get Message Source
```
GET /api/v1/mailbox/{name}/{id}/source
```
Returns the raw SMTP source of the message.

#### 4. Delete Message
```
DELETE /api/v1/mailbox/{name}/{id}
```
Removes a specific message from the mailbox.

#### 5. Purge Mailbox
```
DELETE /api/v1/mailbox/{name}
```
Deletes all messages from the specified mailbox.

### URL Structure

**IMPORTANT**: The API uses the **email local part** (username) in the URL path, NOT the full email address.

**Example**:
- Email: `testuser@example.com`
- URL parameter: `testuser`
- Endpoint: `GET /api/v1/mailbox/testuser`

### JSON Response Format

#### Get Specific Message Response

Example request:
```bash
curl -i -H "Accept: application/json" \
  http://localhost:9000/api/v1/mailbox/swaks/20131016T164638-0001
```

Response (200 OK):
```json
{
  "mailbox": "swaks",
  "id": "20131016T164638-0001",
  "from": "jamehi03@server.com",
  "subject": "Swaks HTML",
  "date": "2013-10-16T16:46:38.646370568-07:00",
  "size": 705,
  "body": {
    "text": "This is a test mailing.\r\n\r\nThis should be clickable: http://google.com/\r\n",
    "html": "<html>\n<body>\n<p>This is a test mailing <b>in HTML</b></p>\n\n<p>This should be clickable: [...]"
  },
  "header": {
    "Content-Type": [
      "multipart/alternative; boundary=\"----=_MIME_BOUNDARY_000_62717\""
    ],
    "Date": [
      "Wed, 16 Oct 2013 16:46:38 -0700"
    ],
    "From": [
      "jamehi03@server.com"
    ]
  }
}
```

#### Response Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `mailbox` | string | Name of the mailbox containing the message |
| `id` | string | Unique identifier for the message (format: `YYYYMMDDTHHMMSS-NNNN`) |
| `from` | string | Sender's email address |
| `subject` | string | Message subject line |
| `date` | string | ISO 8601 timestamp when message was received |
| `size` | number | Message size in bytes |
| `body.text` | string | Plain text version of message content |
| `body.html` | string | HTML version of message content |
| `header` | object | Parsed SMTP headers (keys are header names, values are arrays of strings) |

**Additional Features**:
- Inbucket version of message headers (same as List Mailbox Contents)
- Decoded Text and HTML portions of MIME body
- List of attachments if present in the message

### List Mailbox Response Format

The List Mailbox endpoint returns an array of message objects. Each message object includes:
- Basic header information
- Message `id` field that can be used to retrieve the full message

## Key Takeaways

1. **Use local part only**: Strip the `@domain.com` from email addresses when making API calls
2. **Message IDs are timestamped**: Format is `YYYYMMDDTHHMMSS-NNNN` (e.g., `20131016T164638-0001`)
3. **Headers are arrays**: All header values are returned as arrays of strings
4. **Special `latest` parameter**: Use `/api/v1/mailbox/{name}/latest` to get the most recent message
5. **Dual body formats**: Messages include both `text` and `html` body versions

## Official Clients Available

Inbucket provides official REST API clients for:
- **Go**: `github.com/inbucket/inbucket/pkg/rest/client`
- **Java**: `stepstone-tech/inbucket-java-client`
- **Node.js**: `Xotabu4/inbucket-js-client`
- **Shell**: Available in `inbucket/inbucket` repository

## Related Searches

- Inbucket webhook support for real-time email notifications
- Inbucket attachment handling and retrieval
- Inbucket WebSocket API for streaming email events
- Inbucket SMTP configuration for custom domains

## Sources & Citations

Research conducted via Perplexity Chat API (sonar-pro model) with citations from:
- Inbucket official documentation
- GitHub repositories
- API reference materials
