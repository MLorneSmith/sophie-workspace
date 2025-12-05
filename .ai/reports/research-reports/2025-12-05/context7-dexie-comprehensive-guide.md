# Context7 Research: Dexie.js Comprehensive Guide

**Date**: 2025-12-05
**Agent**: context7-expert
**Libraries Researched**: dexie/dexie.js (latest)

## Query Summary

Comprehensive research on Dexie.js (IndexedDB wrapper) covering architecture, database/table definitions, schema versioning, query API, hooks/middleware, Dexie Cloud sync, TypeScript integration, React/Next.js patterns, performance optimization, and debugging approaches. This research is intended to create a Claude Code skill for helping developers implement Dexie.js.

## Findings

### 1. What Dexie.js Is and Its Architecture

**Overview**: Dexie.js is a minimalistic wrapper for IndexedDB, providing a clean, promise-based API that makes working with browser-based databases intuitive and powerful.

**Key Features**:
- Modern promise-based API (supports async/await)
- Type-safe TypeScript support with EntityTable<T, K> pattern
- Query API inspired by LINQ/SQL
- Observable pattern for real-time data updates
- Cloud sync capabilities (Dexie Cloud)
- Minimal wrapper overhead over native IndexedDB

**Installation**:
```bash
npm install dexie
```

**Basic Architecture**:
```javascript
import { Dexie } from 'dexie';

// Database declaration
const db = new Dexie('DatabaseName');

// Schema definition
db.version(1).stores({
  tableName: '++id, indexedField1, indexedField2'
});

// Usage
await db.tableName.add({ name: 'Alice', age: 21 });
const results = await db.tableName.where('age').below(30).toArray();
```

### 2. Database and Table Definitions

**Primary Key Patterns**:
- ++id - Auto-incrementing primary key
- id - Non-auto-incrementing primary key (must be provided)
- $$uuid - UUID primary key (generates unique IDs, essential for sync)
- @propName - Inline key (property is the primary key)

**Schema Syntax**:
```javascript
db.version(1).stores({
  friends: '++id, name, age',           // Auto-increment ID, indexed name and age
  settings: 'key, value',                // 'key' is primary, 'value' indexed
  messages: '$$uuid, sender, timestamp', // UUID primary key
  products: '@sku, name, price'          // sku is inline primary key
});
```

**TypeScript Entity Pattern**:
```typescript
import { Dexie, type EntityTable } from 'dexie';

export interface Friend {
  id: number;
  name: string;
  age: number;
}

export const db = new Dexie('FriendDatabase') as Dexie & {
  friends: EntityTable<Friend, 'id'>;
};

db.version(1).stores({
  friends: '++id, age', // Only index what you query on
});
```

**Important Notes**:
- Only list properties that need to be indexed
- Don't list all properties in the schema
- The schema defines indexes, not table structure
- IndexedDB is schemaless for non-indexed properties

### 3. Schema Versioning and Migrations

**Version Progression**:
```javascript
const db = new Dexie('MyDatabase');

// Initial schema
db.version(1).stores({
  friends: '++id, name, age'
});

// Add new table in version 2
db.version(2).stores({
  friends: '++id, name, age',
  pets: '++id, name, species'
});

// Modify indexes in version 3
db.version(3).stores({
  friends: '++id, name, age, email', // Added email index
  pets: '++id, name, species, ownerId' // Added ownerId index
});
```

**Migration Hooks**:
```javascript
db.version(2)
  .stores({
    friends: '++id, name, age, email'
  })
  .upgrade(tx => {
    // Modify existing data during upgrade
    return tx.table('friends').toCollection().modify(friend => {
      friend.email = friend.email || 'unknown@example.com';
    });
  });
```

**Addon Installation Pattern**:
When adding addons (Observable, Syncable), increment version even if schema doesn't change:
```javascript
db.version(1).stores({ friends: '++id, name' });

// Enable addon - requires version bump
db.version(2).stores({}); // Empty stores, just triggers upgrade
```

**Schema Dumping** (useful for debugging):
```javascript
// Programmatically inspect database schema
const db = new Dexie(dbName);
await db.open();
console.log(\`db.version(\${db.verno}).stores({\`);
db.tables.forEach(table => {
  const indexes = [table.schema.primKey, ...table.schema.indexes];
  const schema = indexes.map(idx => idx.src).join(',');
  console.log(\`  \${table.name}: '\${schema}'\`);
});
console.log('});');
db.close();
```

### 4. Query API (where, equals, between, etc.)

**Complete Query API Reference**:

```javascript
// WhereClause methods
.where('field')
  .above(value)              // field > value
  .aboveOrEqual(value)       // field >= value
  .below(value)              // field < value
  .belowOrEqual(value)       // field <= value
  .equals(value)             // field === value
  .equalsIgnoreCase(value)   // Case-insensitive match
  .between(lower, upper, includeLower?, includeUpper?)
  .startsWith(prefix)        // For strings
  .startsWithIgnoreCase(prefix)
  .startsWithAnyOf([prefixes])
  .startsWithAnyOfIgnoreCase([prefixes])
  .anyOf([values])           // IN query
  .anyOfIgnoreCase([values])
  .noneOf([values])          // NOT IN query
  .notEqual(value)           // field !== value
  .inAnyRange([{from, to}, ...]) // Multiple ranges

// Collection methods (chainable)
.and(obj => boolean)         // Additional filter
.filter(obj => boolean)      // Client-side filter
.distinct()                  // Unique results
.limit(n)                    // Limit results
.offset(n)                   // Skip n results
.reverse()                   // Reverse order
.sortBy('keyPath')           // Sort by property
.until(obj => boolean, includeStopEntry?)
.orderBy('index')            // Use different index

// Execution methods (return Promise)
.toArray()                   // Get all as array
.each(callback)              // Iterate over results
.first()                     // Get first result
.last()                      // Get last result
.count()                     // Count results
.keys()                      // Get primary keys
.primaryKeys()               // Get primary keys
.uniqueKeys()                // Get unique keys
.eachKey(callback)           // Iterate over keys
.eachPrimaryKey(callback)
.eachUniqueKey(callback)

// Table methods (direct operations)
.add(item, key?)             // Add single item
.bulkAdd([items])            // Add multiple
.put(item, key?)             // Add or update
.bulkPut([items])            // Put multiple
.update(key, changes)        // Update by key
.delete(key)                 // Delete by key
.bulkDelete([keys])          // Delete multiple
.clear()                     // Delete all
.get(key)                    // Get by primary key
.modify(changes)             // Modify matched records
.modify(callback)            // Modify with function
```

**Query Examples**:
```javascript
// Range queries
const youngFriends = await db.friends
  .where('age')
  .between(18, 30)
  .toArray();

// Multiple conditions
const results = await db.friends
  .where('age').above(18)
  .and(friend => friend.name.startsWith('A'))
  .toArray();

// Pagination
const page2 = await db.friends
  .orderBy('name')
  .offset(20)
  .limit(10)
  .toArray();

// Compound index queries
db.version(1).stores({
  friends: '++id, [firstName+lastName], age'
});

const friend = await db.friends
  .where('[firstName+lastName]')
  .equals(['John', 'Doe'])
  .first();

// Bulk operations
await db.friends.bulkAdd([
  { name: 'Alice', age: 21 },
  { name: 'Bob', age: 25 }
]);

// Modify records
await db.friends
  .where('age').below(18)
  .modify({ isMinor: true });

// Modify with function
await db.friends
  .where('age').above(30)
  .modify(friend => {
    friend.ageGroup = 'senior';
  });
```

### 5. Hooks and Middleware

**Observable Pattern** (dexie-observable addon):
```bash
npm install dexie-observable
```

```javascript
import Dexie from 'dexie';
import 'dexie-observable';

const db = new Dexie('ObservableDB');
db.version(1).stores({
  friends: '++id, name, age'
});

// Subscribe to all changes
db.on('changes', (changes, partial) => {
  changes.forEach(change => {
    switch (change.type) {
      case 1: // CREATED
        console.log('Created:', change.obj);
        break;
      case 2: // UPDATED
        console.log('Updated key:', change.key, 'mods:', change.mods);
        break;
      case 3: // DELETED
        console.log('Deleted:', change.oldObj);
        break;
    }
  });
});

// Changes are detected across browser windows/tabs
await db.friends.add({ name: 'Alice', age: 21 });
// Triggers CREATED event
```

**LiveQuery Pattern** (for React/UI updates):
```javascript
import { liveQuery } from 'dexie';

const friendsObservable = liveQuery(() =>
  db.friends.where('age').between(18, 30).toArray()
);

const subscription = friendsObservable.subscribe({
  next: results => console.log('Results updated:', results),
  error: err => console.error(err)
});

// Auto-updates when database changes
await db.friends.add({ name: 'Bob', age: 25 });
// Triggers subscription with new results

subscription.unsubscribe(); // Clean up
```

**Transaction Hooks**:
```javascript
db.transaction('rw', db.friends, async () => {
  // All operations in this transaction
  await db.friends.add({ name: 'Alice', age: 21 });
  await db.friends.where('age').above(30).modify({ senior: true });
  
  // Transaction commits automatically on success
  // Rolls back on error
}).catch(error => {
  console.error('Transaction failed:', error);
});
```

### 6. Dexie Cloud (Sync Service)

**Overview**: Dexie Cloud is a commercial sync service that provides real-time, multi-user database synchronization with authentication and access control.

**Installation**:
```bash
npm install dexie@latest
npm install dexie-cloud-addon@latest
```

**Basic Setup**:
```typescript
import Dexie from 'dexie';
import dexieCloud from 'dexie-cloud-addon';

const db = new Dexie('MyCloudDB', { addons: [dexieCloud] });

db.version(1).stores({
  todos: '@id, title, completed', // @ prefix for cloud-synced primary key
  lists: '@id, name'
});

db.cloud.configure({
  databaseUrl: 'https://<yourdb>.dexie.cloud'
});
```

**Creating Cloud Database**:
```bash
npx dexie-cloud create
# Outputs database URL for configuration
```

**Service Worker for Offline Sync**:
```typescript
// In your configuration
db.cloud.configure({
  databaseUrl: 'https://<yourdb>.dexie.cloud',
  tryUseServiceWorker: true // Enable offline sync
});
```

**Deployment Whitelisting** (for PWAs):
```bash
npm run deploy
npx dexie-cloud whitelist https://your-domain.github.io
```

**Key Features**:
- Real-time multi-user sync
- Offline-first with service worker support
- Built-in authentication
- Access control and permissions
- Conflict resolution
- Works across devices and browsers

### 7. TypeScript Integration

**Entity Table Pattern** (Recommended):
```typescript
import { Dexie, type EntityTable } from 'dexie';

// Define entity interfaces
export interface Friend {
  id: number;
  name: string;
  age: number;
  email?: string;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

// Type-safe database declaration
export const db = new Dexie('TypeSafeDB') as Dexie & {
  friends: EntityTable<Friend, 'id'>;
  messages: EntityTable<Message, 'id'>;
};

// Schema (only indexes)
db.version(1).stores({
  friends: '++id, age',        // Auto-increment ID, age indexed
  messages: 'id, sender, timestamp' // String ID, sender and timestamp indexed
});

// Usage with full type safety
const addFriend = async (name: string, age: number): Promise<number> => {
  return await db.friends.add({ name, age }); // Returns number (ID)
};

const getFriend = async (id: number): Promise<Friend | undefined> => {
  return await db.friends.get(id); // Returns Friend | undefined
};

const youngFriends = await db.friends.where('age').below(30).toArray();
// youngFriends: Friend[]
```

### 8. Common Patterns for React/Next.js Integration

**React Hook Pattern**:
```bash
npm install dexie-react-hooks
```

```tsx
import React from 'react';
import { Dexie, type EntityTable } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';

// Database setup
export interface Friend {
  id: number;
  name: string;
  age: number;
}

export const db = new Dexie('FriendDatabase') as Dexie & {
  friends: EntityTable<Friend, 'id'>;
};

db.version(1).stores({
  friends: '++id, age',
});

// React Component
export function FriendsList() {
  // Auto-updates when database changes
  const youngFriends = useLiveQuery(
    () => db.friends.where('age').below(30).toArray()
  );

  const addFriend = async () => {
    await db.friends.add({ name: 'Alice', age: 21 });
  };

  return (
    <>
      <h3>My Young Friends</h3>
      <ul>
        {youngFriends?.map(friend => (
          <li key={friend.id}>
            {friend.name}, Age: {friend.age}
          </li>
        ))}
      </ul>
      <button onClick={addFriend}>Add Friend</button>
    </>
  );
}
```

**Next.js App Router Pattern**: See full example in detailed sections above.

### 9. Performance Optimization Tips

**1. Index Only What You Query**:
```javascript
// BAD - too many indexes
db.version(1).stores({
  users: '++id, name, email, age, city, country, phone, address'
});

// GOOD - only indexed fields
db.version(1).stores({
  users: '++id, email, [city+country]' // Compound index for location queries
});
```

**2. Use Compound Indexes for Multi-Field Queries**:
```javascript
db.version(1).stores({
  orders: '++id, [customerId+status], createdAt'
});

// Efficient query using compound index
const pendingOrders = await db.orders
  .where('[customerId+status]')
  .equals([userId, 'pending'])
  .toArray();
```

**3. Bulk Operations Over Loops**:
```javascript
// BAD - multiple transactions
for (const item of items) {
  await db.table.add(item);
}

// GOOD - single transaction
await db.table.bulkAdd(items);
```

**4. Use Transactions for Related Operations**:
```javascript
await db.transaction('rw', db.orders, db.inventory, async () => {
  await db.orders.add(order);
  await db.inventory.where('productId').equals(order.productId)
    .modify(item => item.stock -= order.quantity);
});
```

**5. Use .count() Instead of .toArray().length**:
```javascript
// BAD - loads all data
const count = (await db.friends.where('age').above(18).toArray()).length;

// GOOD - counts without loading
const count = await db.friends.where('age').above(18).count();
```

### 10. Common Pitfalls and Debugging Approaches

**Pitfall 1: Forgetting to Index Queried Fields**
```javascript
// BAD - 'age' not indexed
db.version(1).stores({
  friends: '++id, name' // age not indexed
});
await db.friends.where('age').above(18).toArray(); // SLOW!

// GOOD
db.version(1).stores({
  friends: '++id, name, age'
});
```

**Pitfall 2: Listing All Properties in Schema**
```javascript
// WRONG - schema is NOT the table structure
db.version(1).stores({
  friends: '++id, name, age, email, phone, address' // Too many indexes!
});

// CORRECT - only index what you query
db.version(1).stores({
  friends: '++id, email' // Only ID (auto) and email need indexes
});

// You can still store other properties
await db.friends.add({
  name: 'Alice',
  age: 21,
  email: 'alice@example.com',
  phone: '555-1234', // Stored but not indexed
  address: '123 Main St' // Stored but not indexed
});
```

**Debugging Techniques**:

**1. Dump Database Schema**:
```javascript
async function dumpSchema(dbName) {
  const db = new Dexie(dbName);
  await db.open();
  
  console.log(\`db.version(\${db.verno}).stores({\`);
  db.tables.forEach(table => {
    const indexes = [table.schema.primKey, ...table.schema.indexes]
      .map(idx => idx.src)
      .join(',');
    console.log(\`  \${table.name}: '\${indexes}'\`);
  });
  console.log('});');
  
  db.close();
}
```

**2. List All Databases**:
```javascript
const databases = await Dexie.getDatabaseNames();
console.log('Available databases:', databases);
```

**3. Export Database for Inspection**:
```javascript
import 'dexie-export-import';

const blob = await db.export({ prettyJson: true });
const text = await blob.text();
console.log('Database contents:', JSON.parse(text));
```

## Key Takeaways

1. **Dexie.js is a promise-based IndexedDB wrapper** that simplifies browser database operations with a clean, intuitive API

2. **Schema defines indexes, not structure** - only list properties you'll query on; IndexedDB is schemaless for other properties

3. **TypeScript integration is excellent** - use EntityTable<T, K> pattern for full type safety

4. **React integration via useLiveQuery** - provides auto-updating components when database changes

5. **Performance through proper indexing** - index only what you query, use compound indexes, bulk operations, and transactions

6. **Observable pattern for real-time updates** - db.on('changes') detects modifications across browser windows/tabs

7. **Dexie Cloud for sync** - commercial service providing real-time multi-user synchronization with offline support

8. **Versioning is critical** - always increment version when modifying schema or adding addons

9. **Query API is powerful** - supports complex queries with where(), between(), anyOf(), compound indexes, and chainable filters

10. **Common pitfalls**: forgetting indexes on queried fields, listing all properties in schema, not handling promises, using auto-increment IDs with sync

## Sources

- **Dexie.js** (dexie/dexie.js) via Context7
  - Core library documentation
  - Observable addon documentation
  - Syncable addon documentation
  - Export/Import addon documentation
  - Dexie Cloud documentation
  - TypeScript integration patterns
  - React hooks documentation
  - Sample applications (Vue, React, vanilla JS)
  - API reference and examples

## Recommended Next Steps

1. **Create Claude Code Skill File** at .claude/skills/dexie-expert.md with:
   - Database setup patterns
   - Schema design best practices
   - Query optimization techniques
   - TypeScript integration templates
   - React/Next.js patterns
   - Performance guidelines
   - Debugging workflows

2. **Add Quick Reference Commands** for:
   - /dexie:init - Initialize database with TypeScript
   - /dexie:migrate - Create migration
   - /dexie:query - Generate optimized query
   - /dexie:react - Setup React integration
   - /dexie:debug - Debug database issues

3. **Include Common Patterns Library**:
   - CRUD operations
   - Pagination
   - Search/filtering
   - Bulk operations
   - Export/import
   - Sync setup

4. **Add Troubleshooting Guide**:
   - Schema design errors
   - Performance issues
   - Type safety problems
   - Migration conflicts
   - Sync issues
