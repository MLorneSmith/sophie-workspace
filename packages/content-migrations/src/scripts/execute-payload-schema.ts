import { createClient } from '@supabase/supabase-js';

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables from .env.development
config({ path: resolve(process.cwd(), '.env.development') });

async function executePayloadSchema() {
  // Get the Supabase URL and key from the environment variables
  const supabaseUrl = process.env.LOCAL_SUPABASE_URL;
  const supabaseKey = process.env.LOCAL_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      'LOCAL_SUPABASE_URL or LOCAL_SUPABASE_ANON_KEY environment variables are not set',
    );
    process.exit(1);
  }

  console.log('Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Read the SQL script
    const sqlPath = resolve(
      process.cwd(),
      '../../apps/payload/src/create-payload-schema.sql',
    );
    const sql = readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL script...');
    const { error } = await supabase.rpc('pgexec', { sql });

    if (error) {
      console.error('Error executing SQL script:', error);
    } else {
      console.log('SQL script executed successfully');
    }
  } catch (error) {
    console.error('Error executing SQL script:', error);
  }
}

executePayloadSchema().catch(console.error);
