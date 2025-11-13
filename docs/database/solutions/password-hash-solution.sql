-- Option 1: Pre-computed hash (same hash in both databases)
-- Generate once: SELECT crypt('aiesec1992', gen_salt('bf'));
-- Result: $2a$06$FIXED_SALT_HERE...
INSERT INTO auth.users (email, encrypted_password, ...) VALUES
  ('test1@slideheroes.com', '$2a$06$9fDjkhPa4NkTRc9QYxyTq.0dVUSMNkrd...', ...);

-- Option 2: Shared function with fixed salt (Better)
CREATE OR REPLACE FUNCTION test_user_password() RETURNS text AS $$
BEGIN
  -- Use a fixed salt for test users only
  RETURN crypt('aiesec1992', '$2a$06$FIXED_SALT_FOR_TESTS');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Then in seed files:
INSERT INTO auth.users (email, encrypted_password, ...) VALUES
  ('test1@slideheroes.com', test_user_password(), ...);

-- Option 3: Environment-based (Most Flexible)
-- Store the hash in environment variables
-- E2E_TEST_PASSWORD_HASH=$2a$06$...
-- Then use it in both seed files