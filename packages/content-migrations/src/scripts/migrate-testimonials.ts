/**
 * Script to migrate testimonials from local to remote Supabase database
 */
import { createClient } from '@supabase/supabase-js';

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables based on the NODE_ENV
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

console.log(`Loading environment variables from ${envFile}`);
dotenv.config({ path: path.resolve(__dirname, `../../${envFile}`) });

/**
 * Migrates testimonials from local to remote Supabase database
 */
async function migrateTestimonials() {
  console.log('Starting testimonials migration...');

  try {
    // Get environment variables
    const localSupabaseUrl =
      process.env.LOCAL_SUPABASE_URL || 'http://localhost:54321';
    const localSupabaseKey = process.env.LOCAL_SUPABASE_ANON_KEY || '';
    const remoteSupabaseUrl = process.env.REMOTE_SUPABASE_URL || '';
    const remoteSupabaseKey =
      process.env.REMOTE_SUPABASE_SERVICE_ROLE_KEY || '';

    if (!remoteSupabaseUrl || !remoteSupabaseKey) {
      throw new Error('Remote Supabase URL and service role key are required');
    }

    console.log(`Local Supabase URL: ${localSupabaseUrl}`);
    console.log(`Remote Supabase URL: ${remoteSupabaseUrl}`);

    // Create Supabase clients
    const localClient = createClient(localSupabaseUrl, localSupabaseKey);
    const remoteClient = createClient(remoteSupabaseUrl, remoteSupabaseKey);

    // Get testimonials from local database
    const { data: testimonials, error } = await localClient
      .from('testimonials')
      .select('*');

    if (error) {
      throw new Error(`Error fetching testimonials: ${error.message}`);
    }

    if (!testimonials || testimonials.length === 0) {
      console.log('No testimonials found in local database');
      return;
    }

    console.log(`Found ${testimonials.length} testimonials to migrate`);

    // Insert testimonials into remote database
    const { error: insertError } = await remoteClient
      .from('testimonials')
      .upsert(testimonials, {
        onConflict: 'id',
        ignoreDuplicates: false,
      });

    if (insertError) {
      throw new Error(`Error inserting testimonials: ${insertError.message}`);
    }

    console.log('Successfully migrated testimonials to remote database');
  } catch (error) {
    console.error('Error migrating testimonials:', error);
    process.exit(1);
  }
}

// Run the migration
migrateTestimonials().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
