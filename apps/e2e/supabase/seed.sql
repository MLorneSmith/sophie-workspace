-- Seed file for E2E test data
-- This file creates necessary test users for E2E tests

-- Create admin user for admin tests
-- Email: michael@slideheroes.com
-- Password: aiesec1992
-- MFA Key: NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE

DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Check if user already exists
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'michael@slideheroes.com';
    
    IF admin_user_id IS NULL THEN
        -- Create admin user in auth.users
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            instance_id,
            aud,
            role,
            raw_app_meta_data,
            raw_user_meta_data
        ) VALUES (
            gen_random_uuid(),
            'michael@slideheroes.com',
            crypt('aiesec1992', gen_salt('bf')),
            now(),
            now(),
            now(),
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            jsonb_build_object(
                'provider', 'email',
                'providers', array['email'],
                'role', 'super-admin'
            ),
            jsonb_build_object(
                'name', 'Michael Admin',
                'email', 'michael@slideheroes.com'
            )
        ) RETURNING id INTO admin_user_id;
        
        -- Create MFA factor for admin user
        INSERT INTO auth.mfa_factors (
            id,
            user_id,
            factor_type,
            status,
            created_at,
            updated_at,
            secret
        ) VALUES (
            gen_random_uuid(),
            admin_user_id,
            'totp',
            'verified',
            now(),
            now(),
            'NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE'
        );
        
        RAISE NOTICE 'Admin user created: michael@slideheroes.com';
    ELSE
        RAISE NOTICE 'Admin user already exists: michael@slideheroes.com';
    END IF;
END $$;