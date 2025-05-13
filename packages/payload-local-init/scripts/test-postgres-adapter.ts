import { postgresAdapter } from '@payloadcms/db-postgres';

console.log('[TEST-ADAPTER] Starting test-postgres-adapter.ts');

try {
  console.log('[TEST-ADAPTER] About to initialize postgresAdapter...');
  const adapter = postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
    // Include schemaName as it seemed necessary for migrate
    schemaName: 'payload',
    // Keep other optional params commented for now
    // push: false,
    // idType: 'uuid',
  });
  console.log('[TEST-ADAPTER] postgresAdapter initialized successfully.');

  // We don't need to call adapter.connect() or anything further,
  // just testing the initialization phase when the module is loaded.

  console.log('[TEST-ADAPTER] Test script finished.');
  process.exit(0); // Explicitly exit on success
} catch (error: any) {
  console.error('[TEST-ADAPTER] Error during postgresAdapter initialization:', error.message, error.stack);
  process.exit(1); // Exit with error code on failure
}
