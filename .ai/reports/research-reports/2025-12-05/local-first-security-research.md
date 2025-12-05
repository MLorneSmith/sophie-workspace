# Perplexity Research: Local-First Enterprise Application Security

**Date**: 2025-12-05
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary

Researched security best practices for local-first enterprise B2B SaaS applications where corporations are concerned about data privacy and data leaving their premises. Focus areas included:

1. XSS hardening for IndexedDB applications (CSP, Trusted Types, SRI)
2. Browser-based encryption patterns (Web Crypto API, key derivation, key management)
3. Supply chain security for npm packages
4. Corporate browser restrictions and feature detection
5. Data retention and compliance for browser storage
6. Enterprise policy enforcement patterns

## Executive Summary

Local-first enterprise applications require treating the browser as a high-value data store that demands backend-level security controls. Key findings:

- **Defense in Depth**: Combine strict CSP with nonces, Trusted Types API, and SRI to create multiple XSS barriers
- **Encryption Mandatory**: Use Web Crypto API with AES-GCM for data at rest, derive keys from session tokens, never store raw keying material
- **Supply Chain Critical**: Implement private registries, lockfile enforcement, continuous SCA scanning, and SBOM generation
- **Graceful Degradation**: Detect API availability with capability + viability checks, provide fallbacks for blocked features
- **Compliance Required**: Treat IndexedDB as regulated storage under GDPR/SOC2, implement server-driven deletion and retention
- **Policy Enforcement**: Embed policy engines in the client, distribute signed policy bundles, integrate with corporate IdP

## 1. XSS Hardening for IndexedDB Applications

### Critical Context

For local-first apps, if an attacker achieves JavaScript execution in your origin, they can exfiltrate or corrupt all IndexedDB data. XSS prevention must be treated as critical infrastructure, not optional hardening.

### 1.1 Strict Content Security Policy with Nonces

**Implementation Pattern:**

```http
Content-Security-Policy: 
  default-src 'none';
  script-src 'self' https://cdn.example.com 'nonce-<random>' 'strict-dynamic';
  style-src 'self' 'nonce-<random>';
  connect-src 'self' https://api.example.com;
  img-src 'self' data:;
  frame-ancestors 'none';
  base-uri 'none';
  object-src 'none';
```

**Key Principles:**

- **Never use** `'unsafe-inline'` or `'unsafe-eval'` in production
- Generate cryptographically random nonces (minimum 128 bits, base64-encoded) on every HTML response
- Attach nonces to all `<script>` and `<style>` tags: `<script nonce="{{nonce}}" src="/main.js"></script>`
- For unavoidable inline bootstrap code, keep it minimal and attach the nonce
- Never allow user data to control nonce values or script attributes

**Multi-Tenant Considerations:**

- For B2B SaaS with per-tenant customization, render per-tenant CSPs only if you fully control all tenant content
- Isolate tenant-rendered content in sandboxed iframes with separate subdomains so XSS cannot access IndexedDB origin
- Use CSP report-only mode in staging to tune policies
- Enforce in production with parallel report-only header for regression detection
- Wire CSP violation reports to security monitoring (SIEM) and alert on blocked executions

**IndexedDB-Specific Controls:**

- CSP does not directly protect IndexedDB; protection comes from preventing arbitrary script execution
- Treat any surface that can modify the app shell (configuration, feature flags, branding) as untrusted
- Ensure these values never become HTML/JS—only text, CSS variables, or pre-defined tokens

### 1.2 Trusted Types API

Trusted Types forces all dangerous DOM assignments (innerHTML, outerHTML, insertAdjacentHTML, document.write) through vetted policies, preventing injection even if CSP is bypassed.

**CSP Configuration:**

```http
Content-Security-Policy: 
  require-trusted-types-for 'script';
  trusted-types appDefault sanitizeHtml;
```

**Policy Implementation Pattern:**

```typescript
// Central policy definitions at app bootstrap
const appTrustedPolicy = trustedTypes.createPolicy('appDefault', {
  createHTML: (input: string) => {
    // Only accepts compile-time constants or IDs mapping to known templates
    if (!isKnownSafeTemplate(input)) {
      throw new Error('Untrusted HTML template');
    }
    return input;
  }
});

const sanitizePolicy = trustedTypes.createPolicy('sanitizeHtml', {
  createHTML: (input: string) => {
    // Pass through robust sanitizer (e.g., DOMPurify in SAFE-HTML-ONLY mode)
    return DOMPurify.sanitize(input, { 
      SAFE_FOR_TEMPLATES: true,
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em'], // Whitelist only
      ALLOWED_ATTR: [] // No attributes
    });
  }
});

// Usage in code
element.innerHTML = sanitizePolicy.createHTML(userInput);
```

**Framework Integration:**

- **React/Vue/Svelte**: Use native template/JSX mechanisms, avoid `dangerouslySetInnerHTML`
- If raw HTML is required, wrap behind helper that only accepts TrustedHTML objects
- **Legacy codebases**: Introduce abstraction layer (e.g., `setHTML(el, unsafeHtml)`) using Trusted Types
- Enable report-only mode first to find violations, then gradually fix and enforce

**B2B Tenant Features:**

- For tenant-provided content (email templates, announcements, help text):
  - Store and render as plain text wherever possible
  - If rich HTML required, sanitize at **both** write-time (server-side) and read-time (client Trusted Types)
  - Never allow `<script>`, event handlers, `javascript:` URLs, or inline CSS that could inject script
- Make Trusted Types violations part of security telemetry to detect risky code paths

### 1.3 Subresource Integrity (SRI)

SRI ensures that scripts/styles from CDNs or external hosts match known hashes, protecting against compromised delivery infrastructure.

**Implementation Pattern:**

```html
<!-- Third-party resources -->
<script 
  src="https://cdn.example.com/lib@1.2.3/bundle.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous"
></script>

<link 
  rel="stylesheet"
  href="https://cdn.example.com/styles@2.0.0/main.css"
  integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u"
  crossorigin="anonymous"
>
```

**Build Pipeline Integration:**

- Automate hash generation in build tools (webpack/rollup/vite plugins)
- Update HTML/template manifests automatically—never manual hash editing
- Use SHA-384 or SHA-512 for strong integrity guarantees

**CSP Coordination:**

```http
Content-Security-Policy:
  script-src 'self' https://cdn.example.com 'nonce-<random>';
```

- CSP `script-src` should whitelist only specific CDN hostnames (avoid wildcards like `https://*.cdn.com`)
- Require SRI on all resources from whitelisted CDNs

**Internal Assets:**

For high-assurance environments (banks, healthcare, government):
- Apply SRI to your own static assets when:
  - Assets hosted on multiple edge providers
  - App embedded in other products (OEM/white-label)
  - Supply chain integrity is critical
- Store asset→hash mapping in version control for reproducible builds

**Operational Considerations:**

- Any library update changes the hash—automate this in CI/CD
- For customers with strict change control, document how SRI + CSP ensure only vetted assets load
- Even if CDN is compromised, browser refuses altered scripts

### 1.4 Combined Defense-in-Depth Strategy

For IndexedDB applications, implement all three layers:

```
┌─────────────────────────────────────────────────────┐
│ Layer 1: Strict CSP with Nonces                    │
│ - Blocks unauthorized script sources                │
│ - Requires nonce for all inline/external scripts   │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Layer 2: Trusted Types API                         │
│ - Forces dangerous DOM assignments through policies │
│ - Sanitizes untrusted HTML before rendering        │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Layer 3: Subresource Integrity                     │
│ - Validates external resource integrity            │
│ - Protects against CDN/supply chain compromise     │
└─────────────────────────────────────────────────────┘
```

**Testing & Monitoring:**

- Regular DAST/SAST plus targeted XSS tests on any feature that influences UI shell
- CSP violation monitoring with alerts on blocked executions
- Trusted Types violations in security telemetry
- Standard XSS defenses: contextual output encoding, server-side validation, no user-controlled HTML/JS in templates

## 2. Browser-Based Encryption Patterns

### Critical Context

Browser storage is not inherently secure. For enterprise B2B SaaS where corporations worry about data privacy, **application-level encryption is mandatory**. Web Crypto API provides the primitives; your architecture determines security.

### 2.1 Web Crypto API for Encrypting IndexedDB Data

**Architecture Pattern: Encrypt-Before-Store**

```typescript
// Encryption service
class IndexedDBEncryptionService {
  private encryptionKey: CryptoKey | null = null;

  // Initialize with derived key (see section 2.2)
  async initialize(sessionToken: string, salt: Uint8Array): Promise<void> {
    this.encryptionKey = await this.deriveKey(sessionToken, salt);
  }

  // Encrypt data before writing to IndexedDB
  async encrypt(plaintext: unknown): Promise<EncryptedBlob> {
    if (!this.encryptionKey) throw new Error('Encryption key not initialized');

    const data = new TextEncoder().encode(JSON.stringify(plaintext));
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128 // 128-bit authentication tag
      },
      this.encryptionKey,
      data
    );

    return {
      version: 1, // For key rotation
      algorithm: 'AES-GCM-256',
      iv: Array.from(iv),
      ciphertext: Array.from(new Uint8Array(ciphertext)),
      timestamp: Date.now()
    };
  }

  // Decrypt data when reading from IndexedDB
  async decrypt(encrypted: EncryptedBlob): Promise<unknown> {
    if (!this.encryptionKey) throw new Error('Encryption key not initialized');
    
    if (encrypted.version !== 1) {
      throw new Error('Unsupported encryption version');
    }

    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(encrypted.iv)
      },
      this.encryptionKey,
      new Uint8Array(encrypted.ciphertext)
    );

    return JSON.parse(new TextDecoder().decode(plaintext));
  }

  // Clear key on logout
  clear(): void {
    this.encryptionKey = null;
  }
}
```

**Algorithm Selection: AES-GCM (Recommended)**

- **AES-GCM** (Galois/Counter Mode): Authenticated encryption (confidentiality + integrity)
  - Key size: 256-bit
  - IV size: 96-bit (12 bytes), cryptographically random, unique per message
  - Authentication tag: 128-bit
  - **Never reuse IV with same key** (catastrophic failure)
  - Well-supported across all modern browsers
  
**Alternative: AES-CBC (Not Recommended)**
- Requires separate HMAC for authentication
- Vulnerable to padding oracle attacks if implemented incorrectly
- Use AES-GCM instead

**Storage Pattern:**

```typescript
interface EncryptedBlob {
  version: number;        // Key version for rotation
  algorithm: string;      // 'AES-GCM-256'
  iv: number[];          // Initialization vector
  ciphertext: number[];  // Encrypted payload
  timestamp: number;     // For retention policies
}

// Store in IndexedDB
const db = await openDB('myApp', 1, {
  upgrade(db) {
    const store = db.createObjectStore('encryptedData', { keyPath: 'id' });
    store.createIndex('timestamp', 'timestamp'); // For cleanup
    store.createIndex('version', 'version');     // For key rotation
  }
});

// Write encrypted
const encrypted = await encryptionService.encrypt(userData);
await db.put('encryptedData', { id: userId, ...encrypted });

// Read and decrypt
const record = await db.get('encryptedData', userId);
const decrypted = await encryptionService.decrypt(record);
```

**Security Considerations:**

- **Never store raw CryptoKey objects in IndexedDB** (defeats encryption purpose)
- Always generate fresh IV for each encryption operation
- Include versioning for key rotation support
- Clear encryption keys from memory on logout/session expiry
- Consider encrypting sensitive fields individually vs. entire records (performance tradeoff)

### 2.2 Key Derivation from Authentication Tokens

**Critical Principle:** Derive encryption keys from server-controlled session tokens, not user passwords directly stored in the browser.

**PBKDF2 Implementation Pattern:**

```typescript
class KeyDerivationService {
  // Derive encryption key from JWT/session token
  async deriveKey(
    sessionToken: string,
    salt: Uint8Array,
    iterations: number = 600000 // OWASP 2023 recommendation for PBKDF2-SHA256
  ): Promise<CryptoKey> {
    
    // Import session token as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(sessionToken),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive AES-GCM key
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false, // Not extractable
      ['encrypt', 'decrypt']
    );
  }

  // Generate salt (per-user, stored server-side)
  generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16)); // 128-bit salt
  }
}
```

**Architecture Flow:**

```
1. User authenticates → Server issues JWT/session token
                      ↓
2. Client receives token + user-specific salt (from server)
                      ↓
3. Client derives encryption key using PBKDF2(token, salt)
                      ↓
4. Client encrypts/decrypts IndexedDB data with derived key
                      ↓
5. On logout/token expiry → Client clears derived key
```

**Salt Management:**

- **Generate salt per-user** (not per-session) for consistency across sessions
- **Store salt server-side** in user profile record
- **Transmit salt over authenticated channel** (HTTPS, after login)
- Salt can be public but must be unique per user
- Length: Minimum 128 bits (16 bytes), OWASP/NIST recommend 128-256 bits

**PBKDF2 Parameters (2023 Standards):**

| Hash Algorithm | Recommended Iterations | Security Level |
|----------------|------------------------|----------------|
| SHA-256        | 600,000               | High (OWASP 2023) |
| SHA-512        | 210,000               | High (OWASP 2023) |

**Alternative: HKDF (Simpler, Faster)**

For session tokens that are already high-entropy (e.g., 256-bit random):

```typescript
async deriveKeyHKDF(
  sessionToken: string,
  salt: Uint8Array,
  info: string = 'indexeddb-encryption'
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(sessionToken),
    'HKDF',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      salt: salt,
      info: new TextEncoder().encode(info),
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
```

**HKDF vs PBKDF2:**

- **HKDF**: Faster, suitable for high-entropy inputs (session tokens, API keys)
- **PBKDF2**: Slower (intentionally), designed for low-entropy inputs (passwords)
- For JWT/session tokens (already cryptographically random), HKDF is appropriate and more performant

### 2.3 Key Management and Rotation

**Key Lifecycle Architecture:**

```
┌──────────────────────────────────────────────────────┐
│ Server: Key Version Management                       │
│ - Track current key version per user/tenant          │
│ - Issue key rotation commands                        │
│ - Store user salt + key version                      │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│ Client: Multi-Version Encryption Service             │
│ - Support reading multiple key versions              │
│ - Encrypt new data with latest version               │
│ - Re-encrypt on read (opportunistic rotation)        │
└──────────────────────────────────────────────────────┘
```

**Implementation Pattern:**

```typescript
interface KeyMetadata {
  version: number;
  createdAt: number;
  algorithm: 'PBKDF2' | 'HKDF';
  iterations?: number;
}

class KeyRotationService {
  private keys: Map<number, CryptoKey> = new Map();
  private currentVersion: number = 1;
  private metadata: Map<number, KeyMetadata> = new Map();

  // Initialize with multiple key versions
  async initialize(
    sessionToken: string,
    saltMap: Map<number, Uint8Array>,
    currentVersion: number
  ): Promise<void> {
    this.currentVersion = currentVersion;

    // Derive keys for all versions (for reading old data)
    for (const [version, salt] of saltMap.entries()) {
      const key = await this.deriveKey(sessionToken, salt, version);
      this.keys.set(version, key);
    }
  }

  // Encrypt with latest key version
  async encrypt(plaintext: unknown): Promise<EncryptedBlob> {
    const key = this.keys.get(this.currentVersion);
    if (!key) throw new Error('Current key version not available');

    // ... encryption logic with version stamped
    return {
      version: this.currentVersion,
      // ... rest of encrypted blob
    };
  }

  // Decrypt with appropriate key version
  async decrypt(encrypted: EncryptedBlob): Promise<unknown> {
    const key = this.keys.get(encrypted.version);
    if (!key) {
      throw new Error(`Key version ${encrypted.version} not available`);
    }

    // ... decryption logic
  }

  // Opportunistic re-encryption
  async reEncryptIfNeeded(
    record: IndexedDBRecord,
    db: IDBPDatabase
  ): Promise<void> {
    if (record.version < this.currentVersion) {
      const plaintext = await this.decrypt(record);
      const reEncrypted = await this.encrypt(plaintext);
      await db.put('encryptedData', { ...record, ...reEncrypted });
    }
  }

  // Trigger rotation (server-initiated)
  async rotateKey(
    sessionToken: string,
    newSalt: Uint8Array,
    newVersion: number
  ): Promise<void> {
    const newKey = await this.deriveKey(sessionToken, newSalt, newVersion);
    this.keys.set(newVersion, newKey);
    this.currentVersion = newVersion;

    // Optionally: Background job to re-encrypt all data
    await this.reEncryptAllData();
  }

  private async reEncryptAllData(): Promise<void> {
    // Iterate through IndexedDB, re-encrypt old versions
    // Can be done incrementally in background
  }
}
```

**Rotation Triggers:**

1. **Time-based**: Rotate every 90 days (compliance requirement)
2. **Event-based**: 
   - Password change
   - Security incident
   - Token compromise
   - User request
3. **Policy-based**: Regulatory requirements (GDPR, HIPAA)

**Rotation Strategy:**

- **Lazy rotation**: Re-encrypt on read (opportunistic)
- **Background rotation**: Async job re-encrypts all data
- **Hybrid**: Background for critical data, lazy for cache

**Key Storage (Server-Side):**

```typescript
interface UserKeyMetadata {
  userId: string;
  currentKeyVersion: number;
  keys: Array<{
    version: number;
    salt: string; // Base64-encoded
    createdAt: string;
    deprecatedAt?: string;
    algorithm: 'PBKDF2' | 'HKDF';
    iterations?: number;
  }>;
}
```

**Security Best Practices:**

- Never store raw encryption keys in IndexedDB or localStorage
- Derive keys on-demand from session tokens
- Clear all keys from memory on logout/session expiry
- Support at least 2-3 key versions simultaneously (current + previous)
- Deprecate old keys after all data is re-encrypted
- Log key rotation events for audit trails
- Consider Hardware Security Module (HSM) for server-side key management in enterprise deployments

### 2.4 Enterprise Considerations

**Corporate Key Escrow (Optional):**

For organizations requiring data recovery:

```typescript
// Hybrid encryption pattern
async encryptWithEscrow(
  plaintext: unknown,
  userKey: CryptoKey,
  tenantPublicKey: CryptoKey
): Promise<EncryptedBlobWithEscrow> {
  // 1. Generate random data encryption key (DEK)
  const dek = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // Extractable for wrapping
    ['encrypt', 'decrypt']
  );

  // 2. Encrypt data with DEK
  const encryptedData = await this.encryptWithKey(plaintext, dek);

  // 3. Wrap DEK with user key (normal path)
  const wrappedUserKey = await crypto.subtle.wrapKey(
    'raw',
    dek,
    userKey,
    { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) }
  );

  // 4. Wrap DEK with tenant public key (escrow path)
  const wrappedEscrowKey = await crypto.subtle.wrapKey(
    'raw',
    dek,
    tenantPublicKey,
    { name: 'RSA-OAEP' }
  );

  return {
    encryptedData,
    wrappedUserKey,
    wrappedEscrowKey // Tenant can decrypt with their private key
  };
}
```

**Considerations:**
- Only implement if explicitly required by enterprise customers
- Document clearly in privacy policy and data processing agreements
- Store escrow keys with strong access controls (HSM, split-key custody)
- May conflict with some compliance frameworks (check with legal)

## 3. Supply Chain Security for npm Packages

### Critical Context

For enterprise B2B SaaS, dependency compromise is a high-impact threat vector. Supply chain security must be treated as operational infrastructure with continuous governance.

### 3.1 Package Lockdown Strategies

**Lock File Enforcement:**

```bash
# Package.json - Use exact versions for critical dependencies
{
  "dependencies": {
    "react": "19.2.0",              // Exact version, no ^ or ~
    "next": "16.0.0",
    "supabase-js": "2.38.0"
  },
  "devDependencies": {
    "typescript": "5.3.3",
    "@types/node": "~20.10.0"      // Tilde acceptable for types
  }
}

# Enforce npm ci in CI/CD
npm ci --prefer-offline --no-audit  # Fails if lockfile doesn't match package.json
```

**CI/CD Configuration:**

```yaml
# .github/workflows/ci.yml
- name: Validate lockfile
  run: |
    if ! git diff --exit-code package-lock.json; then
      echo "Lockfile modified unexpectedly"
      exit 1
    fi

- name: Verify integrity
  run: npm ci --prefer-offline

- name: Fail on lockfile changes
  run: |
    git diff --exit-code package-lock.json || \
      (echo "Run 'npm install' locally and commit package-lock.json" && exit 1)
```

**Private Registry Configuration:**

```bash
# .npmrc (per-project)
registry=https://npm.internal.company.com
always-auth=true
//npm.internal.company.com/:_authToken=${NPM_TOKEN}

# Lockdown with allowlist
@mycompany:registry=https://npm.internal.company.com
@trusted-vendor:registry=https://npm.trusted-vendor.com

# Block public registry for production builds
@*:registry=https://npm.internal.company.com
```

**Registry Mirror Strategy:**

```
┌────────────────────────────────────────────────────┐
│ Public npm Registry (npmjs.org)                    │
└────────────────────────────────────────────────────┘
                      ↓ Mirror with approval
┌────────────────────────────────────────────────────┐
│ Internal Registry (Artifactory/Nexus/Verdaccio)    │
│ - Security scanning before ingestion               │
│ - Version approval workflow                        │
│ - Blocklist for known-bad packages                 │
└────────────────────────────────────────────────────┘
                      ↓ CI/CD only
┌────────────────────────────────────────────────────┐
│ Build Agents (no direct public registry access)    │
└────────────────────────────────────────────────────┘
```

**Postinstall Script Controls:**

```json
// package.json - Disable risky lifecycle scripts
{
  "scripts": {
    "preinstall": "npx --yes only-allow pnpm"  // Lock to specific package manager
  },
  "config": {
    "ignore-scripts": true  // Disable postinstall by default
  }
}
```

```bash
# CI/CD: Explicitly allow scripts only for known packages
npm ci --ignore-scripts
npm rebuild node-sass  # Selectively rebuild packages that need compilation
```

**Dependency Minimization:**

```typescript
// Audit and remove unused dependencies quarterly
import { depcheck } from 'depcheck';

const unused = await depcheck('/', {
  ignoreBinPackage: false,
  skipMissing: true
});

// Remove unused: npm uninstall <package>
```

### 3.2 Audit Workflows and Continuous Scanning

**Multi-Layer Scanning Architecture:**

```
┌─────────────────────────────────────────────────────┐
│ Layer 1: Developer Workstation                     │
│ - Pre-commit hooks: npm audit                      │
│ - IDE integration: Snyk plugin                     │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Layer 2: Pull Request Checks                       │
│ - npm audit (fail on high/critical)                │
│ - Snyk test                                        │
│ - socket.dev analysis                              │
│ - License compliance check                         │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Layer 3: Main Branch Protection                    │
│ - Daily scheduled scans                            │
│ - Automated PRs for security updates               │
│ - Dependency version pinning enforcement           │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Layer 4: Production Monitoring                     │
│ - Runtime SBOM validation                          │
│ - Zero-day vulnerability alerting                  │
│ - Incident response integration                    │
└─────────────────────────────────────────────────────┘
```

**npm audit Integration:**

```bash
# Pre-commit hook (.husky/pre-commit)
#!/bin/sh
npm audit --audit-level=moderate --production || {
  echo "Security vulnerabilities detected. Run 'npm audit fix' or create exception ticket."
  exit 1
}
```

```yaml
# GitHub Actions workflow
- name: Security audit
  run: |
    npm audit --audit-level=high --json > audit-results.json
    
    # Fail on high/critical in production dependencies
    CRITICAL=$(jq '.metadata.vulnerabilities.critical' audit-results.json)
    HIGH=$(jq '.metadata.vulnerabilities.high' audit-results.json)
    
    if [ "$CRITICAL" -gt 0 ] || [ "$HIGH" -gt 0 ]; then
      echo "Critical or high vulnerabilities found"
      npm audit
      exit 1
    fi
```

**Snyk Integration:**

```yaml
# .github/workflows/snyk.yml
name: Snyk Security
on: [push, pull_request]

jobs:
  snyk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: snyk/actions/setup@master
      
      - name: Snyk test
        run: snyk test --severity-threshold=high --fail-on=all
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: Snyk monitor
        if: github.ref == 'refs/heads/main'
        run: snyk monitor --project-name=myapp-production
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

**socket.dev Integration (Behavioral Analysis):**

```yaml
# .github/workflows/socket.yml
- name: Socket Security
  uses: SocketDev/github-action@v1
  with:
    token: ${{ secrets.SOCKET_TOKEN }}
    
    # Fail on supply chain risk signals
    fail-on: |
      install-scripts
      network-access
      filesystem-access
      shell-access
      eval-usage
```

**Triage and Exception Workflow:**

```typescript
// .snyk policy file for documented exceptions
{
  "version": "v1.22.0",
  "ignore": {
    "SNYK-JS-LODASH-567890": {
      "reason": "No fix available, compensating control: input validation",
      "expires": "2025-03-01",
      "created": "2025-01-15",
      "owner": "security-team@company.com"
    }
  },
  "patch": {}
}
```

**Severity Thresholds:**

| Environment | Critical | High | Moderate | Low |
|-------------|----------|------|----------|-----|
| Production  | Fail     | Fail | Warn     | Info |
| Staging     | Fail     | Warn | Info     | Info |
| Development | Warn     | Info | Info     | Info |

### 3.3 SBOM Generation and Management

**SBOM Generation:**

```bash
# CycloneDX SBOM
npx @cyclonedx/cyclonedx-npm --output-file sbom.json

# SPDX SBOM
npx spdx-sbom-generator npm

# Store alongside artifacts
tar -czf release-v1.2.3.tar.gz dist/ sbom.json
```

**SBOM Storage and Querying:**

```yaml
# Store in artifact registry with versioning
- name: Upload SBOM
  uses: actions/upload-artifact@v4
  with:
    name: sbom-${{ github.sha }}
    path: sbom.json
    retention-days: 365

# Index in vulnerability database
- name: Index SBOM
  run: |
    curl -X POST https://vuln-db.internal/api/sboms \
      -H "Authorization: Bearer ${{ secrets.VULN_DB_TOKEN }}" \
      -F "sbom=@sbom.json" \
      -F "version=${{ github.ref_name }}" \
      -F "commit=${{ github.sha }}"
```

**Incident Response Integration:**

```typescript
// Query: "Where do we use package X?"
interface SBOMQuery {
  package: string;
  version?: string;
  
  findUsage(): Array<{
    application: string;
    version: string;
    environment: 'production' | 'staging' | 'development';
    deployedAt: Date;
  }>;
}

// Example: Log4Shell incident
const usage = await sbomDB.query({
  package: 'log4js',
  version: '<2.19.0'
});

// Generate immediate impact report
console.log(`Affected deployments: ${usage.length}`);
usage.forEach(app => {
  console.log(`- ${app.application}@${app.version} in ${app.environment}`);
});
```

### 3.4 Enterprise Dependency Governance

**Approved Dependency Catalog:**

```typescript
// approved-packages.json
{
  "allowlist": {
    "react": {
      "versions": ["19.x"],
      "justification": "Primary UI framework",
      "reviewer": "architecture-team",
      "reviewedAt": "2025-01-15"
    },
    "lodash": {
      "versions": ["4.17.21"],
      "justification": "Utility library",
      "reviewer": "security-team",
      "reviewedAt": "2025-01-10",
      "conditions": "Only tree-shakeable imports allowed"
    }
  },
  "blocklist": {
    "event-stream": {
      "reason": "Historical compromise (2018)",
      "severity": "critical",
      "blockedAt": "2018-11-26"
    }
  }
}
```

**Automated Approval Workflow:**

```yaml
# .github/workflows/dependency-change.yml
name: Dependency Change Review
on:
  pull_request:
    paths:
      - 'package.json'
      - 'package-lock.json'

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Detect dependency changes
        id: changes
        run: |
          git diff origin/main package.json | grep '"dependencies"' -A 999 > changes.txt
          
      - name: Check against approved catalog
        run: |
          node scripts/validate-dependencies.js changes.txt approved-packages.json
      
      - name: Request security review
        if: steps.changes.outputs.new-packages != ''
        run: |
          gh pr comment ${{ github.event.pull_request.number }} \
            --body "New dependencies detected. Security review required. cc @security-team"
```

**Service-Level Policy Enforcement:**

```json
// For data-sensitive microservices
{
  "dependencies": {
    // Strict: Only approved, minimal dependencies
    "react": "19.2.0",
    "zod": "3.22.4"
  },
  "config": {
    "maxDependencies": 20,  // Hard limit
    "allowedLicenses": ["MIT", "Apache-2.0", "BSD-3-Clause"]
  }
}
```

**Developer Training Requirements:**

- Supply chain attack patterns (typosquatting, dependency confusion, compromised maintainers)
- How internal tooling mitigates risks
- Approved dependency review process
- Incident response procedures

## 4. Corporate Browser Restrictions and Feature Detection

### Critical Context

Enterprise browsers often block powerful APIs via group policies, security products, or virtualized desktop environments. B2B SaaS applications must detect these restrictions and degrade gracefully while maintaining core functionality.

### 4.1 Feature Detection Pattern: Capability + Viability

**Two-Step Detection:**

Standard feature detection (`if ('indexedDB' in window)`) is necessary but insufficient. Corporate environments can make APIs appear present but non-functional.

**Detection Pattern:**

```typescript
interface FeatureDetectionResult {
  available: boolean;
  reason?: 'not-present' | 'security-blocked' | 'quota-exceeded' | 'private-mode';
  degradationMode?: string;
}

class EnterpriseFeatureDetector {
  
  // IndexedDB detection with viability check
  async detectIndexedDB(): Promise<FeatureDetectionResult> {
    // Step 1: Capability check
    if (!('indexedDB' in window)) {
      return {
        available: false,
        reason: 'not-present',
        degradationMode: 'memory-only'
      };
    }

    // Step 2: Viability check
    try {
      const testDB = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('__capability_test__', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        // Timeout for environments that hang
        setTimeout(() => reject(new Error('Timeout')), 3000);
      });

      // Perform read/write test
      const tx = testDB.transaction(['test'], 'readwrite');
      const store = tx.objectStore('test');
      await store.put({ id: 1, test: true });
      await store.get(1);

      testDB.close();
      indexedDB.deleteDatabase('__capability_test__');

      return { available: true };

    } catch (error: unknown) {
      if (error instanceof DOMException) {
        if (error.name === 'SecurityError') {
          return {
            available: false,
            reason: 'security-blocked',
            degradationMode: 'server-sync'
          };
        }
        if (error.name === 'QuotaExceededError') {
          return {
            available: false,
            reason: 'quota-exceeded',
            degradationMode: 'limited-cache'
          };
        }
      }

      // Private browsing or unknown issue
      return {
        available: false,
        reason: 'private-mode',
        degradationMode: 'session-only'
      };
    }
  }

  // Service Worker detection
  async detectServiceWorker(): Promise<FeatureDetectionResult> {
    if (!('serviceWorker' in navigator)) {
      return {
        available: false,
        reason: 'not-present',
        degradationMode: 'online-only'
      };
    }

    try {
      // Try registration with timeout
      const registration = await Promise.race([
        navigator.serviceWorker.register('/sw-test.js', { scope: '/' }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);

      await (registration as ServiceWorkerRegistration).unregister();
      return { available: true };

    } catch (error: unknown) {
      const err = error as Error;
      if (err.name === 'SecurityError' || err.message.includes('proxy')) {
        return {
          available: false,
          reason: 'security-blocked',
          degradationMode: 'online-only'
        };
      }

      return {
        available: false,
        reason: 'not-present',
        degradationMode: 'online-only'
      };
    }
  }

  // WebGPU detection
  async detectWebGPU(): Promise<FeatureDetectionResult> {
    if (!('gpu' in navigator)) {
      return {
        available: false,
        reason: 'not-present',
        degradationMode: 'cpu-compute'
      };
    }

    try {
      const adapter = await Promise.race([
        navigator.gpu.requestAdapter(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        )
      ]);

      if (!adapter) {
        return {
          available: false,
          reason: 'security-blocked',
          degradationMode: 'cpu-compute'
        };
      }

      return { available: true };

    } catch (error) {
      return {
        available: false,
        reason: 'security-blocked',
        degradationMode: 'cpu-compute'
      };
    }
  }

  // Comprehensive detection on app startup
  async detectAllFeatures(): Promise<Map<string, FeatureDetectionResult>> {
    const results = new Map<string, FeatureDetectionResult>();

    const detections = await Promise.all([
      this.detectIndexedDB().then(r => ['indexedDB', r] as const),
      this.detectServiceWorker().then(r => ['serviceWorker', r] as const),
      this.detectWebGPU().then(r => ['webGPU', r] as const),
      this.detectNotifications(),
      this.detectClipboard(),
      this.detectWebRTC()
    ]);

    detections.forEach(([name, result]) => results.set(name, result));
    
    // Log to telemetry for enterprise IT visibility
    this.reportCapabilities(results);

    return results;
  }

  private async detectNotifications(): Promise<['notifications', FeatureDetectionResult]> {
    if (!('Notification' in window)) {
      return ['notifications', { 
        available: false, 
        reason: 'not-present',
        degradationMode: 'in-app-alerts' 
      }];
    }

    // Check if globally denied by policy
    if (Notification.permission === 'denied') {
      return ['notifications', {
        available: false,
        reason: 'security-blocked',
        degradationMode: 'in-app-alerts'
      }];
    }

    return ['notifications', { available: true }];
  }

  private async detectClipboard(): Promise<['clipboard', FeatureDetectionResult]> {
    if (!navigator.clipboard) {
      return ['clipboard', {
        available: false,
        reason: 'not-present',
        degradationMode: 'manual-copy'
      }];
    }

    try {
      // Try to query permission
      const permission = await navigator.permissions.query({ 
        name: 'clipboard-read' as PermissionName 
      });
      
      if (permission.state === 'denied') {
        return ['clipboard', {
          available: false,
          reason: 'security-blocked',
          degradationMode: 'manual-copy'
        }];
      }

      return ['clipboard', { available: true }];
    } catch {
      return ['clipboard', { available: false, reason: 'security-blocked' }];
    }
  }

  private async detectWebRTC(): Promise<['webrtc', FeatureDetectionResult]> {
    if (!('RTCPeerConnection' in window)) {
      return ['webrtc', {
        available: false,
        reason: 'not-present',
        degradationMode: 'websocket-only'
      }];
    }

    // Many corporate firewalls block WebRTC at network level
    // This is hard to detect without attempting connection
    return ['webrtc', { available: true }];
  }

  private reportCapabilities(results: Map<string, FeatureDetectionResult>): void {
    // Send to analytics/telemetry
    const capabilities = Object.fromEntries(results);
    
    // Example: PostHog, Amplitude, or custom telemetry
    analytics.track('browser_capabilities_detected', {
      capabilities,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
  }
}
```

**Usage at Application Startup:**

```typescript
// app-initialization.ts
const detector = new EnterpriseFeatureDetector();
const capabilities = await detector.detectAllFeatures();

// Configure application based on capabilities
const appConfig = {
  storage: capabilities.get('indexedDB')?.available 
    ? 'indexeddb' 
    : 'memory',
  offline: capabilities.get('serviceWorker')?.available 
    ? 'enabled' 
    : 'disabled',
  compute: capabilities.get('webGPU')?.available 
    ? 'gpu' 
    : 'cpu'
};

// Initialize with degraded configuration
await initializeApp(appConfig);
```

### 4.2 Graceful Degradation Patterns

**Storage Fallback Hierarchy:**

```typescript
class AdaptiveStorageService {
  private strategy: 'indexeddb' | 'memory' | 'server-sync';

  async initialize(capabilities: Map<string, FeatureDetectionResult>): Promise<void> {
    const indexedDBAvailable = capabilities.get('indexedDB')?.available;

    if (indexedDBAvailable) {
      this.strategy = 'indexeddb';
      await this.initIndexedDB();
    } else {
      const reason = capabilities.get('indexedDB')?.reason;
      
      if (reason === 'security-blocked') {
        this.strategy = 'server-sync';
        this.warnUser('Local storage unavailable due to browser policy. Data will sync with server.');
      } else {
        this.strategy = 'memory';
        this.warnUser('Local storage unavailable. Data will be cached in memory only.');
      }
    }
  }

  async get(key: string): Promise<unknown> {
    switch (this.strategy) {
      case 'indexeddb':
        return this.getFromIndexedDB(key);
      case 'memory':
        return this.getFromMemoryCache(key);
      case 'server-sync':
        return this.getFromServer(key);
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    switch (this.strategy) {
      case 'indexeddb':
        await this.setInIndexedDB(key, value);
        // Also sync to server for redundancy
        await this.syncToServer(key, value);
        break;
      case 'memory':
        this.setInMemoryCache(key, value);
        // Opportunistic server sync
        await this.syncToServer(key, value);
        break;
      case 'server-sync':
        await this.setOnServer(key, value);
        break;
    }
  }
}
```

**Offline Mode Fallback:**

```typescript
class OfflineCapabilityManager {
  private mode: 'offline-enabled' | 'online-only';

  initialize(capabilities: Map<string, FeatureDetectionResult>): void {
    const swAvailable = capabilities.get('serviceWorker')?.available;
    const indexedDBAvailable = capabilities.get('indexedDB')?.available;

    if (swAvailable && indexedDBAvailable) {
      this.mode = 'offline-enabled';
      this.enableOfflineFeatures();
    } else {
      this.mode = 'online-only';
      this.disableOfflineUI();
      this.showOnlineRequirement();
    }
  }

  private disableOfflineUI(): void {
    // Hide offline indicators, disable offline mode toggle
    document.querySelector('[data-offline-toggle]')?.remove();
    document.querySelector('[data-sync-status]')?.remove();
  }

  private showOnlineRequirement(): void {
    // Show persistent banner
    const banner = document.createElement('div');
    banner.className = 'enterprise-notice';
    banner.innerHTML = `
      <span>⚠️ Online mode required due to browser policies.</span>
      <a href="/docs/enterprise-browser-requirements">Learn more</a>
    `;
    document.body.prepend(banner);
  }
}
```

**Compute Fallback (WebGPU → CPU):**

```typescript
class ComputeService {
  private backend: 'gpu' | 'cpu';

  async initialize(capabilities: Map<string, FeatureDetectionResult>): Promise<void> {
    const gpuAvailable = capabilities.get('webGPU')?.available;
    this.backend = gpuAvailable ? 'gpu' : 'cpu';

    if (this.backend === 'cpu') {
      this.warnPerformance('GPU acceleration unavailable. Complex operations may be slower.');
    }
  }

  async processLargeDataset(data: Float32Array): Promise<Float32Array> {
    if (this.backend === 'gpu') {
      return this.processOnGPU(data);
    } else {
      // Reduce dataset size or use web workers for parallelism
      return this.processOnCPU(data);
    }
  }

  private async processOnCPU(data: Float32Array): Promise<Float32Array> {
    // Use Web Workers for parallel CPU processing
    const numWorkers = navigator.hardwareConcurrency || 4;
    const chunkSize = Math.ceil(data.length / numWorkers);
    
    const workers = Array.from({ length: numWorkers }, (_, i) => {
      const worker = new Worker('/compute-worker.js');
      const chunk = data.slice(i * chunkSize, (i + 1) * chunkSize);
      return this.processChunk(worker, chunk);
    });

    const results = await Promise.all(workers);
    return new Float32Array(results.flat());
  }

  private warnPerformance(message: string): void {
    console.warn(message);
    // Show non-intrusive toast
    showToast({ type: 'info', message, duration: 10000 });
  }
}
```

**Progressive Enhancement Table:**

| Feature | Primary | Fallback 1 | Fallback 2 | Fallback 3 |
|---------|---------|------------|------------|------------|
| Storage | IndexedDB | LocalStorage | Memory | Server-only |
| Offline | Service Worker | Application Cache (deprecated) | - | Online-only |
| Compute | WebGPU | Web Workers | Main thread | Server-side |
| Notifications | Web Push | In-app notifications | Email | - |
| Clipboard | Clipboard API | execCommand | Manual copy | - |

### 4.3 User Communication Patterns

**Inline Contextual Messaging:**

```typescript
class EnterpriseNotificationService {
  showFeatureUnavailable(feature: string, reason: string): void {
    const message = this.getEnterpriseMessage(feature, reason);
    
    // Show inline where feature would be
    const placeholder = document.querySelector(`[data-feature="${feature}"]`);
    if (placeholder) {
      placeholder.innerHTML = `
        <div class="feature-unavailable">
          <p>${message.description}</p>
          <a href="${message.helpLink}" target="_blank">
            ${message.helpText}
          </a>
        </div>
      `;
    }
  }

  private getEnterpriseMessage(feature: string, reason: string): {
    description: string;
    helpText: string;
    helpLink: string;
  } {
    const messages = {
      indexedDB: {
        'security-blocked': {
          description: 'Local data storage is unavailable due to browser security policies. Your data will sync with our servers instead.',
          helpText: 'IT Administrator Guide',
          helpLink: '/docs/enterprise/storage-requirements'
        }
      },
      serviceWorker: {
        'security-blocked': {
          description: 'Offline mode is unavailable. You\'ll need an active internet connection to use this application.',
          helpText: 'Enterprise Browser Requirements',
          helpLink: '/docs/enterprise/browser-policies'
        }
      }
    };

    return messages[feature]?.[reason] || {
      description: `${feature} is unavailable in this browser environment.`,
      helpText: 'Learn more',
      helpLink: '/docs/enterprise/compatibility'
    };
  }
}
```

**Tenant-Level Configuration:**

```typescript
interface TenantConfiguration {
  tenantId: string;
  compatibilityMode: 'auto' | 'forced';
  disabledFeatures: string[];
  customMessages: Record<string, string>;
}

class EnterpriseConfigService {
  async loadTenantConfig(tenantId: string): Promise<TenantConfiguration> {
    // Fetch from server
    const config = await fetch(`/api/tenant/${tenantId}/config`).then(r => r.json());
    
    if (config.compatibilityMode === 'forced') {
      // IT admin has pre-configured compatibility mode
      this.applyForcedCompatibility(config);
    }

    return config;
  }

  private applyForcedCompatibility(config: TenantConfiguration): void {
    // Disable features even if technically available
    config.disabledFeatures.forEach(feature => {
      this.disableFeature(feature);
    });

    // Show custom IT-provided messages
    Object.entries(config.customMessages).forEach(([feature, message]) => {
      this.showCustomMessage(feature, message);
    });
  }
}
```

**Admin Dashboard for IT:**

```typescript
// Endpoint: /api/admin/tenant/:tenantId/diagnostics
interface TenantDiagnostics {
  totalUsers: number;
  usersInCompatibilityMode: number;
  commonBlockedFeatures: Array<{
    feature: string;
    affectedUsers: number;
    percentage: number;
  }>;
  recommendedActions: string[];
}

// Example response:
{
  totalUsers: 500,
  usersInCompatibilityMode: 350,  // 70% affected
  commonBlockedFeatures: [
    { feature: 'indexedDB', affectedUsers: 350, percentage: 70 },
    { feature: 'serviceWorker', affectedUsers: 350, percentage: 70 },
    { feature: 'webGPU', affectedUsers: 500, percentage: 100 }
  ],
  recommendedActions: [
    "Consider enabling IndexedDB for *.yourdomain.com in Group Policy",
    "WebGPU is blocked for all users; GPU-accelerated features will use CPU fallback",
    "Documentation: https://docs.yourapp.com/enterprise/browser-policies"
  ]
}
```

### 4.4 Documentation for IT Teams

**Enterprise Requirements Page (Public):**

```markdown
# Enterprise Browser Requirements

## Supported Browsers
- Chrome 120+ (recommended)
- Edge 120+
- Firefox 115+
- Safari 17+

## Required Browser APIs

### Essential (Core Functionality)
- LocalStorage (5MB minimum)
- SessionStorage
- Fetch API
- Web Workers

### Recommended (Enhanced Features)
- IndexedDB (50MB minimum quota)
  - Required for: Offline editing, local caching
  - Group Policy: Enable for *.yourapp.com
  
- Service Workers
  - Required for: Offline mode, background sync
  - Group Policy: Enable for *.yourapp.com

### Optional (Advanced Features)
- WebGPU
  - Required for: GPU-accelerated rendering (>1M data points)
  - Fallback: CPU processing (slower)
  
- Clipboard API
  - Required for: One-click copy functionality
  - Fallback: Manual copy/paste

## Network Requirements
- Outbound HTTPS to *.yourapp.com (port 443)
- WebSocket support for real-time features
- No SSL inspection on *.yourapp.com (breaks WebSocket)

## Common Enterprise Configurations

### Scenario 1: Maximum Security
- IndexedDB: Blocked
- Service Workers: Blocked
- Result: Online-only mode, server-side storage

### Scenario 2: Balanced
- IndexedDB: Allowed for *.yourapp.com
- Service Workers: Blocked
- Result: Local caching enabled, no offline mode

### Scenario 3: Full Features
- All APIs: Allowed for *.yourapp.com
- Result: Full offline capabilities

## Group Policy Examples

### Chrome/Edge Enterprise
```
Enable IndexedDB: *.yourapp.com
Enable Service Workers: *.yourapp.com
Disable for: <blank> (allow all by default)
```

### Firefox Enterprise
See: enterprise-firefox-config.json

## Support
Contact: enterprise-support@yourapp.com
```

## 5. Data Retention and Compliance for Browser Storage

### Critical Context

Browser storage containing personal data is subject to the same compliance requirements as server-side databases. For enterprise B2B SaaS, GDPR, SOC 2, and industry-specific regulations (HIPAA, FINRA) apply equally to IndexedDB, LocalStorage, and Cache Storage.

### 5.1 GDPR and SOC 2 Compliance for IndexedDB

**Regulatory Scope:**

- GDPR Article 4(1): Personal data is "any information relating to an identified or identifiable natural person" **regardless of storage location**
- GDPR Article 5: Data minimization, storage limitation, and security principles apply to browser storage
- SOC 2 Trust Services Criteria: Security, confidentiality, and privacy controls extend to client-side storage

**Documentation Requirements:**

```typescript
// Records of Processing Activity (ROPA)
interface BrowserStorageROPA {
  storageType: 'IndexedDB' | 'LocalStorage' | 'SessionStorage';
  dataCategories: string[];
  legalBasis: 'legitimate_interest' | 'contract' | 'consent';
  retentionPeriod: string;
  securityMeasures: string[];
  locationOfProcessing: string;
}

const indexedDBROPA: BrowserStorageROPA = {
  storageType: 'IndexedDB',
  dataCategories: [
    'User preferences (non-identifying)',
    'Cached API responses (pseudonymized)',
    'Draft content (user-generated)',
    'Session tokens (opaque)'
  ],
  legalBasis: 'contract', // Necessary for service delivery
  retentionPeriod: 'Session duration + 30 days or until user logout',
  securityMeasures: [
    'AES-256-GCM encryption at rest',
    'Key derivation from session tokens',
    'Automatic expiry and cleanup',
    'CSP preventing unauthorized script access'
  ],
  locationOfProcessing: 'User device (browser sandbox)'
};
```

**Privacy by Design Implementation:**

```typescript
class PrivacyCompliantStorage {
  // Data minimization: Store only necessary data
  async storeUserPreferences(userId: string, prefs: UserPreferences): Promise<void> {
    // Strip PII before storing
    const sanitized = {
      userId: hashUserId(userId),  // Pseudonymize
      theme: prefs.theme,
      language: prefs.language,
      // Do NOT store: email, name, phone, etc.
    };

    await this.encryptAndStore('preferences', sanitized);
  }

  // Storage limitation: Automatic expiry
  async storeWithExpiry(key: string, value: unknown, ttlDays: number): Promise<void> {
    const expiresAt = Date.now() + (ttlDays * 24 * 60 * 60 * 1000);
    
    await db.put('data', {
      key,
      value,
      expiresAt,
      createdAt: Date.now()
    });
  }

  // Security: Encryption mandatory for sensitive data
  async storeSensitiveData(data: unknown): Promise<void> {
    const encrypted = await encryptionService.encrypt(data);
    await db.put('sensitive', encrypted);
  }
}
```

**SOC 2 Control Evidence:**

```typescript
// Control: CC6.1 - Logical and physical access controls
const accessControls = {
  description: 'Browser storage access restricted to application origin only',
  implementation: [
    'Same-Origin Policy (SOP) enforced by browser',
    'Content Security Policy prevents unauthorized script execution',
    'Encryption keys never exposed to JavaScript (non-extractable CryptoKey)',
    'Trusted Types API prevents injection attacks'
  ],
  testing: 'Annual penetration testing includes client-side storage security',
  evidence: [
    'CSP violation logs',
    'Trusted Types enforcement reports',
    'Penetration test reports'
  ]
};

// Control: CC6.7 - Restricted access to system resources
const encryptionControl = {
  description: 'Sensitive data encrypted at rest in browser storage',
  implementation: 'AES-256-GCM encryption using Web Crypto API',
  keyManagement: 'Keys derived from session tokens, cleared on logout',
  testing: 'Quarterly code review of encryption implementation',
  evidence: [
    'Code review reports',
    'Unit tests for encryption/decryption',
    'IndexedDB inspection logs showing encrypted payloads'
  ]
};
```

### 5.2 Right to Erasure (GDPR Article 17)

**Server-Driven Deletion Pattern:**

```typescript
class DataSubjectRightsService {
  // Triggered when user requests account deletion (server-side)
  async handleDeletionRequest(userId: string): Promise<void> {
    // 1. Mark for deletion in database
    await db.users.update(userId, { 
      status: 'deletion_pending',
      deletionRequestedAt: new Date()
    });

    // 2. Broadcast to all active sessions
    await this.broadcastDeletionToSessions(userId);

    // 3. Queue background job to purge server data
    await deleteQueue.add({ userId, requestedAt: new Date() });
  }

  private async broadcastDeletionToSessions(userId: string): Promise<void> {
    // WebSocket broadcast or Server-Sent Events
    await sessionManager.broadcast(userId, {
      type: 'ACCOUNT_DELETED',
      payload: { userId, immediate: true }
    });
  }
}
```

**Client-Side Deletion Handler:**

```typescript
class ClientDataDeletionService {
  async handleAccountDeleted(userId: string): Promise<void> {
    console.log(`Account deleted signal received for user ${userId}`);

    // 1. Clear IndexedDB
    await this.clearIndexedDB(userId);

    // 2. Clear LocalStorage/SessionStorage
    this.clearWebStorage(userId);

    // 3. Clear Cache Storage
    await this.clearCacheStorage();

    // 4. Unregister Service Workers
    await this.unregisterServiceWorkers();

    // 5. Clear encryption keys
    encryptionService.clear();

    // 6. Logout and redirect
    await authService.logout();
    window.location.href = '/account-deleted';
  }

  private async clearIndexedDB(userId: string): Promise<void> {
    // Option 1: Delete entire database (if single-user)
    const dbNames = await indexedDB.databases();
    for (const { name } of dbNames) {
      if (name?.includes(userId) || name?.startsWith('app-')) {
        await indexedDB.deleteDatabase(name);
      }
    }

    // Option 2: Clear user-specific records (if multi-user)
    const db = await openDB('app-data');
    const stores = ['documents', 'drafts', 'cache', 'preferences'];
    
    for (const storeName of stores) {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      
      // Delete by user ID index
      const index = store.index('userId');
      for await (const cursor of index.iterate(userId)) {
        await cursor.delete();
      }
      
      await tx.done;
    }
  }

  private clearWebStorage(userId: string): void {
    // Clear all keys (safest approach)
    localStorage.clear();
    sessionStorage.clear();

    // Or clear user-specific keys
    Object.keys(localStorage).forEach(key => {
      if (key.includes(userId) || key.startsWith('user_')) {
        localStorage.removeItem(key);
      }
    });
  }

  private async clearCacheStorage(): Promise<void> {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(name => caches.delete(name))
    );
  }

  private async unregisterServiceWorkers(): Promise<void> {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(reg => reg.unregister())
    );
  }
}
```

**Handling Unreachable Devices:**

```typescript
// Mitigation: Cryptographic erasure
class CryptographicErasureService {
  async handleDeletion(userId: string): Promise<void> {
    // 1. Invalidate all session tokens (server-side)
    await tokenService.revokeAllTokens(userId);

    // 2. Rotate encryption key salt (makes old keys unrecoverable)
    await keyService.rotateSalt(userId);

    // 3. Delete server-side encryption key backups
    await keyService.deleteEscrowKeys(userId);

    // Result: Even if browser data persists, it's cryptographically useless
  }
}

// Documentation for GDPR compliance
const deletionPolicy = {
  approach: 'Server-driven deletion with client-side cleanup',
  mechanisms: [
    'Active sessions: Real-time broadcast triggers immediate cleanup',
    'Inactive devices: Cryptographic erasure (token revocation + key rotation)',
    'Next connection: Forced logout + data purge on reconnect'
  ],
  limitations: [
    'Devices never connecting again retain encrypted, unusable data',
    'Mitigation: Data encrypted with session-derived keys that are invalidated server-side'
  ],
  documentation: 'Documented in Privacy Policy and DPIA',
  auditorGuidance: 'Demonstrate token revocation logs, key rotation logs, and cleanup code'
};
```

**Automated Cleanup on Login:**

```typescript
class LoginCleanupService {
  async onLogin(userId: string): Promise<void> {
    // Check server for deletion status
    const userStatus = await fetch(`/api/user/${userId}/status`).then(r => r.json());

    if (userStatus.deleted) {
      // User was deleted while offline
      await clientDataDeletionService.handleAccountDeleted(userId);
      throw new Error('Account has been deleted');
    }

    if (userStatus.deletionPending) {
      // Deletion in progress
      await clientDataDeletionService.handleAccountDeleted(userId);
      throw new Error('Account deletion in progress');
    }

    // Normal login flow
  }
}
```

### 5.3 Data Retention Policies and Automatic Cleanup

**Classification-Based Retention:**

```typescript
enum DataClassification {
  ESSENTIAL = 'essential',        // Session tokens, critical state
  FUNCTIONAL = 'functional',      // User preferences, UI state
  CACHE = 'cache',                // API responses, computed data
  TEMPORARY = 'temporary'         // Draft content, form state
}

interface RetentionPolicy {
  classification: DataClassification;
  maxAge: number;  // milliseconds
  cleanupStrategy: 'time-based' | 'event-based' | 'manual';
  encryptionRequired: boolean;
}

const retentionPolicies: Record<DataClassification, RetentionPolicy> = {
  [DataClassification.ESSENTIAL]: {
    classification: DataClassification.ESSENTIAL,
    maxAge: 0,  // Session-only
    cleanupStrategy: 'event-based',  // Logout
    encryptionRequired: true
  },
  [DataClassification.FUNCTIONAL]: {
    classification: DataClassification.FUNCTIONAL,
    maxAge: 90 * 24 * 60 * 60 * 1000,  // 90 days
    cleanupStrategy: 'time-based',
    encryptionRequired: false
  },
  [DataClassification.CACHE]: {
    classification: DataClassification.CACHE,
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
    cleanupStrategy: 'time-based',
    encryptionRequired: true
  },
  [DataClassification.TEMPORARY]: {
    classification: DataClassification.TEMPORARY,
    maxAge: 24 * 60 * 60 * 1000,  // 24 hours
    cleanupStrategy: 'time-based',
    encryptionRequired: false
  }
};
```

**Automatic Cleanup Service:**

```typescript
class DataRetentionService {
  private cleanupInterval: number;

  constructor() {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(() => this.runCleanup(), 60 * 60 * 1000);
    
    // Also run on startup
    this.runCleanup();
    
    // Run when tab becomes visible (user returns)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.runCleanup();
      }
    });
  }

  async runCleanup(): Promise<CleanupReport> {
    const report: CleanupReport = {
      startedAt: new Date(),
      recordsScanned: 0,
      recordsDeleted: 0,
      bytesFreed: 0,
      errors: []
    };

    try {
      const db = await openDB('app-data');
      
      for (const storeName of db.objectStoreNames) {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        
        for await (const cursor of store) {
          report.recordsScanned++;
          
          const record = cursor.value;
          const shouldDelete = this.shouldDeleteRecord(record);
          
          if (shouldDelete) {
            const size = this.estimateSize(record);
            await cursor.delete();
            report.recordsDeleted++;
            report.bytesFreed += size;
          }
        }
        
        await tx.done;
      }

      // Log to telemetry
      this.reportCleanup(report);
      
    } catch (error) {
      report.errors.push(error);
      console.error('Cleanup failed:', error);
    }

    return report;
  }

  private shouldDeleteRecord(record: unknown): boolean {
    if (!record || typeof record !== 'object') return false;
    
    const { expiresAt, classification, createdAt } = record as {
      expiresAt?: number;
      classification?: DataClassification;
      createdAt?: number;
    };

    // Time-based expiry
    if (expiresAt && Date.now() > expiresAt) {
      return true;
    }

    // Classification-based retention
    if (classification && createdAt) {
      const policy = retentionPolicies[classification];
      if (policy && Date.now() - createdAt > policy.maxAge) {
        return true;
      }
    }

    return false;
  }

  private estimateSize(record: unknown): number {
    try {
      return new Blob([JSON.stringify(record)]).size;
    } catch {
      return 0;
    }
  }

  private reportCleanup(report: CleanupReport): void {
    analytics.track('indexeddb_cleanup', {
      recordsDeleted: report.recordsDeleted,
      bytesFreed: report.bytesFreed,
      duration: Date.now() - report.startedAt.getTime()
    });
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

interface CleanupReport {
  startedAt: Date;
  recordsScanned: number;
  recordsDeleted: number;
  bytesFreed: number;
  errors: unknown[];
}
```

**Event-Based Cleanup:**

```typescript
class EventBasedCleanupService {
  async onLogout(userId: string): Promise<void> {
    // Delete ESSENTIAL classification data
    await this.deleteByClassification(DataClassification.ESSENTIAL);
    
    // Clear encryption keys
    encryptionService.clear();
  }

  async onPasswordChange(userId: string): Promise<void> {
    // Rotate encryption keys
    await keyRotationService.rotateKey(userId);
    
    // Re-encrypt sensitive data
    await this.reEncryptSensitiveData();
  }

  async onRoleChange(userId: string, newRole: string): Promise<void> {
    // Delete data user should no longer access
    await this.deleteByAccessLevel(newRole);
  }

  private async deleteByClassification(classification: DataClassification): Promise<void> {
    const db = await openDB('app-data');
    // ... deletion logic
  }
}
```

**Quota Management:**

```typescript
class StorageQuotaService {
  async checkQuota(): Promise<StorageQuota> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        percentage: ((estimate.usage || 0) / (estimate.quota || 1)) * 100
      };
    }
    return { usage: 0, quota: 0, percentage: 0 };
  }

  async enforceQuotaLimits(): Promise<void> {
    const quota = await this.checkQuota();
    
    // Trigger cleanup if over 80% quota
    if (quota.percentage > 80) {
      console.warn('Storage quota exceeded 80%, triggering aggressive cleanup');
      await this.aggressiveCleanup();
    }

    // Warn user if over 90%
    if (quota.percentage > 90) {
      this.notifyUser('Storage space running low. Some features may be limited.');
    }
  }

  private async aggressiveCleanup(): Promise<void> {
    // 1. Delete all CACHE classification data
    await this.deleteByClassification(DataClassification.CACHE);
    
    // 2. Delete oldest TEMPORARY data
    await this.deleteOldestRecords(100);
    
    // 3. Compact database
    await this.compactDatabase();
  }
}

interface StorageQuota {
  usage: number;
  quota: number;
  percentage: number;
}
```

### 5.4 Audit Trail for Sensitive Data

**Server-Side Audit Logging (Authoritative):**

```typescript
class AuditLogService {
  async logDataAccess(event: DataAccessEvent): Promise<void> {
    // Log on server (authoritative record)
    await fetch('/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: event.userId,
        tenantId: event.tenantId,
        action: event.action,  // 'read', 'write', 'delete'
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        ipAddress: event.ipAddress,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        source: 'browser'
      })
    });
  }

  // Log before IndexedDB operations on sensitive data
  async logBeforeWrite(data: SensitiveData): Promise<void> {
    await this.logDataAccess({
      userId: data.userId,
      tenantId: data.tenantId,
      action: 'write',
      resourceType: 'sensitive_document',
      resourceId: data.id,
      classification: 'confidential'
    });
  }
}
```

**Client-Side Audit Buffer (Offline Support):**

```typescript
class OfflineAuditBuffer {
  async bufferAuditEvent(event: AuditEvent): Promise<void> {
    // Encrypt audit event before storing
    const encrypted = await encryptionService.encrypt(event);
    
    await db.put('audit_buffer', {
      id: crypto.randomUUID(),
      event: encrypted,
      timestamp: Date.now(),
      synced: false
    });
  }

  async syncToServer(): Promise<void> {
    const tx = db.transaction('audit_buffer', 'readwrite');
    const store = tx.objectStore('audit_buffer');
    
    for await (const cursor of store) {
      if (!cursor.value.synced) {
        try {
          // Decrypt and send to server
          const event = await encryptionService.decrypt(cursor.value.event);
          await auditLogService.logDataAccess(event);
          
          // Mark as synced
          await cursor.update({ ...cursor.value, synced: true });
          
        } catch (error) {
          console.error('Failed to sync audit event:', error);
        }
      }
    }
    
    // Delete synced events older than 7 days
    await this.purgeSyncedEvents();
  }

  private async purgeSyncedEvents(): Promise<void> {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
    // ... deletion logic
  }
}
```

**Compliance Evidence Generation:**

```typescript
class ComplianceReportService {
  async generateBrowserStorageReport(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    
    // Query server-side audit logs
    const auditLogs = await fetch(
      `/api/audit/logs?tenant=${tenantId}&start=${startDate}&end=${endDate}&source=browser`
    ).then(r => r.json());

    return {
      reportType: 'Browser Storage Access Report',
      tenantId,
      period: { startDate, endDate },
      summary: {
        totalAccesses: auditLogs.length,
        uniqueUsers: new Set(auditLogs.map(l => l.userId)).size,
        sensitiveDataAccesses: auditLogs.filter(l => 
          l.classification === 'confidential'
        ).length
      },
      securityControls: [
        'AES-256-GCM encryption at rest',
        'Key derivation from session tokens (PBKDF2 600k iterations)',
        'Automatic data retention enforcement',
        'CSP + Trusted Types for XSS prevention',
        'Server-side audit logging'
      ],
      incidents: await this.queryIncidents(tenantId, startDate, endDate),
      evidence: {
        encryptionTests: 'Unit tests pass',
        retentionEnforcement: 'Automated cleanup logs',
        accessControls: 'CSP violation logs (zero violations)'
      }
    };
  }
}

interface ComplianceReport {
  reportType: string;
  tenantId: string;
  period: { startDate: Date; endDate: Date };
  summary: {
    totalAccesses: number;
    uniqueUsers: number;
    sensitiveDataAccesses: number;
  };
  securityControls: string[];
  incidents: unknown[];
  evidence: Record<string, string>;
}
```

## 6. Enterprise Policy Enforcement Patterns

### Critical Context

For local-first applications serving enterprise customers concerned about data exfiltration, policy enforcement must operate at multiple layers: embedded client logic, server-side policy distribution, identity-based authorization, and continuous monitoring.

### 6.1 Embedded Policy Engine Architecture

**Policy Decision Point (PDP) in Browser:**

```typescript
// Policy representation (declarative JSON/YAML)
interface PolicyRule {
  id: string;
  version: number;
  effect: 'allow' | 'deny';
  actions: string[];  // ['export', 'copy', 'print', 'screenshot']
  resources: string[];  // ['document.*', 'sensitive_data']
  conditions: PolicyCondition[];
  metadata: {
    owner: string;
    createdAt: string;
    description: string;
  };
}

interface PolicyCondition {
  attribute: string;  // 'user.role', 'device.managed', 'network.location'
  operator: 'equals' | 'in' | 'matches';
  value: string | string[];
}

// Example policy
const examplePolicy: PolicyRule = {
  id: 'block-export-pii',
  version: 1,
  effect: 'deny',
  actions: ['export', 'download'],
  resources: ['documents.pii'],
  conditions: [
    { attribute: 'user.role', operator: 'in', value: ['viewer', 'guest'] },
    { attribute: 'device.managed', operator: 'equals', value: 'false' }
  ],
  metadata: {
    owner: 'compliance-team',
    createdAt: '2025-01-15T00:00:00Z',
    description: 'Prevent PII export from unmanaged devices by non-privileged users'
  }
};
```

**Policy Engine Implementation:**

```typescript
class ClientPolicyEngine {
  private policies: PolicyRule[] = [];
  private context: PolicyContext;

  constructor(context: PolicyContext) {
    this.context = context;
  }

  async loadPolicies(signedBundle: SignedPolicyBundle): Promise<void> {
    // 1. Verify signature
    const isValid = await this.verifySignature(signedBundle);
    if (!isValid) {
      throw new Error('Policy bundle signature verification failed');
    }

    // 2. Validate schema
    const validated = PolicyBundleSchema.parse(signedBundle.policies);

    // 3. Load into engine
    this.policies = validated;
    
    console.log(`Loaded ${this.policies.length} policies (version ${signedBundle.version})`);
  }

  evaluate(
    action: string,
    resource: string,
    additionalContext?: Record<string, unknown>
  ): PolicyDecision {
    const context = { ...this.context, ...additionalContext };
    
    // Find applicable policies
    const applicablePolicies = this.policies.filter(policy => 
      this.isApplicable(policy, action, resource)
    );

    if (applicablePolicies.length === 0) {
      return { effect: 'allow', reason: 'No applicable policies (default allow)' };
    }

    // Evaluate conditions for each policy
    for (const policy of applicablePolicies) {
      const conditionsMet = policy.conditions.every(condition =>
        this.evaluateCondition(condition, context)
      );

      if (conditionsMet) {
        if (policy.effect === 'deny') {
          return {
            effect: 'deny',
            reason: policy.metadata.description,
            policyId: policy.id
          };
        }
      }
    }

    return { effect: 'allow', reason: 'No denying policies matched' };
  }

  private isApplicable(policy: PolicyRule, action: string, resource: string): boolean {
    const actionMatch = policy.actions.includes(action) || policy.actions.includes('*');
    const resourceMatch = policy.resources.some(pattern =>
      this.matchPattern(pattern, resource)
    );
    return actionMatch && resourceMatch;
  }

  private evaluateCondition(condition: PolicyCondition, context: PolicyContext): boolean {
    const value = this.getContextValue(condition.attribute, context);
    
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'matches':
        return new RegExp(condition.value as string).test(String(value));
      default:
        return false;
    }
  }

  private getContextValue(attribute: string, context: PolicyContext): unknown {
    const path = attribute.split('.');
    let value: unknown = context;
    
    for (const key of path) {
      value = (value as Record<string, unknown>)?.[key];
    }
    
    return value;
  }

  private matchPattern(pattern: string, resource: string): boolean {
    // Simple glob matching (extend as needed)
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    return regex.test(resource);
  }

  private async verifySignature(bundle: SignedPolicyBundle): Promise<boolean> {
    // Verify using public key (shipped with app or fetched securely)
    const publicKey = await this.getPublicKey();
    
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(bundle.policies));
    const signature = this.base64ToBuffer(bundle.signature);

    return crypto.subtle.verify(
      { name: 'RSASSA-PKCS1-v1_5' },
      publicKey,
      signature,
      data
    );
  }

  private async getPublicKey(): Promise<CryptoKey> {
    // Public key for signature verification (embedded in app)
    const publicKeyJWK = {
      kty: 'RSA',
      n: '...', // Base64url-encoded modulus
      e: 'AQAB',
      alg: 'RS256',
      use: 'sig'
    };

    return crypto.subtle.importKey(
      'jwk',
      publicKeyJWK,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
  }

  private base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

interface PolicyContext {
  user: {
    id: string;
    role: string;
    groups: string[];
  };
  device: {
    managed: boolean;
    compliant: boolean;
    platform: string;
  };
  network: {
    location: 'corporate' | 'public' | 'unknown';
    ip: string;
  };
  session: {
    mfaCompleted: boolean;
    riskScore: number;
  };
}

interface PolicyDecision {
  effect: 'allow' | 'deny';
  reason: string;
  policyId?: string;
}

interface SignedPolicyBundle {
  version: number;
  policies: PolicyRule[];
  signature: string;  // Base64-encoded RSA signature
  issuedAt: string;
  expiresAt: string;
}
```

**Policy Enforcement at Action Points:**

```typescript
class DataExportService {
  constructor(private policyEngine: ClientPolicyEngine) {}

  async exportDocument(documentId: string): Promise<Blob | null> {
    // Evaluate policy
    const decision = this.policyEngine.evaluate('export', `document.${documentId}`);

    if (decision.effect === 'deny') {
      // Block and log
      console.warn(`Export blocked by policy: ${decision.reason}`);
      await this.logPolicyViolation('export', documentId, decision);
      
      // Show user-friendly message
      this.showBlockedMessage(decision.reason);
      
      return null;
    }

    // Allowed: proceed with export
    const blob = await this.generateExport(documentId);
    await this.logDataExfiltration('export', documentId, blob.size);
    
    return blob;
  }

  async copyToClipboard(content: string, dataClassification: string): Promise<boolean> {
    const decision = this.policyEngine.evaluate('copy', `data.${dataClassification}`);

    if (decision.effect === 'deny') {
      this.showBlockedMessage(decision.reason);
      return false;
    }

    await navigator.clipboard.writeText(content);
    await this.logDataExfiltration('copy', dataClassification, content.length);
    
    return true;
  }

  private showBlockedMessage(reason: string): void {
    showToast({
      type: 'error',
      title: 'Action Blocked by Policy',
      message: reason,
      duration: 10000
    });
  }

  private async logPolicyViolation(
    action: string,
    resource: string,
    decision: PolicyDecision
  ): Promise<void> {
    await fetch('/api/audit/policy-violation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        resource,
        policyId: decision.policyId,
        reason: decision.reason,
        timestamp: new Date().toISOString()
      })
    });
  }

  private async logDataExfiltration(
    action: string,
    resource: string,
    sizeBytes: number
  ): Promise<void> {
    await fetch('/api/audit/data-movement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        resource,
        sizeBytes,
        timestamp: new Date().toISOString()
      })
    });
  }
}
```

### 6.2 Remote Policy Distribution

**Policy Distribution Service:**

```typescript
class PolicyDistributionService {
  private currentVersion: number = 0;
  private updateCheckInterval: number;

  constructor(private policyEngine: ClientPolicyEngine) {
    // Check for updates every 5 minutes
    this.updateCheckInterval = setInterval(() => this.checkForUpdates(), 5 * 60 * 1000);
    
    // Initial load
    this.loadLatestPolicies();
  }

  async loadLatestPolicies(): Promise<void> {
    try {
      const bundle = await this.fetchPolicyBundle();
      
      if (bundle.version > this.currentVersion) {
        await this.policyEngine.loadPolicies(bundle);
        this.currentVersion = bundle.version;
        
        // Store for offline use
        await this.cachePolicyBundle(bundle);
        
        console.log(`Policy bundle updated to version ${bundle.version}`);
      }
    } catch (error) {
      console.error('Failed to load policies:', error);
      // Fall back to cached version
      await this.loadCachedPolicies();
    }
  }

  private async fetchPolicyBundle(): Promise<SignedPolicyBundle> {
    const response = await fetch('/api/policies/current', {
      headers: {
        'Authorization': `Bearer ${await authService.getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error(`Policy fetch failed: ${response.status}`);
    }

    return response.json();
  }

  private async cachePolicyBundle(bundle: SignedPolicyBundle): Promise<void> {
    await db.put('policies', {
      id: 'current',
      bundle,
      cachedAt: Date.now()
    });
  }

  private async loadCachedPolicies(): Promise<void> {
    const cached = await db.get('policies', 'current');
    
    if (cached) {
      await this.policyEngine.loadPolicies(cached.bundle);
      this.currentVersion = cached.bundle.version;
      console.log('Loaded cached policy bundle');
    } else {
      throw new Error('No cached policies available');
    }
  }

  async checkForUpdates(): Promise<void> {
    try {
      const response = await fetch('/api/policies/version', {
        headers: { 'Authorization': `Bearer ${await authService.getToken()}` }
      });
      
      const { version } = await response.json();
      
      if (version > this.currentVersion) {
        console.log(`New policy version available: ${version}`);
        await this.loadLatestPolicies();
      }
    } catch (error) {
      console.error('Policy update check failed:', error);
    }
  }

  destroy(): void {
    clearInterval(this.updateCheckInterval);
  }
}
```

**Server-Side Policy Management:**

```typescript
// Server endpoint: POST /api/admin/policies
class PolicyManagementController {
  async createPolicyVersion(
    tenantId: string,
    policies: PolicyRule[]
  ): Promise<SignedPolicyBundle> {
    
    // 1. Validate policies
    const validated = PolicyBundleSchema.parse(policies);

    // 2. Increment version
    const version = await this.getNextVersion(tenantId);

    // 3. Sign bundle
    const bundle: SignedPolicyBundle = {
      version,
      policies: validated,
      signature: await this.signPolicies(validated),
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()  // 30 days
    };

    // 4. Store in database
    await db.policyVersions.create({
      tenantId,
      version,
      bundle,
      createdBy: this.getCurrentUser(),
      createdAt: new Date()
    });

    // 5. Broadcast to active sessions (WebSocket)
    await this.broadcastPolicyUpdate(tenantId, version);

    return bundle;
  }

  private async signPolicies(policies: PolicyRule[]): Promise<string> {
    // Sign with private key (stored securely, e.g., HSM)
    const privateKey = await this.getPrivateKey();
    
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(policies));

    const signature = await crypto.subtle.sign(
      { name: 'RSASSA-PKCS1-v1_5' },
      privateKey,
      data
    );

    return Buffer.from(signature).toString('base64');
  }

  private async broadcastPolicyUpdate(tenantId: string, version: number): Promise<void> {
    await websocketService.broadcast(tenantId, {
      type: 'POLICY_UPDATE',
      payload: { version }
    });
  }
}
```

**Client-Side Real-Time Updates:**

```typescript
class PolicyUpdateListener {
  constructor(
    private policyDistribution: PolicyDistributionService,
    private websocket: WebSocket
  ) {
    this.websocket.addEventListener('message', this.handleMessage.bind(this));
  }

  private async handleMessage(event: MessageEvent): Promise<void> {
    const message = JSON.parse(event.data);

    if (message.type === 'POLICY_UPDATE') {
      console.log(`Policy update notification: v${message.payload.version}`);
      
      // Fetch and apply immediately
      await this.policyDistribution.loadLatestPolicies();
      
      // Notify user
      showToast({
        type: 'info',
        title: 'Security Policies Updated',
        message: 'New security policies have been applied.',
        duration: 5000
      });
    }
  }
}
```

### 6.3 Identity-Based Policy Enforcement (SAML/OIDC)

**IdP Claims Integration:**

```typescript
class IdentityContextBuilder {
  async buildPolicyContext(token: OIDCToken): Promise<PolicyContext> {
    // Extract claims from JWT
    const claims = this.decodeToken(token);

    // Build context for policy engine
    return {
      user: {
        id: claims.sub,
        role: claims.role || 'user',
        groups: claims.groups || []
      },
      device: {
        managed: claims.device_managed === true,
        compliant: claims.device_compliant === true,
        platform: this.detectPlatform()
      },
      network: {
        location: await this.detectNetworkLocation(),
        ip: await this.getPublicIP()
      },
      session: {
        mfaCompleted: claims.amr?.includes('mfa') || false,
        riskScore: claims.risk_score || 0
      }
    };
  }

  private decodeToken(token: string): Record<string, unknown> {
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  }

  private detectPlatform(): string {
    return navigator.platform;
  }

  private async detectNetworkLocation(): Promise<'corporate' | 'public' | 'unknown'> {
    // Check if on corporate network (IP range, DNS, etc.)
    try {
      const response = await fetch('/api/network/detect');
      const { location } = await response.json();
      return location;
    } catch {
      return 'unknown';
    }
  }

  private async getPublicIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const { ip } = await response.json();
      return ip;
    } catch {
      return 'unknown';
    }
  }
}
```

**Step-Up Authentication:**

```typescript
class StepUpAuthService {
  async requireStepUp(action: string): Promise<boolean> {
    // Check if action requires elevated authentication
    const decision = policyEngine.evaluate(action, 'sensitive_action');

    if (decision.effect === 'deny' && decision.reason.includes('MFA required')) {
      // Trigger step-up authentication
      const elevated = await this.triggerStepUp();
      
      if (elevated) {
        // Re-evaluate with updated context
        const newContext = await identityContextBuilder.buildPolicyContext(
          await authService.getToken()
        );
        policyEngine.updateContext(newContext);
        
        return true;
      }
      
      return false;
    }

    return true;
  }

  private async triggerStepUp(): Promise<boolean> {
    // Redirect to IdP for MFA prompt
    const params = new URLSearchParams({
      prompt: 'login',
      acr_values: 'urn:oasis:names:tc:SAML:2.0:ac:classes:MFA',
      redirect_uri: window.location.href
    });

    window.location.href = `/auth/authorize?${params}`;
    
    // This will redirect, so return is never reached
    return false;
  }
}
```

**SCIM-Based Group Synchronization:**

```typescript
// Server: SCIM endpoint for group provisioning
class SCIMGroupSync {
  async syncGroups(userId: string, groups: string[]): Promise<void> {
    // Update user groups from IdP
    await db.users.update(userId, {
      groups,
      groupsSyncedAt: new Date()
    });

    // Invalidate policy cache for this user
    await policyCache.invalidate(userId);

    // Broadcast to active sessions
    await websocketService.sendToUser(userId, {
      type: 'GROUPS_UPDATED',
      payload: { groups }
    });
  }
}

// Client: Handle group updates
class GroupUpdateHandler {
  async handleGroupsUpdated(groups: string[]): Promise<void> {
    // Update local context
    const context = await identityContextBuilder.buildPolicyContext(
      await authService.getToken()
    );
    
    context.user.groups = groups;
    policyEngine.updateContext(context);

    // Re-evaluate current page/actions
    await this.reEvaluatePermissions();
  }

  private async reEvaluatePermissions(): Promise<void> {
    // Check if current page is still accessible
    const pageAccess = policyEngine.evaluate('view', window.location.pathname);
    
    if (pageAccess.effect === 'deny') {
      // Redirect to home
      window.location.href = '/';
    }

    // Update UI elements based on new permissions
    document.querySelectorAll('[data-policy-action]').forEach(el => {
      const action = el.getAttribute('data-policy-action');
      const resource = el.getAttribute('data-policy-resource');
      
      const decision = policyEngine.evaluate(action!, resource!);
      
      if (decision.effect === 'deny') {
        (el as HTMLElement).style.display = 'none';
      } else {
        (el as HTMLElement).style.display = '';
      }
    });
  }
}
```

### 6.4 Monitoring and Compliance Reporting

**Event Schema for Data Movement:**

```typescript
interface DataMovementEvent {
  eventId: string;
  timestamp: string;
  
  // Who
  userId: string;
  userName: string;
  tenantId: string;
  
  // What
  action: 'export' | 'download' | 'copy' | 'print' | 'screenshot' | 'upload';
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
  resourceType: string;
  resourceId: string;
  resourceName: string;
  sizeBytes: number;
  
  // Where
  fromLocation: 'indexeddb' | 'server' | 'cache';
  toLocation: 'download' | 'clipboard' | 'printer' | 'external-upload';
  destinationDomain?: string;
  
  // How
  source: 'browser' | 'api' | 'sync';
  ipAddress: string;
  userAgent: string;
  deviceId: string;
  
  // Policy
  policyDecision: 'allowed' | 'blocked';
  policyId?: string;
  policyReason?: string;
}
```

**Client-Side Event Logging:**

```typescript
class DataMovementLogger {
  async logEvent(event: Partial<DataMovementEvent>): Promise<void> {
    const fullEvent: DataMovementEvent = {
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      
      userId: authService.getCurrentUser().id,
      userName: authService.getCurrentUser().name,
      tenantId: authService.getCurrentTenant().id,
      
      ipAddress: await this.getPublicIP(),
      userAgent: navigator.userAgent,
      deviceId: await this.getDeviceId(),
      source: 'browser',
      
      ...event
    } as DataMovementEvent;

    // Send to server immediately
    await this.sendToServer(fullEvent);

    // Also buffer locally for reliability
    await this.bufferLocally(fullEvent);
  }

  private async sendToServer(event: DataMovementEvent): Promise<void> {
    try {
      await fetch('/api/audit/data-movement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await authService.getToken()}`
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Failed to send audit event:', error);
      // Event is buffered locally and will retry
    }
  }

  private async bufferLocally(event: DataMovementEvent): Promise<void> {
    await db.put('audit_buffer', {
      ...event,
      synced: false
    });
  }

  private async getDeviceId(): Promise<string> {
    // Stable device ID (localStorage)
    let deviceId = localStorage.getItem('device_id');
    
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('device_id', deviceId);
    }
    
    return deviceId;
  }

  private async getPublicIP(): Promise<string> {
    // Cached IP address
    const cached = sessionStorage.getItem('public_ip');
    if (cached) return cached;

    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const { ip } = await response.json();
      sessionStorage.setItem('public_ip', ip);
      return ip;
    } catch {
      return 'unknown';
    }
  }
}
```

**On-Premise Log Sinks:**

```typescript
// For customers requiring on-premise logging
class OnPremiseLogSink {
  private syslogEndpoint: string;

  constructor(config: { syslogEndpoint: string }) {
    this.syslogEndpoint = config.syslogEndpoint;
  }

  async sendEvent(event: DataMovementEvent): Promise<void> {
    // Format as syslog CEF (Common Event Format)
    const cef = this.formatCEF(event);

    // Send to customer's syslog/SIEM
    await fetch(this.syslogEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: cef
    });
  }

  private formatCEF(event: DataMovementEvent): string {
    // CEF format for SIEM ingestion
    return `CEF:0|YourApp|BrowserClient|1.0|${event.action}|Data Movement|${this.getSeverity(event)}|` +
      `src=${event.ipAddress} ` +
      `suser=${event.userName} ` +
      `cs1Label=DataClassification cs1=${event.dataClassification} ` +
      `cs2Label=PolicyDecision cs2=${event.policyDecision} ` +
      `cn1Label=SizeBytes cn1=${event.sizeBytes} ` +
      `msg=${event.action} on ${event.resourceType}`;
  }

  private getSeverity(event: DataMovementEvent): number {
    if (event.policyDecision === 'blocked') return 8;  // High
    if (event.dataClassification === 'confidential') return 6;  // Medium
    return 4;  // Low
  }
}
```

**Compliance Dashboard:**

```typescript
// Server: Compliance report generation
class ComplianceDashboardService {
  async generateDataMovementReport(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DataMovementReport> {
    
    const events = await db.dataMovementEvents.find({
      tenantId,
      timestamp: { $gte: startDate, $lte: endDate }
    });

    return {
      period: { startDate, endDate },
      summary: {
        totalEvents: events.length,
        allowedEvents: events.filter(e => e.policyDecision === 'allowed').length,
        blockedEvents: events.filter(e => e.policyDecision === 'blocked').length,
        dataExported: events
          .filter(e => e.action === 'export')
          .reduce((sum, e) => sum + e.sizeBytes, 0)
      },
      byAction: this.groupBy(events, 'action'),
      byClassification: this.groupBy(events, 'dataClassification'),
      byUser: this.groupBy(events, 'userId'),
      violations: events.filter(e => e.policyDecision === 'blocked'),
      topExporters: this.getTopUsers(events, 'export', 10)
    };
  }

  private groupBy<T extends Record<string, unknown>>(
    items: T[],
    key: keyof T
  ): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getTopUsers(events: DataMovementEvent[], action: string, limit: number): Array<{
    userId: string;
    userName: string;
    count: number;
    totalBytes: number;
  }> {
    const userStats = events
      .filter(e => e.action === action)
      .reduce((acc, event) => {
        if (!acc[event.userId]) {
          acc[event.userId] = {
            userId: event.userId,
            userName: event.userName,
            count: 0,
            totalBytes: 0
          };
        }
        acc[event.userId].count++;
        acc[event.userId].totalBytes += event.sizeBytes;
        return acc;
      }, {} as Record<string, { userId: string; userName: string; count: number; totalBytes: number }>);

    return Object.values(userStats)
      .sort((a, b) => b.totalBytes - a.totalBytes)
      .slice(0, limit);
  }
}

interface DataMovementReport {
  period: { startDate: Date; endDate: Date };
  summary: {
    totalEvents: number;
    allowedEvents: number;
    blockedEvents: number;
    dataExported: number;
  };
  byAction: Record<string, number>;
  byClassification: Record<string, number>;
  byUser: Record<string, number>;
  violations: DataMovementEvent[];
  topExporters: Array<{
    userId: string;
    userName: string;
    count: number;
    totalBytes: number;
  }>;
}
```

## Key Takeaways

### Security Hierarchy for Local-First Enterprise Applications

```
┌──────────────────────────────────────────────────────────┐
│ Layer 1: Prevention (XSS Hardening)                      │
│ - Strict CSP with nonces                                 │
│ - Trusted Types API                                      │
│ - Subresource Integrity                                  │
│ - Supply chain security (lockfiles, SCA, SBOM)           │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ Layer 2: Protection (Encryption & Key Management)        │
│ - Web Crypto API (AES-GCM-256)                           │
│ - PBKDF2/HKDF key derivation                             │
│ - Key rotation and versioning                            │
│ - Non-extractable CryptoKey objects                      │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ Layer 3: Detection (Feature Detection & Graceful Deg.)   │
│ - Capability + viability checks                          │
│ - Progressive enhancement architecture                   │
│ - Fallback hierarchies (IndexedDB → Memory → Server)     │
│ - Enterprise communication patterns                      │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ Layer 4: Compliance (Data Retention & Subject Rights)    │
│ - Server-driven deletion contracts                       │
│ - Automatic retention enforcement                        │
│ - Classification-based policies                          │
│ - Cryptographic erasure for unreachable devices          │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ Layer 5: Policy Enforcement (Enterprise Controls)        │
│ - Embedded policy engines (PDP in browser)               │
│ - Signed policy bundles with remote updates              │
│ - Identity-based authorization (SAML/OIDC)               │
│ - Continuous monitoring and audit trails                 │
└──────────────────────────────────────────────────────────┘
```

### Critical Success Factors

1. **Never trust the browser environment alone**
   - Encrypt sensitive data at rest with AES-GCM
   - Derive keys from session tokens, not local storage
   - Clear keys on logout/session expiry

2. **Defense in depth is mandatory**
   - CSP + Trusted Types + SRI work together
   - Single layer failure doesn't compromise system
   - Regular security audits and penetration testing

3. **Corporate IT is your partner, not your enemy**
   - Detect restrictions, don't fight them
   - Provide graceful fallbacks
   - Document requirements clearly for IT teams
   - Offer tenant-level compatibility modes

4. **Compliance is not optional**
   - Treat IndexedDB as regulated storage under GDPR/SOC2
   - Implement server-driven deletion for Right to Erasure
   - Enforce retention policies automatically
   - Generate audit trails for compliance evidence

5. **Supply chain security is infrastructure**
   - Private registries with approval workflows
   - Continuous SCA scanning (npm audit, Snyk, socket.dev)
   - SBOM generation and indexing
   - Incident response integration

6. **Policy enforcement must work offline**
   - Embed policy engine in client
   - Signed policy bundles with local caching
   - Server-driven updates with real-time broadcast
   - Identity-based authorization from IdP claims

### Implementation Priority (MVP → Production)

**Phase 1: Security Foundations (MVP)**
- Strict CSP with nonces
- Web Crypto API encryption (AES-GCM)
- Basic key derivation (PBKDF2)
- Feature detection for IndexedDB

**Phase 2: Compliance (Beta)**
- Data retention policies
- Automatic cleanup service
- Server-driven deletion
- Audit logging (server-side)

**Phase 3: Enterprise Features (GA)**
- Trusted Types API
- Subresource Integrity
- Policy engine with signed bundles
- Corporate browser detection

**Phase 4: Advanced (Post-GA)**
- Key rotation automation
- On-premise log sinks
- Compliance dashboards
- Advanced policy conditions

### Recommended Tooling

| Category | Tools |
|----------|-------|
| CSP Management | csp-evaluator, report-uri.com |
| Encryption | Web Crypto API (native) |
| Key Derivation | PBKDF2 (native), HKDF (native) |
| Supply Chain | Snyk, socket.dev, npm audit |
| SBOM | CycloneDX, SPDX |
| Testing | OWASP ZAP, Burp Suite, Playwright |
| Monitoring | Sentry, PostHog, custom telemetry |
| Policy | OPA (Open Policy Agent) concepts |

## Related Research

For deeper dives into specific topics:

- **XSS Prevention**: OWASP XSS Prevention Cheat Sheet
- **Web Crypto API**: W3C Web Cryptography API Specification
- **Supply Chain**: SLSA Framework, OSSF Scorecard
- **GDPR Compliance**: GDPR Article 32 Technical Measures
- **SOC 2**: AICPA TSC (Trust Services Criteria)
- **Enterprise Browsers**: Chrome Enterprise, Edge for Business

## Next Steps

To implement these patterns in your application:

1. **Security Assessment**
   - Audit current XSS protections
   - Review data storage patterns
   - Identify sensitive data in browser storage

2. **Architecture Design**
   - Design encryption key lifecycle
   - Plan policy engine integration
   - Define data retention policies

3. **Implementation Roadmap**
   - Start with CSP + encryption (Phase 1)
   - Add compliance features (Phase 2)
   - Roll out enterprise controls (Phase 3)

4. **Testing & Validation**
   - Penetration testing
   - Compliance audits (SOC 2, GDPR)
   - Corporate browser testing

5. **Documentation**
   - Enterprise requirements page
   - IT administrator guides
   - Security architecture documentation

---

**Research Completed**: 2025-12-05
**Total Sources Consulted**: 36+ (Perplexity Chat API + Search API)
**Report Generated By**: perplexity-expert agent
