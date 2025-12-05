---
name: local-first-db
description: Expert guidance for implementing local-first databases with RxDB and Dexie.js. This skill should be used when developers need to implement offline-first data persistence, reactive client-side databases, or local-first sync architecture. Triggers on requests like "add offline support", "implement local database", "setup RxDB", "use Dexie.js", "sync local data", "client-side storage", "IndexedDB wrapper", or "reactive database queries".
---

# Local-First Database Expert

Expert guidance for implementing local-first databases using RxDB and Dexie.js in JavaScript/TypeScript applications.

## When to Use This Skill

- Setting up client-side databases (RxDB or Dexie.js)
- Implementing offline-first architecture
- Adding reactive/observable database queries
- Configuring data synchronization and replication
- Migrating from cloud-first to local-first architecture
- Optimizing IndexedDB performance
- TypeScript integration for client databases

## Quick Decision Guide

### Choose Dexie.js When

- Lightweight solution needed (~29KB bundle)
- Simple IndexedDB wrapper with good ergonomics
- Dataset is <10,000 records
- Using Dexie Cloud for turnkey sync
- Quick setup with minimal dependencies
- Team has limited local-first experience

### Choose RxDB When

- Full local-first database with reactive queries required
- JSON schema validation and migrations needed
- Complex sync/replication with multiple backends
- Cross-platform apps (web, mobile, desktop)
- Field-level encryption, CRDTs, or attachments required
- Dataset involves complex document relationships

## Core Patterns

### Database Setup

#### RxDB Setup

```typescript
import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

const db = await createRxDatabase({
  name: 'mydb',
  storage: getRxStorageDexie(),
  multiInstance: true,  // Multi-tab sync
  eventReduce: true     // Optimize events
});
```

#### Dexie.js Setup

```typescript
import { Dexie, type EntityTable } from 'dexie';

interface Todo {
  id: number;
  title: string;
  done: boolean;
}

const db = new Dexie('mydb') as Dexie & {
  todos: EntityTable<Todo, 'id'>;
};

db.version(1).stores({
  todos: '++id, done'  // Only index queried fields
});
```

### Schema Definition

#### RxDB Schema (JSON Schema)

```typescript
const todoSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },  // maxLength required!
    title: { type: 'string' },
    done: { type: 'boolean' },
    timestamp: { type: 'string', format: 'date-time' }
  },
  required: ['id', 'title', 'done'],
  indexes: ['done', ['done', 'timestamp']]  // Compound index
} as const;  // 'as const' critical for TypeScript!
```

#### Dexie Schema (Index-Only)

```typescript
// Schema defines INDEXES only, not table structure
db.version(1).stores({
  todos: '++id, done, [done+timestamp]',  // Auto-increment, indexes
  users: '&email, name',                   // Unique email, name indexed
  messages: '$$uuid, sender'               // UUID primary key
});

// All properties can be stored, only indexed ones in schema
await db.todos.add({ title: 'Task', done: false, priority: 5 });
```

### Reactive Queries

#### RxDB Observable Queries

```typescript
// One-time query
const results = await db.todos.find({ selector: { done: false } }).exec();

// Reactive query (auto-updates)
db.todos.find({ selector: { done: false } }).$.subscribe(todos => {
  updateUI(todos);  // Fires on every change
});

// Observe single field
doc.get$('title').subscribe(title => console.log('Changed:', title));
```

#### Dexie LiveQuery

```typescript
import { useLiveQuery } from 'dexie-react-hooks';

function TodoList() {
  const activeTodos = useLiveQuery(
    () => db.todos.where('done').equals(false).toArray()
  );

  return <ul>{activeTodos?.map(t => <li key={t.id}>{t.title}</li>)}</ul>;
}
```

### CRUD Operations

#### RxDB CRUD

```typescript
// Create
const doc = await db.todos.insert({ id: 'todo1', title: 'Task', done: false });

// Read
const found = await db.todos.findOne('todo1').exec();

// Update (immutable)
await found.incrementalPatch({ done: true });

// Delete
await found.remove();

// Bulk (much faster!)
await db.todos.bulkInsert([doc1, doc2, doc3]);
```

#### Dexie CRUD

```typescript
// Create
const id = await db.todos.add({ title: 'Task', done: false });

// Read
const todo = await db.todos.get(id);

// Update
await db.todos.update(id, { done: true });

// Delete
await db.todos.delete(id);

// Bulk
await db.todos.bulkAdd([todo1, todo2, todo3]);
```

### Replication/Sync

#### RxDB Generic Replication

```typescript
import { replicateRxCollection } from 'rxdb/plugins/replication';

const replicationState = await replicateRxCollection({
  collection: db.todos,
  replicationIdentifier: 'todos-sync',
  live: true,

  pull: {
    handler: async (checkpoint, limit) => {
      const response = await fetch(
        `/api/todos/pull?checkpoint=${JSON.stringify(checkpoint)}&limit=${limit}`
      );
      return await response.json();  // { documents, checkpoint }
    }
  },

  push: {
    handler: async (changedDocs) => {
      const response = await fetch('/api/todos/push', {
        method: 'POST',
        body: JSON.stringify(changedDocs)
      });
      return await response.json();  // { errorDocuments: [] }
    }
  }
});

// Monitor replication
replicationState.error$.subscribe(err => console.error('Sync error:', err));
await replicationState.awaitInitialReplication();
```

#### Dexie Cloud Sync

```typescript
import dexieCloud from 'dexie-cloud-addon';

const db = new Dexie('mydb', { addons: [dexieCloud] });

db.version(1).stores({
  todos: '@id, title, done'  // @ prefix for cloud-synced primary key
});

db.cloud.configure({
  databaseUrl: 'https://yourdb.dexie.cloud',
  tryUseServiceWorker: true  // Background sync
});
```

## TypeScript Patterns

### RxDB Full Type Safety

```typescript
import { RxDocument, RxCollection, RxDatabase } from 'rxdb';

type TodoDoc = { id: string; title: string; done: boolean };

type TodoDocMethods = {
  complete: () => Promise<void>;
};

type TodoDocument = RxDocument<TodoDoc, TodoDocMethods>;
type TodoCollection = RxCollection<TodoDoc, TodoDocMethods>;
type MyDatabase = RxDatabase<{ todos: TodoCollection }>;

const db: MyDatabase = await createRxDatabase({ /* ... */ });
```

### Dexie EntityTable Pattern

```typescript
import { Dexie, type EntityTable } from 'dexie';

interface Todo {
  id: number;
  title: string;
  done: boolean;
}

const db = new Dexie('mydb') as Dexie & {
  todos: EntityTable<Todo, 'id'>;
};
```

## Performance Guidelines

### Critical Optimizations

1. **Use bulk operations** - 10x+ faster than loops
   ```typescript
   // Bad: for (const doc of docs) { await collection.insert(doc); }
   // Good:
   await collection.bulkInsert(docs);
   ```

2. **Index only queried fields** - Over-indexing hurts performance
   ```typescript
   // Bad: '++id, name, email, phone, address, city, country'
   // Good: '++id, email, [city+country]'
   ```

3. **Compound index ordering** - More selective field first
   ```typescript
   // If 50% are 'pending' but only 10% are 'high' priority:
   indexes: [['priority', 'status']]  // priority first (more selective)
   ```

4. **Use count() not toArray().length**
   ```typescript
   // Bad: (await db.todos.toArray()).length
   // Good:
   await db.todos.count();
   ```

5. **Attachments for large data** (RxDB)
   ```typescript
   await doc.putAttachment({
     id: 'image.jpg',
     data: blob,
     type: 'image/jpeg'
   });
   ```

### Storage Engine Selection (RxDB)

| Engine | Best For | Performance |
|--------|----------|-------------|
| Dexie.js | Free, good baseline | Very Good |
| IndexedDB (Premium) | Production browsers | Excellent |
| Memory-Synced | Read-heavy apps | Outstanding |
| SQLite | Mobile/Desktop | Excellent |

## Schema Migration

### RxDB Migration

```typescript
const schema = {
  version: 1,  // Increment version
  // ... schema definition
};

await db.addCollections({
  todos: {
    schema,
    migrationStrategies: {
      1: (oldDoc) => {
        oldDoc.timestamp = new Date(oldDoc.date).toISOString();
        delete oldDoc.date;
        return oldDoc;  // Return null to delete
      }
    }
  }
});
```

### Dexie Migration

```typescript
db.version(1).stores({ todos: '++id, title' });

db.version(2)
  .stores({ todos: '++id, title, done' })
  .upgrade(tx => {
    return tx.table('todos').toCollection().modify(todo => {
      todo.done = todo.done ?? false;
    });
  });
```

## React/Next.js Integration

### Database Provider Pattern

```typescript
'use client';

const DbContext = createContext<AppDatabase | null>(null);

export function DbProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<AppDatabase | null>(null);

  useEffect(() => {
    // Initialize only in browser
    initDatabase().then(setDb);
  }, []);

  if (!db) return <div>Loading database...</div>;

  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}

export function useDb() {
  const db = useContext(DbContext);
  if (!db) throw new Error('useDb must be used within DbProvider');
  return db;
}
```

### Next.js Two-Phase Hydration

```typescript
// Server Component
export default async function Page() {
  const serverData = await fetchFromServer();
  return <ClientComponent initialData={serverData} />;
}

// Client Component
'use client';
export function ClientComponent({ initialData }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const localData = useLiveQuery(() => db.items.toArray());

  useEffect(() => {
    // Sync server data to local DB
    syncToLocal(initialData).then(() => setHydrated(true));
  }, []);

  return <List data={hydrated ? localData : initialData} />;
}
```

## Common Pitfalls

### RxDB Pitfalls

1. **Missing maxLength on primary key** - Will fail silently
2. **Forgetting `as const`** - TypeScript inference won't work
3. **Not using bulk operations** - Major performance issue
4. **Wrong compound index order** - Put more selective field first

### Dexie Pitfalls

1. **Listing all properties in schema** - Only list indexes!
2. **Forgetting to index queried fields** - Queries will be slow
3. **Using auto-increment IDs with sync** - Use UUID (`$$uuid`)
4. **Not handling promise rejections** - Use try/catch

## Debugging

### RxDB Debugging

```typescript
import { wrappedLoggerStorage } from 'rxdb-premium/plugins/logger';

const storage = wrappedLoggerStorage({
  storage: getRxStorageIndexedDB({}),
  settings: { prefix: 'DEBUG', timing: true }
});
```

### Dexie Debugging

```typescript
// Dump schema
db.tables.forEach(table => {
  const indexes = [table.schema.primKey, ...table.schema.indexes];
  console.log(`${table.name}: '${indexes.map(i => i.src).join(',')}'`);
});

// List all databases
const dbs = await Dexie.getDatabaseNames();
```

## Reference Documentation

For detailed patterns and advanced usage, see the reference files:

- `references/rxdb-patterns.md` - Complete RxDB patterns and examples
- `references/dexie-patterns.md` - Complete Dexie.js patterns and examples

These files contain extensive code examples for:
- Complex query patterns
- Replication configurations
- Conflict resolution strategies
- Performance optimization techniques
- Migration strategies
