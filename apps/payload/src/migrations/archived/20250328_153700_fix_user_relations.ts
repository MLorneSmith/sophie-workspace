import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add foreign key constraints to payload_preferences_rels and payload_locked_documents_rels
    DO $$ 
    BEGIN
      -- Check if users_id column in payload_preferences_rels exists
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' AND table_name = 'payload_preferences_rels' AND column_name = 'users_id'
      ) THEN
        -- Add foreign key constraint if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.table_constraints 
          WHERE constraint_name = 'payload_preferences_rels_users_id_fkey'
        ) THEN
          ALTER TABLE payload.payload_preferences_rels 
          ADD CONSTRAINT payload_preferences_rels_users_id_fkey 
          FOREIGN KEY (users_id) REFERENCES payload.users(id) ON DELETE CASCADE;
        END IF;
      END IF;
      
      -- Check if users_id column in payload_locked_documents_rels exists
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' AND table_name = 'payload_locked_documents_rels' AND column_name = 'users_id'
      ) THEN
        -- Add foreign key constraint if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.table_constraints 
          WHERE constraint_name = 'payload_locked_documents_rels_users_id_fkey'
        ) THEN
          ALTER TABLE payload.payload_locked_documents_rels 
          ADD CONSTRAINT payload_locked_documents_rels_users_id_fkey 
          FOREIGN KEY (users_id) REFERENCES payload.users(id) ON DELETE CASCADE;
        END IF;
      END IF;
      
      -- Check if user column in payload_preferences exists
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' AND table_name = 'payload_preferences' AND column_name = 'user'
      ) THEN
        -- Add foreign key constraint if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.table_constraints 
          WHERE constraint_name = 'payload_preferences_user_fkey'
        ) THEN
          ALTER TABLE payload.payload_preferences 
          ADD CONSTRAINT payload_preferences_user_fkey 
          FOREIGN KEY ("user") REFERENCES payload.users(id) ON DELETE CASCADE;
        END IF;
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove foreign key constraints
    DO $$ 
    BEGIN
      -- Check if constraint exists before dropping
      IF EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'payload_preferences_rels_users_id_fkey'
      ) THEN
        ALTER TABLE payload.payload_preferences_rels 
        DROP CONSTRAINT payload_preferences_rels_users_id_fkey;
      END IF;
      
      -- Check if constraint exists before dropping
      IF EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'payload_locked_documents_rels_users_id_fkey'
      ) THEN
        ALTER TABLE payload.payload_locked_documents_rels 
        DROP CONSTRAINT payload_locked_documents_rels_users_id_fkey;
      END IF;
      
      -- Check if constraint exists before dropping
      IF EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'payload_preferences_user_fkey'
      ) THEN
        ALTER TABLE payload.payload_preferences 
        DROP CONSTRAINT payload_preferences_user_fkey;
      END IF;
    END $$;
  `)
}
