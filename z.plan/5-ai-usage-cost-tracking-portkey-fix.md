# AI Usage Cost Tracking - Portkey Gateway Integration Fix

## Table of Contents

1. [Issue Summary](#1-issue-summary)
2. [Root Cause Analysis](#2-root-cause-analysis)
3. [Portkey Documentation Research](#3-portkey-documentation-research)
4. [Implementation Plan](#4-implementation-plan)
5. [Technical Details](#5-technical-details)
6. [Testing Strategy](#6-testing-strategy)
7. [Future Considerations](#7-future-considerations)

## 1. Issue Summary

When using the Canvas Editor feature at `/home/ai/canvas` and clicking the "Generate Suggestions" button, the following error occurs:

```
web:dev:  ✓ Compiled /home/ai/canvas in 2.2s
web:dev:  GET /home/ai/canvas?id=4f4836f7-d142-4c57-9da0-0758e308d847 200 in 2318ms
web:dev:  POST /home/ai/canvas?id=4f4836f7-d142-4c57-9da0-0758e308d847 200 in 85ms
web:dev: Ideas Request: {
web:dev:   contentLength: 34,
web:dev:   userId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
web:dev:   submissionId: '4f4836f7-d142-4c57-9da0-0758e308d847',
web:dev:   type: 'situation'
web:dev: }
web:dev: OpenAI API Error: {
web:dev:   status: 400,
web:dev:   message: '400 Unrecognized request argument supplied: config',
web:dev:   code: null,
web:dev:   type: 'invalid_request_error'
web:dev: }
web:dev: Error in ideas action: Error: 400 Unrecognized request argument supplied: config
```

This error prevents the Canvas Editor from generating AI suggestions when requested by the user. The error appears to be related to the Portkey AI Gateway integration and specifically how configuration parameters are being passed to the OpenAI API.

## 2. Root Cause Analysis

After examining the code, we identified that the error occurs in the OpenAI client request when using the Portkey AI Gateway. Specifically:

1. In `apps/web/app/home/(user)/ai/canvas/_actions/generate-ideas.ts`, we are:

   - Creating a configuration object using `createBalancedOptimizedConfig`
   - Normalizing the config using `ConfigManager.normalizeConfig`
   - Passing this config directly to `getChatCompletion` as a parameter in the options object

2. In `packages/ai-gateway/src/index.ts`, we see that:
   - The config parameter from options is being directly added to the `requestOptions` object
   - This object is then passed directly to `client.chat.completions.create(requestOptions)`
   - The OpenAI API doesn't recognize the `config` parameter in the request body, causing the 400 error

The root cause is that we're incorrectly passing the Portkey configuration object as part of the OpenAI API request body, rather than handling it properly via headers as required by the Portkey AI Gateway.

## 3. Portkey Documentation Research

We researched the official Portkey documentation to understand the correct way to integrate with their AI Gateway. Key findings:

1. **Header-Based Configuration**:

   - Portkey configurations should be passed via headers, not in the request body
   - The `portkey-ai` package provides a `createHeaders` function specifically to handle this properly

2. **Proper OpenAI Client Configuration**:

   ```javascript
   import OpenAI from 'openai';
   import { PORTKEY_GATEWAY_URL, createHeaders } from 'portkey-ai';

   const openai = new OpenAI({
     apiKey: 'OPENAI_API_KEY', // Optional when using virtual keys
     baseURL: PORTKEY_GATEWAY_URL,
     defaultHeaders: createHeaders({
       provider: 'openai',
       apiKey: 'PORTKEY_API_KEY',
       config: config, // Config object or config ID
     }),
   });
   ```

3. **Configuration Options**:

   - Configurations can be passed as a string ID or as a JSON object
   - When passing as a JSON object, it should still be included in the headers, not the request body
   - The `config` parameter supports advanced routing, caching, retries, and fallback strategies

4. **Custom Headers**:
   - Additional custom headers can be added for tracking and analytics
   - Headers like `x-portkey-request-metadata-*` can be used for custom metadata

## 4. Implementation Plan

Our plan to fix the issue consists of three main steps:

1. **Update the Enhanced Gateway Client**:

   - Import and use the `createHeaders` function from the `portkey-ai` package
   - Pass the config object to `createHeaders` instead of directly to the request body
   - Maintain our custom metadata headers for tracking

2. **Fix Request Parameters**:

   - Remove the config parameter from the OpenAI API request options
   - Ensure all other parameters are correctly passed to the API

3. **Update Dependencies**:
   - Verify that the `portkey-ai` package is correctly installed and imported
   - Ensure version compatibility between all required packages

## 5. Technical Details

### 5.1 Enhanced Gateway Client Update

We'll update `packages/ai-gateway/src/enhanced-gateway-client.ts` to:

```typescript
import OpenAI from 'openai';
import { PORTKEY_GATEWAY_URL, createHeaders } from 'portkey-ai';

interface PortkeyClientOptions {
  userId?: string;
  teamId?: string;
  feature?: string;
  sessionId?: string;
  config?: any; // The config object or ID
}

/**
 * Creates an OpenAI client configured to use Portkey with tracking metadata
 *
 * @param options Tracking metadata and config options
 * @returns OpenAI Configured OpenAI client
 */
export function createGatewayClient(options: PortkeyClientOptions = {}) {
  const { userId, teamId, feature, sessionId, config } = options;

  // Create headers using Portkey's official function
  const headers = createHeaders({
    provider: 'openai',
    apiKey: process.env.PORTKEY_API_KEY || '',
    // Include the configuration properly as a header parameter
    config: config,
  });

  // Add our custom tracking metadata
  if (userId) headers['x-portkey-request-metadata-user-id'] = userId;
  if (teamId) headers['x-portkey-request-metadata-team-id'] = teamId;
  if (feature) headers['x-portkey-request-metadata-feature'] = feature;
  if (sessionId) headers['x-portkey-trace-id'] = sessionId;

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '', // Can be empty when using virtual keys
    baseURL: PORTKEY_GATEWAY_URL,
    defaultHeaders: headers,
  });
}
```

### 5.2 Index.ts Update

We'll update `packages/ai-gateway/src/index.ts` to remove the config from the request body:

```typescript
// In getChatCompletion function
const client = createGatewayClient({
  userId,
  teamId,
  feature,
  sessionId,
  config, // Pass config here instead of in requestOptions
});

// Configure request options WITHOUT the config parameter
const requestOptions: any = {
  messages,
  model,
  temperature,
  // Remove the config property, as it's now handled by createHeaders
};

const response = await client.chat.completions.create(requestOptions);
```

### 5.3 Package.json Update

Verify `packages/ai-gateway/package.json` includes the proper dependency:

```json
{
  "dependencies": {
    "portkey-ai": "^0.1.0",
    "openai": "^4.28.0"
    // ...other dependencies
  }
}
```

## 6. Testing Strategy

We'll test our changes using the following approach:

### 6.1 Unit Tests

1. Verify that `createGatewayClient` correctly integrates the config parameter in headers
2. Ensure the OpenAI client is properly configured with the Portkey gateway URL
3. Confirm that metadata headers are correctly added to the request

### 6.2 Integration Tests

1. Test the Canvas Editor's "Generate Suggestions" functionality:

   - Create a new presentation
   - Edit an existing presentation
   - Generate suggestions for different sections

2. Verify that API calls succeed without the 400 error
3. Confirm that usage tracking data is correctly recorded in the database

### 6.3 Monitoring

1. Add additional logging to verify configuration parameters are correctly processed:

   ```typescript
   console.log('Portkey Gateway Headers:', headers);
   ```

2. Monitor API responses for any new or different error patterns
3. Verify cost tracking is functioning correctly

## 7. Future Considerations

1. **Advanced Error Handling**:

   - Implement more robust error handling for Portkey-specific errors
   - Add fallback mechanisms for when the Portkey Gateway is unavailable

2. **Configuration Management**:

   - Consider creating a centralized repository of Portkey configurations
   - Implement a mechanism to select configurations based on features or requirements

3. **Performance Optimization**:

   - Evaluate caching strategies to reduce redundant API calls
   - Monitor and optimize API request timing

4. **Documentation**:

   - Update internal documentation to reflect the correct Portkey integration patterns
   - Create examples for future developers to follow

5. **Monitoring and Analytics**:
   - Set up additional monitoring for Portkey API usage
   - Create analytics dashboards for tracking API costs and usage patterns
