-- Migration: Create Payload Schema
-- Purpose: Ensure the payload schema exists for Payload CMS to use
-- This migration creates a fresh, empty payload schema that Payload CMS
-- will populate with its own migrations.
--
-- IMPORTANT: This migration uses DROP CASCADE which will remove ALL objects
-- in the payload schema. This is intentional for reset workflows but must
-- NOT run in production with existing data.

-- Production safety guard: prevent accidental drops in production
DO $$
BEGIN
  IF current_database() ~ '(production|prod)' THEN
    RAISE EXCEPTION 'Cannot drop payload schema in production database: %', current_database();
  END IF;
END $$;

-- Drop existing payload schema and all its objects (tables, functions, etc.)
-- This ensures a clean slate for Payload CMS migrations
DROP SCHEMA IF EXISTS payload CASCADE;

-- Create fresh payload schema
CREATE SCHEMA payload;
