# Context7 Research: Ragie RAG-as-a-Service SDK

**Date**: 2026-01-23
**Agent**: alpha-context7
**Spec Directory**: .ai/alpha/specs/pending-Spec-ragie-presentation-import
**Libraries Researched**: ragieai/ragie-typescript, websites/ragie_ai

## Query Summary

Researched Ragie RAG-as-a-Service SDK documentation for implementing presentation import functionality in SlideHeroes. Focus areas included:
1. Document ingestion (especially presentations: PPTX, PPT, PDF, Keynote)
2. Partition feature for multi-tenant data isolation
3. Retrieval API for querying indexed content
4. Document metadata and management (listing, deleting)
5. SDK installation and setup for Next.js
6. Rate limits and pricing considerations
7. Slide/page extraction capabilities

## Findings

### 1. SDK Installation and Setup

**Package Installation** (pnpm - matches SlideHeroes monorepo):
```bash
pnpm add ragie
```

**Note**: For yarn users, zod peer dependency must be explicitly installed:
```bash
yarn add ragie zod
```

**SDK Initialization**:
```typescript
import { Ragie } from "ragie";

const ragie = new Ragie({
  auth: "<YOUR_BEARER_TOKEN_HERE>",  // API key from Ragie dashboard
});
```

**Tree-Shaking Optimized Approach** (recommended for Next.js):
```typescript
import { RagieCore } from "ragie/core.js";
import { documentsCreate } from "ragie/funcs/documentsCreate.js";

// Single instance across application
const ragie = new RagieCore({
  auth: process.env.RAGIE_API_KEY!,
});
```

**Environment Setup**:
```env
RAGIE_API_KEY=your-api-key-here
```

### 2. Document Ingestion

#### Creating Documents from Files

```typescript
import { openAsBlob } from "node:fs";
import { Ragie } from "ragie";

const ragie = new Ragie({
  auth: process.env.RAGIE_API_KEY!,
});

// Upload file (supports PPTX, PDF, and many other formats)
const result = await ragie.documents.create({
  file: await openAsBlob("presentation.pptx"),
  partition: "tenant_123",  // Optional: for multi-tenant isolation
  metadata: {
    source: "upload",
    fileType: "presentation",
    uploadedBy: "user_456"
  }
});

// Document goes through status progression:
// uploading -> partitioning -> processing -> indexed -> ready
console.log(result.id);     // Document ID
console.log(result.status); // Processing status
```

#### Creating Documents from URL

```typescript
const result = await ragie.documents.createDocumentFromUrl({
  partition: "tenant_123",
  url: "https://example.com/presentation.pdf",
});
```

#### Creating Raw Text Documents

```typescript
const result = await ragie.documents.createRaw({
  partition: "tenant_123",
  data: "Raw text content to index..."
});
```

#### Partition Strategies for Different File Types

When creating documents, you can specify processing strategies:

```typescript
const result = await ragie.documents.create({
  file: fileBlob,
  partition: "tenant_123",
  partitionStrategy: {
    static: "hi_res",     // For text documents: detailed extraction with images/tables
    audio: true,          // Process audio files
    video: "video_only"   // For video: "audio_only", "video_only", or true for both
  }
});
```

**Processing Modes**:
- `fast`: Text-only extraction, ~20x faster (skips images/tables)
- `hi_res`: Full extraction including images, tables, and layout

#### Supported File Formats

Based on the documentation, Ragie supports:
- **Presentations**: PPTX, PDF (presentations converted to PDF)
- **Documents**: PDF, DOCX, TXT, and standard office formats
- **Media**: MP3, MP4, video files (with audio transcription)
- **Note**: Keynote files typically need conversion to PDF/PPTX first

### 3. Document Status and Polling

```typescript
const document = await ragie.documents.get({
  documentId: "21881de1-65f7-4816-b571-3ef69661c375",
  partition: "tenant_123"
});

// Status values: uploading, partitioning, processing, indexed, ready, failed
console.log(document.status);
console.log(document.chunkCount);  // Number of chunks after processing
console.log(document.pageCount);   // Number of pages detected

// Polling until ready
while (document.status !== "ready" && document.status !== "failed") {
  await new Promise(resolve => setTimeout(resolve, 2000));
  document = await ragie.documents.get({
    documentId: document.id,
    partition: "tenant_123"
  });
}
```

### 4. Partition Feature for Multi-Tenant Isolation

Partitions provide data isolation for multi-tenant applications - perfect for SlideHeroes' team accounts.

#### Creating Partitions

Partitions are created implicitly when documents are added, or explicitly:

```typescript
// Explicit partition creation with limits
const partition = await ragie.partitions.create({
  partitionId: "org_acme_corp",
  limits: {
    pagesProcessedLimitMonthly: 10000,
    pagesHostedLimitMonthly: 50000,
    pagesProcessedLimitMax: 100000,
    pagesHostedLimitMax: 500000
  }
});
```

#### Working with Partitions

```typescript
// Upload document to specific partition (tenant)
const document = await ragie.documents.create({
  file: fileBlob,
  name: "Q4 Sales Presentation",
  partition: "org_acme_corp",
  metadata: {
    tenant_id: "acme_corp",
    uploaded_by: "user_123"
  }
});

// Retrieve within partition scope
const results = await ragie.retrievals.retrieve({
  query: "customer contracts",
  partition: "org_acme_corp",  // Scoped to this tenant only
  filter: {
    tenant_id: "acme_corp"    // Additional metadata filter
  }
});
```

#### Checking Partition Usage

```typescript
const usage = await ragie.partitions.get({
  partitionId: "org_acme_corp"
});

console.log(`Pages processed this month: ${usage.stats.pagesProcessedMonthly}`);
console.log(`Pages hosted this month: ${usage.stats.pagesHostedMonthly}`);
console.log(`Total documents: ${usage.stats.documentCount}`);

if (usage.limitExceededAt) {
  console.warn(`Partition limited since: ${usage.limitExceededAt}`);
}
```

#### Deleting Partitions

```typescript
// Delete partition and ALL its documents
await ragie.partitions.delete({ partitionId: "org_acme_corp" });
```

### 5. Retrieval API

#### Basic Retrieval

```typescript
const results = await ragie.retrievals.retrieve({
  query: "What are the 3 main points of the presentation?",
  partition: "tenant_123",
});

// Results contain scored chunks
results.scoredChunks.forEach(chunk => {
  console.log({
    text: chunk.text,
    score: chunk.score,
    documentId: chunk.documentId,
    documentName: chunk.documentName,
    metadata: chunk.documentMetadata
  });
});
```

#### Advanced Retrieval with Filters

```typescript
// Metadata filters using MongoDB-style operators
const results = await ragie.retrievals.retrieve({
  query: "quarterly results",
  partition: "tenant_123",
  filter: {
    $and: [
      { fileType: { $eq: "presentation" } },
      { year: { $gte: 2024 } }
    ]
  }
});

// OR conditions
const results = await ragie.retrievals.retrieve({
  query: "sales data",
  filter: {
    $or: [
      { department: { $eq: "sales" } },
      { department: { $eq: "marketing" } }
    ]
  },
  partition: "tenant_123"
});

// IN operator for multiple values
const results = await ragie.retrievals.retrieve({
  query: "project updates",
  filter: {
    status: { $in: ["active", "pending"] }
  },
  partition: "tenant_123"
});
```

#### Summary Index for Diverse Results

To get results from multiple documents instead of clustering in one:

```typescript
const results = await ragie.retrievals.retrieve({
  query: "product features",
  topK: 24,
  maxChunksPerDocument: 2,  // Max 2 chunks per doc = ~12 different documents
  partition: "tenant_123"
});
```

#### Getting Document Summaries

```typescript
const summary = await ragie.documents.getSummary({
  documentId: "doc_id_here",
  partition: "tenant_123"
});

console.log(summary.text);  // LLM-generated summary of entire document
```

### 6. Document Chunks and Pages

#### Retrieving Document Chunks

```typescript
// Get specific range of chunks
const chunks = await ragie.documents.getChunks({
  documentId: "doc_id",
  startIndex: 0,
  endIndex: 10,
  partition: "tenant_123"
});

// Each chunk contains:
chunks.forEach(chunk => {
  console.log({
    id: chunk.id,
    index: chunk.index,
    text: chunk.text,
    metadata: chunk.metadata,  // May include start_time, end_time for media
    links: chunk.links         // URLs for content access
  });
});
```

#### Getting Individual Chunk

```typescript
const chunk = await ragie.documents.getChunk({
  documentId: "doc_id",
  chunkId: "chunk_id",
  partition: "tenant_123"
});

// For presentations/PDFs, chunks may correlate to slides/pages
// metadata.page_number or similar may be available
```

### 7. Document Management

#### Listing Documents

```typescript
// List with filters and pagination
const result = await ragie.documents.list({
  partition: "tenant_123",
  filter: JSON.stringify({
    department: { $in: ["sales", "marketing"] }
  })
});

for await (const page of result) {
  page.documents.forEach(doc => {
    console.log({
      id: doc.id,
      name: doc.name,
      status: doc.status,
      createdAt: doc.createdAt,
      metadata: doc.metadata
    });
  });
}
```

#### Updating Document Metadata

```typescript
await ragie.documents.patchMetadata({
  documentId: "doc_id",
  partition: "tenant_123",
  patchDocumentMetadataParams: {
    metadata: {
      title: "Updated Title",
      published: true,
      tags: ["sales", "q4"],
      // Set to null to delete a key
      oldKey: null
    }
  }
});
```

#### Deleting Documents

```typescript
await ragie.documents.delete({
  documentId: "doc_id",
  partition: "tenant_123"
});
```

#### Updating Document File

```typescript
// Replace document content with new file
await ragie.documents.updateFile({
  documentId: "doc_id",
  partition: "tenant_123",
  file: newFileBlob,
  partitionStrategy: {
    static: "hi_res"
  }
});
```

### 8. Rate Limits by Plan

| Endpoint | Developer | Starter | Pro | Enterprise |
|----------|-----------|---------|-----|------------|
| GET /documents | 1000/min | 2000/min | 4000/min | Custom |
| GET /documents/{id} | 1000/min | 2000/min | 4000/min | Custom |
| GET /documents/{id}/summary | 10/min | 500/min | 1000/min | Custom |
| GET /documents/{id}/source | 10/min | 500/min | 1000/min | Custom |
| GET /documents/{id}/chunks | 10/min | 500/min | 1000/min | Custom |
| GET /instructions/{id}/entities | 10/min | 500/min | 1000/min | Custom |

### 9. Webhooks for Status Updates

Register webhooks to receive real-time notifications:

**Event Types**:
- `document_status_updated`: Document processing status changes (ready, failed)
- `entity_extracted`: Entities extracted from document
- `connection_sync_finished`: Data source sync complete
- `partition_limit_exceeded`: Partition usage limit reached

**Webhook Payload Example**:
```json
{
  "nonce": "unique_event_id_123",
  "type": "document_status_updated",
  "document_id": "doc_abc456",
  "status": "ready"
}
```

### 10. Integration with OpenAI for RAG

```typescript
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const response = await ragie.retrievals.retrieve({
  query: "What are the 3 main points of the presentation?",
  partition: "tenant_123"
});

const sources = response.scoredChunks.map((chunk) => ({
  ...chunk.documentMetadata,
  text: chunk.text,
  documentName: chunk.documentName,
  // For media files, includes timing info
  startTime: chunk.metadata?.start_time,
  endTime: chunk.metadata?.end_time,
}));

const { text } = await generateText({
  model: openai('gpt-4o'),
  prompt: `Answer the user question using the provided sources: ${JSON.stringify(sources)}`,
});
```

## Key Takeaways

1. **Multi-Tenant Ready**: Partitions provide excellent data isolation for team accounts in SlideHeroes. Use `accountId` as partition name.

2. **Presentation Support**: PPTX and PDF are supported. Keynote files need conversion. Documents are chunked automatically.

3. **Async Processing**: Documents go through multiple status stages. Implement polling or use webhooks for status updates.

4. **Flexible Retrieval**: MongoDB-style filters work with metadata. Use `maxChunksPerDocument` for diverse results across presentations.

5. **Rate Limits**: Developer tier has lower limits (10/min for summaries/chunks). Plan for Pro tier for production.

6. **Tree-Shaking**: Use `RagieCore` and standalone functions for optimal Next.js bundle size.

7. **Slide/Page Extraction**: Chunks may correlate to pages/slides. Use `getChunks` to iterate through presentation content.

## Code Examples for SlideHeroes Implementation

### Server Action for Presentation Upload

```typescript
// apps/web/app/home/[account]/presentations/_lib/server/upload-presentation.action.ts
'use server';

import { enhanceAction } from '@kit/next/actions';
import { RagieCore } from 'ragie/core.js';
import { documentsCreate } from 'ragie/funcs/documentsCreate.js';
import { z } from 'zod';

const ragie = new RagieCore({
  auth: process.env.RAGIE_API_KEY!,
});

const UploadPresentationSchema = z.object({
  accountId: z.string().uuid(),
  file: z.instanceof(Blob),
  fileName: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export const uploadPresentation = enhanceAction(
  async (data) => {
    const result = await documentsCreate(ragie, {
      file: data.file,
      partition: data.accountId,  // Multi-tenant isolation
      metadata: {
        fileName: data.fileName,
        source: 'slideheroes_upload',
        ...data.metadata,
      },
    });

    if (!result.ok) {
      throw result.error;
    }

    return {
      success: true,
      documentId: result.value.id,
      status: result.value.status,
    };
  },
  { schema: UploadPresentationSchema }
);
```

### Server Action for Retrieval

```typescript
// apps/web/app/home/[account]/presentations/_lib/server/search-presentations.action.ts
'use server';

import { RagieCore } from 'ragie/core.js';
import { retrievalsRetrieve } from 'ragie/funcs/retrievalsRetrieve.js';

const ragie = new RagieCore({
  auth: process.env.RAGIE_API_KEY!,
});

export async function searchPresentations(accountId: string, query: string) {
  const result = await retrievalsRetrieve(ragie, {
    query,
    partition: accountId,
    maxChunksPerDocument: 3,  // Spread across presentations
  });

  if (!result.ok) {
    throw result.error;
  }

  return result.value.scoredChunks.map(chunk => ({
    text: chunk.text,
    score: chunk.score,
    documentId: chunk.documentId,
    documentName: chunk.documentName,
    metadata: chunk.documentMetadata,
  }));
}
```

## Sources

- Ragie TypeScript SDK via Context7 (ragieai/ragie-typescript)
- Ragie Documentation Website via Context7 (websites/ragie_ai)
- https://docs.ragie.ai/
- https://github.com/ragieai/ragie-typescript
