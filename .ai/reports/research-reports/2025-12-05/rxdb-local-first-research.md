# Context7 Research: RxDB for Local-First Applications

**Date**: 2025-12-05
**Agent**: context7-expert
**Libraries Researched**: pubkey/rxdb
**Version**: latest

## Query Summary

Comprehensive research into RxDB capabilities for building local-first presentation applications, focusing on:
1. Dexie.js storage adapter integration
2. Conflict resolution mechanisms (field-level LWW)
3. Encryption plugin capabilities
4. React hooks integration (rxdb-hooks)
5. PostgreSQL/Supabase synchronization
6. Storage quota management and eviction policies

## Executive Summary

RxDB is a powerful offline-first database for JavaScript applications with excellent support for:
- **Multiple storage adapters** including Dexie.js for IndexedDB
- **Flexible conflict resolution** with custom handlers supporting field-level strategies
- **Strong encryption** via crypto-js and Web Crypto API plugins
- **React integration** via observable queries and middleware hooks
- **Native Supabase replication** with built-in plugin
- **Storage management** with quota estimation and key compression

**Key Finding for Presentation App**: RxDB + Dexie + Supabase replication is production-ready for hybrid local-first architectures with field-level conflict resolution.

## 1. RxDB with Dexie.js Storage Adapter

### Overview

RxDB supports Dexie.js as a storage adapter via the `storage-dexie` plugin, providing a high-performance IndexedDB layer.

### Basic Setup

```javascript
import { createRxDatabase } from 'rxdb/plugins/core';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

const db = await createRxDatabase({
    name: 'exampledb',
    storage: getRxStorageDexie()
});
```

### With Collections

```javascript
await db.addCollections({
    presentations: {
        schema: {
            version: 0,
            type: 'object',
            primaryKey: 'id',
            properties: {
                id: { type: 'string', maxLength: 100 },
                title: { type: 'string' },
                slides: { type: 'array', items: { type: 'object' } },
                updatedAt: { type: 'number' }
            },
            required: ['id', 'title']
        }
    }
});
```

### Dexie Cloud Integration (Optional)

RxDB can also integrate with Dexie Cloud for automatic sync:

```javascript
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import dexieCloud from 'dexie-cloud-addon';

const db = await createRxDatabase({
    name: 'mydb',
    storage: getRxStorageDexie()
});
```

### Key Benefits

- **Performance**: Dexie provides optimized IndexedDB access
- **Reliability**: Well-tested in production environments
- **Browser Support**: Works across all modern browsers
- **Storage Limits**: ~500MB-1GB+ depending on browser

## 2. Conflict Resolution Capabilities

### Default Conflict Handler

RxDB provides a default conflict handler that always uses the master (server) state:

```typescript
import { deepEqual } from 'rxdb/plugins/utils';

export const defaultConflictHandler: RxConflictHandler<any> = {
    isEqual(a, b) {
        // Deep equality check (CPU intensive)
        // For performance, check specific fields like updatedAt
        return deepEqual(a, b);
    },
    resolve(i) {
        // Default: drop fork state, use master state
        return i.realMasterState;
    }
};
```

### Custom Conflict Handler Architecture

Conflict handlers receive three states:
- `i.realMasterState` - Current state on server
- `i.assumedMasterState` - State client thought was on server
- `i.newDocumentState` - State client wants to write

```javascript
export const myConflictHandler = {
    isEqual(a, b) {
        // Performance optimization: check only updatedAt
        return a.updatedAt === b.updatedAt;
    },
    async resolve(i) {
        // Can be async for UI interactions
        return i.realMasterState; // or custom merge logic
    }
};
```

### Field-Level LWW (Last-Write-Wins) Implementation

**Critical Pattern for Presentation App**: Implement per-field timestamps for granular conflict resolution.

```typescript
interface SlideDocument {
    id: string;
    title: string;
    titleUpdatedAt: number;
    content: string;
    contentUpdatedAt: number;
    backgroundColor: string;
    backgroundUpdatedAt: number;
    updatedAt: number; // Overall document timestamp
}

const fieldLevelLWWHandler = {
    isEqual(a, b) {
        // Quick check using overall timestamp
        if (a.updatedAt !== b.updatedAt) return false;
        return deepEqual(a, b);
    },
    
    async resolve(i) {
        const { realMasterState, newDocumentState } = i;
        const merged = { ...realMasterState };
        
        // Field-level LWW: compare per-field timestamps
        const fields = ['title', 'content', 'backgroundColor'];
        
        for (const field of fields) {
            const timestampField = `${field}UpdatedAt`;
            
            if (newDocumentState[timestampField] > realMasterState[timestampField]) {
                // Client has newer version of this field
                merged[field] = newDocumentState[field];
                merged[timestampField] = newDocumentState[timestampField];
            }
            // else: keep master state (server is newer)
        }
        
        // Update overall document timestamp
        merged.updatedAt = Math.max(
            realMasterState.updatedAt,
            newDocumentState.updatedAt
        );
        
        return merged;
    }
};
```

### Applying Custom Conflict Handler

```javascript
const myCollections = await myDatabase.addCollections({
    slides: {
        schema: mySchema,
        conflictHandler: fieldLevelLWWHandler
    }
});
```

### Server-Side Conflict Detection

Server detects conflicts by comparing assumed vs. real master state:

```typescript
// Server push endpoint
app.post('/push', (req, res) => {
    const changeRows = req.body;
    const conflicts = [];
    
    for (const changeRow of changeRows) {
        const realMasterState = db.findOne({ id: changeRow.newDocumentState.id });
        
        if (
            realMasterState && 
            realMasterState.updatedAt !== changeRow.assumedMasterState?.updatedAt
        ) {
            // Conflict detected
            conflicts.push(realMasterState);
        } else {
            // No conflict - write the document
            db.updateOne(
                { id: changeRow.newDocumentState.id },
                changeRow.newDocumentState
            );
        }
    }
    
    res.json(conflicts); // Return conflicting documents
});
```

### Conflict Resolution Strategies Summary

1. **First-on-Server-Wins**: Return `i.realMasterState` (default)
2. **Last-Write-Wins (Document-Level)**: Return `i.newDocumentState`
3. **Field-Level LWW**: Compare per-field timestamps (recommended for collaborative editing)
4. **Manual Resolution**: Show UI to user (async resolve function)
5. **Event Sourcing**: Avoid conflicts entirely by appending deltas

### Event Sourcing Alternative

For critical data (like financial transactions), use event sourcing to avoid conflicts:

```typescript
// Instead of modifying balance directly, append events
{
    id: new Date().toJSON(),
    change: 100
} // balance increased by $100
{
    id: new Date().toJSON(),
    change: -50
} // balance decreased by $50
```

## 3. Encryption Plugin Capabilities

### Two Encryption Plugins Available

1. **crypto-js** (Free, slower): Password-based encryption
2. **web-crypto** (Premium, faster): Web Crypto API with AES-CTR/CBC/GCM

### Basic Encryption with crypto-js

```typescript
import { wrappedKeyEncryptionCryptoJsStorage } from 'rxdb/plugins/encryption-crypto-js';
import { getRxStorageLocalstorage } from 'rxdb/plugins/storage-localstorage';

// Wrap storage with encryption
const encryptedStorage = wrappedKeyEncryptionCryptoJsStorage({
    storage: getRxStorageLocalstorage()
});

// Create encrypted database
const db = await createRxDatabase({
    name: 'mydatabase',
    storage: encryptedStorage,
    password: 'sudoLetMeIn' // NEVER hardcode in production
});
```

### Field-Level Encryption

Encrypt specific fields in a collection:

```typescript
const schema = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        title: { type: 'string' }, // Not encrypted
        speakerNotes: { type: 'string' }, // Encrypted
        apiKey: { type: 'string' } // Encrypted
    },
    required: ['id'],
    encrypted: ['speakerNotes', 'apiKey'] // Field-level encryption
};
```

### Premium Web Crypto Plugin (Faster)

```typescript
import { wrappedKeyEncryptionWebCryptoStorage } from 'rxdb-premium/plugins/encryption-web-crypto';
import { getRxStorageIndexedDB } from 'rxdb-premium/plugins/storage-indexeddb';

const encryptedStorage = wrappedKeyEncryptionWebCryptoStorage({
    storage: getRxStorageIndexedDB()
});

const myPasswordObject = {
    algorithm: 'AES-GCM', // or 'AES-CTR' | 'AES-CBC'
    password: 'myRandomPasswordWithMin8Length'
};

const db = await createRxDatabase({
    name: 'mydatabase',
    storage: encryptedStorage,
    password: myPasswordObject
});
```

### Deriving Encryption Key from Supabase Session

**Critical Pattern for Presentation App**: Derive encryption password from user session.

```typescript
import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';

// Get Supabase session
const supabase = createClient(url, anonKey);
const { data: { session } } = await supabase.auth.getSession();

if (!session) {
    throw new Error('No active session');
}

// Derive encryption password from session token
// WARNING: This is a simplified example - use proper key derivation (PBKDF2)
const derivedPassword = CryptoJS.SHA256(
    session.access_token + session.user.id
).toString();

const encryptedStorage = wrappedKeyEncryptionCryptoJsStorage({
    storage: getRxStorageDexie()
});

const db = await createRxDatabase({
    name: `user-${session.user.id}`,
    storage: encryptedStorage,
    password: derivedPassword
});
```

### Attachment Encryption

Encrypt attachments (images, videos) separately:

```javascript
const schema = {
    version: 0,
    properties: { /* ... */ },
    attachments: {
        encrypted: true // Encrypt all attachments
    }
};
```

### Querying Encrypted Data

**Important Limitation**: You can only query by non-encrypted fields or primary keys.

```javascript
// Insert encrypted data
await db.secureData.insert({
    id: 'mySecretId',
    normalField: 'foobar', // Not encrypted
    secretField: 'This is top secret data' // Encrypted
});

// Query by non-encrypted field
const doc = await db.secureData.findOne({
    selector: {
        normalField: 'foobar' // Can query this
        // secretField: 'secret' // CANNOT query encrypted fields
    }
}).exec();

console.log(doc.secretField); // Decrypted on read: 'This is top secret data'
```

## 4. React Hooks Integration (rxdb-hooks)

### Using rxdb-hooks Library

RxDB provides excellent React integration via the `rxdb-hooks` package:

```javascript
import { useRxCollection, useRxQuery } from 'rxdb-hooks';

function PresentationList() {
    const collection = useRxCollection('presentations');
    
    const query = collection
        .find()
        .where('userId')
        .equals(currentUserId);
    
    const {
        result: presentations,
        isFetching,
        fetchMore,
        isExhausted,
    } = useRxQuery(query, {
        pageSize: 10,
        pagination: 'Infinite',
    });
    
    if (isFetching) {
        return <LoadingSpinner />;
    }
    
    return (
        <div>
            {presentations.map((pres) => (
                <PresentationCard key={pres.id} presentation={pres} />
            ))}
            {!isExhausted && (
                <button onClick={fetchMore}>Load More</button>
            )}
        </div>
    );
}
```

### Manual Observable Subscription (Alternative)

If not using rxdb-hooks, subscribe to RxDB observables manually:

```typescript
import { useState, useEffect } from 'react';

function SlideList({ collection }) {
    const [slides, setSlides] = useState([]);
    
    useEffect(() => {
        // Create observable query
        const query = collection.find();
        
        // Subscribe to live updates
        const subscription = query.$.subscribe(newSlides => {
            setSlides(newSlides);
        });
        
        // Cleanup on unmount
        return () => subscription.unsubscribe();
    }, [collection]);
    
    return (
        <ul>
            {slides.map(slide => (
                <li key={slide.id}>{slide.title}</li>
            ))}
        </ul>
    );
}
```

### Using Signals for Real-time Updates

RxDB supports signals (`.$$`) for modern React patterns:

```tsx
import React from 'react';

function MyComponent({ myCollection }) {
    // .find().$$ provides a signal that updates whenever data changes
    const docsSignal = myCollection.find().$$;
    
    return (
        <ul>
            {docs.map((doc) => (
                <li key={doc.id}>{doc.name}</li>
            ))}
        </ul>
    );
}
```

### Middleware Hooks for Side Effects

RxDB provides middleware hooks for document lifecycle events:

```javascript
// Run after document is inserted
myCollection.postInsert(function(plainData, rxDocument) {
    console.log('Document inserted:', rxDocument.id);
    // Could trigger analytics, notifications, etc.
}, false);

// Run before document is saved
myCollection.preSave(function(plainData, rxDocument) {
    // Modify data before saving
    plainData.updatedAt = Date.now();
}, false);

// Run after document is removed
myCollection.postRemove(function(plainData, rxDocument) {
    console.log('Document removed:', rxDocument.id);
}, false);

// Add custom getter to documents
myCollection.postCreate(function(plainData, rxDocument) {
    Object.defineProperty(rxDocument, 'displayTitle', {
        get: () => rxDocument.title.toUpperCase()
    });
});
```

### Middleware Execution Modes

- **Series** (`false`): Execute hooks one after another
- **Parallel** (`true`): Execute hooks concurrently
- **Async**: Return a promise for async operations

```javascript
// Async hook example
myCollection.postInsert(function(plainData, rxDocument) {
    return new Promise(res => setTimeout(res, 100));
}, false);
```

## 5. PostgreSQL/Supabase Synchronization

### Native Supabase Replication Plugin

RxDB has a dedicated Supabase replication plugin:

```typescript
import { replicateSupabase } from 'rxdb/plugins/replication-supabase';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://xyzcompany.supabase.co',
    'eyJhbGciOi...'
);

const replication = replicateSupabase({
    tableName: 'presentations',
    client: supabase,
    collection: db.presentations,
    replicationIdentifier: 'presentations-supabase',
    live: true, // Continuous sync
    pull: {
        batchSize: 50,
        modifier: (doc) => {
            // Transform incoming docs
            if (!doc.tags) delete doc.tags;
            return doc;
        }
    },
    push: {
        batchSize: 50
    },
    // Optional: customize column names
    // modifiedField: '_modified',
    // deletedField: '_deleted'
});

// Observe errors
replication.error$.subscribe(err => console.error('[replication]', err));

// Wait for initial sync
await replication.awaitInitialReplication();
```

### Required Supabase Table Schema

Supabase tables must have `_deleted` and `_modified` fields:

```sql
create extension if not exists moddatetime schema extensions;

create table "public"."presentations" (
    "id" text primary key,
    "title" text not null,
    "slides" jsonb,
    "userId" text not null,
    
    "_deleted" boolean DEFAULT false NOT NULL,
    "_modified" timestamp with time zone DEFAULT now() NOT NULL
);

-- Auto-update the _modified timestamp
CREATE TRIGGER update_modified_datetime 
BEFORE UPDATE ON public.presentations 
FOR EACH ROW
EXECUTE FUNCTION extensions.moddatetime('_modified');

-- Enable real-time updates
alter publication supabase_realtime add table "public"."presentations";
```

### Custom HTTP Replication (Alternative)

For custom backends or PostgreSQL without Supabase:

```typescript
import { replicateRxCollection } from 'rxdb/plugins/replication';

const replicationState = await replicateRxCollection({
    collection: db.presentations,
    replicationIdentifier: 'custom-presentations-api',
    push: {
        async handler(docs) {
            const response = await fetch('https://api.example.com/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ changes: docs })
            });
            return await response.json(); // Return conflicts
        }
    },
    pull: {
        async handler(lastCheckpoint, batchSize) {
            const response = await fetch(
                `https://api.example.com/pull?checkpoint=${JSON.stringify(lastCheckpoint)}&limit=${batchSize}`
            );
            return await response.json();
        }
    },
    live: true,
    retryTime: 5000 // Retry on errors
});
```

### Hybrid Architecture: Selective Sync

**Critical Pattern**: Not all data needs to sync. Keep some data local-only.

```typescript
// Local-only collection (drafts, temporary data)
await db.addCollections({
    drafts: {
        schema: draftSchema
        // No replication configured
    }
});

// Synced collection (published presentations)
await db.addCollections({
    presentations: {
        schema: presentationSchema
    }
});

// Setup replication only for presentations
replicateSupabase({
    collection: db.presentations,
    // ... config
});
```

### Dynamic/Partial Replication

Replicate only data relevant to current user or scope:

```typescript
const activeReplications = {}; // projectId -> replicationState

function startProjectReplication(projectId) {
    if (activeReplications[projectId]) return;
    
    const replicationState = replicateRxCollection({
        collection: db.slides,
        replicationIdentifier: `slides-project-${projectId}`,
        pull: {
            async handler(checkpoint, limit) {
                const res = await fetch(
                    `/api/slides/pull?projectId=${projectId}&cp=${checkpoint}&limit=${limit}`
                );
                return await res.json();
            }
        },
        push: {
            async handler(changedDocs) {
                const res = await fetch(`/api/slides/push?projectId=${projectId}`, {
                    method: 'POST',
                    body: JSON.stringify(changedDocs)
                });
                return await res.json();
            }
        }
    });
    
    activeReplications[projectId] = replicationState;
}

async function stopProjectReplication(projectId) {
    const rep = activeReplications[projectId];
    if (rep) {
        rep.cancel();
        delete activeReplications[projectId];
    }
}

// Switch projects
function onProjectChange(newProjectId, oldProjectId) {
    if (oldProjectId) {
        stopProjectReplication(oldProjectId);
    }
    startProjectReplication(newProjectId);
}
```

### UI Feedback for Sync Status

Show loading indicators based on sync state:

```javascript
await myCollection.insertLocal('last-in-sync', { time: 0 }).catch();

myReplicationState.active$.pipe(
    mergeMap(async() => {
        await myReplicationState.awaitInSync();
        await myCollection.upsertLocal('last-in-sync', { time: Date.now() })
    })
);

// Observe the flag and toggle loading spinner
await showLoadingSpinner();
const oneDay = 1000 * 60 * 60 * 24;

await firstValueFrom(
    myCollection.getLocal$('last-in-sync').pipe(
        filter(d => d.get('time') > (Date.now() - oneDay))
    )
);
await hideLoadingSpinner();
```

## 6. Storage Quota Management and Eviction Policies

### Estimating Browser Storage Usage

```javascript
const quota = await navigator.storage.estimate();
const totalSpace = quota.quota; // Total allocated space
const usedSpace = quota.usage;   // Currently used space

console.log('Total allocated space:', totalSpace);
console.log('Used space:', usedSpace);
console.log('Usage percentage:', (usedSpace / totalSpace * 100).toFixed(2) + '%');
```

### Handling Quota Exceeded Errors

```javascript
try {
    await db.presentations.insert(largePresentation);
} catch (error) {
    if (error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded. Cleanup needed.');
        
        // Option 1: Remove old documents
        await removeOldDocuments();
        
        // Option 2: Show UI to user
        displayStorageFullDialog();
        
        // Option 3: Move to cloud storage
        await migrateToCloudStorage();
    } else {
        console.error('Database write error:', error);
    }
}
```

### Storage Optimization: Key Compression

RxDB can compress field names to save space:

```javascript
const schema = {
    version: 0,
    keyCompression: true, // Enable key compression
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        shoppingCartItems: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    productNumber: { type: 'number' },
                    amount: { type: 'number' }
                }
            }
        }
    }
};
```

**Before compression**:
```json
{
    "firstName": "Corrine",
    "lastName": "Ziemann",
    "shoppingCartItems": [
        { "productNumber": 29857, "amount": 1 }
    ]
}
```

**After compression** (20-40% smaller):
```json
{
    "|e": "Corrine",
    "|g": "Ziemann",
    "|i": [
        { "|h": 29857, "|b": 1 }
    ]
}
```

### Storage Migration Between Adapters

Migrate from one storage to another (e.g., LocalStorage → IndexedDB):

```typescript
import { migrateStorage } from 'rxdb/plugins/migration-storage';
import { getRxStorageIndexedDB } from 'rxdb-premium/plugins/storage-indexeddb';
import { getRxStorageLocalstorage } from 'rxdb/plugins/storage-localstorage';

// Create new database with target storage
const db = await createRxDatabase({
    name: 'mydb-new',
    storage: getRxStorageIndexedDB(),
    multiInstance: false
});

// Migrate from old storage
await migrateStorage({
    database: db,
    oldDatabaseName: 'mydb-old',
    oldStorage: getRxStorageLocalstorage(),
    batchSize: 500,
    parallel: false,
    afterMigrateBatch: (input) => {
        console.log('Batch migrated:', input);
    }
});
```

### Memory-Mapped Storage for Performance

Use memory-mapped storage for faster reads/writes with background persistence:

```typescript
import { getMemoryMappedRxStorage } from 'rxdb-premium/plugins/storage-memory-mapped';
import { getRxStorageIndexedDB } from 'rxdb-premium/plugins/storage-indexeddb';

const db = await createRxDatabase({
    name: 'exampledb',
    storage: getMemoryMappedRxStorage({
        storage: getRxStorageIndexedDB()
    })
});
```

**Benefits**:
- Near-instant reads (from memory)
- Background writes to persistent storage
- Hybrid in-memory/persistent approach

**Limitations**:
- Data loss if process exits immediately
- Limited by available RAM

### Storage Buckets API (Advanced)

For better quota management, use Storage Buckets API:

```javascript
import { getRxStorageIndexedDB } from 'rxdb-premium/plugins/storage-indexeddb';

const db = await createRxDatabase({
    name: 'exampledb',
    storage: getRxStorageIndexedDB({
        indexedDB: async(params) => {
            const myStorageBucket = await navigator.storageBuckets.open(
                'myApp-' + params.databaseName
            );
            return myStorageBucket.indexedDB;
        },
        IDBKeyRange
    })
});
```

### Data Cleanup Strategies

**1. Time-based cleanup**:
```javascript
async function cleanupOldData() {
    const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    await db.presentations.find({
        selector: {
            updatedAt: { $lt: oneMonthAgo },
            synced: true // Only remove synced data
        }
    }).remove();
}
```

**2. LRU (Least Recently Used)**:
```javascript
async function cleanupLRU(maxDocuments = 1000) {
    const allDocs = await db.presentations
        .find()
        .sort({ lastAccessedAt: 'asc' })
        .exec();
    
    if (allDocs.length > maxDocuments) {
        const toRemove = allDocs.slice(0, allDocs.length - maxDocuments);
        await Promise.all(toRemove.map(doc => doc.remove()));
    }
}
```

**3. Size-based cleanup**:
```javascript
async function cleanupBySize(maxSizeBytes = 100 * 1024 * 1024) { // 100MB
    const { usage } = await navigator.storage.estimate();
    
    if (usage > maxSizeBytes) {
        // Remove oldest documents until under limit
        const docs = await db.presentations
            .find()
            .sort({ updatedAt: 'asc' })
            .exec();
        
        for (const doc of docs) {
            await doc.remove();
            const { usage: newUsage } = await navigator.storage.estimate();
            if (newUsage < maxSizeBytes) break;
        }
    }
}
```

## Key Takeaways for Presentation App

### 1. Recommended Tech Stack

```typescript
// Core database
- RxDB with Dexie storage adapter
- Field-level LWW conflict resolution
- Web Crypto encryption (premium) or crypto-js (free)
- React hooks for UI integration
- Supabase replication for sync

// Example structure
const db = await createRxDatabase({
    name: `presentations-${userId}`,
    storage: wrappedKeyEncryptionWebCryptoStorage({
        storage: getRxStorageDexie()
    }),
    password: derivedFromSupabaseSession
});
```

### 2. Schema Design with Field Timestamps

```typescript
const slideSchema = {
    version: 0,
    primaryKey: 'id',
    keyCompression: true, // Save 20-40% storage
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        presentationId: { type: 'string' },
        
        // Each field has its own timestamp
        title: { type: 'string' },
        titleUpdatedAt: { type: 'number' },
        
        content: { type: 'string' },
        contentUpdatedAt: { type: 'number' },
        
        backgroundColor: { type: 'string' },
        backgroundUpdatedAt: { type: 'number' },
        
        // Overall document timestamp
        updatedAt: { type: 'number' },
        
        // Soft delete for sync
        _deleted: { type: 'boolean', default: false },
        _modified: { type: 'number' }
    },
    required: ['id', 'presentationId'],
    indexes: [
        'presentationId',
        'updatedAt',
        ['presentationId', 'updatedAt']
    ]
};
```

### 3. Hybrid Architecture

```typescript
// Collections that sync
await db.addCollections({
    presentations: { schema: presentationSchema },
    slides: { schema: slideSchema }
});

// Collections that stay local
await db.addCollections({
    drafts: { schema: draftSchema },
    settings: { schema: settingsSchema },
    cache: { schema: cacheSchema }
});

// Setup selective replication
replicateSupabase({
    collection: db.presentations,
    // ... only sync published presentations
});

replicateSupabase({
    collection: db.slides,
    // ... only sync slides for active projects
});
```

### 4. Conflict Resolution Implementation

```typescript
const fieldLevelLWWHandler = {
    isEqual(a, b) {
        return a.updatedAt === b.updatedAt;
    },
    
    async resolve({ realMasterState, newDocumentState }) {
        const merged = { ...realMasterState };
        
        // List of fields with timestamps
        const trackedFields = [
            'title', 'content', 'backgroundColor', 
            'layout', 'animations', 'transitions'
        ];
        
        for (const field of trackedFields) {
            const timestampField = `${field}UpdatedAt`;
            
            if (newDocumentState[timestampField] > realMasterState[timestampField]) {
                merged[field] = newDocumentState[field];
                merged[timestampField] = newDocumentState[timestampField];
            }
        }
        
        merged.updatedAt = Math.max(
            realMasterState.updatedAt,
            newDocumentState.updatedAt
        );
        
        return merged;
    }
};
```

### 5. React Integration Pattern

```tsx
import { useRxCollection, useRxQuery } from 'rxdb-hooks';

function SlideEditor({ slideId }) {
    const collection = useRxCollection('slides');
    const query = collection.findOne(slideId);
    const { result: slide, isFetching } = useRxQuery(query);
    
    const updateField = async (field, value) => {
        await slide.incrementalPatch({
            [field]: value,
            [`${field}UpdatedAt`]: Date.now(),
            updatedAt: Date.now()
        });
    };
    
    if (isFetching) return <LoadingSpinner />;
    
    return (
        <div>
            <input
                value={slide.title}
                onChange={(e) => updateField('title', e.target.value)}
            />
            {/* Other fields */}
        </div>
    );
}
```

### 6. Storage Management

```typescript
// Monitor storage usage
setInterval(async () => {
    const { usage, quota } = await navigator.storage.estimate();
    const percentage = (usage / quota * 100).toFixed(2);
    
    if (percentage > 80) {
        console.warn('Storage usage high:', percentage + '%');
        await cleanupOldData();
    }
}, 60000); // Check every minute

// Enable key compression to save 20-40%
const schema = {
    keyCompression: true,
    // ...
};

// Cleanup strategy
async function cleanupOldData() {
    const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Remove old drafts
    await db.drafts.find({
        selector: { updatedAt: { $lt: oneMonthAgo } }
    }).remove();
    
    // Remove cached data
    await db.cache.find().remove();
}
```

## Production Considerations

### 1. Encryption Key Management

**NEVER hardcode passwords**. Derive from user session:

```typescript
import { createClient } from '@supabase/supabase-js';
import { pbkdf2 } from 'crypto';

async function deriveEncryptionKey(session) {
    return new Promise((resolve, reject) => {
        const salt = session.user.id; // User-specific salt
        const password = session.access_token;
        
        pbkdf2(password, salt, 100000, 32, 'sha256', (err, key) => {
            if (err) reject(err);
            resolve(key.toString('hex'));
        });
    });
}

const encryptionKey = await deriveEncryptionKey(session);
```

### 2. Migration Strategy

Version your schemas and handle migrations:

```typescript
const slidesSchemaV1 = {
    version: 1, // Increment version
    // ... new schema
};

// RxDB handles migration automatically
// Or provide custom migration strategies
```

### 3. Error Handling

```typescript
replication.error$.subscribe(err => {
    if (err.code === 'QUOTA_EXCEEDED') {
        showStorageFullModal();
    } else if (err.code === 'NETWORK_ERROR') {
        showOfflineIndicator();
    } else {
        logErrorToSentry(err);
    }
});
```

### 4. Performance Optimization

- Use indexes for frequently queried fields
- Enable key compression (20-40% savings)
- Use memory-mapped storage for hot data
- Batch operations when possible
- Implement incremental loading (pagination)

### 5. Testing

```typescript
// Use in-memory storage for tests
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';

const testDb = await createRxDatabase({
    name: 'test-db',
    storage: getRxStorageMemory()
});
```

## Sources

- RxDB Official Documentation: https://github.com/pubkey/rxdb
- Via Context7: `/pubkey/rxdb` (latest version)
- Retrieved: 2025-12-05

## Related Research

For additional research on related topics, consider:
- **Supabase Real-time**: Deep dive into Supabase real-time capabilities
- **IndexedDB Performance**: Browser storage performance benchmarks
- **Operational Transformation**: Alternative to LWW for collaborative editing
- **CRDTs**: Conflict-free replicated data types as alternative to conflict handlers
