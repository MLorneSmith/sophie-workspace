# Perplexity Research: Cloudflare Zero Trust Service Tokens (Service Credentials)

**Date**: 2026-03-04
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary
Researched how to create and use Cloudflare Zero Trust service tokens/credentials in the current dashboard UI, including:
1. Step-by-step creation in the current "Access Controls > Service Credentials" navigation
2. Associating tokens with specific Access applications via Service Auth policies
3. HTTP header usage for API calls (CF-Access-Client-Id, CF-Access-Client-Secret)

## Terminology Clarification

In the current Cloudflare Zero Trust dashboard (2025/2026), what you see as **"Access Controls > Service Credentials"** in the sidebar is the parent navigation section. Under it, **"Service Tokens"** is the subsection where you create and manage tokens. The official documentation URL confirms this hierarchy:

```
https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/
```

So "Service Credentials" is the category, and "Service Tokens" is the specific feature within it.

## Findings

### Part 1: Creating a Service Token

**Navigation Path**: Cloudflare One dashboard > **Access Controls** > **Service Credentials** > **Service Tokens**

1. In the [Cloudflare One dashboard](https://one.dash.cloudflare.com/), navigate to **Access Controls** > **Service Credentials** > **Service Tokens**
2. Click **Create Service Token**
3. Enter a **name** for the service token (used for identification in logs and for individual revocation)
4. Choose a **Service Token Duration** (expiration options: 1 year, 2 years, 5 years, 10 years, or Non-expiring)
5. Click **Generate token**
6. **CRITICAL**: Copy both the **Client ID** and **Client Secret** immediately. The Client Secret will NOT be shown again after you close this dialog.

The dashboard displays the values in header format:
```
CF-Access-Client-Id: <your-client-id>.access
CF-Access-Client-Secret: <your-client-secret>
```

### Part 2: Associating with a Specific Application (e.g., gateway.slideheroes.com)

This is the step most people miss. You must create a **Service Auth** policy on the Access Application -- not an "Allow" policy.

1. Navigate to **Access** > **Applications** in the Cloudflare One dashboard
2. Find the application for `gateway.slideheroes.com` and click **Edit**
3. Go to the **Policies** tab
4. Click **Add a policy** (you need a NEW, separate policy -- do NOT add the service token to an existing user-based policy)
5. Configure the policy:
   - **Policy Name**: Give it a descriptive name (e.g., "API Service Access")
   - **Action**: Select **Service Auth** (NOT "Allow" -- this is the critical setting)
   - **Session Duration**: "No duration" is recommended for service tokens
   - Optionally check **401 Response** if you want a 401 instead of a redirect when auth fails
6. Under **Configure rules** > **Include**:
   - **Selector**: Choose **Service Token**
   - **Value**: Select the service token you created in Part 1
7. Click **Save policy**, then **Save application**

**Common Mistake**: Setting the action to "Allow" instead of "Service Auth" will cause Cloudflare to redirect to the identity provider login page, even when valid service token headers are present. This is the #1 issue people encounter.

**Policy Execution Order**: Service Auth policies are evaluated FIRST, before Bypass, Allow, and Block policies.

### Part 3: Making API Calls with the Service Token

#### Initial Request

Add both headers to your HTTP request:

```bash
curl -H "CF-Access-Client-Id: <CLIENT_ID>" \
     -H "CF-Access-Client-Secret: <CLIENT_SECRET>" \
     https://gateway.slideheroes.com/your-endpoint
```

#### What Happens on Success

If the service token is valid, Cloudflare Access:
1. Validates the token against the Service Auth policy
2. Generates a JWT scoped to the application
3. Returns the JWT as a `CF_Authorization` cookie in the response
4. Returns HTTP 200 (or your application's response)

#### Subsequent Requests (Two Options)

**Option A**: Continue sending both headers on every request (simplest, always works):
```bash
curl -H "CF-Access-Client-Id: <CLIENT_ID>" \
     -H "CF-Access-Client-Secret: <CLIENT_SECRET>" \
     https://gateway.slideheroes.com/your-endpoint
```

**Option B**: Use the JWT from the first response (only works if you also have at least one Allow policy):
```bash
curl -H "cookie: CF_Authorization=<JWT_TOKEN>" \
     https://gateway.slideheroes.com/your-endpoint
```

Or as a raw header:
```bash
curl -H "cf-access-token: <JWT_TOKEN>" \
     https://gateway.slideheroes.com/your-endpoint
```

**Important Note**: If your Access application ONLY has Service Auth policies (no Allow policies), you MUST send the service token headers on EVERY request. The JWT cookie approach only works when there is at least one Allow policy configured on the application.

#### Single-Header Alternative (for services that only support one custom header)

If the consuming service can only send one custom header (e.g., only `Authorization`), you can configure the Access application via API:

```bash
# 1. Get existing app config
curl -X GET \
  "https://api.cloudflare.com/client/v4/accounts/{account_id}/access/apps/{app_id}" \
  -H "Authorization: Bearer <API_TOKEN>"

# 2. Update to use single header (include ALL existing fields to avoid overwriting)
curl -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/{account_id}/access/apps/{app_id}" \
  -H "Authorization: Bearer <API_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "gateway.slideheroes.com",
    "type": "self_hosted",
    "read_service_tokens_from_header": "Authorization",
    ... (all other existing fields)
  }'

# 3. Then authenticate with single header
curl -H 'Authorization: {"CF-Access-Client-Id": "<CLIENT_ID>", "CF-Access-Client-Secret": "<CLIENT_SECRET>"}' \
  https://gateway.slideheroes.com/your-endpoint
```

### Token Management

- **Renewal**: Service tokens can be renewed before expiration from the same Service Tokens page
- **Revocation**: Delete the service token to permanently revoke access. Note: "Revoke existing tokens" on an application only revokes sessions, not the service token itself -- the token can still create new sessions until deleted
- **API Permission**: Managing service tokens via API requires `Access: Service Tokens Write` permission
- **Terraform**: Use the `cloudflare_zero_trust_access_service_token` resource

## Sources & Citations
- [Service tokens - Cloudflare One docs](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/)
- [cloudflare-docs GitHub - service-tokens.mdx](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/cloudflare-one/identity/service-tokens.mdx)
- [How to Use Service Auth on Cloudflare Access (blog)](https://blog.jamisonkissh.com/selfhosting/cloudflare-service-auth/)
- [Access policies - Service Auth action](https://developers.cloudflare.com/cloudflare-one/policies/access/#service-auth)
- [Community discussion on Service Auth troubleshooting](https://www.answeroverflow.com/m/1148772330848391269)
- [GitHub cloudflared issues #602, #1104](https://github.com/cloudflare/cloudflared/issues/602)

## Key Takeaways
- "Service Credentials" is the parent category in the current sidebar; "Service Tokens" is the feature underneath it
- The #1 mistake is using "Allow" action instead of "Service Auth" action on the Access application policy
- Service Auth policies are evaluated first in policy execution order
- Always copy the Client Secret immediately -- it is shown only once
- For service-only access (no human users), send both headers on every request
- The JWT cookie approach for subsequent requests only works if at least one Allow policy exists

## Related Searches
- Cloudflare Access policy execution order and precedence
- Cloudflare service token rotation best practices
- Cloudflare Access with Terraform automation
- CF_Authorization JWT token validation and verification
