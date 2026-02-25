# SlideHeroes — End-to-End Encryption (E2EE) Strategy

## Why this exists
SlideHeroes will store and process highly confidential material (strategy, pricing, financials, M&A, product roadmaps). For enterprise customers, **E2EE is a differentiator**: SlideHeroes infrastructure should not be able to read customer presentation content.

This document proposes an E2EE approach that is:
- Practical for a web app (browser-based)
- Compatible with collaboration + sharing
- Compatible with local-first/offline goals
- Incrementally adoptable (phased rollout)

## Definitions
- **Plaintext**: unencrypted user content (slides, notes, uploads, generated content).
- **Ciphertext**: encrypted content stored/transmitted.
- **Content Encryption Key (CEK)**: symmetric key used to encrypt a single object (deck, slide, file, etc.).
- **Key Encryption Key (KEK)**: key used to encrypt/wrap CEKs.
- **Workspace**: tenant boundary; a customer org.

## Threat model (what we protect against)
### In scope
- Cloud DB/object store compromise
- Insider access to production databases/logs
- Misconfigured backups
- Attacker with read access to server-side systems

### Out of scope (initially)
- Compromised client device / malware / keylogger
- User shares decrypted content intentionally
- Side-channel inference via traffic analysis (can be mitigated later)

## High-level design (recommended)
### Core principle
**Encrypt on the client, decrypt on the client.** Servers store ciphertext + metadata necessary for sync/collaboration, but never see plaintext.

### Cryptographic primitives (recommended defaults)
- Symmetric encryption: **XChaCha20-Poly1305** (libsodium) or **AES-256-GCM** (WebCrypto)
- Hash/KDF: **Argon2id** (preferred) or PBKDF2 (fallback) for user passphrase-derived keys
- Asymmetric keys (sharing): **X25519** for key agreement, **Ed25519** for signatures (libsodium)

> Implementation note: browser support is easiest with WebCrypto (AES-GCM, HKDF, PBKDF2) but libsodium-wrappers provides modern primitives like XChaCha20 and Ed25519.

## Key hierarchy
### 1) Per-object keys
Each encryptable object gets a unique CEK, e.g.:
- deck CEK
- slide CEK(s) (optional; could be deck-level only to start)
- upload/file CEK
- generated artifact CEK

Encrypt object payload using CEK.

### 2) Workspace keyring (wrapping CEKs)
To enable sharing/collaboration inside a workspace:
- Generate a **Workspace Master Key (WMK)** (symmetric).
- Wrap each object CEK with the WMK.
- Store wrapped CEKs (ciphertext) alongside objects.

The WMK itself is not stored in plaintext; it is distributed to users via per-user encryption.

### 3) Per-user keys
Each user has a device-backed keypair:
- Private key stored locally (OS keychain where possible; otherwise encrypted at rest)
- Public key stored server-side

The WMK is encrypted (sealed) to each member’s public key and stored as **"WMK for user X"**.

When a user joins/leaves a workspace, rotate WMK or rotate access via key rewrapping (see Membership changes).

## Authentication vs encryption
- Auth (sessions, refresh tokens, etc.) can remain server-managed.
- Encryption keys must be separate from auth tokens.
- Never log plaintext.

## Collaboration & sharing
### Within a workspace
- Users in a workspace should be able to open a shared deck by obtaining the WMK (sealed to their public key) and then unwrapping deck CEKs.

### Sharing outside a workspace
Options (choose later):
1. **Link-based share**: create a separate share key; user copies a passphrase out-of-band.
2. **Invite-based share**: recipient has an account + public key; encrypt share key to their key.

Recommendation for v1: **invite-based share** for enterprises; link shares can come later.

## Membership changes (join/leave)
### User joins
- Create a sealed WMK blob for the new user (encrypted to their public key).
- No need to re-encrypt content.

### User leaves / access revoked
Two levels:
1. **Soft revoke** (fast): delete the sealed WMK blob for the user; they lose future server-synced access, but could still have locally cached plaintext.
2. **Hard revoke** (strong): rotate WMK and re-wrap all CEKs under new WMK; expensive but enforceable for future access.

Recommendation: support soft revoke initially; implement scheduled hard-rotate for high-security plans.

## Search, RAG, and AI with E2EE
E2EE constrains server-side features:
- Full-text search and embeddings cannot be computed on the server without plaintext.

Options:
1. **Client-side indexing** (recommended): compute search index/embeddings locally, upload encrypted index.
2. **Selective disclosure**: allow user to opt-in to server-side processing for certain docs.
3. **Trusted execution** (later): TEEs (SGX/SEV) to compute embeddings with attestations (still complex).

Recommendation: start with **client-side embeddings** for enterprise E2EE tier.

## Storage model (what the server stores)
For each encrypted object:
- ciphertext payload
- nonce/iv
- algorithm/version
- AAD metadata (object id, workspace id, timestamps)
- wrapped CEK (wrapped by WMK)

For keys:
- user public keys
- sealed WMK per user
- key versioning + rotation metadata

## Backup & recovery
Key recovery is the hard part.

Options:
1. **Enterprise admin escrow** (recommended for enterprise): WMK can be re-sealed to an admin-held recovery key kept in customer-controlled HSM/vault.
2. **User passphrase recovery**: allow user to set a recovery passphrase; derive a recovery KEK to unwrap WMK.

Recommendation:
- For enterprise: support **admin escrow** + documented process.
- For SMB: optional recovery passphrase.

## Multi-device support
- Each device generates its own keypair.
- Workspace WMK is sealed to each device public key (or to user key with device key wrapping).

Recommendation: simplest is per-device keys + server stores multiple sealed WMKs per user.

## Observability and debugging
- Log only ciphertext identifiers and sizes.
- Add client-side diagnostics (encryption version, failures).
- Ensure client error reporting never includes decrypted payloads.

## Local-first / offline considerations
- Treat local plaintext as **cached decrypted data** with an explicit retention policy.
- Default: store ciphertext in IndexedDB; decrypt on demand; keep decrypted data in-memory when possible.
- If decrypted caching is needed for performance/offline: encrypt local caches with a device key and set TTL/“lock on idle”.
- Provide a “Lock workspace” action that clears in-memory keys and (optionally) local decrypted caches.

## Compliance & enterprise expectations (non-exhaustive)
E2EE helps with confidentiality, but does not replace core controls:
- Access controls, audit logs (for ciphertext access/events), and least privilege
- Key rotation and revocation procedures
- Incident response: demonstrate that content remained encrypted
- Data residency: ciphertext location still matters for contractual requirements

Common frameworks to align with (as the program matures):
- SOC 2 (security, availability, confidentiality)
- GDPR (data protection; encryption is a key technical measure)
- For regulated customers: consider HIPAA/BAA or FINRA/SEC retention requirements as applicable

## Rollout plan (phased)
### Phase 0 — Hygiene (now)
- Ensure no plaintext ends up in logs, analytics, error reporting.
- Classify data types; mark sensitive fields.

### Phase 1 — Encrypt-at-rest with customer-controlled keys (intermediate)
- Server-side envelope encryption with KMS/CMK; improves baseline but **not E2EE**.

### Phase 2 — True E2EE for decks (minimum viable E2EE)
- Client-side encryption for deck payloads
- Per-deck CEK wrapped by WMK
- WMK sealed per user

### Phase 3 — E2EE for uploads + knowledge base
- Add file/object E2EE
- Client-side extraction where possible

### Phase 4 — E2EE-aware AI features
- Client-side embeddings + encrypted vector store
- Optional selective disclosure modes

## Decisions to make (open questions)
- Which crypto stack: WebCrypto-only vs libsodium
- Where private keys live: IndexedDB + passphrase vs OS keychain integration (native wrapper)
- Hard revocation requirements per plan
- Offline mode requirements and caching policy

## Next actions
- Align on primitives + libraries (security review)
- Define concrete object model: what is a "deck payload" to encrypt
- Prototype: encrypt/decrypt a deck blob in the browser + sync ciphertext
- Define enterprise recovery and key rotation procedures
