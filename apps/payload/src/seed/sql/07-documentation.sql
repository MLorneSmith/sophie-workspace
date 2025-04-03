-- Seed data for the documentation table
-- This file should be run after the migrations to ensure the documentation table exists

-- Start a transaction
BEGIN;

-- Function to convert Markdown content to Lexical JSON
CREATE OR REPLACE FUNCTION markdown_to_lexical(text_content TEXT) RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'root', jsonb_build_object(
      'children', jsonb_build_array(
        jsonb_build_object(
          'children', jsonb_build_array(
            jsonb_build_object(
              'detail', 0,
              'format', 0,
              'mode', 'normal',
              'style', '',
              'text', text_content,
              'type', 'text',
              'version', 1
            )
          ),
          'direction', 'ltr',
          'format', '',
          'indent', 0,
          'type', 'paragraph',
          'version', 1
        )
      ),
      'direction', 'ltr',
      'format', '',
      'indent', 0,
      'type', 'root',
      'version', 1
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Insert documentation entries from existing .mdoc files
INSERT INTO payload.documentation (
  id,
  title,
  slug,
  description,
  content,
  status,
  updated_at,
  created_at
) VALUES
(gen_random_uuid(), 'How much does SlideHeroes cost?', 'how-much-does-slideheroes-cost', 
 'What are your prices?', 
 markdown_to_lexical('See our pricing page for more information, and find a plan that works for you.'), 
 'published', NOW(), NOW()),
(gen_random_uuid(), 'Difference Between Pro and Teams', 'difference-between-pro-and-teams', 
 'Understanding the differences between our Pro and Teams plans', 
 markdown_to_lexical('This document explains the key differences between our Pro and Teams subscription plans.'), 
 'published', NOW(), NOW()),
(gen_random_uuid(), 'Just Promote Informally', 'just-promote-informally', 
 'Information about informal promotions', 
 markdown_to_lexical('This document provides guidance on informal promotion processes.'), 
 'published', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING; -- Skip if the documentation already exists

-- Add parent documentation entries for subdirectories
DO $$
DECLARE
  product_id UUID;
  security_id UUID;
  billing_id UUID;
BEGIN
  -- Insert parent documents
  INSERT INTO payload.documentation (
    id,
    title,
    slug,
    description,
    content,
    status,
    updated_at,
    created_at
  ) VALUES
  (
    'c4f14964-e4b6-4ea4-9e5c-4508d1da6143', -- Fixed UUID for Our Product
    'Our Product',
    'our-product',
    'Information about our product',
    markdown_to_lexical('This section contains information about our product.'),
    'published',
    NOW(),
    NOW()
  ),
  (
    'c5f14964-e4b6-4ea4-9e5c-4508d1da6143', -- Fixed UUID for Data Security
    'Data Security and Privacy',
    'data-security-and-privacy',
    'Information about data security and privacy',
    markdown_to_lexical('This section contains information about our data security and privacy practices.'),
    'published',
    NOW(),
    NOW()
  ),
  (
    'c6f14964-e4b6-4ea4-9e5c-4508d1da6143', -- Fixed UUID for Billing
    'Billing',
    'billing',
    'Information about billing',
    markdown_to_lexical('This section contains information about billing.'),
    'published',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    content = EXCLUDED.content,
    status = EXCLUDED.status,
    updated_at = NOW();
  
  -- Store the parent IDs
  product_id := 'c4f14964-e4b6-4ea4-9e5c-4508d1da6143';
  security_id := 'c5f14964-e4b6-4ea4-9e5c-4508d1da6143';
  billing_id := 'c6f14964-e4b6-4ea4-9e5c-4508d1da6143';
  
  -- Insert child documents with parent references
  INSERT INTO payload.documentation (
    id,
    title,
    slug,
    description,
    content,
    parent_id,
    status,
    updated_at,
    created_at
  ) VALUES
  (
    'c7f14964-e4b6-4ea4-9e5c-4508d1da6143',
    'Features',
    'features',
    'Information about product features',
    markdown_to_lexical('This section contains information about our product features.'),
    product_id,
    'published',
    NOW(),
    NOW()
  ),
  (
    'c8f14964-e4b6-4ea4-9e5c-4508d1da6143',
    'Roadmap',
    'roadmap',
    'Information about our product roadmap',
    markdown_to_lexical('This section contains information about our product roadmap.'),
    product_id,
    'published',
    NOW(),
    NOW()
  ),
  (
    'c9f14964-e4b6-4ea4-9e5c-4508d1da6143',
    'Privacy Policy',
    'privacy-policy',
    'Our privacy policy',
    markdown_to_lexical('This section contains our privacy policy.'),
    security_id,
    'published',
    NOW(),
    NOW()
  ),
  (
    'd0f14964-e4b6-4ea4-9e5c-4508d1da6143',
    'Purchases and Invoicing',
    'purchases-invoicing',
    'Information about purchases and invoicing',
    markdown_to_lexical('This section contains information about purchases and invoicing.'),
    billing_id,
    'published',
    NOW(),
    NOW()
  ),
  (
    'd1f14964-e4b6-4ea4-9e5c-4508d1da6143',
    'Refunds',
    'refunds',
    'Information about refunds',
    markdown_to_lexical('This section contains information about our refund policy.'),
    billing_id,
    'published',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    content = EXCLUDED.content,
    parent_id = EXCLUDED.parent_id,
    status = EXCLUDED.status,
    updated_at = NOW();
  
  -- Add standalone documents
  INSERT INTO payload.documentation (
    id,
    title,
    slug,
    description,
    content,
    status,
    updated_at,
    created_at
  ) VALUES
  (
    'd2f14964-e4b6-4ea4-9e5c-4508d1da6143',
    'Technical Support',
    'technical-support',
    'Information about technical support',
    markdown_to_lexical('This section contains information about our technical support services.'),
    'published',
    NOW(),
    NOW()
  ),
  (
    'd3f14964-e4b6-4ea4-9e5c-4508d1da6143',
    'Affiliates',
    'affiliates',
    'Information about our affiliate program',
    markdown_to_lexical('This section contains information about our affiliate program.'),
    'published',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    content = EXCLUDED.content,
    status = EXCLUDED.status,
    updated_at = NOW();
END;
$$;

-- Drop the temporary function
DROP FUNCTION markdown_to_lexical;

-- Commit the transaction
COMMIT;
