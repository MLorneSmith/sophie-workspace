/**
 * Verifies consistency of data types for downloads-related columns
 */
import { createClient } from '@supabase/supabase-js';

import { config } from 'dotenv';

// Initialize environment variables from .env file
config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface ColumnInfo {
  table_name: string;
  column_name: string;
  current_type: string;
  expected_type: string;
  is_consistent: boolean;
}

export async function verifyDownloadsDataTypes(): Promise<void> {
  // Create supabase client using service role key for direct database access
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  console.log(
    'Verifying data type consistency for downloads-related columns...',
  );

  // Check column types directly from information schema
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('table_name, column_name, data_type')
    .eq('table_schema', 'payload')
    .or('column_name.eq.downloads_id,column_name.eq._parent_id')
    .in('table_name', [
      'downloads',
      'downloads_rels',
      'documentation__downloads',
      'posts__downloads',
      'surveys__downloads',
      'survey_questions__downloads',
      'courses__downloads',
      'course_lessons__downloads',
      'course_quizzes__downloads',
      'quiz_questions__downloads',
    ]);

  if (error) {
    console.error('Error verifying column types:', error);
    return;
  }

  // Process results
  const columnInfo = data.map((col) => ({
    table_name: col.table_name,
    column_name: col.column_name,
    current_type: col.data_type,
    expected_type: 'uuid',
    is_consistent: col.data_type === 'uuid',
  })) as ColumnInfo[];

  const inconsistentColumns = columnInfo.filter((col) => !col.is_consistent);

  if (inconsistentColumns.length === 0) {
    console.log(
      '✅ All downloads-related columns have consistent types (UUID)',
    );
  } else {
    console.error(
      `❌ Found ${inconsistentColumns.length} column type inconsistencies:`,
    );

    inconsistentColumns.forEach((col) => {
      console.error(
        `   Table: ${col.table_name}, Column: ${col.column_name}, ` +
          `Type: ${col.current_type} (expected: ${col.expected_type})`,
      );
    });

    console.log(
      'Run the 20250412_100000_fix_downloads_uuid_type_consistency migration to fix these issues',
    );
  }

  // Also check for temporary UUID tables (more complex)
  console.log('\nChecking temporary UUID tables...');
  const { data: tempTables, error: tempTablesError } = await supabase
    .from('pg_tables')
    .select('tablename')
    .eq('schemaname', 'payload')
    .ilike('tablename', '%______%')
    .filter(
      'tablename',
      'regexp',
      '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$',
    );

  if (tempTablesError) {
    console.error('Error checking temporary UUID tables:', tempTablesError);
    return;
  }

  if (tempTables && tempTables.length > 0) {
    console.log(
      `Found ${tempTables.length} temporary UUID tables. Checking column types...`,
    );

    for (const table of tempTables) {
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_schema', 'payload')
        .eq('table_name', table.tablename)
        .eq('column_name', 'downloads_id');

      if (columnsError) {
        console.error(
          `Error checking columns for ${table.tablename}:`,
          columnsError,
        );
        continue;
      }

      if (columns.length === 0) {
        console.error(
          `❌ Table ${table.tablename} is missing downloads_id column`,
        );
      } else if (columns[0].data_type !== 'uuid') {
        console.error(
          `❌ Table ${table.tablename} has downloads_id column with type ${columns[0].data_type} (expected: uuid)`,
        );
      } else {
        console.log(
          `✅ Table ${table.tablename} has correctly typed downloads_id column`,
        );
      }
    }
  } else {
    console.log('No temporary UUID tables found');
  }
}

// Run the verification if executed directly
if (require.main === module) {
  verifyDownloadsDataTypes()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Verification failed:', err);
      process.exit(1);
    });
}
