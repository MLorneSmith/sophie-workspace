# SlideHeroes Local-First Implementation Plan

## Executive Summary

**Goal:** Transform SlideHeroes into a local-first application where presentation data lives encrypted in the browser (Dexie.js/RxDB), syncs encrypted to Supabase for backup/multi-device access, with optional browser-based AI for privacy-conscious enterprise customers.

**Primary Driver:** Data privacy for enterprise customers who are concerned about data leaving their premises.

**Secondary Benefits:** Improved performance, offline capability.

## Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Local Database | RxDB + Dexie.js | Native Supabase replication, reactive, field-level conflict resolution |
| Data Scope | All presentation data | Personal accounts only (no team presentations for now) |
| Data Residency | Browser + encrypted Supabase sync | Local-first with backup for multi-device access |
| Conflict Resolution | Field-level LWW | Per-field timestamps allow granular merging |
| Encryption | Web Crypto API (AES-GCM-256) | Session-derived keys, PBKDF2 with 600k iterations |
| Local AI | Transformers.js (Qwen2.5-0.5B) | 250MB quantized model, WebGPU/WASM |
| AI Tiers | Browser → BYOM → Cloud (Portkey) | Progressive fallback, enterprise flexibility |
| Service Worker | Serwist | Modern Next.js 15+ integration |
| Enterprise Policies | Per-organization admin settings | Owner of team controls local-first features |
| Migration | Clean slate | No existing data to migrate (development phase) |

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Local Database | RxDB + Dexie.js | Reactive local storage with IndexedDB |
| Sync Engine | RxDB Supabase Replication | Bidirectional encrypted sync |
| Encryption | Web Crypto API | AES-GCM-256 encryption at rest |
| Local AI | Transformers.js | Browser-based inference |
| Service Worker | Serwist | Offline capability, caching |
| State Management | rxdb-hooks | React integration for reactive data |

---

## Phase 0: Security Foundation

**Focus:** Harden the application against XSS and supply chain attacks before storing sensitive data locally

**Duration:** ~2 weeks

### Deliverables

| Task | Description | Priority |
|------|-------------|----------|
| Strict CSP | Implement nonce-based Content Security Policy | Critical |
| Trusted Types | Enforce safe DOM APIs to prevent injection | Critical |
| SRI Hashes | Add integrity attributes to third-party scripts | High |
| Supply Chain Audit | Lock npm versions, configure `.npmrc`, run audit | High |
| Security Headers | X-Content-Type-Options, X-Frame-Options, etc. | Medium |
| Threat Model Doc | Document attack vectors and mitigations | Medium |

### Technical Implementation

#### Content Security Policy (next.config.ts)

```typescript
// next.config.ts - CSP with nonces
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
  style-src 'self' 'nonce-${nonce}';
  connect-src 'self' https://*.supabase.co;
  worker-src 'self' blob:;
`;
```

#### NPM Lockdown (.npmrc)

```ini
engine-strict=true
save-exact=true
package-lock=true
audit=true
```

### Success Criteria

- [ ] CSP blocks inline scripts without nonces
- [ ] No `eval()` or `Function()` calls in codebase
- [ ] All third-party scripts have SRI hashes
- [ ] `npm audit` shows 0 high/critical vulnerabilities
- [ ] Security headers score A+ on securityheaders.com

---

## Phase 1: Core Local-First Infrastructure

**Focus:** Establish RxDB + Dexie local database with Supabase sync (unencrypted first, encryption in Phase 2)

**Duration:** ~3 weeks

### Deliverables

| Task | Description | Priority |
|------|-------------|----------|
| RxDB Setup | Initialize RxDB with Dexie storage adapter | Critical |
| Schema Design | Define local schemas with field-level timestamps | Critical |
| Supabase Schema Update | Add `_deleted`, `_modified`, encrypted blob columns | Critical |
| Basic Sync | Implement pull/push replication with Supabase | Critical |
| Field-Level LWW | Custom conflict handler for per-field merging | High |
| React Integration | rxdb-hooks for reactive data binding | High |
| Migration Path | Schema versioning for future changes | Medium |

### Data Model

#### Local RxDB Schema

```typescript
const presentationSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    userId: { type: 'string' },

    // Content fields with per-field timestamps for LWW
    title: { type: 'string' },
    titleUpdatedAt: { type: 'number' },

    outline: { type: 'string' }, // JSON string
    outlineUpdatedAt: { type: 'number' },

    storyboard: { type: 'string' }, // JSON string
    storyboardUpdatedAt: { type: 'number' },

    // SCQA fields
    situation: { type: 'string' },
    situationUpdatedAt: { type: 'number' },
    complication: { type: 'string' },
    complicationUpdatedAt: { type: 'number' },
    answer: { type: 'string' },
    answerUpdatedAt: { type: 'number' },

    // Metadata
    audience: { type: 'string' },
    presentationType: { type: 'string' },

    // Sync metadata
    _deleted: { type: 'boolean', default: false },
    _modified: { type: 'number' },
    _revision: { type: 'string' }, // UUID for integrity
  },
  required: ['id', 'userId', '_modified'],
  indexes: ['userId', '_modified']
};
```

#### Supabase Schema Addition

```sql
-- apps/web/supabase/schemas/
ALTER TABLE building_blocks_submissions ADD COLUMN IF NOT EXISTS
  _deleted boolean DEFAULT false NOT NULL,
  _modified timestamptz DEFAULT now() NOT NULL,
  _revision uuid DEFAULT gen_random_uuid() NOT NULL,
  encrypted_payload bytea, -- For Phase 2
  encryption_version int DEFAULT 0;

-- Index for efficient sync queries
CREATE INDEX idx_submissions_sync ON building_blocks_submissions(user_id, _modified);
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │   React     │◄──►│   RxDB      │◄──►│   Dexie.js      │  │
│  │  Components │    │  (reactive) │    │  (IndexedDB)    │  │
│  └─────────────┘    └──────┬──────┘    └─────────────────┘  │
│                            │                                 │
│                    ┌───────▼───────┐                        │
│                    │  Sync Engine  │                        │
│                    │  (pull/push)  │                        │
│                    └───────┬───────┘                        │
└────────────────────────────┼────────────────────────────────┘
                             │ HTTPS
                    ┌────────▼────────┐
                    │    Supabase     │
                    │  (PostgreSQL)   │
                    │  + RLS policies │
                    └─────────────────┘
```

### Field-Level LWW Conflict Handler

```typescript
const fieldLevelLWWHandler = {
  isEqual(a, b) {
    return a._revision === b._revision;
  },

  async resolve({ realMasterState, newDocumentState }) {
    const merged = { ...realMasterState };

    // Fields that support LWW
    const lwwFields = [
      'title', 'outline', 'storyboard',
      'situation', 'complication', 'answer',
      'audience', 'presentationType'
    ];

    for (const field of lwwFields) {
      const timestampField = `${field}UpdatedAt`;
      const newTimestamp = newDocumentState[timestampField] || 0;
      const masterTimestamp = realMasterState[timestampField] || 0;

      if (newTimestamp > masterTimestamp) {
        merged[field] = newDocumentState[field];
        merged[timestampField] = newTimestamp;
      }
    }

    // Update revision
    merged._revision = crypto.randomUUID();
    merged._modified = Date.now();

    return merged;
  }
};
```

### Success Criteria

- [ ] Presentations save locally without network
- [ ] Data syncs to Supabase when online
- [ ] Multi-device: changes on Device A appear on Device B
- [ ] Conflict resolution works (edit same field on 2 devices)
- [ ] Storage usage < 50KB per presentation (under 5KB JSON + overhead)

---

## Phase 2: Encryption & Enterprise Controls

**Focus:** Encrypt local data and sync encrypted payloads; add admin controls

**Duration:** ~4 weeks

### Deliverables

| Task | Description | Priority |
|------|-------------|----------|
| Key Derivation | PBKDF2 from user password or session token | Critical |
| Local Encryption | Encrypt Dexie/RxDB data with Web Crypto API | Critical |
| Encrypted Sync | Sync encrypted blobs to Supabase | Critical |
| Key Management | Key rotation, versioning, secure storage | High |
| Enterprise Policies | Org-level settings for local-first features | High |
| Admin Control Panel | IT admin interface for policy management | High |
| Data Control Panel | User-facing local data management | Medium |
| Capability Detection | Check IndexedDB, quota, WebGPU availability | Medium |

### Encryption Implementation

#### Key Derivation from Session

```typescript
async function deriveEncryptionKey(session: Session): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(session.access_token + session.user.id),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(session.user.id), // User-specific salt
      iterations: 600000, // OWASP 2023 recommendation
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // Non-extractable
    ['encrypt', 'decrypt']
  );
}
```

#### Encrypt Before Sync

```typescript
async function encryptForSync(data: object, key: CryptoKey): Promise<ArrayBuffer> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  // Prepend IV to ciphertext
  const result = new Uint8Array(iv.length + ciphertext.byteLength);
  result.set(iv);
  result.set(new Uint8Array(ciphertext), iv.length);

  return result.buffer;
}
```

### Enterprise Policy Schema

```typescript
interface OrganizationPolicy {
  orgId: string;
  localFirstEnabled: boolean;      // Master toggle
  localAiAllowed: boolean;         // Browser AI permitted
  encryptionRequired: boolean;     // Force encryption
  dataRetentionDays: number;       // Auto-cleanup period
  maxLocalStorageMb: number;       // Quota limit
  allowedDevices: number;          // Max devices per user
  requireMfa: boolean;             // MFA for local data access
}
```

### Admin Control Panel UI

```
┌──────────────────────────────────────────────────────────────┐
│  Organization Data Controls (Admin Only)                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ☑ Enable Local-First Mode                                   │
│    Data stored locally in user browsers with encrypted sync  │
│                                                              │
│  ☑ Allow Browser AI                                          │
│    Users can download AI models for offline suggestions      │
│                                                              │
│  ☐ Require Encryption                                        │
│    Force all local data to be encrypted (recommended)        │
│                                                              │
│  Data Retention: [30 days ▼]                                │
│  Max Local Storage: [500 MB ▼]                              │
│                                                              │
│  ─────────────────────────────────────────────────────────   │
│                                                              │
│  Registered Devices                                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ User           │ Device        │ Last Sync │ Actions   │ │
│  │ john@acme.com  │ Chrome/Win    │ 2 min ago │ [Revoke]  │ │
│  │ john@acme.com  │ Safari/Mac    │ 1 day ago │ [Revoke]  │ │
│  │ jane@acme.com  │ Chrome/Mac    │ 5 min ago │ [Revoke]  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [Force Sync All]  [Clear All Local Data]                    │
└──────────────────────────────────────────────────────────────┘
```

### Success Criteria

- [ ] Local data encrypted at rest (IndexedDB inspection shows ciphertext)
- [ ] Supabase only stores encrypted blobs (DBA cannot read content)
- [ ] Key derived from session; changes on password reset
- [ ] Admin can enable/disable local-first per organization
- [ ] Admin can remotely wipe local data (on next sync)
- [ ] Capability detection gracefully degrades when features unavailable

---

## Phase 3: Local AI Integration

**Focus:** Transformers.js for browser-based AI with tiered fallback

**Duration:** ~3 weeks

### Deliverables

| Task | Description | Priority |
|------|-------------|----------|
| Transformers.js Setup | Web Worker with Qwen2.5-0.5B model | High |
| Model Management UI | Download, delete, storage display | High |
| Autocomplete Hook | `useAutocomplete()` for text suggestions | High |
| Tier Routing | Route requests to Browser → BYOM → Cloud | Medium |
| BYOM Configuration | Admin setting for custom AI endpoint | Medium |
| WebGPU Detection | Use GPU when available, WASM fallback | Medium |
| Progress Indicators | Model download progress, inference status | Medium |

### AI Tier Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AI Request Router                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  User Input → Check Tier Availability → Route to Best Tier  ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│         ┌────────────────────┼────────────────────┐             │
│         ▼                    ▼                    ▼             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   Tier 1    │     │   Tier 2    │     │   Tier 3    │       │
│  │  Browser    │     │   BYOM      │     │   Cloud     │       │
│  │  (Local)    │     │ (Customer)  │     │  (Portkey)  │       │
│  ├─────────────┤     ├─────────────┤     ├─────────────┤       │
│  │ Qwen2.5-0.5B│     │ Llama 3.3   │     │ Claude/GPT  │       │
│  │ 250MB q4    │     │ 70B         │     │             │       │
│  │ <100ms      │     │ ~1-2s       │     │ ~2-5s       │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│       ▲                    ▲                    ▲               │
│       │                    │                    │               │
│  Web Worker          Customer API         Portkey Gateway      │
│  (transformers.js)   (configurable)       (existing)           │
└─────────────────────────────────────────────────────────────────┘
```

### React Hook Implementation

```typescript
// hooks/useLocalAI.ts
export function useLocalAI() {
  const [ready, setReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const workerRef = useRef<Worker | null>(null);

  const initializeModel = useCallback(async () => {
    setDownloading(true);
    workerRef.current = new Worker(
      new URL('../workers/ai.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e) => {
      if (e.data.status === 'progress') setProgress(e.data.progress);
      if (e.data.status === 'ready') {
        setReady(true);
        setDownloading(false);
      }
    };
  }, []);

  const complete = useCallback(async (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      const handler = (e: MessageEvent) => {
        if (e.data.status === 'complete') {
          resolve(e.data.output);
          workerRef.current?.removeEventListener('message', handler);
        }
      };
      workerRef.current?.addEventListener('message', handler);
      workerRef.current?.postMessage({ type: 'complete', prompt });
    });
  }, []);

  return { ready, downloading, progress, initializeModel, complete };
}
```

### Web Worker Implementation

```typescript
// workers/ai.worker.ts
import { pipeline } from '@huggingface/transformers';

let generator: any = null;

self.addEventListener('message', async (event) => {
  if (event.data.type === 'init') {
    generator = await pipeline(
      'text-generation',
      'onnx-community/Qwen2.5-0.5B-Instruct',
      {
        dtype: 'q4',
        device: navigator.gpu ? 'webgpu' : 'wasm',
        progress_callback: (progress: any) => {
          self.postMessage({ status: 'progress', progress: progress.progress });
        }
      }
    );
    self.postMessage({ status: 'ready' });
  }

  if (event.data.type === 'complete' && generator) {
    const result = await generator(event.data.prompt, {
      max_new_tokens: 50,
      temperature: 0.7,
      do_sample: true
    });
    self.postMessage({ status: 'complete', output: result[0].generated_text });
  }
});
```

### Model Management UI

```
┌──────────────────────────────────────────────────────────────┐
│  Local AI Settings                                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  AI Model: Qwen2.5-0.5B (Autocomplete)                       │
│  Size: 250 MB                                                │
│  Status: ● Downloaded                                        │
│                                                              │
│  [Delete Model]  [Re-download]                               │
│                                                              │
│  ─────────────────────────────────────────────────────────   │
│                                                              │
│  Storage Usage                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ AI Model     ████████████████░░░░░░░░░░░  250 MB       │ │
│  │ Presentations████░░░░░░░░░░░░░░░░░░░░░░░   45 MB       │ │
│  │ Cache        ██░░░░░░░░░░░░░░░░░░░░░░░░░   12 MB       │ │
│  │ ─────────────────────────────────────────────────────  │ │
│  │ Total: 307 MB / 500 MB quota                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [Clear All Local Data]                                      │
└──────────────────────────────────────────────────────────────┘
```

### Success Criteria

- [ ] Model downloads with progress indicator
- [ ] Autocomplete suggestions appear in < 200ms
- [ ] WebGPU used when available (10x faster)
- [ ] WASM fallback works on all browsers
- [ ] Model can be deleted to free storage
- [ ] Tier routing works: Browser → BYOM → Cloud

---

## Phase 4: Offline Mode & Polish

**Focus:** Service worker for true offline capability; sync indicators; polish

**Duration:** ~3 weeks

### Deliverables

| Task | Description | Priority |
|------|-------------|----------|
| Serwist Setup | Service worker with Next.js 15 integration | High |
| Offline Detection | `useOnlineStatus()` hook with UI indicator | High |
| Sync Status UI | "Synced", "Syncing...", "Offline" states | High |
| Background Sync | Queue mutations when offline | Medium |
| Offline Fallback Page | Graceful UX when critical resources unavailable | Medium |
| Cache Strategies | NetworkFirst for API, CacheFirst for assets | Medium |
| Integrity System | Checksums, corruption detection, auto-recovery | Medium |
| Reset & Resync | User-triggered full resync from server | Medium |

### Online/Offline Hook

```typescript
// hooks/useOnlineStatus.ts
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

### Sync Status Component

```tsx
// components/SyncStatusIndicator.tsx
export function SyncStatusIndicator() {
  const isOnline = useOnlineStatus();
  const { syncState, lastSyncedAt } = useSyncStatus();

  return (
    <div className="flex items-center gap-2 text-sm">
      {!isOnline && (
        <Badge variant="warning">
          <CloudOff className="h-3 w-3 mr-1" />
          Offline
        </Badge>
      )}
      {isOnline && syncState === 'syncing' && (
        <Badge variant="secondary">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Syncing...
        </Badge>
      )}
      {isOnline && syncState === 'synced' && (
        <Badge variant="success">
          <Check className="h-3 w-3 mr-1" />
          Synced {formatRelative(lastSyncedAt)}
        </Badge>
      )}
      {syncState === 'error' && (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Sync Error
        </Badge>
      )}
    </div>
  );
}
```

### Integrity & Recovery System

```typescript
// Integrity check on app load
async function checkDataIntegrity(db: RxDatabase): Promise<IntegrityReport> {
  const issues: IntegrityIssue[] = [];

  // Check each document's revision matches content hash
  const presentations = await db.presentations.find().exec();
  for (const doc of presentations) {
    const expectedHash = await hashDocument(doc.toJSON());
    if (doc._revision !== expectedHash) {
      issues.push({
        documentId: doc.id,
        type: 'hash_mismatch',
        severity: 'warning'
      });
    }
  }

  return { valid: issues.length === 0, issues };
}

// Auto-recovery on corruption
async function recoverFromCorruption(db: RxDatabase) {
  // 1. Mark local DB as corrupted
  // 2. Clear local IndexedDB
  // 3. Re-initialize empty DB
  // 4. Trigger full sync from server
  // 5. Notify user
}
```

### Serwist Configuration

```typescript
// app/sw.ts
import { defaultCache } from '@serwist/next/worker';
import { Serwist } from 'serwist';

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
```

### Success Criteria

- [ ] App works offline (create/edit presentations)
- [ ] Changes sync automatically when back online
- [ ] User sees clear online/offline/syncing status
- [ ] Background sync queues work when offline
- [ ] Corruption detected and auto-recovered
- [ ] "Reset & Resync" button works

---

## File Structure

### New Packages

```
packages/local-first/
├── src/
│   ├── database/
│   │   ├── schemas/
│   │   │   └── presentation.schema.ts
│   │   ├── setup.ts
│   │   └── conflict-handler.ts
│   ├── sync/
│   │   ├── supabase-replication.ts
│   │   └── sync-status.ts
│   ├── encryption/
│   │   ├── key-derivation.ts
│   │   └── crypto.ts
│   ├── hooks/
│   │   ├── useLocalDatabase.ts
│   │   ├── usePresentations.ts
│   │   ├── useOnlineStatus.ts
│   │   └── useSyncStatus.ts
│   └── index.ts
├── package.json
└── tsconfig.json

packages/local-ai/
├── src/
│   ├── workers/
│   │   └── ai.worker.ts
│   ├── hooks/
│   │   ├── useLocalAI.ts
│   │   └── useAutocomplete.ts
│   ├── tier-router.ts
│   ├── model-manager.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### Modified Files

```
apps/web/
├── next.config.ts               # Add Serwist, CSP
├── middleware.ts                # Security headers
├── app/
│   ├── sw.ts                    # Service worker
│   ├── manifest.json            # PWA manifest
│   ├── home/[account]/settings/
│   │   └── local-data/
│   │       └── page.tsx         # Data control panel
│   └── admin/
│       └── organization/
│           └── data-controls/
│               └── page.tsx     # Admin control panel
└── supabase/schemas/
    └── XX-local-first.sql       # Schema additions
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| IndexedDB quota exceeded | Monitor usage, implement LRU eviction, warn users at 80% |
| Corporate browser blocks IndexedDB | Capability detection, graceful fallback to server-only mode |
| Encryption key lost on session expiry | Re-derive key on login, never store raw keys |
| Sync conflicts cause data loss | Field-level LWW preserves most recent edits per field |
| WebGPU not available | WASM fallback for local AI (slower but functional) |
| Service worker caching stale code | Implement update notifications, auto-refresh on new version |
| Password reset breaks encryption | Key rotation with re-encryption of local data |

---

## Dependencies

### New NPM Packages

```json
{
  "dependencies": {
    "rxdb": "^15.x",
    "rxdb-hooks": "^5.x",
    "dexie": "^4.x",
    "@huggingface/transformers": "^3.x",
    "@serwist/next": "^9.x"
  },
  "devDependencies": {
    "serwist": "^9.x"
  }
}
```

### Browser Requirements

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| Web Crypto | ✅ | ✅ | ✅ | ✅ |
| Service Workers | ✅ | ✅ | ✅ | ✅ |
| WebGPU | ✅ 113+ | 🔜 | ⚠️ Exp | ✅ 113+ |
| WASM | ✅ | ✅ | ✅ | ✅ |

---

## Research Reports

Detailed research reports are available in:

- `.ai/reports/research-reports/2025-12-05/rxdb-local-first-research.md`
- `.ai/reports/research-reports/2025-12-05/transformers-js-research.md`
- `.ai/reports/research-reports/2025-12-05/serwist-research.md`
- `.ai/reports/research-reports/2025-12-05/local-first-security-research.md`

---

## Success Metrics

### Phase 0 Complete
- Security headers score A+ on securityheaders.com
- Zero high/critical npm audit findings

### Phase 1 Complete
- Presentations persist across browser sessions
- Multi-device sync works within 5 seconds
- Conflict resolution handles simultaneous edits

### Phase 2 Complete
- IndexedDB inspection shows only encrypted data
- Admin can toggle local-first per organization
- Enterprise customers approve security posture

### Phase 3 Complete
- Autocomplete latency < 200ms with WebGPU
- Model download shows progress, can be cancelled
- Tier fallback works seamlessly

### Phase 4 Complete
- App functions offline for 24+ hours
- Sync indicator accurately reflects state
- Recovery from corruption is automatic

---

## Next Steps

1. Create GitHub issues for Phase 0 tasks
2. Set up `packages/local-first` package structure
3. Begin CSP implementation in `next.config.ts`
4. Audit current third-party scripts for SRI
