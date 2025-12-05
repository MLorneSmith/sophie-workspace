# RxDB Comprehensive Research Report

**Date**: 2025-12-05  
**Agent**: context7-expert  
**Libraries Researched**: pubkey/rxdb (latest)  
**Research Scope**: Complete RxDB documentation for skill creation

## Executive Summary

RxDB is a **local-first, reactive, NoSQL database** for JavaScript applications that works in browsers, Node.js, Electron, React Native, and other JavaScript environments. It provides an observable, real-time database layer with built-in replication, offline-first capabilities, and multi-tab synchronization.

**Key Strengths**:
- Observable queries with RxJS integration
- Offline-first architecture with automatic conflict resolution
- Multiple storage adapters (IndexedDB, SQLite, Memory, Dexie, etc.)
- Comprehensive replication protocols (CouchDB, GraphQL, WebSocket, WebRTC, MongoDB)
- TypeScript-first with excellent type safety
- Schema-based with validation and migration support

---

## 1. Core Architecture

### 1.1 What is RxDB?

RxDB is built on three fundamental concepts:

1. **Reactive**: All queries return RxJS Observables that emit changes in real-time
2. **Offline-First**: Data is stored locally first, then optionally synced to remote
3. **Local-First**: The local database is the source of truth, ensuring zero-latency reads

**Architecture Layers**:
```
Application Layer
       ↓
RxDB Collections (Schema-based)
       ↓
RxStorage Interface (Pluggable)
       ↓
Storage Implementation (IndexedDB/SQLite/Memory/etc.)
```

### 1.2 Database Creation

```typescript
import { createRxDatabase } from 'rxdb';
import { getRxStorageIndexedDB } from 'rxdb-premium/plugins/storage-indexeddb';

const db = await createRxDatabase({
  name: 'mydb',
  storage: getRxStorageIndexedDB(),
  multiInstance: true,  // Enable multi-tab sync
  eventReduce: true     // Optimize event handling
});
```

**Storage Options**:
- **IndexedDB** (Premium): Best for browsers, high performance
- **Dexie.js**: IndexedDB wrapper with better API
- **SQLite**: For Node.js, Electron, Capacitor, React Native
- **Memory**: In-memory storage for testing
- **LocalStorage**: Limited storage for simple use cases
- **FoundationDB**: Distributed database for backend
- **MongoDB**: Direct MongoDB integration
- **PouchDB**: Legacy adapter (deprecated)

---

## 2. Collections and Schemas

### 2.1 JSON Schema Definition

RxDB uses JSON Schema to define document structure, validation, and indexes:

```typescript
const todoSchema = {
  version: 0,                    // Schema version for migrations
  primaryKey: 'id',              // Primary key field
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100             // Required for primary keys
    },
    title: {
      type: 'string'
    },
    done: {
      type: 'boolean',
      default: false             // Default values supported
    },
    timestamp: {
      type: 'string',
      format: 'date-time'
    },
    priority: {
      type: 'number',
      minimum: 0,                // Required for indexed numbers
      maximum: 10,
      multipleOf: 1
    }
  },
  required: ['id', 'title', 'done', 'timestamp'],
  indexes: [
    'done',                      // Simple index
    ['done', 'priority']         // Compound index
  ],
  attachments: {
    encrypted: true              // Optional attachment support
  }
};
```

**Schema Requirements**:
- Primary key must have `maxLength`
- Indexed strings must have `maxLength`
- Indexed numbers must have `minimum`, `maximum`, `multipleOf`
- Indexed booleans must be `required`

### 2.2 Adding Collections

```typescript
await db.addCollections({
  todos: {
    schema: todoSchema,
    methods: {
      // Instance methods (on documents)
      scream: function(this: TodoDocument, text: string) {
        return this.title + ': ' + text.toUpperCase();
      }
    },
    statics: {
      // Static methods (on collection)
      findActive: async function(this: TodoCollection) {
        return this.find({ selector: { done: false } }).exec();
      }
    },
    migrationStrategies: {
      // Schema migration functions
      1: (oldDoc) => {
        oldDoc.timestamp = new Date(oldDoc.timestamp).getTime();
        return oldDoc;
      }
    },
    autoMigrate: true,           // Auto-run migrations
    conflictHandler: (input) => {
      // Custom conflict resolution
      return input.newDocumentState;
    }
  }
});
```

### 2.3 Composite Primary Keys

```typescript
const schema = {
  primaryKey: {
    key: 'id',
    fields: ['firstName', 'lastName'],
    separator: '|'
  },
  properties: {
    id: { type: 'string', maxLength: 200 },
    firstName: { type: 'string' },
    lastName: { type: 'string' }
  },
  required: ['id', 'firstName', 'lastName']
};

// Document with id: "Alice|Smith"
await collection.insert({
  firstName: 'Alice',
  lastName: 'Smith'
});
```

---

## 3. Document Operations

### 3.1 CRUD Operations

```typescript
// CREATE
const doc = await db.todos.insert({
  id: 'todo1',
  title: 'Learn RxDB',
  done: false,
  timestamp: new Date().toISOString()
});

// READ
const found = await db.todos.findOne('todo1').exec();

// UPDATE (immutable pattern)
await found.incrementalPatch({ done: true });

// Alternative: atomic update
await found.incrementalModify(docData => {
  docData.done = true;
  return docData;
});

// DELETE
await found.remove();

// BULK OPERATIONS (much faster)
await db.todos.bulkInsert([doc1, doc2, doc3]);
await db.todos.bulkRemove(['id1', 'id2']);
```

### 3.2 Reactive Queries

**All queries return Observables**:

```typescript
// One-time query
const results = await db.todos
  .find({ selector: { done: false } })
  .exec();

// Reactive query (updates automatically)
db.todos
  .find({ selector: { done: false } })
  .$.subscribe(results => {
    console.log('Active todos:', results.length);
    // UI updates automatically when data changes
  });

// Observe single field
doc.get$('title').subscribe(title => {
  console.log('Title changed:', title);
});

// Chained query builder
db.todos
  .find()
  .where('priority').gt(5)
  .where('done').eq(false)
  .sort('timestamp')
  .$.subscribe(results => { /* ... */ });
```

### 3.3 Query Operators

RxDB uses **Mango Query** syntax (similar to MongoDB):

```typescript
// Equality
{ selector: { name: { $eq: 'Alice' } } }

// Comparison
{ selector: { age: { $gt: 18, $lte: 65 } } }

// Regex (case-insensitive)
{ selector: { name: { $regex: '^foo', $options: 'i' } } }

// Logical operators
{ selector: {
  $or: [
    { done: { $eq: true } },
    { priority: { $gt: 8 } }
  ]
}}

// In/Not In
{ selector: { status: { $in: ['pending', 'active'] } } }

// Exists
{ selector: { deletedAt: { $exists: false } } }

// Compound query
{ selector: {
  done: { $eq: false },
  priority: { $gte: 5 },
  $or: [
    { assignee: 'alice' },
    { assignee: 'bob' }
  ]
}}
```

---

## 4. Replication and Sync

### 4.1 Replication Protocols

RxDB supports multiple replication backends:

#### A. Generic Replication (Any Backend)

```typescript
import { replicateRxCollection } from 'rxdb/plugins/replication';

const replicationState = await replicateRxCollection({
  collection: db.todos,
  replicationIdentifier: 'my-todos-sync',
  live: true,                    // Continuous sync
  retryTime: 5000,               // Retry on error
  
  pull: {
    handler: async (lastCheckpoint, batchSize) => {
      const response = await fetch(
        `/api/todos/pull?checkpoint=${JSON.stringify(lastCheckpoint)}&limit=${batchSize}`
      );
      const { documents, checkpoint } = await response.json();
      return { documents, checkpoint };
    },
    batchSize: 50,
    stream$: async () => {
      // Optional: SSE/WebSocket for real-time updates
      const eventSource = new EventSource('/api/todos/stream');
      return new Observable(subscriber => {
        eventSource.onmessage = (msg) => {
          const data = JSON.parse(msg.data);
          subscriber.next(data);
        };
        return () => eventSource.close();
      });
    }
  },
  
  push: {
    handler: async (changedDocs) => {
      const response = await fetch('/api/todos/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changedDocs)
      });
      const { errorDocuments } = await response.json();
      return errorDocuments;  // Return conflicts
    },
    batchSize: 50
  }
});

// Observe replication state
replicationState.active$.subscribe(active => {
  console.log('Replication active:', active);
});

replicationState.error$.subscribe(err => {
  console.error('Replication error:', err);
});

await replicationState.awaitInitialReplication();
```

#### B. CouchDB Replication

```typescript
import { replicateCouchDB } from 'rxdb/plugins/replication-couchdb';

const replicationState = replicateCouchDB({
  replicationIdentifier: 'couchdb-sync',
  collection: db.todos,
  url: 'http://localhost:5984/todos',
  live: true,
  pull: { batchSize: 50 },
  push: { batchSize: 50 }
});
```

#### C. Supabase Replication

```typescript
import { replicateSupabase } from 'rxdb/plugins/replication-supabase';

const replicationState = replicateSupabase({
  tableName: 'todos',
  client: supabase,
  collection: db.todos,
  replicationIdentifier: 'supabase-sync',
  live: true,
  pull: {
    batchSize: 50,
    modifier: (doc) => {
      if (!doc.priority) doc.priority = 0;
      return doc;
    }
  },
  push: { batchSize: 50 }
});
```

#### D. WebRTC P2P Replication

```typescript
import { replicateWebRTC, getConnectionHandlerSimplePeer } 
  from 'rxdb/plugins/replication-webrtc';

const webrtcPool = await replicateWebRTC({
  collection: db.todos,
  topic: 'my-app-room-123',        // Unique room ID
  secret: 'my-secret-key',         // Encryption secret
  connectionHandlerCreator: getConnectionHandlerSimplePeer({
    signalingServerUrl: 'wss://signaling.rxdb.info/'
  }),
  pull: {},
  push: {}
});
```

#### E. MongoDB Replication

```typescript
import { replicateMongoDB } from 'rxdb/plugins/replication-mongodb';

const replicationState = replicateMongoDB({
  mongodb: {
    collectionName: 'todos',
    connection: 'mongodb://localhost:27017',
    databaseName: 'myapp'
  },
  collection: db.todos,
  replicationIdentifier: 'mongodb-sync',
  pull: { batchSize: 50 },
  push: { batchSize: 50 },
  live: true
});
```

### 4.2 Partial/Filtered Replication

Sync only specific data chunks (e.g., for games, large datasets):

```typescript
const activeReplications = {}; // chunkId -> replicationState

function startChunkReplication(chunkId) {
  if (activeReplications[chunkId]) return;
  
  const replicationState = replicateRxCollection({
    collection: db.voxels,
    replicationIdentifier: 'voxels-chunk-' + chunkId,
    pull: {
      async handler(checkpoint, limit) {
        const res = await fetch(
          `/api/voxels/pull?chunkId=${chunkId}&cp=${checkpoint}&limit=${limit}`
        );
        return await res.json();
      }
    },
    push: {
      async handler(changedDocs) {
        const res = await fetch(`/api/voxels/push?chunkId=${chunkId}`, {
          method: 'POST',
          body: JSON.stringify(changedDocs)
        });
        return await res.json();
      }
    }
  });
  
  activeReplications[chunkId] = replicationState;
}

function stopChunkReplication(chunkId) {
  const rep = activeReplications[chunkId];
  if (rep) {
    rep.cancel();
    delete activeReplications[chunkId];
  }
}

// Dynamic sync based on player position
function onPlayerMove(nearbyChunkIds) {
  nearbyChunkIds.forEach(startChunkReplication);
  Object.keys(activeReplications).forEach(cid => {
    if (!nearbyChunkIds.includes(cid)) {
      stopChunkReplication(cid);
    }
  });
}
```

### 4.3 Conflict Resolution

```typescript
await db.addCollections({
  todos: {
    schema: todoSchema,
    conflictHandler: (input) => {
      const { newDocumentState, realMasterState } = input;
      
      // Strategy 1: Last-write-wins (default)
      return realMasterState;
      
      // Strategy 2: Use local version
      return newDocumentState;
      
      // Strategy 3: Custom merge
      return {
        ...realMasterState,
        title: newDocumentState.title,  // Prefer local title
        done: realMasterState.done      // Prefer remote done
      };
    }
  }
});
```

---

## 5. TypeScript Integration

### 5.1 Type-Safe Collections

```typescript
import { RxJsonSchema, RxDocument, RxCollection, RxDatabase } from 'rxdb';

// 1. Define document type
type TodoDocType = {
  id: string;
  title: string;
  done: boolean;
  timestamp: string;
  priority?: number;
};

// 2. Define schema with literal type
const todoSchemaLiteral = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    title: { type: 'string' },
    done: { type: 'boolean' },
    timestamp: { type: 'string' },
    priority: { type: 'number' }
  },
  required: ['id', 'title', 'done', 'timestamp']
} as const;  // 'as const' is critical!

type TodoSchemaType = typeof todoSchemaLiteral;
const todoSchema: RxJsonSchema<TodoDocType> = todoSchemaLiteral;

// 3. Define document methods
type TodoDocMethods = {
  scream: (text: string) => string;
};

type TodoDocument = RxDocument<TodoDocType, TodoDocMethods>;

// 4. Define collection statics
type TodoCollectionMethods = {
  findActive: () => Promise<TodoDocument[]>;
};

type TodoCollection = RxCollection<TodoDocType, TodoDocMethods, TodoCollectionMethods>;

// 5. Define database collections
type MyDatabaseCollections = {
  todos: TodoCollection;
};

type MyDatabase = RxDatabase<MyDatabaseCollections>;

// 6. Create database with types
const db: MyDatabase = await createRxDatabase<MyDatabaseCollections>({
  name: 'mydb',
  storage: getRxStorageIndexedDB()
});

// 7. Add collections with ORM
await db.addCollections({
  todos: {
    schema: todoSchema,
    methods: {
      scream(this: TodoDocument, text: string) {
        return this.title + ': ' + text.toUpperCase();
      }
    },
    statics: {
      async findActive(this: TodoCollection) {
        return this.find({ selector: { done: false } }).exec();
      }
    }
  }
});

// 8. Fully type-safe usage
const doc = await db.todos.insert({
  id: 'todo1',
  title: 'Learn TypeScript',
  done: false,
  timestamp: new Date().toISOString()
});

console.log(doc.scream('YES!'));           // Type-safe method
const active = await db.todos.findActive();  // Type-safe static
```

---

## 6. Storage Adapters and Plugins

### 6.1 Browser Storage Options

| Storage | Use Case | Performance | Size Limit |
|---------|----------|-------------|------------|
| **IndexedDB** (Premium) | Production apps | Excellent | ~1GB+ |
| **Dexie.js** | IndexedDB wrapper | Very Good | ~1GB+ |
| **LocalStorage** | Simple apps | Poor | ~10MB |
| **Memory** | Testing, temporary | Excellent | RAM limited |
| **Memory-Synced** (Premium) | High-performance hybrid | Excellent | RAM limited |

#### IndexedDB (Recommended for Production)

```typescript
import { getRxStorageIndexedDB } from 'rxdb-premium/plugins/storage-indexeddb';

const db = await createRxDatabase({
  name: 'mydb',
  storage: getRxStorageIndexedDB({
    batchSize: 300  // Tune for query performance
  })
});
```

#### Memory-Synced (Best Performance)

Combines in-memory speed with persistent storage:

```typescript
import { getMemorySyncedRxStorage } from 'rxdb-premium/plugins/storage-memory-synced';
import { getRxStorageIndexedDB } from 'rxdb-premium/plugins/storage-indexeddb';

const storage = getMemorySyncedRxStorage({
  storage: getRxStorageIndexedDB(),
  batchSize: 50,
  awaitWritePersistence: true  // Ensure writes are persisted
});

const db = await createRxDatabase({
  name: 'mydb',
  storage
});
```

### 6.2 Node.js/Mobile Storage

#### SQLite

```typescript
import { getRxStorageSQLite, getSQLiteBasicsCapacitor } 
  from 'rxdb-premium/plugins/storage-sqlite';

const db = await createRxDatabase({
  name: 'mydb',
  storage: getRxStorageSQLite({
    sqliteBasics: getSQLiteBasicsCapacitor(sqlite, Capacitor)
  })
});
```

#### FoundationDB (Distributed)

```typescript
import { getRxStorageFoundationDB } from 'rxdb/plugins/storage-foundationdb';

const db = await createRxDatabase({
  name: 'mydb',
  storage: getRxStorageFoundationDB({
    apiVersion: 720,
    clusterFile: '/path/to/fdb.cluster',
    batchSize: 50
  })
});
```

### 6.3 Key Plugins

#### Encryption

```typescript
// Basic encryption (crypto-js)
import { wrappedKeyEncryptionCryptoJsStorage } 
  from 'rxdb/plugins/encryption-crypto-js';

const encryptedStorage = wrappedKeyEncryptionCryptoJsStorage({
  storage: getRxStorageIndexedDB()
});

const db = await createRxDatabase({
  name: 'mydb',
  storage: encryptedStorage,
  password: 'my-secure-password-min-8-chars'
});

// Premium encryption (web-crypto, faster)
import { wrappedKeyEncryptionWebCryptoStorage } 
  from 'rxdb-premium/plugins/encryption-web-crypto';

const encryptedStorage = wrappedKeyEncryptionWebCryptoStorage({
  storage: getRxStorageIndexedDB()
});

const db = await createRxDatabase({
  name: 'mydb',
  storage: encryptedStorage,
  password: {
    algorithm: 'AES-GCM',
    password: 'my-secure-password'
  }
});
```

#### Key Compression

Reduces storage size by compressing field names:

```typescript
import { wrappedKeyCompressionStorage } from 'rxdb/plugins/key-compression';

const compressedStorage = wrappedKeyCompressionStorage({
  storage: getRxStorageIndexedDB()
});

// Enable in schema
const schema = {
  version: 0,
  keyCompression: true,  // Enable compression
  primaryKey: 'id',
  // ...
};
```

#### Logger (Premium)

Debug all storage operations:

```typescript
import { wrappedLoggerStorage } from 'rxdb-premium/plugins/logger';

const loggingStorage = wrappedLoggerStorage({
  storage: getRxStorageIndexedDB({}),
  settings: {
    prefix: 'RxDB',
    logInserts: true,
    logUpdates: true,
    logDeletes: true,
    logQueries: true,
    timing: true
  }
});
```

#### Attachments

Store binary data (images, files) separately:

```typescript
// Enable in schema
const schema = {
  attachments: {
    encrypted: true  // Encrypt attachments with db password
  }
};

// Add attachment
const doc = await collection.insert({ id: '1', title: 'Doc' });
await doc.putAttachment({
  id: 'avatar.jpg',
  data: createBlob(imageData, 'image/jpeg'),
  type: 'image/jpeg'
});

// Get attachment
const attachment = doc.getAttachment('avatar.jpg');
const dataBlob = await attachment.getData();
```

---

## 7. Schema Migration

### 7.1 Simple Migration

```typescript
const schemaV1 = {
  version: 1,  // Increment version
  // ... rest of schema
};

await db.addCollections({
  todos: {
    schema: schemaV1,
    migrationStrategies: {
      1: (oldDoc) => {
        // Transform from v0 to v1
        oldDoc.timestamp = new Date(oldDoc.timestamp).getTime();
        return oldDoc;
      }
    }
  }
});
```

### 7.2 Async Migration

```typescript
migrationStrategies: {
  2: async (oldDoc) => {
    // Fetch external data
    const response = await fetch(`/api/enrich/${oldDoc.id}`);
    const data = await response.json();
    oldDoc.enrichedData = data;
    return oldDoc;
  }
}
```

### 7.3 Filtering Documents

```typescript
migrationStrategies: {
  3: (oldDoc) => {
    // Remove old documents
    if (oldDoc.createdAt < Date.now() - 365 * 24 * 60 * 60 * 1000) {
      return null;  // Delete document
    }
    return oldDoc;
  }
}
```

### 7.4 Manual Migration Control

```typescript
const collection = await db.addCollections({
  todos: {
    schema: schemaV1,
    autoMigrate: false,  // Disable auto-migration
    migrationStrategies: { /* ... */ }
  }
});

// Check if needed
const needed = await collection.migrationNeeded();
if (needed) {
  // Start with batch size
  collection.startMigration(100);
  
  // Observe progress
  collection.getMigrationState().$.subscribe(state => {
    console.log(`Migration: ${state.count.percent}% complete`);
  });
  
  // Or await completion
  await collection.migratePromise(100);
}
```

### 7.5 Storage Migration

Migrate between storage engines (e.g., LocalStorage → IndexedDB):

```typescript
import { migrateStorage } from 'rxdb/plugins/migration-storage';
import { getRxStorageLocalstorage } from 'rxdb-old/plugins/storage-localstorage';

const db = await createRxDatabase({
  name: 'mydb-new',
  storage: getRxStorageIndexedDB()
});

await migrateStorage({
  database: db,
  oldDatabaseName: 'mydb-old',
  oldStorage: getRxStorageLocalstorage(),
  batchSize: 500,
  parallel: false,
  afterMigrateBatch: (input) => {
    console.log(`Migrated ${input.countHandled}/${input.countAll}`);
  }
});
```

---

## 8. Performance Optimization

### 8.1 Query Optimization

**Use Indexes Wisely**:

```typescript
// BAD: No index
const results = await collection.find({
  selector: { name: { $regex: '^Alice' } }
}).exec();

// GOOD: Use index with restrictive operator
const results = await collection.find({
  selector: {
    name: {
      $regex: '^Alice',
      $gte: 'Alice'  // Helps query planner
    }
  }
}).exec();

// BETTER: Enforce index order
const results = await collection.find({
  selector: {
    done: { $eq: false },
    priority: { $gt: 5 }
  },
  index: ['done', 'priority']  // Specify index
}).exec();
```

**Compound Index Ordering**:

```typescript
// If 50% are 'male' but only 20% are under 18:
const query = collection.find({
  selector: {
    age: { $gt: 18 },
    gender: { $eq: 'm' }
  },
  index: ['gender', 'age']  // More selective field first
});
```

### 8.2 Bulk Operations

```typescript
// BAD: Loop with awaits
for (const doc of docs) {
  await collection.insert(doc);
}

// GOOD: Use bulkInsert
await collection.bulkInsert(docs);
```

### 8.3 Attachments for Large Data

```typescript
// Store large/rarely-used data as attachments
const doc = await collection.insert({
  id: '1',
  title: 'Document',
  summary: 'Quick summary'
});

await doc.putAttachment({
  id: 'full-content.json',
  data: createBlob(JSON.stringify(largeData), 'application/json'),
  type: 'application/json'
});

// Attachment data only loaded when needed
const attachment = doc.getAttachment('full-content.json');
const data = await attachment.getData();
```

### 8.4 Memory-Synced Storage

Best performance for read-heavy applications:

```typescript
const storage = getMemorySyncedRxStorage({
  storage: getRxStorageIndexedDB(),
  batchSize: 50,
  waitBeforePersist: () => requestIdlePromise()  // Persist during idle
});
```

### 8.5 EventReduce Optimization

RxDB optimizes event handling by default:

```typescript
const db = await createRxDatabase({
  name: 'mydb',
  storage,
  eventReduce: true  // Default, optimizes Observable emissions
});
```

---

## 9. Common Pitfalls and Debugging

### 9.1 Common Mistakes

**1. Missing maxLength on Primary Key**:
```typescript
// BAD
properties: {
  id: { type: 'string' }  // Will fail!
}

// GOOD
properties: {
  id: { type: 'string', maxLength: 100 }
}
```

**2. Not Using Bulk Operations**:
```typescript
// Slow
for (const doc of docs) {
  await collection.insert(doc);
}

// Fast
await collection.bulkInsert(docs);
```

**3. Forgetting 'as const' in TypeScript**:
```typescript
// BAD: Type inference won't work
const schema = { version: 0, /* ... */ };

// GOOD
const schema = { version: 0, /* ... */ } as const;
```

**4. Wrong Index Order**:
```typescript
// If querying by done=false (50% selectivity) and priority>5 (20% selectivity):

// BAD: Less selective first
indexes: [['priority', 'done']]

// GOOD: More selective first
indexes: [['done', 'priority']]
```

### 9.2 Debugging Tools

**Enable Logger Plugin**:
```typescript
import { wrappedLoggerStorage } from 'rxdb-premium/plugins/logger';

const storage = wrappedLoggerStorage({
  storage: getRxStorageIndexedDB({}),
  settings: {
    prefix: 'DEBUG',
    timing: true
  }
});
```

**Debug Replication Errors**:
```typescript
replicationState.error$.subscribe(err => {
  console.error('Replication error:', err);
});

// Check if in sync
await replicationState.awaitInSync();
```

**Disable EventReduce for Debugging**:
```typescript
const db = await createRxDatabase({
  name: 'mydb',
  eventReduce: false  // Disable optimization for debugging
});
```

### 9.3 Performance Tracking

RxDB provides internal benchmarks:

```json
{
  "platform": "indexeddb",
  "collectionsAmount": 4,
  "docsAmount": 1200,
  "time-to-first-insert": 25.53,
  "insert-documents-200": 7.5,
  "find-by-ids": 47.77,
  "find-by-query": 52.1,
  "find-by-query-parallel-4": 38.3,
  "count": 5.48,
  "property-access": 5.27
}
```

---

## 10. Real-World Usage Patterns

### 10.1 Offline-First Todo App

```typescript
// 1. Setup
const db = await createRxDatabase({
  name: 'todos-db',
  storage: getRxStorageIndexedDB()
});

await db.addCollections({
  todos: { schema: todoSchema }
});

// 2. Local-first writes (instant)
await db.todos.insert({
  id: uuid(),
  title: 'Buy milk',
  done: false,
  timestamp: new Date().toISOString()
});

// 3. Reactive UI
db.todos.find({ selector: { done: false } }).$.subscribe(todos => {
  updateUI(todos);  // Automatic updates
});

// 4. Sync in background
const replicationState = await replicateRxCollection({
  collection: db.todos,
  replicationIdentifier: 'todos-sync',
  live: true,
  pull: { /* ... */ },
  push: { /* ... */ }
});
```

### 10.2 Multi-User Collaboration

```typescript
// Local user's documents
const myDocs = await db.documents.find({
  selector: { ownerId: currentUserId }
}).exec();

// Shared documents (filtered replication)
const replicationState = replicateRxCollection({
  collection: db.documents,
  replicationIdentifier: 'shared-docs',
  pull: {
    handler: async (checkpoint, limit) => {
      // Only pull documents user has access to
      const response = await fetch(
        `/api/documents/pull?userId=${currentUserId}&checkpoint=${checkpoint}`
      );
      return response.json();
    }
  },
  push: {
    handler: async (changedDocs) => {
      // Push only user's own documents
      const myChanges = changedDocs.filter(doc => doc.ownerId === currentUserId);
      const response = await fetch('/api/documents/push', {
        method: 'POST',
        body: JSON.stringify(myChanges)
      });
      return response.json();
    }
  }
});
```

### 10.3 Game World Chunks

```typescript
// Dynamic chunk loading for large worlds
const activeChunks = new Map();

function loadChunk(chunkId: string) {
  if (activeChunks.has(chunkId)) return;
  
  const replicationState = replicateRxCollection({
    collection: db.voxels,
    replicationIdentifier: `chunk-${chunkId}`,
    pull: {
      handler: async (checkpoint, limit) => {
        const response = await fetch(
          `/api/world/pull?chunk=${chunkId}&checkpoint=${checkpoint}`
        );
        return response.json();
      }
    },
    push: {
      handler: async (docs) => {
        const response = await fetch(`/api/world/push?chunk=${chunkId}`, {
          method: 'POST',
          body: JSON.stringify(docs)
        });
        return response.json();
      }
    }
  });
  
  activeChunks.set(chunkId, replicationState);
}

function unloadChunk(chunkId: string) {
  const replication = activeChunks.get(chunkId);
  if (replication) {
    replication.cancel();
    activeChunks.delete(chunkId);
  }
}

// Load chunks near player
onPlayerMove((nearbyChunks) => {
  nearbyChunks.forEach(loadChunk);
  activeChunks.forEach((_, chunkId) => {
    if (!nearbyChunks.includes(chunkId)) {
      unloadChunk(chunkId);
    }
  });
});
```

### 10.4 Electron Multi-Window

```typescript
// Main process
import { exposeIpcMainRxStorage } from 'rxdb/plugins/electron';
import { getRxStorageSQLite } from 'rxdb-premium/plugins/storage-sqlite';

app.on('ready', () => {
  exposeIpcMainRxStorage({
    key: 'main-storage',
    storage: getRxStorageSQLite(),
    ipcMain: electron.ipcMain
  });
});

// Renderer process
import { getRxStorageIpcRenderer } from 'rxdb/plugins/electron';

const db = await createRxDatabase({
  name: 'mydb',
  storage: getRxStorageIpcRenderer({
    key: 'main-storage',
    ipcRenderer: electron.ipcRenderer
  })
});
```

---

## 11. Best Practices Summary

### Schema Design
- ✅ Always set `maxLength` on primary keys and indexed strings
- ✅ Set `minimum`, `maximum`, `multipleOf` on indexed numbers
- ✅ Mark indexed booleans as `required`
- ✅ Use compound indexes for common query patterns
- ✅ Order compound indexes by selectivity (most selective first)
- ✅ Use `keyCompression: true` to reduce storage size
- ✅ Enable `attachments` for large/binary data

### TypeScript
- ✅ Use `as const` on schema literals
- ✅ Define types for documents, methods, and collections
- ✅ Leverage type inference from schemas
- ✅ Use strict typing for ORM methods

### Performance
- ✅ Use `bulkInsert` instead of looping with `insert`
- ✅ Use `bulkRemove` for multiple deletes
- ✅ Store large data as attachments
- ✅ Use Memory-Synced storage for read-heavy apps
- ✅ Add restrictive operators to help query planner
- ✅ Specify index order when query planner chooses poorly

### Replication
- ✅ Use `live: true` for real-time sync
- ✅ Implement `stream$` for push-based updates (SSE/WebSocket)
- ✅ Handle conflicts with custom `conflictHandler`
- ✅ Use filtered replication for multi-user apps
- ✅ Implement partial replication for large datasets
- ✅ Monitor `error$` for debugging
- ✅ Use `awaitInitialReplication()` before showing UI

### Migration
- ✅ Increment schema `version` when structure changes
- ✅ Implement `migrationStrategies` for each version
- ✅ Use async strategies when fetching external data
- ✅ Return `null` to filter/delete documents
- ✅ Use `autoMigrate: false` for manual control
- ✅ Monitor migration progress for user feedback

### Storage
- ✅ Use IndexedDB for production browsers
- ✅ Use SQLite for Node.js/Electron/Mobile
- ✅ Use Memory-Synced for high-performance apps
- ✅ Enable encryption for sensitive data
- ✅ Use Logger plugin for debugging

---

## 12. Key Takeaways for Skill Creation

### Essential Concepts to Teach
1. **Local-First Philosophy**: Data stored locally first, sync is secondary
2. **Observable Queries**: All queries return RxJS Observables for reactive UIs
3. **Schema-First**: JSON Schema defines structure, validation, indexes
4. **Replication Flexibility**: Support for any backend via pull/push handlers
5. **TypeScript Excellence**: Full type safety with proper patterns

### Common Developer Questions

**Q: When should I use RxDB vs plain IndexedDB?**  
A: Use RxDB when you need:
- Observable/reactive queries
- Schema validation
- Offline-first with sync
- Multi-tab synchronization
- TypeScript safety

**Q: Which storage adapter should I use?**  
A: 
- **Browser**: IndexedDB (Premium) or Dexie
- **Node.js**: SQLite or FoundationDB
- **Electron**: SQLite with IPC
- **React Native**: SQLite
- **Testing**: Memory

**Q: How do I handle conflicts?**  
A: Implement `conflictHandler` in collection config. Default is last-write-wins, but you can implement custom merge logic.

**Q: How do I optimize performance?**  
A:
1. Use bulk operations
2. Add proper indexes
3. Use Memory-Synced storage
4. Store large data as attachments
5. Optimize index order

**Q: How do I migrate schemas?**  
A: Increment `version` and add `migrationStrategies` functions to transform old documents to new structure.

### Code Patterns to Include in Skill

1. **Database Setup Pattern**
2. **Collection Creation Pattern**
3. **CRUD with Reactivity Pattern**
4. **Replication Setup Pattern**
5. **TypeScript Typing Pattern**
6. **Migration Pattern**
7. **Conflict Resolution Pattern**
8. **Performance Optimization Pattern**

### Documentation References

- Official Docs: https://rxdb.info/
- GitHub: https://github.com/pubkey/rxdb
- Quickstart: https://rxdb.info/quickstart.html
- TypeScript Guide: https://rxdb.info/tutorials/typescript.html
- Replication: https://rxdb.info/replication.html

---

## Conclusion

RxDB is a comprehensive, production-ready local-first database for JavaScript applications. Its reactive nature, offline-first architecture, flexible replication, and excellent TypeScript support make it ideal for modern applications requiring instant responsiveness and resilient data synchronization.

The library's strength lies in its:
- **Observable API** for automatic UI updates
- **Pluggable storage** for any environment
- **Flexible replication** for any backend
- **Schema validation** with migrations
- **TypeScript-first** design

Developers adopting RxDB should focus on understanding the local-first philosophy, schema design patterns, and replication strategies to build responsive, offline-capable applications.

---

**Generated with Context7 Research Agent**  
**Total Documentation Tokens**: ~24,000 tokens across 6 API calls  
**Coverage**: Architecture, Collections, Queries, Replication, TypeScript, Storage, Migrations, Performance, Debugging, Best Practices
