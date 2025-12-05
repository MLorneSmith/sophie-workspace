# RxDB Complete Reference

Comprehensive patterns and examples for RxDB - the local-first, reactive NoSQL database.

## Database Creation

### Basic Setup

```typescript
import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

const db = await createRxDatabase({
  name: 'mydb',
  storage: getRxStorageDexie(),
  multiInstance: true,  // Enable multi-tab sync
  eventReduce: true     // Optimize event handling
});
```

### Storage Options

```typescript
// Dexie.js Storage (Free, recommended starting point)
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
const storage = getRxStorageDexie();

// IndexedDB Premium (Best browser performance)
import { getRxStorageIndexedDB } from 'rxdb-premium/plugins/storage-indexeddb';
const storage = getRxStorageIndexedDB({ batchSize: 300 });

// Memory-Synced (Best for read-heavy apps)
import { getMemorySyncedRxStorage } from 'rxdb-premium/plugins/storage-memory-synced';
const storage = getMemorySyncedRxStorage({
  storage: getRxStorageIndexedDB(),
  batchSize: 50,
  awaitWritePersistence: true
});

// Memory (Testing only)
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
const storage = getRxStorageMemory();

// SQLite (Node.js/Electron/Mobile)
import { getRxStorageSQLite, getSQLiteBasicsCapacitor }
  from 'rxdb-premium/plugins/storage-sqlite';
const storage = getRxStorageSQLite({
  sqliteBasics: getSQLiteBasicsCapacitor(sqlite, Capacitor)
});
```

## Schema Definition

### Complete Schema Example

```typescript
const heroSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    // Primary key MUST have maxLength
    id: {
      type: 'string',
      maxLength: 100
    },
    name: {
      type: 'string'
    },
    // Indexed strings MUST have maxLength
    email: {
      type: 'string',
      maxLength: 255
    },
    // Indexed numbers MUST have min/max/multipleOf
    age: {
      type: 'number',
      minimum: 0,
      maximum: 150,
      multipleOf: 1
    },
    // Indexed booleans MUST be required
    active: {
      type: 'boolean'
    },
    // Optional fields
    bio: {
      type: 'string'
    },
    // Date-time format
    createdAt: {
      type: 'string',
      format: 'date-time'
    },
    // Nested objects
    address: {
      type: 'object',
      properties: {
        city: { type: 'string' },
        country: { type: 'string' }
      }
    },
    // Arrays
    tags: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  required: ['id', 'name', 'active'],
  indexes: [
    'email',                    // Simple index
    'age',                      // Number index
    ['active', 'createdAt'],    // Compound index
    ['address.city', 'name']    // Nested field index
  ],
  attachments: {
    encrypted: true             // Optional attachment support
  }
} as const;  // CRITICAL for TypeScript!
```

### Composite Primary Keys

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

// Auto-generates id: "Alice|Smith"
await collection.insert({ firstName: 'Alice', lastName: 'Smith' });
```

## Collection Setup

### Adding Collections with ORM

```typescript
type HeroDoc = {
  id: string;
  name: string;
  age: number;
};

type HeroDocMethods = {
  greet: (text: string) => string;
};

type HeroCollectionMethods = {
  findActive: () => Promise<HeroDocument[]>;
};

type HeroDocument = RxDocument<HeroDoc, HeroDocMethods>;
type HeroCollection = RxCollection<HeroDoc, HeroDocMethods, HeroCollectionMethods>;

await db.addCollections({
  heroes: {
    schema: heroSchema,
    methods: {
      // Instance methods (on documents)
      greet(this: HeroDocument, text: string) {
        return `${this.name} says: ${text}`;
      }
    },
    statics: {
      // Static methods (on collection)
      async findActive(this: HeroCollection) {
        return this.find({ selector: { active: true } }).exec();
      }
    },
    migrationStrategies: {
      // Migration from version 0 to 1
      1: (oldDoc) => {
        oldDoc.updatedAt = oldDoc.createdAt;
        return oldDoc;
      }
    },
    autoMigrate: true,
    conflictHandler: (input) => {
      // Custom conflict resolution
      return input.newDocumentState;
    }
  }
});
```

## Query Patterns

### Mango Query Syntax

```typescript
// Equality
const results = await db.heroes.find({
  selector: { name: { $eq: 'Alice' } }
}).exec();

// Comparison operators
const results = await db.heroes.find({
  selector: {
    age: { $gt: 18, $lte: 65 }
  }
}).exec();

// Regex (case-insensitive)
const results = await db.heroes.find({
  selector: {
    name: { $regex: '^Al', $options: 'i' }
  }
}).exec();

// Logical OR
const results = await db.heroes.find({
  selector: {
    $or: [
      { active: { $eq: true } },
      { age: { $gt: 50 } }
    ]
  }
}).exec();

// IN query
const results = await db.heroes.find({
  selector: {
    status: { $in: ['pending', 'active'] }
  }
}).exec();

// NOT IN query
const results = await db.heroes.find({
  selector: {
    status: { $nin: ['deleted', 'archived'] }
  }
}).exec();

// EXISTS check
const results = await db.heroes.find({
  selector: {
    deletedAt: { $exists: false }
  }
}).exec();

// Compound query
const results = await db.heroes.find({
  selector: {
    active: { $eq: true },
    age: { $gte: 18 },
    $or: [
      { role: 'admin' },
      { role: 'moderator' }
    ]
  },
  sort: [{ createdAt: 'desc' }],
  limit: 10
}).exec();
```

### Query Builder Pattern

```typescript
const results = await db.heroes
  .find()
  .where('age').gt(18)
  .where('active').eq(true)
  .sort('name')
  .limit(20)
  .exec();
```

### Reactive Queries

```typescript
// Subscribe to query results
const subscription = db.heroes
  .find({ selector: { active: true } })
  .$.subscribe(heroes => {
    console.log('Heroes updated:', heroes.length);
    renderUI(heroes);
  });

// Observe single document
const doc = await db.heroes.findOne('hero1').exec();
doc.$.subscribe(latestDoc => {
  console.log('Document changed:', latestDoc);
});

// Observe specific field
doc.get$('name').subscribe(name => {
  console.log('Name changed to:', name);
});

// Cleanup
subscription.unsubscribe();
```

## Document Operations

### CRUD Operations

```typescript
// CREATE
const doc = await db.heroes.insert({
  id: 'hero1',
  name: 'Alice',
  age: 25,
  active: true
});

// READ
const hero = await db.heroes.findOne('hero1').exec();
const heroes = await db.heroes.find().exec();

// UPDATE - Immutable patch
await hero.incrementalPatch({ age: 26 });

// UPDATE - Atomic modify
await hero.incrementalModify(data => {
  data.age += 1;
  return data;
});

// DELETE
await hero.remove();

// BULK INSERT (10x+ faster)
await db.heroes.bulkInsert([
  { id: 'h1', name: 'Hero1', age: 20, active: true },
  { id: 'h2', name: 'Hero2', age: 30, active: false },
  { id: 'h3', name: 'Hero3', age: 40, active: true }
]);

// BULK REMOVE
await db.heroes.bulkRemove(['h1', 'h2', 'h3']);

// UPSERT (insert or update)
await db.heroes.upsert({
  id: 'hero1',
  name: 'Alice Updated',
  age: 26,
  active: true
});
```

### Attachments

```typescript
// Enable in schema
const schema = {
  attachments: { encrypted: true }
};

// Add attachment
const doc = await db.heroes.findOne('hero1').exec();
await doc.putAttachment({
  id: 'avatar.jpg',
  data: imageBlob,  // Blob or string
  type: 'image/jpeg'
});

// Get attachment
const attachment = doc.getAttachment('avatar.jpg');
const blob = await attachment.getData();
const url = URL.createObjectURL(blob);

// List attachments
const attachments = doc.allAttachments();

// Remove attachment
await attachment.remove();
```

## Replication Patterns

### Generic Replication (Any Backend)

```typescript
import { replicateRxCollection } from 'rxdb/plugins/replication';

const replicationState = await replicateRxCollection({
  collection: db.heroes,
  replicationIdentifier: 'heroes-sync',
  live: true,
  retryTime: 5000,

  pull: {
    handler: async (lastCheckpoint, batchSize) => {
      const response = await fetch(
        `/api/heroes/pull?checkpoint=${JSON.stringify(lastCheckpoint)}&limit=${batchSize}`
      );
      const { documents, checkpoint } = await response.json();
      return { documents, checkpoint };
    },
    batchSize: 50,
    // Optional: Real-time stream
    stream$: new Observable(subscriber => {
      const eventSource = new EventSource('/api/heroes/stream');
      eventSource.onmessage = (msg) => {
        subscriber.next(JSON.parse(msg.data));
      };
      return () => eventSource.close();
    })
  },

  push: {
    handler: async (changedDocs) => {
      const response = await fetch('/api/heroes/push', {
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

// Monitor replication
replicationState.active$.subscribe(active => {
  console.log('Replication active:', active);
});

replicationState.error$.subscribe(err => {
  console.error('Replication error:', err);
});

// Wait for initial sync
await replicationState.awaitInitialReplication();

// Check if in sync
await replicationState.awaitInSync();

// Cancel replication
await replicationState.cancel();
```

### CouchDB Replication

```typescript
import { replicateCouchDB } from 'rxdb/plugins/replication-couchdb';

const replicationState = replicateCouchDB({
  replicationIdentifier: 'couchdb-sync',
  collection: db.heroes,
  url: 'http://localhost:5984/heroes',
  live: true,
  pull: { batchSize: 50 },
  push: { batchSize: 50 }
});
```

### Supabase Replication

```typescript
import { replicateSupabase } from 'rxdb/plugins/replication-supabase';

const replicationState = replicateSupabase({
  tableName: 'heroes',
  client: supabaseClient,
  collection: db.heroes,
  replicationIdentifier: 'supabase-sync',
  live: true,
  pull: {
    batchSize: 50,
    modifier: (doc) => {
      // Transform incoming data
      if (!doc.active) doc.active = false;
      return doc;
    }
  },
  push: { batchSize: 50 }
});
```

### WebRTC P2P Replication

```typescript
import { replicateWebRTC, getConnectionHandlerSimplePeer }
  from 'rxdb/plugins/replication-webrtc';

const webrtcPool = await replicateWebRTC({
  collection: db.heroes,
  topic: 'my-app-room-123',
  secret: 'encryption-secret',
  connectionHandlerCreator: getConnectionHandlerSimplePeer({
    signalingServerUrl: 'wss://signaling.rxdb.info/'
  }),
  pull: {},
  push: {}
});
```

### Partial/Filtered Replication

```typescript
// Sync only specific chunks (e.g., for games)
const activeReplications = new Map();

function startChunkReplication(chunkId: string) {
  if (activeReplications.has(chunkId)) return;

  const replicationState = replicateRxCollection({
    collection: db.voxels,
    replicationIdentifier: `chunk-${chunkId}`,
    pull: {
      handler: async (checkpoint, limit) => {
        const res = await fetch(
          `/api/voxels/pull?chunkId=${chunkId}&cp=${checkpoint}&limit=${limit}`
        );
        return res.json();
      }
    },
    push: {
      handler: async (docs) => {
        const res = await fetch(`/api/voxels/push?chunkId=${chunkId}`, {
          method: 'POST',
          body: JSON.stringify(docs)
        });
        return res.json();
      }
    }
  });

  activeReplications.set(chunkId, replicationState);
}

function stopChunkReplication(chunkId: string) {
  const rep = activeReplications.get(chunkId);
  if (rep) {
    rep.cancel();
    activeReplications.delete(chunkId);
  }
}
```

## Conflict Resolution

```typescript
await db.addCollections({
  heroes: {
    schema: heroSchema,
    conflictHandler: (input) => {
      const { newDocumentState, realMasterState } = input;

      // Strategy 1: Last-write-wins (default)
      return realMasterState;

      // Strategy 2: Prefer local changes
      return newDocumentState;

      // Strategy 3: Custom merge
      return {
        ...realMasterState,
        name: newDocumentState.name,  // Prefer local name
        updatedAt: new Date().toISOString()
      };

      // Strategy 4: Field-level merge
      const merged = { ...realMasterState };
      Object.keys(newDocumentState).forEach(key => {
        if (newDocumentState[key] !== undefined) {
          merged[key] = newDocumentState[key];
        }
      });
      return merged;
    }
  }
});
```

## Schema Migration

### Simple Migration

```typescript
const schemaV1 = {
  version: 1,  // Increment version
  // ... schema
};

await db.addCollections({
  heroes: {
    schema: schemaV1,
    migrationStrategies: {
      1: (oldDoc) => {
        // Transform from v0 to v1
        oldDoc.updatedAt = oldDoc.createdAt;
        oldDoc.fullName = `${oldDoc.firstName} ${oldDoc.lastName}`;
        return oldDoc;
      }
    }
  }
});
```

### Async Migration

```typescript
migrationStrategies: {
  2: async (oldDoc) => {
    // Fetch external data during migration
    const response = await fetch(`/api/enrich/${oldDoc.id}`);
    const enrichment = await response.json();
    oldDoc.enrichedData = enrichment;
    return oldDoc;
  }
}
```

### Filter/Delete During Migration

```typescript
migrationStrategies: {
  3: (oldDoc) => {
    // Remove old documents
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    if (new Date(oldDoc.createdAt).getTime() < oneYearAgo) {
      return null;  // Delete document
    }
    return oldDoc;
  }
}
```

### Manual Migration Control

```typescript
const collection = await db.addCollections({
  heroes: {
    schema: schemaV1,
    autoMigrate: false,
    migrationStrategies: { /* ... */ }
  }
});

// Check if needed
const needed = await collection.migrationNeeded();
if (needed) {
  // Start migration
  collection.startMigration(100);  // Batch size

  // Monitor progress
  collection.getMigrationState().$.subscribe(state => {
    console.log(`Progress: ${state.count.percent}%`);
  });

  // Or await completion
  await collection.migratePromise(100);
}
```

## Plugins

### Encryption

```typescript
// Basic encryption (crypto-js)
import { wrappedKeyEncryptionCryptoJsStorage }
  from 'rxdb/plugins/encryption-crypto-js';

const encryptedStorage = wrappedKeyEncryptionCryptoJsStorage({
  storage: getRxStorageIndexedDB()
});

const db = await createRxDatabase({
  name: 'encrypted-db',
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
  name: 'encrypted-db',
  storage: encryptedStorage,
  password: {
    algorithm: 'AES-GCM',
    password: 'my-secure-password'
  }
});
```

### Key Compression

```typescript
import { wrappedKeyCompressionStorage } from 'rxdb/plugins/key-compression';

const compressedStorage = wrappedKeyCompressionStorage({
  storage: getRxStorageIndexedDB()
});

// Enable in schema
const schema = {
  version: 0,
  keyCompression: true,  // Enable compression
  // ...
};
```

### Logger (Debugging)

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

## TypeScript Complete Example

```typescript
import {
  createRxDatabase,
  RxDatabase,
  RxCollection,
  RxDocument,
  RxJsonSchema
} from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

// 1. Define document type
interface HeroDocType {
  id: string;
  name: string;
  age: number;
  active: boolean;
}

// 2. Define schema with literal type
const heroSchemaLiteral = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
    age: { type: 'number', minimum: 0, maximum: 150, multipleOf: 1 },
    active: { type: 'boolean' }
  },
  required: ['id', 'name', 'age', 'active'],
  indexes: ['age', ['active', 'age']]
} as const;

type HeroSchemaType = typeof heroSchemaLiteral;
const heroSchema: RxJsonSchema<HeroDocType> = heroSchemaLiteral;

// 3. Define document methods
interface HeroDocMethods {
  greet: (text: string) => string;
}

type HeroDocument = RxDocument<HeroDocType, HeroDocMethods>;

// 4. Define collection statics
interface HeroCollectionMethods {
  findActive: () => Promise<HeroDocument[]>;
}

type HeroCollection = RxCollection<HeroDocType, HeroDocMethods, HeroCollectionMethods>;

// 5. Define database collections
interface MyDatabaseCollections {
  heroes: HeroCollection;
}

type MyDatabase = RxDatabase<MyDatabaseCollections>;

// 6. Create database
export async function createDatabase(): Promise<MyDatabase> {
  const db: MyDatabase = await createRxDatabase<MyDatabaseCollections>({
    name: 'heroes-db',
    storage: getRxStorageDexie()
  });

  await db.addCollections({
    heroes: {
      schema: heroSchema,
      methods: {
        greet(this: HeroDocument, text: string) {
          return `${this.name}: ${text}`;
        }
      },
      statics: {
        async findActive(this: HeroCollection) {
          return this.find({ selector: { active: true } }).exec();
        }
      }
    }
  });

  return db;
}

// 7. Usage with full type safety
async function main() {
  const db = await createDatabase();

  // Insert with type checking
  const doc = await db.heroes.insert({
    id: 'hero1',
    name: 'Alice',
    age: 25,
    active: true
  });

  // Methods are typed
  console.log(doc.greet('Hello!'));

  // Statics are typed
  const activeHeroes = await db.heroes.findActive();

  // Queries are typed
  const youngHeroes = await db.heroes
    .find({ selector: { age: { $lt: 30 } } })
    .exec();
}
```

## Performance Best Practices

### 1. Use Bulk Operations

```typescript
// BAD: 10x slower
for (const doc of docs) {
  await collection.insert(doc);
}

// GOOD
await collection.bulkInsert(docs);
```

### 2. Optimize Compound Indexes

```typescript
// If 50% are 'active' but only 10% are age > 50:
// Put more selective field first
indexes: [['age', 'active']]  // age first

// Query helps planner with restrictive operator
const results = await collection.find({
  selector: {
    active: { $eq: true },
    age: { $gt: 50 }
  },
  index: ['age', 'active']  // Specify index
}).exec();
```

### 3. Store Large Data as Attachments

```typescript
// Instead of storing large content in document:
await doc.putAttachment({
  id: 'content.json',
  data: createBlob(JSON.stringify(largeContent), 'application/json'),
  type: 'application/json'
});
```

### 4. Use Memory-Synced for Read-Heavy Apps

```typescript
const storage = getMemorySyncedRxStorage({
  storage: getRxStorageIndexedDB(),
  batchSize: 50,
  waitBeforePersist: () => requestIdlePromise()
});
```

### 5. Process Heavy Queries in WebWorkers

```typescript
// Create worker storage
const workerStorage = getRxStorageWorker({
  workerInput: 'path/to/worker.js',
  storage: getRxStorageIndexedDB()
});
```

## Common Errors and Solutions

### Error: Primary key must have maxLength

```typescript
// BAD
properties: { id: { type: 'string' } }

// GOOD
properties: { id: { type: 'string', maxLength: 100 } }
```

### Error: TypeScript inference not working

```typescript
// BAD
const schema = { version: 0, /* ... */ };

// GOOD - use 'as const'
const schema = { version: 0, /* ... */ } as const;
```

### Error: Indexed boolean not required

```typescript
// BAD
properties: { active: { type: 'boolean' } }

// GOOD
properties: { active: { type: 'boolean' } },
required: ['active']
```

### Error: Indexed number missing constraints

```typescript
// BAD
properties: { age: { type: 'number' } }

// GOOD
properties: {
  age: {
    type: 'number',
    minimum: 0,
    maximum: 150,
    multipleOf: 1
  }
}
```
