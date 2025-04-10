
      SELECT EXISTS (
        SELECT FROM pg_proc
        WHERE pronamespace = 'payload'::regnamespace
        AND proname = 'scan_and_fix_uuid_tables'
      ) as exists;
    