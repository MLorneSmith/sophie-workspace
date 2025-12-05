# Context7 Research: RxDB Local-First Database Integration

**Date**: 2025-12-05
**Agent**: context7-expert
**Libraries Researched**: pubkey/rxdb (latest version)

## Query Summary

Retrieved comprehensive documentation for RxDB focusing on:
1. Supabase replication setup and configuration
2. React hooks integration (rxdb-hooks library)
3. Encryption plugin configuration and usage
4. Conflict resolution strategies and custom handlers
5. Schema design patterns for local-first applications

## Key Findings Summary

### Supabase Replication
- Native integration with `rxdb/plugins/replication-supabase`
- Requires `_deleted` and `_modified` columns on Supabase tables
- Bidirectional real-time sync with customizable batch sizes
- Pull modifiers allow data transformation before storage
- Must add tables to `supabase_realtime` publication

### React Integration
- Use `rxdb-hooks` for automatic reactivity
- `useRxCollection` + `useRxQuery` pattern is recommended
- Built-in pagination with `fetchMore` and `isExhausted`
- Manual RxJS Observable subscriptions for advanced cases

### Encryption
- Two options: crypto-js (open) or web-crypto (premium)
- Field-level encryption with `encrypted: ['field']`
- Web Crypto API is faster and more secure (AES-CTR/CBC/GCM)
- Cannot query encrypted fields - only non-encrypted fields

### Conflict Resolution
- Default handler: master state always wins
- Custom handlers support async resolution (UI prompts)
- Performance tip: Compare timestamps instead of deep equality
- `incrementalUpsert` prevents concurrent modification errors

### Schema Design
- Primary key must have `maxLength` defined
- `keyCompression: true` reduces storage by ~30%
- `final: true` for immutable fields after insert
