# Payload CMS Utilities

This directory contains utilities for interacting with Payload CMS.

## Purpose

These utilities provide a robust interface for:

1. Authenticating with Payload CMS
2. Creating, reading, updating, and deleting content
3. Handling batch operations efficiently
4. Managing error conditions and retry logic

## Key Utilities

- `enhanced-payload-client.ts`: A robust client for the Payload CMS API with retry logic and token caching

## Usage Examples

### Basic Usage

```typescript
import { getEnhancedPayloadClient } from './enhanced-payload-client';

// Get a client instance
const client = await getEnhancedPayloadClient();

// Find documents
const { docs, totalDocs } = await client.find({
  collection: 'posts',
  limit: 100,
  query: { status: 'published' },
});

// Create a document
const newPost = await client.create({
  collection: 'posts',
  data: {
    title: 'New Post',
    content:
      '{"root":{"children":[{"children":[{"text":"Hello World"}],"type":"paragraph"}]}}',
    status: 'draft',
  },
});

// Update a document
await client.update({
  collection: 'posts',
  id: newPost.id,
  data: { status: 'published' },
});
```

### Batch Operations

```typescript
import { getEnhancedPayloadClient } from './enhanced-payload-client';

// Get a client instance
const client = await getEnhancedPayloadClient();

// Batch create documents
const posts = await client.batchCreate({
  collection: 'posts',
  data: postsToCreate,
  batchSize: 10, // Process 10 items at a time
});
```

## Features

- **Automatic Authentication**: Handles login and token management automatically
- **Token Caching**: Caches auth tokens to reduce authentication requests
- **Retry Logic**: Automatically retries failed requests with exponential backoff
- **Error Handling**: Detailed error messages and proper exception handling

## Environment Configuration

The Payload client requires several environment variables to be set:

```
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
PAYLOAD_ADMIN_EMAIL=admin@example.com
PAYLOAD_ADMIN_PASSWORD=complexpassword
```

These variables are loaded from `.env.development` or `.env.production` based on the `NODE_ENV` environment variable.

## Best Practices

When using these utilities:

1. Reuse client instances when making multiple operations
2. Use batch operations for creating or updating multiple items
3. Handle errors appropriately at the application level
4. Consider using transactions or retry logic for critical operations
5. Use appropriate query limits to avoid performance issues
