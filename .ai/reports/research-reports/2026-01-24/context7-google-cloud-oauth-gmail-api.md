# Context7 Research: Google Cloud OAuth Setup for Gmail API (Desktop Application)

**Date**: 2026-01-24
**Agent**: context7-expert
**Libraries Researched**: 
- websites/developers_google_workspace
- googleapis/google-auth-library-nodejs
- google/oauth2l
- gongrzhe/gmail-mcp-server

## Query Summary

User needs current steps for:
1. Setting up OAuth consent screen in Google Cloud Console (2024-2025 interface)
2. Creating OAuth 2.0 Desktop app credentials for Gmail API
3. Downloading the credentials.json file

The user is seeing a new "OAuth Overview" page with "metrics" and "Project Checkup" sections, indicating they're on the newer Google Cloud Console interface.

## Important Note

Context7 primarily indexes library documentation from GitHub repositories, not Google Cloud Console UI documentation. The Google Cloud Console interface changes frequently and is not fully captured in library docs. However, I was able to extract the practical steps from multiple Google Workspace API quickstarts and authentication libraries.

## Findings

### Current Google Cloud Console OAuth Setup Process (2024-2025)

Based on the documentation from multiple Google Workspace API quickstarts, here is the current process:

#### Step 1: Enable the Gmail API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Library**
4. Search for "Gmail API" and click **Enable**

#### Step 2: Configure OAuth Consent Screen

The new interface has reorganized the OAuth settings. Here's the current path:

1. In Cloud Console, go to **APIs & Services** > **OAuth consent screen**
2. If you see "OAuth Overview" with metrics - look for a **Configure Consent Screen** or **Edit App** button
3. Select **User Type**:
   - **External**: For personal Gmail accounts (most common for CLI tools)
   - **Internal**: Only if using Google Workspace organization
4. Fill in required fields:
   - **App name**: Your application name (e.g., "Gmail CLI Tool")
   - **User support email**: Your email address
   - **Developer contact email**: Your email address
5. Click **Save and Continue**

#### Step 3: Add Scopes

1. Click **Add or Remove Scopes**
2. For Gmail API access, add these scopes:
   - `https://www.googleapis.com/auth/gmail.readonly` - Read-only access
   - `https://www.googleapis.com/auth/gmail.modify` - Read/write access
   - `https://www.googleapis.com/auth/gmail.labels` - Manage labels
   - `https://mail.google.com/` - Full access (if needed)
3. Click **Update** then **Save and Continue**

#### Step 4: Add Test Users (for External apps in Testing mode)

1. Click **Add Users**
2. Enter the Gmail addresses that will use the CLI tool
3. Click **Save and Continue**

**Note**: Apps in "Testing" mode are limited to 100 test users. For broader access, you'd need to publish and verify the app.

#### Step 5: Create OAuth 2.0 Client ID (Desktop Application)

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Application type**: **Desktop app**
4. Enter a name (e.g., "Gmail CLI Desktop Client")
5. Click **Create**

#### Step 6: Download credentials.json

1. After creation, a dialog appears with your Client ID and Client Secret
2. Click **Download JSON** button
3. Save the file as `credentials.json` in your working directory
4. Alternatively, find it later: **APIs & Services** > **Credentials** > click the download icon next to your OAuth client

### Code Examples for Using credentials.json

#### Node.js (Modern Approach)

```javascript
import path from 'node:path';
import process from 'node:process';
import {authenticate} from '@google-cloud/local-auth';
import {google} from 'googleapis';

// The scope for Gmail API access
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function authorize() {
  // Authenticate and get an authorized client
  const auth = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  return auth;
}

async function main() {
  const auth = await authorize();
  const gmail = google.gmail({version: 'v1', auth});
  
  // List labels as a test
  const res = await gmail.users.labels.list({userId: 'me'});
  console.log('Labels:', res.data.labels);
}

main();
```

#### Python (Modern Approach)

```python
import os.path
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# If modifying these scopes, delete token.json
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

def main():
    creds = None
    # token.json stores the user's access and refresh tokens
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    
    # If no valid credentials, let the user log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES
            )
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    
    # Build the Gmail service
    service = build('gmail', 'v1', credentials=creds)
    
    # List labels
    results = service.users().labels().list(userId='me').execute()
    labels = results.get('labels', [])
    print('Labels:', labels)

if __name__ == '__main__':
    main()
```

#### Go

```go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "os"

    "golang.org/x/oauth2"
    "golang.org/x/oauth2/google"
    "google.golang.org/api/gmail/v1"
    "google.golang.org/api/option"
)

func main() {
    ctx := context.Background()
    b, err := os.ReadFile("credentials.json")
    if err != nil {
        log.Fatalf("Unable to read client secret file: %v", err)
    }

    config, err := google.ConfigFromJSON(b, gmail.GmailReadonlyScope)
    if err != nil {
        log.Fatalf("Unable to parse client secret file: %v", err)
    }
    
    client := getClient(config)
    srv, err := gmail.NewService(ctx, option.WithHTTPClient(client))
    if err != nil {
        log.Fatalf("Unable to retrieve Gmail client: %v", err)
    }

    // List labels
    r, err := srv.Users.Labels.List("me").Do()
    if err != nil {
        log.Fatalf("Unable to retrieve labels: %v", err)
    }
    
    for _, l := range r.Labels {
        fmt.Printf("- %s\n", l.Name)
    }
}
```

### credentials.json File Format

The downloaded `credentials.json` for a Desktop app looks like this:

```json
{
  "installed": {
    "client_id": "123456789-abcdefg.apps.googleusercontent.com",
    "project_id": "your-project-id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "GOCSPX-your-client-secret",
    "redirect_uris": ["http://localhost"]
  }
}
```

**Note**: Desktop apps use `"installed"` as the top-level key, while web apps use `"web"`.

### Common Gmail API Scopes

| Scope | Description |
|-------|-------------|
| `https://www.googleapis.com/auth/gmail.readonly` | Read-only access to mailbox |
| `https://www.googleapis.com/auth/gmail.modify` | Read, send, delete, manage labels |
| `https://www.googleapis.com/auth/gmail.compose` | Create and send messages only |
| `https://www.googleapis.com/auth/gmail.send` | Send messages only |
| `https://www.googleapis.com/auth/gmail.labels` | Manage labels |
| `https://mail.google.com/` | Full access (requires verification) |

### Troubleshooting the New Console Interface

If you're seeing "OAuth Overview" with metrics:

1. **Look for "Branding" or "Data Access" tabs** - The consent screen settings may be under these
2. **Check the sidebar** - There should be tabs like:
   - OAuth overview
   - Branding
   - Audience (where you set Internal/External)
   - Data access (where you add scopes)
   - Credentials
3. **If in "Testing" status**: Your app only works for added test users
4. **"Publish App" button**: Makes the app available to any Google account (requires verification for sensitive scopes)

### Using oauth2l CLI Tool (Alternative)

If you already have credentials.json, you can test with Google's oauth2l tool:

```bash
# Install
brew install oauth2l  # macOS
# or
pip install google-oauth2l

# Fetch a token
oauth2l fetch --credentials ~/credentials.json --scope gmail.readonly

# Use with curl
curl -H "$(oauth2l header --credentials ~/credentials.json --scope gmail.readonly)" \
  https://gmail.googleapis.com/gmail/v1/users/me/labels
```

## Key Takeaways

1. **Desktop app credentials** use `"installed"` key in credentials.json (not `"web"`)
2. **OAuth consent screen** is now split into multiple tabs (Branding, Audience, Data access)
3. **Testing mode** limits apps to 100 explicitly added test users
4. **First run** opens browser for OAuth flow, then saves refresh token to `token.json`
5. **Sensitive scopes** (like full Gmail access) require Google verification for production
6. The credentials.json file contains your **client_id** and **client_secret** - keep it secure

## Sources

- Google Workspace Developers Documentation via Context7 (/websites/developers_google_workspace)
- google-auth-library-nodejs via Context7 (/googleapis/google-auth-library-nodejs)
- google/oauth2l via Context7 (/google/oauth2l)
- Gmail MCP Server via Context7 (/gongrzhe/gmail-mcp-server)

## Recommendation

For the most up-to-date Google Cloud Console UI steps, the official quickstart guides are:
- https://developers.google.com/gmail/api/quickstart/python
- https://developers.google.com/gmail/api/quickstart/nodejs
- https://developers.google.com/gmail/api/quickstart/go

These quickstarts include current screenshots and are updated when the Console UI changes.
