# Dexie.js Complete Reference

Comprehensive patterns and examples for Dexie.js - the minimalistic IndexedDB wrapper.

## Database Setup

### Basic Setup

```typescript
import { Dexie, type EntityTable } from 'dexie';

interface Friend {
  id: number;
  name: string;
  age: number;
  email?: string;
}

// Type-safe database declaration
const db = new Dexie('FriendDatabase') as Dexie & {
  friends: EntityTable<Friend, 'id'>;
};

// Schema defines INDEXES only, not table structure
db.version(1).stores({
  friends: '++id, age'  // Auto-increment ID, age indexed
});

// Open database (optional, auto-opens on first operation)
await db.open();
```

### Primary Key Patterns

```typescript
db.version(1).stores({
  // Auto-increment integer primary key
  items: '++id, name',

  // Non-auto primary key (must provide on insert)
  settings: 'key, value',

  // UUID primary key (for sync)
  messages: '$$uuid, sender, timestamp',

  // Unique constraint (& prefix)
  users: '++id, &email, name',

  // Inline primary key (property is the key)
  products: '@sku, name, price'
});
```

### Index Types

```typescript
db.version(1).stores({
  items: [
    '++id',           // Auto-increment primary key
    'name',           // Simple index
    '&email',         // Unique index
    '*tags',          // Multi-entry index (for arrays)
    '[firstName+lastName]',  // Compound index
    '[city+country]'  // Another compound index
  ].join(', ')
});
```

## TypeScript Patterns

### EntityTable Pattern (Recommended)

```typescript
import { Dexie, type EntityTable } from 'dexie';

// Define entities
interface User {
  id: number;
  email: string;
  name: string;
  createdAt: Date;
}

interface Post {
  id: string;  // UUID
  userId: number;
  title: string;
  content: string;
}

// Type-safe database
const db = new Dexie('AppDatabase') as Dexie & {
  users: EntityTable<User, 'id'>;
  posts: EntityTable<Post, 'id'>;
};

db.version(1).stores({
  users: '++id, &email, name',
  posts: '$$uuid, userId, title'
});

// Full type safety
const user = await db.users.get(1);  // User | undefined
const posts = await db.posts.where('userId').equals(1).toArray();  // Post[]
```

### Class-Based Database

```typescript
import Dexie, { type EntityTable } from 'dexie';

interface Friend {
  id?: number;
  name: string;
  age: number;
}

class AppDatabase extends Dexie {
  friends!: EntityTable<Friend, 'id'>;

  constructor() {
    super('AppDatabase');
    this.version(1).stores({
      friends: '++id, name, age'
    });
  }
}

const db = new AppDatabase();
```

## Query API

### WhereClause Methods

```typescript
// Equality
const alice = await db.friends.where('name').equals('Alice').first();

// Case-insensitive equality
const users = await db.friends.where('name').equalsIgnoreCase('alice').toArray();

// Comparison
const adults = await db.friends.where('age').above(18).toArray();
const seniors = await db.friends.where('age').aboveOrEqual(65).toArray();
const minors = await db.friends.where('age').below(18).toArray();
const teens = await db.friends.where('age').belowOrEqual(19).toArray();

// Range
const middleAged = await db.friends.where('age').between(30, 50).toArray();
const inclusive = await db.friends.where('age').between(30, 50, true, true).toArray();

// String prefix
const aNames = await db.friends.where('name').startsWith('A').toArray();
const aOrB = await db.friends.where('name').startsWithAnyOf(['A', 'B']).toArray();

// IN query
const specific = await db.friends.where('age').anyOf([20, 25, 30]).toArray();

// NOT IN query
const notThese = await db.friends.where('age').noneOf([20, 25, 30]).toArray();

// NOT equal
const notAlice = await db.friends.where('name').notEqual('Alice').toArray();

// Multiple ranges
const ranges = await db.friends.where('age').inAnyRange([
  [18, 25],
  [40, 50]
]).toArray();
```

### Compound Index Queries

```typescript
db.version(1).stores({
  friends: '++id, [firstName+lastName], [city+age]'
});

// Query compound index
const john = await db.friends
  .where('[firstName+lastName]')
  .equals(['John', 'Doe'])
  .first();

// Range on compound index
const cityResults = await db.friends
  .where('[city+age]')
  .between(['New York', 18], ['New York', 65])
  .toArray();
```

### Collection Methods (Chainable)

```typescript
const results = await db.friends
  .where('age').above(18)
  .and(friend => friend.name.length > 3)  // Additional filter
  .filter(friend => friend.active)         // Client-side filter
  .distinct()                              // Unique results
  .limit(10)                               // Limit results
  .offset(20)                              // Skip first 20
  .reverse()                               // Reverse order
  .sortBy('name');                         // Sort by property

// Until (stop when condition met)
const results = await db.friends
  .orderBy('age')
  .until(friend => friend.age > 50)
  .toArray();
```

### Execution Methods

```typescript
// Get all as array
const all = await db.friends.toArray();

// Get first match
const first = await db.friends.where('age').above(18).first();

// Get last match
const last = await db.friends.orderBy('age').last();

// Count results
const count = await db.friends.where('age').above(18).count();

// Iterate over results
await db.friends.where('age').above(18).each(friend => {
  console.log(friend.name);
});

// Get keys only
const ids = await db.friends.where('age').above(18).primaryKeys();

// Get unique keys
const ages = await db.friends.orderBy('age').uniqueKeys();
```

## CRUD Operations

### Create

```typescript
// Add single item (returns ID)
const id = await db.friends.add({ name: 'Alice', age: 25 });

// Add with explicit key
await db.friends.add({ id: 1, name: 'Bob', age: 30 });

// Bulk add
await db.friends.bulkAdd([
  { name: 'Charlie', age: 35 },
  { name: 'Diana', age: 28 }
]);

// Put (add or replace)
await db.friends.put({ id: 1, name: 'Bob Updated', age: 31 });

// Bulk put
await db.friends.bulkPut([
  { id: 1, name: 'Bob', age: 31 },
  { id: 2, name: 'Charlie', age: 36 }
]);
```

### Read

```typescript
// Get by primary key
const friend = await db.friends.get(1);

// Get multiple by keys
const friends = await db.friends.bulkGet([1, 2, 3]);

// Get by index
const alice = await db.friends.where('name').equals('Alice').first();

// Get all
const all = await db.friends.toArray();

// Get with filter
const adults = await db.friends.filter(f => f.age >= 18).toArray();
```

### Update

```typescript
// Update by key
await db.friends.update(1, { age: 26 });

// Modify matching records
await db.friends
  .where('age').below(18)
  .modify({ category: 'minor' });

// Modify with function
await db.friends
  .where('age').above(65)
  .modify(friend => {
    friend.category = 'senior';
    friend.discount = 0.15;
  });

// Bulk update (put replaces entire record)
await db.friends.bulkPut([
  { id: 1, name: 'Alice', age: 26 },
  { id: 2, name: 'Bob', age: 31 }
]);

// Atomic increment
await db.friends.where('id').equals(1).modify(f => {
  f.loginCount = (f.loginCount || 0) + 1;
});
```

### Delete

```typescript
// Delete by key
await db.friends.delete(1);

// Bulk delete
await db.friends.bulkDelete([1, 2, 3]);

// Delete matching records
await db.friends.where('age').below(18).delete();

// Clear entire table
await db.friends.clear();
```

## Transactions

### Basic Transaction

```typescript
await db.transaction('rw', db.friends, db.posts, async () => {
  // All operations in this block are atomic
  await db.friends.add({ name: 'Alice', age: 25 });
  await db.posts.add({ userId: 1, title: 'Hello' });

  // If any operation fails, all are rolled back
});
```

### Transaction Modes

```typescript
// Read-only (faster)
await db.transaction('r', db.friends, async () => {
  const count = await db.friends.count();
});

// Read-write
await db.transaction('rw', db.friends, async () => {
  await db.friends.add({ name: 'Bob', age: 30 });
});

// Read-write with upgrade (for schema changes)
await db.transaction('rw!', db.friends, async () => {
  // Can modify schema here
});
```

### Error Handling

```typescript
try {
  await db.transaction('rw', db.friends, async () => {
    await db.friends.add({ name: 'Alice', age: 25 });

    // Simulate error
    throw new Error('Something went wrong');

    // This won't execute, transaction is rolled back
    await db.friends.add({ name: 'Bob', age: 30 });
  });
} catch (error) {
  console.error('Transaction failed:', error);
  // Alice was not added due to rollback
}
```

### Nested Transactions

```typescript
await db.transaction('rw', db.friends, db.posts, async () => {
  await db.friends.add({ name: 'Alice', age: 25 });

  // Nested transaction (same scope)
  await db.transaction('rw', db.posts, async () => {
    await db.posts.add({ userId: 1, title: 'Hello' });
  });
});
```

## Schema Versioning

### Adding Tables

```typescript
const db = new Dexie('MyDatabase');

// Initial version
db.version(1).stores({
  friends: '++id, name, age'
});

// Add new table
db.version(2).stores({
  friends: '++id, name, age',
  posts: '++id, userId, title'
});
```

### Adding Indexes

```typescript
// Version 1
db.version(1).stores({
  friends: '++id, name'
});

// Version 2: Add age index
db.version(2).stores({
  friends: '++id, name, age'
});
```

### Migration with Upgrade

```typescript
db.version(1).stores({
  friends: '++id, name'
});

db.version(2)
  .stores({
    friends: '++id, name, fullName'
  })
  .upgrade(tx => {
    return tx.table('friends').toCollection().modify(friend => {
      friend.fullName = friend.firstName + ' ' + friend.lastName;
      delete friend.firstName;
      delete friend.lastName;
    });
  });
```

### Removing Tables

```typescript
db.version(3).stores({
  friends: '++id, name',
  posts: null  // Remove posts table
});
```

### Complex Migration

```typescript
db.version(4)
  .stores({
    friends: '++id, name, email',
    accounts: '++id, friendId, balance'
  })
  .upgrade(async tx => {
    // Create accounts for existing friends
    const friends = await tx.table('friends').toArray();

    await tx.table('accounts').bulkAdd(
      friends.map(friend => ({
        friendId: friend.id,
        balance: 0
      }))
    );

    // Update friends with default email
    await tx.table('friends').toCollection().modify(friend => {
      friend.email = friend.email || `${friend.name.toLowerCase()}@example.com`;
    });
  });
```

## Observable/LiveQuery

### Basic LiveQuery

```typescript
import { liveQuery } from 'dexie';

// Create observable query
const friends$ = liveQuery(() =>
  db.friends.where('age').above(18).toArray()
);

// Subscribe to changes
const subscription = friends$.subscribe({
  next: friends => console.log('Friends updated:', friends),
  error: err => console.error('Error:', err)
});

// Unsubscribe
subscription.unsubscribe();
```

### React Integration

```typescript
import { useLiveQuery } from 'dexie-react-hooks';

function FriendsList() {
  // Auto-updates when database changes
  const friends = useLiveQuery(
    () => db.friends.where('age').above(18).toArray(),
    []  // Dependencies
  );

  if (!friends) return <div>Loading...</div>;

  return (
    <ul>
      {friends.map(friend => (
        <li key={friend.id}>{friend.name}</li>
      ))}
    </ul>
  );
}
```

### Computed Queries

```typescript
function useFriendStats() {
  return useLiveQuery(async () => {
    const friends = await db.friends.toArray();
    return {
      total: friends.length,
      averageAge: friends.reduce((sum, f) => sum + f.age, 0) / friends.length,
      adults: friends.filter(f => f.age >= 18).length
    };
  });
}
```

### Observable Addon (Cross-Tab)

```typescript
import 'dexie-observable';

// Listen to all changes (works across browser tabs)
db.on('changes', (changes, partial) => {
  changes.forEach(change => {
    switch (change.type) {
      case 1: // CREATED
        console.log('Created:', change.table, change.obj);
        break;
      case 2: // UPDATED
        console.log('Updated:', change.table, change.key, change.mods);
        break;
      case 3: // DELETED
        console.log('Deleted:', change.table, change.oldObj);
        break;
    }
  });
});
```

## Dexie Cloud

### Setup

```bash
npm install dexie@latest dexie-cloud-addon@latest
npx dexie-cloud create  # Get database URL
```

```typescript
import Dexie from 'dexie';
import dexieCloud from 'dexie-cloud-addon';

const db = new Dexie('MyCloudDB', { addons: [dexieCloud] });

db.version(1).stores({
  todos: '@id, title, completed'  // @ prefix for cloud-synced primary key
});

db.cloud.configure({
  databaseUrl: 'https://yourdb.dexie.cloud',
  requireAuth: true,
  tryUseServiceWorker: true  // Background sync
});
```

### Authentication

```typescript
// Check auth status
const currentUser = await db.cloud.currentUser;

// Login
await db.cloud.login();

// Logout
await db.cloud.logout();

// Custom auth provider
db.cloud.configure({
  customLoginGui: true,
  fetchTokens: async () => {
    // Return tokens from your auth provider
    return {
      accessToken: 'your-access-token',
      refreshToken: 'your-refresh-token'
    };
  }
});
```

### Sync Control

```typescript
// Check sync status
const syncState = await db.cloud.sync();

// Force sync
await db.cloud.sync({ force: true });

// Pause/resume sync
db.cloud.options.disableWebSocket = true;  // Pause
db.cloud.options.disableWebSocket = false; // Resume
```

## Export/Import

### Export Database

```typescript
import 'dexie-export-import';

// Export to blob
const blob = await db.export({ prettyJson: true });

// Download as file
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'database-backup.json';
a.click();
```

### Import Database

```typescript
import 'dexie-export-import';

// Import from blob
const file = inputElement.files[0];
await db.import(file, {
  overwriteValues: true,  // Replace existing records
  clearTablesBeforeImport: false
});
```

### Export with Progress

```typescript
const blob = await db.export({
  prettyJson: true,
  progressCallback: ({ totalRows, completedRows, done }) => {
    console.log(`Progress: ${completedRows}/${totalRows}`);
    return true;  // Return false to abort
  }
});
```

## Performance Optimization

### 1. Index Only Queried Fields

```typescript
// BAD: Too many indexes
db.version(1).stores({
  users: '++id, name, email, phone, address, city, country'
});

// GOOD: Only what you query
db.version(1).stores({
  users: '++id, &email, [city+country]'
});
```

### 2. Use Bulk Operations

```typescript
// BAD: Multiple transactions
for (const item of items) {
  await db.items.add(item);
}

// GOOD: Single transaction
await db.items.bulkAdd(items);

// BETTER: Explicit transaction for complex operations
await db.transaction('rw', db.items, db.logs, async () => {
  await db.items.bulkAdd(items);
  await db.logs.add({ action: 'bulk_insert', count: items.length });
});
```

### 3. Use Compound Indexes

```typescript
db.version(1).stores({
  orders: '++id, [customerId+status], createdAt'
});

// Efficient query using compound index
const pending = await db.orders
  .where('[customerId+status]')
  .equals([userId, 'pending'])
  .toArray();
```

### 4. Prefer Count Over Length

```typescript
// BAD: Loads all data
const count = (await db.items.toArray()).length;

// GOOD: Uses index
const count = await db.items.count();
```

### 5. Batch Large Queries

```typescript
// For very large tables, process in batches
async function processAllItems() {
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const batch = await db.items
      .offset(offset)
      .limit(batchSize)
      .toArray();

    if (batch.length === 0) break;

    await processBatch(batch);
    offset += batchSize;
  }
}
```

### 6. Use anyOf Instead of Multiple Get

```typescript
// BAD: Multiple queries
const items = [];
for (const id of ids) {
  const item = await db.items.get(id);
  items.push(item);
}

// GOOD: Single query
const items = await db.items.where('id').anyOf(ids).toArray();
```

## Debugging

### Dump Schema

```typescript
async function dumpSchema(dbName: string) {
  const db = new Dexie(dbName);
  await db.open();

  console.log(`db.version(${db.verno}).stores({`);
  db.tables.forEach(table => {
    const indexes = [table.schema.primKey, ...table.schema.indexes];
    const schema = indexes.map(idx => idx.src).join(',');
    console.log(`  ${table.name}: '${schema}'`);
  });
  console.log('});');

  db.close();
}
```

### List All Databases

```typescript
const databases = await Dexie.getDatabaseNames();
console.log('Available databases:', databases);
```

### Delete Database

```typescript
await Dexie.delete('DatabaseName');
```

### Debug Queries

```typescript
// Log all queries
const originalWhere = db.friends.where;
db.friends.where = function(...args) {
  console.log('Query on friends:', args);
  return originalWhere.apply(this, args);
};
```

### Check Table Stats

```typescript
async function tableStats(db: Dexie) {
  for (const table of db.tables) {
    const count = await table.count();
    console.log(`${table.name}: ${count} records`);
  }
}
```

## Common Pitfalls

### 1. Listing All Properties in Schema

```typescript
// WRONG: Schema is NOT table structure
db.version(1).stores({
  users: '++id, name, email, phone, address, bio, createdAt, updatedAt'
});

// CORRECT: Only list indexes
db.version(1).stores({
  users: '++id, &email'  // Only email needs to be indexed
});

// All properties can still be stored
await db.users.add({
  name: 'Alice',
  email: 'alice@example.com',
  phone: '555-1234',  // Not indexed but stored
  address: '123 Main St',  // Not indexed but stored
  bio: 'Hello world'  // Not indexed but stored
});
```

### 2. Forgetting to Index Queried Fields

```typescript
// BAD: 'status' not indexed
db.version(1).stores({ orders: '++id, customerId' });
// This will be SLOW:
await db.orders.where('status').equals('pending').toArray();

// GOOD: Index queried fields
db.version(1).stores({ orders: '++id, customerId, status' });
```

### 3. Using Auto-Increment with Sync

```typescript
// BAD: Auto-increment IDs conflict across devices
db.version(1).stores({ items: '++id, name' });

// GOOD: UUID for synced data
db.version(1).stores({ items: '$$uuid, name' });

// Or generate your own UUIDs
const id = crypto.randomUUID();
await db.items.add({ id, name: 'Item' });
```

### 4. Not Handling Errors

```typescript
// BAD: Silent failures
await db.items.add({ name: 'Item' });

// GOOD: Error handling
try {
  await db.items.add({ name: 'Item' });
} catch (error) {
  if (error.name === 'ConstraintError') {
    console.error('Duplicate key');
  } else {
    throw error;
  }
}
```

### 5. Modifying Objects Without Saving

```typescript
// BAD: Changes not persisted
const item = await db.items.get(1);
item.name = 'Updated';  // Not saved!

// GOOD: Use update or put
await db.items.update(1, { name: 'Updated' });

// Or put the modified object
const item = await db.items.get(1);
item.name = 'Updated';
await db.items.put(item);
```

## Next.js Integration

### Database Module

```typescript
// lib/db.ts
'use client';

import { Dexie, type EntityTable } from 'dexie';

interface Item {
  id: number;
  name: string;
}

let db: (Dexie & { items: EntityTable<Item, 'id'> }) | null = null;

export function getDb() {
  if (typeof window === 'undefined') {
    throw new Error('Database can only be used in browser');
  }

  if (!db) {
    db = new Dexie('AppDatabase') as Dexie & {
      items: EntityTable<Item, 'id'>;
    };
    db.version(1).stores({ items: '++id, name' });
  }

  return db;
}
```

### Provider Pattern

```typescript
// providers/db-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getDb } from '@/lib/db';

type AppDatabase = ReturnType<typeof getDb>;

const DbContext = createContext<AppDatabase | null>(null);

export function DbProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<AppDatabase | null>(null);

  useEffect(() => {
    setDb(getDb());
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

### Client Component

```typescript
// components/items-list.tsx
'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useDb } from '@/providers/db-provider';

export function ItemsList() {
  const db = useDb();
  const items = useLiveQuery(() => db.items.toArray(), [db]);

  const addItem = async () => {
    await db.items.add({ name: `Item ${Date.now()}` });
  };

  return (
    <div>
      <button onClick={addItem}>Add Item</button>
      <ul>
        {items?.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```
