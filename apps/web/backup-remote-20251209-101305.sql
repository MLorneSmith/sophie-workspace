


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE SCHEMA IF NOT EXISTS "kit";


ALTER SCHEMA "kit" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE SCHEMA IF NOT EXISTS "payload";


ALTER SCHEMA "payload" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA "kit";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_permissions" AS ENUM (
    'roles.manage',
    'billing.manage',
    'settings.manage',
    'members.manage',
    'invites.manage'
);


ALTER TYPE "public"."app_permissions" OWNER TO "postgres";


CREATE TYPE "public"."billing_provider" AS ENUM (
    'stripe',
    'lemon-squeezy',
    'paddle'
);


ALTER TYPE "public"."billing_provider" OWNER TO "postgres";


CREATE TYPE "public"."invitation" AS (
	"email" "text",
	"role" character varying(50)
);


ALTER TYPE "public"."invitation" OWNER TO "postgres";


CREATE TYPE "public"."notification_channel" AS ENUM (
    'in_app',
    'email'
);


ALTER TYPE "public"."notification_channel" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'info',
    'warning',
    'error'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'succeeded',
    'failed'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."subscription_item_type" AS ENUM (
    'flat',
    'per_seat',
    'metered'
);


ALTER TYPE "public"."subscription_item_type" OWNER TO "postgres";


CREATE TYPE "public"."subscription_status" AS ENUM (
    'active',
    'trialing',
    'past_due',
    'canceled',
    'unpaid',
    'incomplete',
    'incomplete_expired',
    'paused'
);


ALTER TYPE "public"."subscription_status" OWNER TO "postgres";


CREATE TYPE "public"."task_priority" AS ENUM (
    'low',
    'medium',
    'high'
);


ALTER TYPE "public"."task_priority" OWNER TO "postgres";


CREATE TYPE "public"."task_status" AS ENUM (
    'do',
    'doing',
    'done'
);


ALTER TYPE "public"."task_status" OWNER TO "postgres";


CREATE TYPE "public"."testimonial_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE "public"."testimonial_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "kit"."add_current_user_to_new_account"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    if new.primary_owner_user_id = auth.uid() then
        insert into public.accounts_memberships(
            account_id,
            user_id,
            account_role)
        values(
            new.id,
            auth.uid(),
            public.get_upper_system_role());

    end if;

    return NEW;

end;

$$;


ALTER FUNCTION "kit"."add_current_user_to_new_account"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "kit"."check_team_account"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    if(
        select
            is_personal_account
        from
            public.accounts
        where
            id = new.account_id) then
        raise exception 'Account must be an team account';

    end if;

    return NEW;

end;

$$;


ALTER FUNCTION "kit"."check_team_account"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "kit"."cleanup_expired_nonces"("p_older_than_days" integer DEFAULT 1, "p_include_used" boolean DEFAULT true, "p_include_revoked" boolean DEFAULT true) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count and delete expired or used nonces based on parameters
  WITH deleted AS (
    DELETE FROM public.nonces
    WHERE
      (
        -- Expired and unused tokens
        (expires_at < NOW() AND used_at IS NULL)

        -- Used tokens older than specified days (if enabled)
        OR (p_include_used = TRUE AND used_at < NOW() - (p_older_than_days * interval '1 day'))

        -- Revoked tokens older than specified days (if enabled)
        OR (p_include_revoked = TRUE AND revoked = TRUE AND created_at < NOW() - (p_older_than_days * interval '1 day'))
      )
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM deleted;

  RETURN v_count;
END;
$$;


ALTER FUNCTION "kit"."cleanup_expired_nonces"("p_older_than_days" integer, "p_include_used" boolean, "p_include_revoked" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "kit"."cleanup_expired_nonces"("p_older_than_days" integer, "p_include_used" boolean, "p_include_revoked" boolean) IS 'Cleans up expired, used, or revoked tokens based on parameters';



CREATE OR REPLACE FUNCTION "kit"."get_storage_filename_as_uuid"("name" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    return replace(storage.filename(name), concat('.',
	storage.extension(name)), '')::uuid;

end;

$$;


ALTER FUNCTION "kit"."get_storage_filename_as_uuid"("name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "kit"."handle_update_user_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    update
        public.accounts
    set
        email = new.email
    where
        primary_owner_user_id = new.id
        and is_personal_account = true;

    return new;

end;

$$;


ALTER FUNCTION "kit"."handle_update_user_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "kit"."prevent_account_owner_membership_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    if exists(
        select
            1
        from
            public.accounts
        where
            id = old.account_id
            and primary_owner_user_id = old.user_id) then
    raise exception 'The primary account owner cannot be removed from the account membership list';

end if;

    return old;

end;

$$;


ALTER FUNCTION "kit"."prevent_account_owner_membership_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "kit"."prevent_memberships_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    if new.account_role <> old.account_role then
        return new;
    end if;

    raise exception 'Only the account_role can be updated';

end; $$;


ALTER FUNCTION "kit"."prevent_memberships_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "kit"."protect_account_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    if current_user in('authenticated', 'anon') then
	if new.id <> old.id or new.is_personal_account <>
	    old.is_personal_account or new.primary_owner_user_id <>
	    old.primary_owner_user_id or new.email <> old.email then
            raise exception 'You do not have permission to update this field';

        end if;

    end if;

    return NEW;

end
$$;


ALTER FUNCTION "kit"."protect_account_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "kit"."set_slug_from_account_name"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    sql_string varchar;
    tmp_slug varchar;
    increment integer;
    tmp_row record;
    tmp_row_count integer;
begin
    tmp_row_count = 1;

    increment = 0;

    while tmp_row_count > 0 loop
        if increment > 0 then
            tmp_slug = kit.slugify(new.name || ' ' || increment::varchar);

        else
            tmp_slug = kit.slugify(new.name);

        end if;

	sql_string = format('select count(1) cnt from public.accounts where slug = ''' || tmp_slug ||
	    '''; ');

        for tmp_row in execute (sql_string)
            loop
                raise notice 'tmp_row %', tmp_row;

                tmp_row_count = tmp_row.cnt;

            end loop;

        increment = increment +1;

    end loop;

    new.slug := tmp_slug;

    return NEW;

end
$$;


ALTER FUNCTION "kit"."set_slug_from_account_name"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "kit"."setup_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    user_name text;
    picture_url text;
begin
    if new.raw_user_meta_data ->> 'name' is not null then
        user_name := new.raw_user_meta_data ->> 'name';

    end if;

    if user_name is null and new.email is not null then
        user_name := split_part(new.email, '@', 1);

    end if;

    if user_name is null then
        user_name := '';

    end if;

    if new.raw_user_meta_data ->> 'avatar_url' is not null then
        picture_url := new.raw_user_meta_data ->> 'avatar_url';
    else
        picture_url := null;
    end if;

    insert into public.accounts(
        id,
        primary_owner_user_id,
        name,
        is_personal_account,
        picture_url,
        email)
    values (
        new.id,
        new.id,
        user_name,
        true,
        picture_url,
        new.email);

    return new;

end;

$$;


ALTER FUNCTION "kit"."setup_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "kit"."slugify"("value" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE STRICT
    SET "search_path" TO ''
    AS $_$
    -- removes accents (diacritic signs) from a given string --
    with "unaccented" as(
        select
            kit.unaccent("value") as "value"
),
"lowercase" as(
    select
        lower("value") as "value"
    from
        "unaccented"
),
"removed_quotes" as(
    select
	regexp_replace("value", '[''"]+', '',
	    'gi') as "value"
    from
        "lowercase"
),
"hyphenated" as(
    select
	regexp_replace("value", '[^a-z0-9\\-_]+', '-',
	    'gi') as "value"
    from
        "removed_quotes"
),
"trimmed" as(
    select
	regexp_replace(regexp_replace("value", '\-+$',
	    ''), '^\-', '') as "value" from "hyphenated"
)
        select
            "value"
        from
            "trimmed";
$_$;


ALTER FUNCTION "kit"."slugify"("value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "kit"."update_notification_dismissed_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    old.dismissed := new.dismissed;

    if (new is distinct from old) then
         raise exception 'UPDATE of columns other than "dismissed" is forbidden';
    end if;

    return old;
end;
$$;


ALTER FUNCTION "kit"."update_notification_dismissed_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "payload"."collection_has_download"("collection_id" "text", "collection_type" "text", "download_id" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $_$
DECLARE
    has_download boolean;
    table_name text;
    query text;
BEGIN
    -- Sanitize the collection_type to prevent SQL injection
    table_name := format('%I', collection_type);
    
    -- Check if the table has a downloads_id column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = collection_type 
        AND column_name = 'downloads_id'
    ) THEN
        RETURN false;
    END IF;
    
    -- Build and execute the query
    query := format('SELECT EXISTS(SELECT 1 FROM payload.%I WHERE id = $1 AND downloads_id = $2)', collection_type);
    EXECUTE query INTO has_download USING collection_id, download_id;
    
    RETURN has_download;
EXCEPTION
    WHEN OTHERS THEN
        -- Return false on any error
        RETURN false;
END;
$_$;


ALTER FUNCTION "payload"."collection_has_download"("collection_id" "text", "collection_type" "text", "download_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "payload"."collection_has_download"("collection_id" "text", "collection_type" "text", "download_id" "text") IS 'Check collection download with fixed search_path for security';



CREATE OR REPLACE FUNCTION "payload"."ensure_downloads_id_column"("table_name" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS downloads_id character varying', table_name);
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors, column might already exist
        NULL;
END;
$$;


ALTER FUNCTION "payload"."ensure_downloads_id_column"("table_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "payload"."ensure_downloads_id_column"("table_name" "text") IS 'Ensure downloads_id column with fixed search_path for security';



CREATE OR REPLACE FUNCTION "payload"."ensure_downloads_id_column_exists"("table_name" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
    column_exists boolean;
    schema_name text := 'payload';
BEGIN
    -- Check if downloads_id column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = schema_name
        AND information_schema.columns.table_name = ensure_downloads_id_column_exists.table_name 
        AND column_name = 'downloads_id'
    ) INTO column_exists;
    
    -- If column doesn't exist, add it
    IF NOT column_exists THEN
        BEGIN
            EXECUTE format('ALTER TABLE %I.%I ADD COLUMN downloads_id UUID', schema_name, table_name);
            RETURN TRUE;
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors (e.g., if table doesn't exist or we don't have permissions)
            RETURN FALSE;
        END;
    END IF;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "payload"."ensure_downloads_id_column_exists"("table_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "payload"."ensure_downloads_id_column_exists"("table_name" "text") IS 'Ensure downloads_id column exists with fixed search_path for security';



CREATE OR REPLACE FUNCTION "payload"."ensure_relationship_columns"("table_name" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    -- Add relationship columns if they don't exist
    EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS downloads_id character varying', table_name);
    EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS pricing_options_id character varying', table_name);
    EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS call_to_action_id character varying', table_name);
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors gracefully
        NULL;
END;
$$;


ALTER FUNCTION "payload"."ensure_relationship_columns"("table_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "payload"."ensure_relationship_columns"("table_name" "text") IS 'Ensure relationship columns with fixed search_path for security';



CREATE OR REPLACE FUNCTION "payload"."fix_dynamic_table"("table_name" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    -- Add the path column to the dynamic table
    EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS path character varying', table_name);
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- Handle errors gracefully
        RAISE NOTICE 'Error adding path column to %: %', table_name, SQLERRM;
        RETURN FALSE;
END;
$$;


ALTER FUNCTION "payload"."fix_dynamic_table"("table_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "payload"."fix_dynamic_table"("table_name" "text") IS 'Fix dynamic table with fixed search_path for security';



CREATE OR REPLACE FUNCTION "payload"."get_downloads_for_collection"("collection_id" "text", "collection_type" "text") RETURNS TABLE("download_id" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $_$
BEGIN
    RETURN QUERY
    EXECUTE format('SELECT downloads_id::text FROM payload.%I WHERE id = $1 AND downloads_id IS NOT NULL', collection_type)
    USING collection_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Return empty result on error
        RETURN;
END;
$_$;


ALTER FUNCTION "payload"."get_downloads_for_collection"("collection_id" "text", "collection_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "payload"."get_downloads_for_collection"("collection_id" "text", "collection_type" "text") IS 'Get downloads for collection with fixed search_path for security';



CREATE OR REPLACE FUNCTION "payload"."get_relationship_data"("table_name" "text", "id" "text", "fallback_column" "text" DEFAULT 'path'::"text") RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $_$
DECLARE
    result json;
    query text;
    column_list text;
BEGIN
    -- Get list of columns for the table
    SELECT string_agg(quote_ident(column_name), ', ') INTO column_list
    FROM information_schema.columns
    WHERE table_schema = 'payload' 
    AND information_schema.columns.table_name = get_relationship_data.table_name;
    
    -- If no columns found, return null
    IF column_list IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Build and execute query
    query := format('SELECT row_to_json(t) FROM (SELECT %s FROM payload.%I WHERE id = $1) t', column_list, table_name);
    EXECUTE query INTO result USING id;
    
    RETURN result::text;
EXCEPTION
    WHEN undefined_table THEN
        -- Table doesn't exist, try with fallback
        BEGIN
            query := format('SELECT row_to_json(t) FROM (SELECT * FROM payload.%I WHERE %I = $1) t', table_name, fallback_column);
            EXECUTE query INTO result USING id;
            RETURN result::text;
        EXCEPTION
            WHEN OTHERS THEN
                -- Return empty object on any error
                RETURN '{}'::text;
        END;
    WHEN OTHERS THEN
        -- Return empty object on any other error
        RETURN '{}'::text;
END;
$_$;


ALTER FUNCTION "payload"."get_relationship_data"("table_name" "text", "id" "text", "fallback_column" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "payload"."get_relationship_data"("table_name" "text", "id" "text", "fallback_column" "text") IS 'Get relationship data with fixed search_path for security';



CREATE OR REPLACE FUNCTION "payload"."safe_uuid_conversion"("text_value" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    RETURN text_value::uuid;
EXCEPTION
    WHEN invalid_text_representation THEN
        RETURN NULL;
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;


ALTER FUNCTION "payload"."safe_uuid_conversion"("text_value" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "payload"."safe_uuid_conversion"("text_value" "text") IS 'Safe UUID conversion with fixed search_path for security';



CREATE OR REPLACE FUNCTION "public"."accept_invitation"("token" "text", "user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
    target_account_id uuid;
    target_role varchar(50);
begin
    select
        account_id,
        role into target_account_id,
        target_role
    from
        public.invitations
    where
        invite_token = token
        and expires_at > now();

    if not found then
        raise exception 'Invalid or expired invitation token';
    end if;

    insert into public.accounts_memberships(
        user_id,
        account_id,
        account_role)
    values (
        accept_invitation.user_id,
        target_account_id,
        target_role);

    delete from public.invitations
    where invite_token = token;

    return target_account_id;
end;

$$;


ALTER FUNCTION "public"."accept_invitation"("token" "text", "user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_default_ai_allocations_for_existing_users"() RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
  v_count INTEGER := 0;
  v_user RECORD;
BEGIN
  FOR v_user IN
    SELECT id FROM auth.users
    WHERE id NOT IN (SELECT user_id FROM public.ai_usage_allocations WHERE user_id IS NOT NULL)
  LOOP
    INSERT INTO public.ai_usage_allocations (
      user_id,
      credits_allocated,
      allocation_type,
      reset_frequency
    ) VALUES (
      v_user.id,
      100, -- Default free credits
      'free',
      'monthly'
    );
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."add_default_ai_allocations_for_existing_users"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."add_default_ai_allocations_for_existing_users"() IS 'Add default allocations for existing users with fixed search_path for security';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."invitations" (
    "id" integer NOT NULL,
    "email" character varying(255) NOT NULL,
    "account_id" "uuid" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "role" character varying(50) NOT NULL,
    "invite_token" character varying(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expires_at" timestamp with time zone DEFAULT (CURRENT_TIMESTAMP + '7 days'::interval) NOT NULL
);


ALTER TABLE "public"."invitations" OWNER TO "postgres";


COMMENT ON TABLE "public"."invitations" IS 'The invitations for an account';



COMMENT ON COLUMN "public"."invitations"."email" IS 'The email of the user being invited';



COMMENT ON COLUMN "public"."invitations"."account_id" IS 'The account the invitation is for';



COMMENT ON COLUMN "public"."invitations"."invited_by" IS 'The user who invited the user';



COMMENT ON COLUMN "public"."invitations"."role" IS 'The role for the invitation';



COMMENT ON COLUMN "public"."invitations"."invite_token" IS 'The token for the invitation';



COMMENT ON COLUMN "public"."invitations"."expires_at" IS 'The expiry date for the invitation';



CREATE OR REPLACE FUNCTION "public"."add_invitations_to_account"("account_slug" "text", "invitations" "public"."invitation"[]) RETURNS "public"."invitations"[]
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
    new_invitation public.invitations;
    all_invitations public.invitations[] := array[]::public.invitations[];
    invite_token text;
    email text;
    role varchar(50);
begin
    FOREACH email,
    role in array invitations loop
        invite_token := extensions.uuid_generate_v4();

        insert into public.invitations(
            email,
            account_id,
            invited_by,
            role,
            invite_token)
        values (
            email,
(
                select
                    id
                from
                    public.accounts
                where
                    slug = account_slug), auth.uid(), role, invite_token)
    returning
        * into new_invitation;

        all_invitations := array_append(all_invitations, new_invitation);

    end loop;

    return all_invitations;

end;

$$;


ALTER FUNCTION "public"."add_invitations_to_account"("account_slug" "text", "invitations" "public"."invitation"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_ai_cost"("p_provider" "text", "p_model" "text", "p_prompt_tokens" integer, "p_completion_tokens" integer) RETURNS numeric
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
  v_input_cost DECIMAL;
  v_output_cost DECIMAL;
  v_markup DECIMAL;
  v_total_cost DECIMAL;
BEGIN
  -- Get cost configuration
  SELECT
    input_cost_per_1k_tokens,
    output_cost_per_1k_tokens,
    markup_percentage
  INTO
    v_input_cost,
    v_output_cost,
    v_markup
  FROM public.ai_cost_configuration
  WHERE provider = p_provider
    AND model = p_model
    AND is_active = true
    AND (effective_to IS NULL OR effective_to > NOW())
  ORDER BY effective_from DESC
  LIMIT 1;

  -- If no configuration found, return 0
  IF v_input_cost IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate base cost
  v_total_cost := (p_prompt_tokens / 1000.0 * v_input_cost) +
                 (p_completion_tokens / 1000.0 * v_output_cost);

  -- Apply markup
  RETURN v_total_cost * (1 + v_markup / 100.0);
END;
$$;


ALTER FUNCTION "public"."calculate_ai_cost"("p_provider" "text", "p_model" "text", "p_prompt_tokens" integer, "p_completion_tokens" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_ai_cost"("p_provider" "text", "p_model" "text", "p_prompt_tokens" integer, "p_completion_tokens" integer) IS 'Calculate AI cost with fixed search_path for security';



CREATE OR REPLACE FUNCTION "public"."can_action_account_member"("target_team_account_id" "uuid", "target_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
    permission_granted boolean;
    target_user_hierarchy_level int;
    current_user_hierarchy_level int;
    is_account_owner boolean;
    target_user_role varchar(50);
begin
    if target_user_id = auth.uid() then
      raise exception 'You cannot update your own account membership with this function';
    end if;

    -- an account owner can action any member of the account
    if public.is_account_owner(target_team_account_id) then
      return true;
    end if;

     -- check the target user is the primary owner of the account
    select
        exists (
            select
                1
            from
                public.accounts
            where
                id = target_team_account_id
                and primary_owner_user_id = target_user_id) into is_account_owner;

    if is_account_owner then
        raise exception 'The primary account owner cannot be actioned';
    end if;

    -- validate the auth user has the required permission on the account
    -- to manage members of the account
    select
 public.has_permission(auth.uid(), target_team_account_id,
     'members.manage'::public.app_permissions) into
     permission_granted;

    -- if the user does not have the required permission, raise an exception
    if not permission_granted then
      raise exception 'You do not have permission to action a member from this account';
    end if;

    -- get the role of the target user
    select
        am.account_role,
        r.hierarchy_level
    from
        public.accounts_memberships as am
    join
        public.roles as r on am.account_role = r.name
    where
        am.account_id = target_team_account_id
        and am.user_id = target_user_id
    into target_user_role, target_user_hierarchy_level;

    -- get the hierarchy level of the current user
    select
        r.hierarchy_level into current_user_hierarchy_level
    from
        public.roles as r
    join
        public.accounts_memberships as am on r.name = am.account_role
    where
        am.account_id = target_team_account_id
        and am.user_id = auth.uid();

    if target_user_role is null then
      raise exception 'The target user does not have a role on the account';
    end if;

    if current_user_hierarchy_level is null then
      raise exception 'The current user does not have a role on the account';
    end if;

    -- check the current user has a higher role than the target user
    if current_user_hierarchy_level >= target_user_hierarchy_level then
      raise exception 'You do not have permission to action a member from this account';
    end if;

    return true;

end;

$$;


ALTER FUNCTION "public"."can_action_account_member"("target_team_account_id" "uuid", "target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_ai_usage_limits"("p_entity_type" "text", "p_entity_id" "uuid", "p_cost" numeric, "p_tokens" integer) RETURNS TABLE("limit_exceeded" boolean, "limit_type" "text", "time_period" "text", "current_usage" numeric, "max_value" numeric)
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
  v_user_id UUID;
  v_team_id UUID;
BEGIN
  -- Set user or team ID based on entity type
  IF p_entity_type = 'user' THEN
    v_user_id := p_entity_id;
  ELSIF p_entity_type = 'team' THEN
    v_team_id := p_entity_id;
  ELSE
    RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
  END IF;

  -- Check daily cost limit
  RETURN QUERY
  WITH limits AS (
    SELECT
      l.limit_type,
      l.time_period,
      l.max_value
    FROM public.ai_usage_limits l
    WHERE (l.user_id = v_user_id OR l.team_id = v_team_id)
      AND l.is_active = true
  ),
  daily_cost AS (
    SELECT COALESCE(SUM(cost), 0) as usage
    FROM public.ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
      AND request_timestamp > (NOW() - INTERVAL '1 day')
  ),
  weekly_cost AS (
    SELECT COALESCE(SUM(cost), 0) as usage
    FROM public.ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
      AND request_timestamp > (NOW() - INTERVAL '7 days')
  ),
  monthly_cost AS (
    SELECT COALESCE(SUM(cost), 0) as usage
    FROM public.ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
      AND request_timestamp > (NOW() - INTERVAL '30 days')
  ),
  total_cost AS (
    SELECT COALESCE(SUM(cost), 0) as usage
    FROM public.ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
  ),
  daily_tokens AS (
    SELECT COALESCE(SUM(total_tokens), 0) as usage
    FROM public.ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
      AND request_timestamp > (NOW() - INTERVAL '1 day')
  ),
  weekly_tokens AS (
    SELECT COALESCE(SUM(total_tokens), 0) as usage
    FROM public.ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
      AND request_timestamp > (NOW() - INTERVAL '7 days')
  ),
  monthly_tokens AS (
    SELECT COALESCE(SUM(total_tokens), 0) as usage
    FROM public.ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
      AND request_timestamp > (NOW() - INTERVAL '30 days')
  ),
  total_tokens AS (
    SELECT COALESCE(SUM(total_tokens), 0) as usage
    FROM public.ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
  )
  SELECT
    CASE
      WHEN l.limit_type = 'cost' AND l.time_period = 'daily' THEN (d.usage + p_cost) > l.max_value
      WHEN l.limit_type = 'cost' AND l.time_period = 'weekly' THEN (w.usage + p_cost) > l.max_value
      WHEN l.limit_type = 'cost' AND l.time_period = 'monthly' THEN (m.usage + p_cost) > l.max_value
      WHEN l.limit_type = 'cost' AND l.time_period = 'total' THEN (t.usage + p_cost) > l.max_value
      WHEN l.limit_type = 'tokens' AND l.time_period = 'daily' THEN (dt.usage + p_tokens) > l.max_value
      WHEN l.limit_type = 'tokens' AND l.time_period = 'weekly' THEN (wt.usage + p_tokens) > l.max_value
      WHEN l.limit_type = 'tokens' AND l.time_period = 'monthly' THEN (mt.usage + p_tokens) > l.max_value
      WHEN l.limit_type = 'tokens' AND l.time_period = 'total' THEN (tt.usage + p_tokens) > l.max_value
      ELSE FALSE
    END as limit_exceeded,
    l.limit_type,
    l.time_period,
    CASE
      WHEN l.limit_type = 'cost' AND l.time_period = 'daily' THEN d.usage
      WHEN l.limit_type = 'cost' AND l.time_period = 'weekly' THEN w.usage
      WHEN l.limit_type = 'cost' AND l.time_period = 'monthly' THEN m.usage
      WHEN l.limit_type = 'cost' AND l.time_period = 'total' THEN t.usage
      WHEN l.limit_type = 'tokens' AND l.time_period = 'daily' THEN dt.usage::decimal
      WHEN l.limit_type = 'tokens' AND l.time_period = 'weekly' THEN wt.usage::decimal
      WHEN l.limit_type = 'tokens' AND l.time_period = 'monthly' THEN mt.usage::decimal
      WHEN l.limit_type = 'tokens' AND l.time_period = 'total' THEN tt.usage::decimal
      ELSE 0
    END as current_usage,
    l.max_value
  FROM limits l
  CROSS JOIN daily_cost d
  CROSS JOIN weekly_cost w
  CROSS JOIN monthly_cost m
  CROSS JOIN total_cost t
  CROSS JOIN daily_tokens dt
  CROSS JOIN weekly_tokens wt
  CROSS JOIN monthly_tokens mt
  CROSS JOIN total_tokens tt
  WHERE
    (l.limit_type = 'cost' AND l.time_period = 'daily' AND (d.usage + p_cost) > l.max_value) OR
    (l.limit_type = 'cost' AND l.time_period = 'weekly' AND (w.usage + p_cost) > l.max_value) OR
    (l.limit_type = 'cost' AND l.time_period = 'monthly' AND (m.usage + p_cost) > l.max_value) OR
    (l.limit_type = 'cost' AND l.time_period = 'total' AND (t.usage + p_cost) > l.max_value) OR
    (l.limit_type = 'tokens' AND l.time_period = 'daily' AND (dt.usage + p_tokens) > l.max_value) OR
    (l.limit_type = 'tokens' AND l.time_period = 'weekly' AND (wt.usage + p_tokens) > l.max_value) OR
    (l.limit_type = 'tokens' AND l.time_period = 'monthly' AND (mt.usage + p_tokens) > l.max_value) OR
    (l.limit_type = 'tokens' AND l.time_period = 'total' AND (tt.usage + p_tokens) > l.max_value);
END;
$$;


ALTER FUNCTION "public"."check_ai_usage_limits"("p_entity_type" "text", "p_entity_id" "uuid", "p_cost" numeric, "p_tokens" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_ai_usage_limits"("p_entity_type" "text", "p_entity_id" "uuid", "p_cost" numeric, "p_tokens" integer) IS 'Check AI usage limits with fixed search_path for security';



CREATE OR REPLACE FUNCTION "public"."check_is_aal2"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    is_aal2 boolean;
BEGIN
    SELECT (select auth.jwt()) ->> 'aal' = 'aal2' INTO is_aal2;
    RETURN COALESCE(is_aal2, false);
END;
$$;


ALTER FUNCTION "public"."check_is_aal2"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_ai_allocation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  INSERT INTO public.ai_usage_allocations (
    user_id,
    credits_allocated,
    allocation_type,
    reset_frequency
  ) VALUES (
    NEW.id,
    100, -- Default free credits
    'free',
    'monthly'
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_ai_allocation"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_default_ai_allocation"() IS 'Create default AI allocation trigger with fixed search_path for security';



CREATE OR REPLACE FUNCTION "public"."create_invitation"("account_id" "uuid", "email" "text", "role" character varying) RETURNS "public"."invitations"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
    new_invitation public.invitations;
    invite_token text;
begin
    invite_token := extensions.uuid_generate_v4();

    insert into public.invitations(
        email,
        account_id,
        invited_by,
        role,
        invite_token)
    values (
        email,
        account_id,
        auth.uid(),
        role,
        invite_token)
returning
    * into new_invitation;

    return new_invitation;

end;

$$;


ALTER FUNCTION "public"."create_invitation"("account_id" "uuid", "email" "text", "role" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_nonce"("p_user_id" "uuid" DEFAULT NULL::"uuid", "p_purpose" "text" DEFAULT NULL::"text", "p_expires_in_seconds" integer DEFAULT 3600, "p_metadata" "jsonb" DEFAULT NULL::"jsonb", "p_scopes" "text"[] DEFAULT NULL::"text"[], "p_revoke_previous" boolean DEFAULT true) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_client_token TEXT;
    v_nonce TEXT;
    v_expires_at TIMESTAMPTZ;
    v_id UUID;
    v_plaintext_token TEXT;
    v_revoked_count INTEGER;
BEGIN
    -- Revoke previous tokens for the same user and purpose if requested
    -- This only applies if a user ID is provided (not for anonymous tokens)
    IF p_revoke_previous = TRUE AND p_user_id IS NOT NULL THEN
        WITH revoked AS (
            UPDATE public.nonces
                SET
                    revoked = TRUE,
                    revoked_reason = 'Superseded by new token with same purpose'
                WHERE
                    user_id = p_user_id
                        AND purpose = p_purpose
                        AND used_at IS NULL
                        AND revoked = FALSE
                        AND expires_at > NOW()
                RETURNING 1
        )
        SELECT COUNT(*) INTO v_revoked_count FROM revoked;
    END IF;

    -- Generate a 6-digit token
    v_plaintext_token := (100000 + floor(random() * 900000))::text;
    v_client_token := extensions.crypt(v_plaintext_token, extensions.gen_salt('bf'));

    -- Still generate a secure nonce for internal use
    v_nonce := encode(extensions.gen_random_bytes(24), 'base64');
    v_nonce := extensions.crypt(v_nonce, extensions.gen_salt('bf'));

    -- Calculate expiration time
    v_expires_at := NOW() + (p_expires_in_seconds * interval '1 second');

    -- Insert the new nonce
    INSERT INTO public.nonces (
        client_token,
        nonce,
        user_id,
        expires_at,
        metadata,
        purpose,
        scopes
    )
    VALUES (
               v_client_token,
               v_nonce,
               p_user_id,
               v_expires_at,
               COALESCE(p_metadata, '{}'::JSONB),
               p_purpose,
               COALESCE(p_scopes, '{}'::TEXT[])
           )
    RETURNING id INTO v_id;

    -- Return the token information
    -- Note: returning the plaintext token, not the hash
    RETURN jsonb_build_object(
            'id', v_id,
            'token', v_plaintext_token,
            'expires_at', v_expires_at,
            'revoked_previous_count', COALESCE(v_revoked_count, 0)
           );
END;
$$;


ALTER FUNCTION "public"."create_nonce"("p_user_id" "uuid", "p_purpose" "text", "p_expires_in_seconds" integer, "p_metadata" "jsonb", "p_scopes" "text"[], "p_revoke_previous" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_nonce"("p_user_id" "uuid", "p_purpose" "text", "p_expires_in_seconds" integer, "p_metadata" "jsonb", "p_scopes" "text"[], "p_revoke_previous" boolean) IS 'Creates a new one-time token for a specific purpose with enhanced options';



CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "primary_owner_user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "slug" "text",
    "email" character varying(320),
    "is_personal_account" boolean DEFAULT false NOT NULL,
    "updated_at" timestamp with time zone,
    "created_at" timestamp with time zone,
    "created_by" "uuid",
    "updated_by" "uuid",
    "picture_url" character varying(1000),
    "public_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "accounts_slug_null_if_personal_account_true" CHECK (((("is_personal_account" = true) AND ("slug" IS NULL)) OR (("is_personal_account" = false) AND ("slug" IS NOT NULL))))
);


ALTER TABLE "public"."accounts" OWNER TO "postgres";


COMMENT ON TABLE "public"."accounts" IS 'Accounts are the top level entity in the Supabase MakerKit. They can be team or personal accounts.';



COMMENT ON COLUMN "public"."accounts"."primary_owner_user_id" IS 'The primary owner of the account';



COMMENT ON COLUMN "public"."accounts"."name" IS 'The name of the account';



COMMENT ON COLUMN "public"."accounts"."slug" IS 'The slug of the account';



COMMENT ON COLUMN "public"."accounts"."email" IS 'The email of the account. For teams, this is the email of the team (if any)';



COMMENT ON COLUMN "public"."accounts"."is_personal_account" IS 'Whether the account is a personal account or not';



CREATE OR REPLACE FUNCTION "public"."create_team_account"("account_name" "text") RETURNS "public"."accounts"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
    new_account public.accounts;
begin
    if (not public.is_set('enable_team_accounts')) then
        raise exception 'Team accounts are not enabled';
    end if;

    insert into public.accounts(
        name,
        is_personal_account)
    values (
        account_name,
        false)
returning
    * into new_account;

    return new_account;

end;

$$;


ALTER FUNCTION "public"."create_team_account"("account_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_ai_credits"("p_entity_type" "text", "p_entity_id" "uuid", "p_amount" numeric, "p_feature" "text", "p_request_id" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
  v_allocation_id UUID;
  v_balance DECIMAL;
  v_user_id UUID;
  v_team_id UUID;
  v_insufficient BOOLEAN := FALSE;
BEGIN
  -- Set user or team ID based on entity type
  IF p_entity_type = 'user' THEN
    v_user_id := p_entity_id;
  ELSIF p_entity_type = 'team' THEN
    v_team_id := p_entity_id;
  ELSE
    RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
  END IF;

  -- Lock the allocations for update to prevent race conditions
  IF p_entity_type = 'user' THEN
    SELECT id, credits_allocated - credits_used
    INTO v_allocation_id, v_balance
    FROM public.ai_usage_allocations
    WHERE user_id = v_user_id
      AND is_active = true
    ORDER BY
      CASE
        WHEN allocation_type = 'free' THEN 3
        WHEN allocation_type = 'promotional' THEN 2
        WHEN allocation_type = 'purchased' THEN 1
      END,
      next_reset_at DESC NULLS LAST
    LIMIT 1
    FOR UPDATE;
  ELSE
    SELECT id, credits_allocated - credits_used
    INTO v_allocation_id, v_balance
    FROM public.ai_usage_allocations
    WHERE team_id = v_team_id
      AND is_active = true
    ORDER BY
      CASE
        WHEN allocation_type = 'free' THEN 3
        WHEN allocation_type = 'promotional' THEN 2
        WHEN allocation_type = 'purchased' THEN 1
      END,
      next_reset_at DESC NULLS LAST
    LIMIT 1
    FOR UPDATE;
  END IF;

  -- Check if allocation exists
  IF v_allocation_id IS NULL THEN
    -- No allocation found, return false
    RETURN FALSE;
  END IF;

  -- Check if enough balance
  IF v_balance < p_amount THEN
    v_insufficient := TRUE;
    -- Continue anyway but mark the transaction as exceeding balance
  END IF;

  -- Update allocation
  UPDATE public.ai_usage_allocations
  SET
    credits_used = credits_used + p_amount,
    updated_at = NOW()
  WHERE id = v_allocation_id;

  -- Record transaction
  INSERT INTO public.ai_credit_transactions (
    user_id,
    team_id,
    allocation_id,
    amount,
    transaction_type,
    reference_id,
    description
  ) VALUES (
    v_user_id,
    v_team_id,
    v_allocation_id,
    -p_amount,
    CASE WHEN v_insufficient THEN 'usage_exceeded' ELSE 'usage' END,
    p_request_id,
    'AI request: ' || p_feature
  );

  -- Return success status
  RETURN NOT v_insufficient;
END;
$$;


ALTER FUNCTION "public"."deduct_ai_credits"("p_entity_type" "text", "p_entity_id" "uuid", "p_amount" numeric, "p_feature" "text", "p_request_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."deduct_ai_credits"("p_entity_type" "text", "p_entity_id" "uuid", "p_amount" numeric, "p_feature" "text", "p_request_id" "text") IS 'Deduct AI credits with fixed search_path for security';



CREATE OR REPLACE FUNCTION "public"."get_account_invitations"("account_slug" "text") RETURNS TABLE("id" integer, "email" character varying, "account_id" "uuid", "invited_by" "uuid", "role" character varying, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "expires_at" timestamp with time zone, "inviter_name" character varying, "inviter_email" character varying)
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    return query
    select
        invitation.id,
        invitation.email,
        invitation.account_id,
        invitation.invited_by,
        invitation.role,
        invitation.created_at,
        invitation.updated_at,
        invitation.expires_at,
        account.name,
        account.email
    from
        public.invitations as invitation
        join public.accounts as account on invitation.account_id = account.id
    where
        account.slug = account_slug;

end;

$$;


ALTER FUNCTION "public"."get_account_invitations"("account_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_account_members"("account_slug" "text") RETURNS TABLE("id" "uuid", "user_id" "uuid", "account_id" "uuid", "role" character varying, "role_hierarchy_level" integer, "primary_owner_user_id" "uuid", "name" character varying, "email" character varying, "picture_url" character varying, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    return QUERY
    select
        acc.id,
        am.user_id,
        am.account_id,
        am.account_role,
        r.hierarchy_level,
        a.primary_owner_user_id,
        acc.name,
        acc.email,
        acc.picture_url,
        am.created_at,
        am.updated_at
    from
        public.accounts_memberships am
        join public.accounts a on a.id = am.account_id
        join public.accounts acc on acc.id = am.user_id
        join public.roles r on r.name = am.account_role
    where
        a.slug = account_slug;

end;

$$;


ALTER FUNCTION "public"."get_account_members"("account_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_config"() RETURNS json
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
    result record;
begin
    select
        *
    from
        public.config
    limit 1 into result;

    return row_to_json(result);

end;

$$;


ALTER FUNCTION "public"."get_config"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_is_super_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    is_super_admin boolean;
BEGIN
    SELECT ((select auth.jwt()) ->> 'app_metadata')::jsonb ->> 'role' = 'super-admin' INTO is_super_admin;
    RETURN COALESCE(is_super_admin, false);
END;
$$;


ALTER FUNCTION "public"."get_is_super_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_nonce_status"("p_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_nonce public.nonces;
BEGIN
  SELECT * INTO v_nonce FROM public.nonces WHERE id = p_id;

  IF v_nonce.id IS NULL THEN
    RETURN jsonb_build_object('exists', false);
  END IF;

  RETURN jsonb_build_object(
    'exists', true,
    'purpose', v_nonce.purpose,
    'user_id', v_nonce.user_id,
    'created_at', v_nonce.created_at,
    'expires_at', v_nonce.expires_at,
    'used_at', v_nonce.used_at,
    'revoked', v_nonce.revoked,
    'revoked_reason', v_nonce.revoked_reason,
    'verification_attempts', v_nonce.verification_attempts,
    'last_verification_at', v_nonce.last_verification_at,
    'last_verification_ip', v_nonce.last_verification_ip,
    'is_valid', (v_nonce.used_at IS NULL AND NOT v_nonce.revoked AND v_nonce.expires_at > NOW())
  );
END;
$$;


ALTER FUNCTION "public"."get_nonce_status"("p_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_nonce_status"("p_id" "uuid") IS 'Retrieves the status of a token for administrative purposes';



CREATE OR REPLACE FUNCTION "public"."get_upper_system_role"() RETURNS character varying
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
    role varchar(50);
begin
    select name from public.roles
      where hierarchy_level = 1 into role;

    return role;
end;
$$;


ALTER FUNCTION "public"."get_upper_system_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_updated_at"() IS 'Update timestamp trigger with fixed search_path for security';



CREATE OR REPLACE FUNCTION "public"."has_active_subscription"("target_account_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    return exists (
        select
            1
        from
            public.subscriptions
        where
            account_id = target_account_id
            and active = true);

end;

$$;


ALTER FUNCTION "public"."has_active_subscription"("target_account_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_more_elevated_role"("target_user_id" "uuid", "target_account_id" "uuid", "role_name" character varying) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
    declare is_primary_owner boolean;
    user_role_hierarchy_level int;
    target_role_hierarchy_level int;
begin
    -- Check if the user is the primary owner of the account
    select
        exists (
            select
                1
            from
                public.accounts
            where
                id = target_account_id
                and primary_owner_user_id = target_user_id) into is_primary_owner;

    -- If the user is the primary owner, they have the highest role and can
    --   perform any action
    if is_primary_owner then
        return true;
    end if;

    -- Get the hierarchy level of the user's role within the account
    select
        hierarchy_level into user_role_hierarchy_level
    from
        public.roles
    where
        name =(
            select
                account_role
            from
                public.accounts_memberships
            where
                account_id = target_account_id
                and target_user_id = user_id);

    if user_role_hierarchy_level is null then
        return false;
    end if;

    -- Get the hierarchy level of the target role
    select
        hierarchy_level into target_role_hierarchy_level
    from
        public.roles
    where
        name = role_name;

    -- If the target role does not exist, the user cannot perform the action
    if target_role_hierarchy_level is null then
        return false;
    end if;

    -- If the user's role is higher than the target role, they can perform
    --   the action
    return user_role_hierarchy_level < target_role_hierarchy_level;

end;

$$;


ALTER FUNCTION "public"."has_more_elevated_role"("target_user_id" "uuid", "target_account_id" "uuid", "role_name" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_permission"("user_id" "uuid", "account_id" "uuid", "permission_name" "public"."app_permissions") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    return exists(
        select
            1
        from
            public.accounts_memberships
	    join public.role_permissions on
		accounts_memberships.account_role =
		role_permissions.role
        where
            accounts_memberships.user_id = has_permission.user_id
            and accounts_memberships.account_id = has_permission.account_id
            and role_permissions.permission = has_permission.permission_name);

end;

$$;


ALTER FUNCTION "public"."has_permission"("user_id" "uuid", "account_id" "uuid", "permission_name" "public"."app_permissions") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role_on_account"("account_id" "uuid", "account_role" character varying DEFAULT NULL::character varying) RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    SELECT EXISTS(
        SELECT 1
        FROM public.accounts_memberships membership
        WHERE membership.user_id = (select auth.uid())
        AND membership.account_id = has_role_on_account.account_id
        AND (
          (membership.account_role = has_role_on_account.account_role)
          OR has_role_on_account.account_role IS NULL
        )
    );
$$;


ALTER FUNCTION "public"."has_role_on_account"("account_id" "uuid", "account_role" character varying) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."has_role_on_account"("account_id" "uuid", "account_role" character varying) IS 'Optimized function using (select auth.uid()) for better RLS performance';



CREATE OR REPLACE FUNCTION "public"."has_same_role_hierarchy_level"("target_user_id" "uuid", "target_account_id" "uuid", "role_name" character varying) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
    is_primary_owner boolean;
    user_role_hierarchy_level int;
    target_role_hierarchy_level int;
begin
    -- Check if the user is the primary owner of the account
    select
        exists (
            select
                1
            from
                public.accounts
            where
                id = target_account_id
                and primary_owner_user_id = target_user_id) into is_primary_owner;

    -- If the user is the primary owner, they have the highest role and can perform any action
    if is_primary_owner then
        return true;
    end if;

    -- Get the hierarchy level of the user's role within the account
    select
        hierarchy_level into user_role_hierarchy_level
    from
        public.roles
    where
        name =(
            select
                account_role
            from
                public.accounts_memberships
            where
                account_id = target_account_id
                and target_user_id = user_id);

    -- If the user does not have a role in the account, they cannot perform the action
    if user_role_hierarchy_level is null then
        return false;
    end if;

    -- Get the hierarchy level of the target role
    select
        hierarchy_level into target_role_hierarchy_level
    from
        public.roles
    where
        name = role_name;

    -- If the target role does not exist, the user cannot perform the action
    if target_role_hierarchy_level is null then
        return false;
    end if;

   -- check the user's role hierarchy level is the same as the target role
    return user_role_hierarchy_level = target_role_hierarchy_level;

end;

$$;


ALTER FUNCTION "public"."has_same_role_hierarchy_level"("target_user_id" "uuid", "target_account_id" "uuid", "role_name" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_certificate"("p_user_id" "uuid", "p_course_id" "text", "p_file_path" "text") RETURNS TABLE("id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_certificate_id UUID;
BEGIN
  -- Insert the certificate record
  INSERT INTO public.certificates (user_id, course_id, file_path)
  VALUES (p_user_id, p_course_id, p_file_path)
  RETURNING public.certificates.id INTO v_certificate_id;
  
  -- Return the certificate ID
  RETURN QUERY SELECT v_certificate_id;
END;
$$;


ALTER FUNCTION "public"."insert_certificate"("p_user_id" "uuid", "p_course_id" "text", "p_file_path" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."insert_certificate"("p_user_id" "uuid", "p_course_id" "text", "p_file_path" "text") IS 'Insert certificate record with fixed search_path for security';



CREATE OR REPLACE FUNCTION "public"."is_aal2"() RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
    is_aal2 boolean;
BEGIN
    SELECT auth.jwt() ->> 'aal' = 'aal2' INTO is_aal2;
    RETURN COALESCE(is_aal2, false);
END
$$;


ALTER FUNCTION "public"."is_aal2"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_account_owner"("account_id" "uuid") RETURNS boolean
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $$
    select
        exists(
            select
                1
            from
                public.accounts
            where
                id = is_account_owner.account_id
                and primary_owner_user_id = auth.uid());
$$;


ALTER FUNCTION "public"."is_account_owner"("account_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_account_team_member"("target_account_id" "uuid") RETURNS boolean
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $$
    select exists(
        select 1
        from public.accounts_memberships as membership
        where public.is_team_member (membership.account_id, target_account_id)
    );
$$;


ALTER FUNCTION "public"."is_account_team_member"("target_account_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_mfa_compliant"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    return array[(select auth.jwt()->>'aal')] <@ (
        select
            case
                when count(id) > 0 then array['aal2']
                else array['aal1', 'aal2']
                end as aal
        from auth.mfa_factors
        where ((select auth.uid()) = auth.mfa_factors.user_id) and auth.mfa_factors.status = 'verified'
    );
end
$$;


ALTER FUNCTION "public"."is_mfa_compliant"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_set"("field_name" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
    result boolean;
begin
    execute format('select %I from public.config limit 1', field_name) into result;

    return result;

end;

$$;


ALTER FUNCTION "public"."is_set"("field_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"() RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
    is_super_admin boolean;
BEGIN
    -- CRITICAL: MFA verification is REQUIRED for super-admin access
    -- This check ensures that super-admins must have second-factor authentication
    IF NOT public.is_aal2() THEN
        RETURN false;
    END IF;

    -- Check if the user has the super-admin role in app_metadata
    SELECT (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super-admin' INTO is_super_admin;
    
    RETURN COALESCE(is_super_admin, false);
END
$$;


ALTER FUNCTION "public"."is_super_admin"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_super_admin"() IS 'Checks if the current user is a super-admin with MFA verification. 
SECURITY REQUIREMENT: MFA (AAL2) verification is mandatory for super-admin access.
This function enforces two-factor authentication to prevent unauthorized administrative access.';



CREATE OR REPLACE FUNCTION "public"."is_team_member"("account_id" "uuid", "user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    select
        exists(
            select
                1
            from
                public.accounts_memberships membership
            where
                public.has_role_on_account(account_id)
                and membership.user_id = is_team_member.user_id
                and membership.account_id = is_team_member.account_id);
$$;


ALTER FUNCTION "public"."is_team_member"("account_id" "uuid", "user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_timezone_cache"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    refresh_duration INTERVAL;
    timezone_count INTEGER;
    result_message TEXT;
BEGIN
    -- Record refresh start time
    start_time := clock_timestamp();
    
    -- Refresh the materialized view
    REFRESH MATERIALIZED VIEW public.timezone_cache;
    
    -- Record refresh end time
    end_time := clock_timestamp();
    refresh_duration := end_time - start_time;
    
    -- Get count of cached timezones
    SELECT COUNT(*) INTO timezone_count FROM public.timezone_cache;
    
    -- Prepare result message
    result_message := format(
        'Timezone cache refreshed successfully. Count: %s, Duration: %s',
        timezone_count,
        refresh_duration
    );
    
    -- Log the refresh (if logging table exists)
    BEGIN
        INSERT INTO public.maintenance_log (
            operation, 
            status, 
            message, 
            duration_ms,
            created_at
        ) VALUES (
            'timezone_cache_refresh',
            'success',
            result_message,
            EXTRACT(MILLISECONDS FROM refresh_duration),
            now()
        );
    EXCEPTION
        WHEN undefined_table THEN
            -- Table doesn't exist, skip logging
            NULL;
    END;
    
    RETURN result_message;
END;
$$;


ALTER FUNCTION "public"."refresh_timezone_cache"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."refresh_timezone_cache"() IS 'Refreshes the timezone cache materialized view with performance logging. Call daily or weekly.';



CREATE OR REPLACE FUNCTION "public"."reset_ai_allocations"() RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
  v_reset_count INTEGER := 0;
  v_allocation RECORD;
BEGIN
  -- Find allocations due for reset
  FOR v_allocation IN
    SELECT id, user_id, team_id, credits_used, allocation_type, reset_frequency
    FROM public.ai_usage_allocations
    WHERE is_active = true
      AND next_reset_at <= NOW()
      AND reset_frequency IS NOT NULL
      AND reset_frequency IN ('daily', 'weekly', 'monthly')
  LOOP
    -- Reset the usage
    UPDATE public.ai_usage_allocations
    SET
      credits_used = 0,
      next_reset_at =
        CASE
          WHEN v_allocation.reset_frequency = 'daily' THEN NOW() + INTERVAL '1 day'
          WHEN v_allocation.reset_frequency = 'weekly' THEN NOW() + INTERVAL '7 days'
          WHEN v_allocation.reset_frequency = 'monthly' THEN NOW() + INTERVAL '1 month'
          ELSE NULL
        END,
      updated_at = NOW()
    WHERE id = v_allocation.id;

    -- Record the reset transaction
    INSERT INTO public.ai_credit_transactions (
      user_id,
      team_id,
      allocation_id,
      amount,
      transaction_type,
      description
    ) VALUES (
      v_allocation.user_id,
      v_allocation.team_id,
      v_allocation.id,
      v_allocation.credits_used, -- Reset the full amount used
      'reset',
      'Periodic reset (' || v_allocation.reset_frequency || ')'
    );

    v_reset_count := v_reset_count + 1;
  END LOOP;

  RETURN v_reset_count;
END;
$$;


ALTER FUNCTION "public"."reset_ai_allocations"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reset_ai_allocations"() IS 'Reset AI allocations with fixed search_path for security';



CREATE OR REPLACE FUNCTION "public"."revoke_nonce"("p_id" "uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_affected_rows INTEGER;
BEGIN
  UPDATE public.nonces
  SET
    revoked = TRUE,
    revoked_reason = p_reason
  WHERE
    id = p_id
    AND used_at IS NULL
    AND NOT revoked
  RETURNING 1 INTO v_affected_rows;

  RETURN v_affected_rows > 0;
END;
$$;


ALTER FUNCTION "public"."revoke_nonce"("p_id" "uuid", "p_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."revoke_nonce"("p_id" "uuid", "p_reason" "text") IS 'Administratively revokes a token to prevent its use';



CREATE OR REPLACE FUNCTION "public"."set_next_reset_time"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
  IF NEW.reset_frequency = 'daily' THEN
    NEW.next_reset_at := NOW() + INTERVAL '1 day';
  ELSIF NEW.reset_frequency = 'weekly' THEN
    NEW.next_reset_at := NOW() + INTERVAL '7 days';
  ELSIF NEW.reset_frequency = 'monthly' THEN
    NEW.next_reset_at := NOW() + INTERVAL '1 month';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_next_reset_time"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_next_reset_time"() IS 'Set next reset time trigger with fixed search_path for security';



CREATE OR REPLACE FUNCTION "public"."team_account_workspace"("account_slug" "text") RETURNS TABLE("id" "uuid", "name" character varying, "picture_url" character varying, "slug" "text", "role" character varying, "role_hierarchy_level" integer, "primary_owner_user_id" "uuid", "subscription_status" "public"."subscription_status", "permissions" "public"."app_permissions"[])
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    return QUERY
    select
        accounts.id,
        accounts.name,
        accounts.picture_url,
        accounts.slug,
        accounts_memberships.account_role,
        roles.hierarchy_level,
        accounts.primary_owner_user_id,
        subscriptions.status,
        array_agg(role_permissions.permission)
    from
        public.accounts
        join public.accounts_memberships on accounts.id = accounts_memberships.account_id
        left join public.subscriptions on accounts.id = subscriptions.account_id
        join public.roles on accounts_memberships.account_role = roles.name
        left join public.role_permissions on accounts_memberships.account_role = role_permissions.role
    where
        accounts.slug = account_slug
        and public.accounts_memberships.user_id = (select auth.uid())
    group by
        accounts.id,
        accounts_memberships.account_role,
        subscriptions.status,
        roles.hierarchy_level;
end;
$$;


ALTER FUNCTION "public"."team_account_workspace"("account_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transfer_team_account_ownership"("target_account_id" "uuid", "new_owner_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    if current_user not in('service_role') then
        raise exception 'You do not have permission to transfer account ownership';
    end if;

    -- verify the user is already a member of the account
    if not exists(
        select
            1
        from
            public.accounts_memberships
        where
            target_account_id = account_id
            and user_id = new_owner_id) then
        raise exception 'The new owner must be a member of the account';
    end if;

    -- update the primary owner of the account
    update
        public.accounts
    set
        primary_owner_user_id = new_owner_id
    where
        id = target_account_id
        and is_personal_account = false;

    -- update membership assigning it the hierarchy role
    update
        public.accounts_memberships
    set
        account_role =(
            public.get_upper_system_role())
    where
        target_account_id = account_id
        and user_id = new_owner_id
        and account_role <>(
            public.get_upper_system_role());

end;

$$;


ALTER FUNCTION "public"."transfer_team_account_ownership"("target_account_id" "uuid", "new_owner_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_set_timestamps"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    if TG_OP = 'INSERT' then
        new.created_at = now();

        new.updated_at = now();

    else
        new.updated_at = now();

        new.created_at = old.created_at;

    end if;

    return NEW;

end
$$;


ALTER FUNCTION "public"."trigger_set_timestamps"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_set_user_tracking"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    if TG_OP = 'INSERT' then
        new.created_by = auth.uid();
        new.updated_by = auth.uid();

    else
        new.updated_by = auth.uid();

        new.created_by = old.created_by;

    end if;

    return NEW;

end
$$;


ALTER FUNCTION "public"."trigger_set_user_tracking"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "text" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "billing_customer_id" integer NOT NULL,
    "status" "public"."payment_status" NOT NULL,
    "billing_provider" "public"."billing_provider" NOT NULL,
    "total_amount" numeric NOT NULL,
    "currency" character varying(3) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


COMMENT ON TABLE "public"."orders" IS 'The one-time orders for an account';



COMMENT ON COLUMN "public"."orders"."account_id" IS 'The account the order is for';



COMMENT ON COLUMN "public"."orders"."billing_customer_id" IS 'The billing customer ID for the order';



COMMENT ON COLUMN "public"."orders"."status" IS 'The status of the order';



COMMENT ON COLUMN "public"."orders"."billing_provider" IS 'The provider of the order';



COMMENT ON COLUMN "public"."orders"."total_amount" IS 'The total amount for the order';



COMMENT ON COLUMN "public"."orders"."currency" IS 'The currency for the order';



CREATE OR REPLACE FUNCTION "public"."upsert_order"("target_account_id" "uuid", "target_customer_id" character varying, "target_order_id" "text", "status" "public"."payment_status", "billing_provider" "public"."billing_provider", "total_amount" numeric, "currency" character varying, "line_items" "jsonb") RETURNS "public"."orders"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
    new_order public.orders;
    new_billing_customer_id int;
begin
    insert into public.billing_customers(
        account_id,
        provider,
        customer_id)
    values (
        target_account_id,
        billing_provider,
        target_customer_id)
on conflict (
    account_id,
    provider,
    customer_id)
    do update set
        provider = excluded.provider
    returning
        id into new_billing_customer_id;

    insert into public.orders(
        account_id,
        billing_customer_id,
        id,
        status,
        billing_provider,
        total_amount,
        currency)
    values (
        target_account_id,
        new_billing_customer_id,
        target_order_id,
        status,
        billing_provider,
        total_amount,
        currency)
on conflict (
    id)
    do update set
        status = excluded.status,
        total_amount = excluded.total_amount,
        currency = excluded.currency
    returning
        * into new_order;

    -- Upsert order items and delete ones that are not in the line_items array
    with item_data as (
        select
            (line_item ->> 'id')::varchar as line_item_id,
            (line_item ->> 'product_id')::varchar as prod_id,
            (line_item ->> 'variant_id')::varchar as var_id,
            (line_item ->> 'price_amount')::numeric as price_amt,
            (line_item ->> 'quantity')::integer as qty
        from
            jsonb_array_elements(line_items) as line_item
    ),
    line_item_ids as (
        select line_item_id from item_data
    ),
    deleted_items as (
        delete from
            public.order_items
        where
            public.order_items.order_id = new_order.id
            and public.order_items.id not in (select line_item_id from line_item_ids)
        returning *
    )
    insert into public.order_items(
        id,
        order_id,
        product_id,
        variant_id,
        price_amount,
        quantity)
    select
        line_item_id,
        target_order_id,
        prod_id,
        var_id,
        price_amt,
        qty
    from
        item_data
    on conflict (id)
        do update set
            price_amount = excluded.price_amount,
            product_id = excluded.product_id,
            variant_id = excluded.variant_id,
            quantity = excluded.quantity;

    return new_order;

end;

$$;


ALTER FUNCTION "public"."upsert_order"("target_account_id" "uuid", "target_customer_id" character varying, "target_order_id" "text", "status" "public"."payment_status", "billing_provider" "public"."billing_provider", "total_amount" numeric, "currency" character varying, "line_items" "jsonb") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "text" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "billing_customer_id" integer NOT NULL,
    "status" "public"."subscription_status" NOT NULL,
    "active" boolean NOT NULL,
    "billing_provider" "public"."billing_provider" NOT NULL,
    "cancel_at_period_end" boolean NOT NULL,
    "currency" character varying(3) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "period_starts_at" timestamp with time zone NOT NULL,
    "period_ends_at" timestamp with time zone NOT NULL,
    "trial_starts_at" timestamp with time zone,
    "trial_ends_at" timestamp with time zone
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."subscriptions" IS 'The subscriptions for an account';



COMMENT ON COLUMN "public"."subscriptions"."account_id" IS 'The account the subscription is for';



COMMENT ON COLUMN "public"."subscriptions"."billing_customer_id" IS 'The billing customer ID for the subscription';



COMMENT ON COLUMN "public"."subscriptions"."status" IS 'The status of the subscription';



COMMENT ON COLUMN "public"."subscriptions"."active" IS 'Whether the subscription is active';



COMMENT ON COLUMN "public"."subscriptions"."billing_provider" IS 'The provider of the subscription';



COMMENT ON COLUMN "public"."subscriptions"."cancel_at_period_end" IS 'Whether the subscription will be canceled at the end of the period';



COMMENT ON COLUMN "public"."subscriptions"."currency" IS 'The currency for the subscription';



COMMENT ON COLUMN "public"."subscriptions"."period_starts_at" IS 'The start of the current period for the subscription';



COMMENT ON COLUMN "public"."subscriptions"."period_ends_at" IS 'The end of the current period for the subscription';



COMMENT ON COLUMN "public"."subscriptions"."trial_starts_at" IS 'The start of the trial period for the subscription';



COMMENT ON COLUMN "public"."subscriptions"."trial_ends_at" IS 'The end of the trial period for the subscription';



CREATE OR REPLACE FUNCTION "public"."upsert_subscription"("target_account_id" "uuid", "target_customer_id" character varying, "target_subscription_id" "text", "active" boolean, "status" "public"."subscription_status", "billing_provider" "public"."billing_provider", "cancel_at_period_end" boolean, "currency" character varying, "period_starts_at" timestamp with time zone, "period_ends_at" timestamp with time zone, "line_items" "jsonb", "trial_starts_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "trial_ends_at" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS "public"."subscriptions"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
    new_subscription public.subscriptions;
    new_billing_customer_id int;
begin
    insert into public.billing_customers(
        account_id,
        provider,
        customer_id)
    values (
        target_account_id,
        billing_provider,
        target_customer_id)
on conflict (
    account_id,
    provider,
    customer_id)
    do update set
        provider = excluded.provider
    returning
        id into new_billing_customer_id;

    insert into public.subscriptions(
        account_id,
        billing_customer_id,
        id,
        active,
        status,
        billing_provider,
        cancel_at_period_end,
        currency,
        period_starts_at,
        period_ends_at,
        trial_starts_at,
        trial_ends_at)
    values (
        target_account_id,
        new_billing_customer_id,
        target_subscription_id,
        active,
        status,
        billing_provider,
        cancel_at_period_end,
        currency,
        period_starts_at,
        period_ends_at,
        trial_starts_at,
        trial_ends_at)
on conflict (
    id)
    do update set
        active = excluded.active,
        status = excluded.status,
        cancel_at_period_end = excluded.cancel_at_period_end,
        currency = excluded.currency,
        period_starts_at = excluded.period_starts_at,
        period_ends_at = excluded.period_ends_at,
        trial_starts_at = excluded.trial_starts_at,
        trial_ends_at = excluded.trial_ends_at
    returning
        * into new_subscription;

    -- Upsert subscription items and delete ones that are not in the line_items array
    with item_data as (
        select
            (line_item ->> 'id')::varchar as line_item_id,
            (line_item ->> 'product_id')::varchar as prod_id,
            (line_item ->> 'variant_id')::varchar as var_id,
            (line_item ->> 'type')::public.subscription_item_type as type,
            (line_item ->> 'price_amount')::numeric as price_amt,
            (line_item ->> 'quantity')::integer as qty,
            (line_item ->> 'interval')::varchar as intv,
            (line_item ->> 'interval_count')::integer as intv_count
        from
            jsonb_array_elements(line_items) as line_item
    ),
    line_item_ids as (
        select line_item_id from item_data
    ),
    deleted_items as (
        delete from
            public.subscription_items
        where
            public.subscription_items.subscription_id = new_subscription.id
            and public.subscription_items.id not in (select line_item_id from line_item_ids)
        returning *
    )
    insert into public.subscription_items(
        id,
        subscription_id,
        product_id,
        variant_id,
        type,
        price_amount,
        quantity,
        interval,
        interval_count)
    select
        line_item_id,
        target_subscription_id,
        prod_id,
        var_id,
        type,
        price_amt,
        qty,
        intv,
        intv_count
    from
        item_data
    on conflict (id)
        do update set
            product_id = excluded.product_id,
            variant_id = excluded.variant_id,
            price_amount = excluded.price_amount,
            quantity = excluded.quantity,
            interval = excluded.interval,
            type = excluded.type,
            interval_count = excluded.interval_count;

    return new_subscription;

end;

$$;


ALTER FUNCTION "public"."upsert_subscription"("target_account_id" "uuid", "target_customer_id" character varying, "target_subscription_id" "text", "active" boolean, "status" "public"."subscription_status", "billing_provider" "public"."billing_provider", "cancel_at_period_end" boolean, "currency" character varying, "period_starts_at" timestamp with time zone, "period_ends_at" timestamp with time zone, "line_items" "jsonb", "trial_starts_at" timestamp with time zone, "trial_ends_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_nonce"("p_token" "text", "p_purpose" "text", "p_user_id" "uuid" DEFAULT NULL::"uuid", "p_required_scopes" "text"[] DEFAULT NULL::"text"[], "p_max_verification_attempts" integer DEFAULT 5, "p_ip" "inet" DEFAULT NULL::"inet", "p_user_agent" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_nonce          RECORD;
BEGIN
    -- Find and update the nonce in a single operation
    -- First filter by indexed columns to reduce candidate rows, then do bcrypt comparison
    WITH candidate_nonces AS (
        -- Use index to filter candidates by purpose, user_id, expiry, status
        SELECT id, client_token, user_id, purpose, metadata, scopes,
               verification_attempts, expires_at, used_at, revoked
        FROM public.nonces
        WHERE purpose = p_purpose
          AND used_at IS NULL
          AND NOT revoked
          AND expires_at > NOW()
          -- Only apply user_id filter if the token was created for a specific user
          AND (
            -- Case 1: Anonymous token (user_id is NULL in DB)
            (user_id IS NULL)
                OR
                -- Case 2: User-specific token (check if user_id matches)
            (user_id = p_user_id)
          )
        ORDER BY created_at DESC
        -- Safety net: Limit to 100 most recent candidates to cap worst-case performance
        -- In production, auto-revocation keeps this low, but this protects against edge cases
        LIMIT 100
        -- CRITICAL: Lock rows to prevent race conditions in concurrent verifications
        -- SKIP LOCKED ensures other requests fail fast instead of waiting
        FOR UPDATE SKIP LOCKED
    ),
    matched_nonce AS (
        -- Now do the expensive bcrypt comparison only on filtered candidates
        SELECT *
        FROM candidate_nonces
        WHERE client_token = extensions.crypt(p_token, client_token)
        LIMIT 1
    ),
    updated_nonce AS (
        -- Update only the matched nonce
        UPDATE public.nonces
        SET verification_attempts        = verification_attempts + 1,
            last_verification_at         = NOW(),
            last_verification_ip         = COALESCE(p_ip, last_verification_ip),
            last_verification_user_agent = COALESCE(p_user_agent, last_verification_user_agent)
        WHERE id = (SELECT id FROM matched_nonce)
        RETURNING *
    )
    SELECT * INTO v_nonce FROM updated_nonce;

    -- Check if nonce exists
    IF v_nonce.id IS NULL THEN
        RETURN jsonb_build_object(
                'valid', false,
                'message', 'Invalid or expired token'
               );
    END IF;

    -- Check if max verification attempts exceeded (using the incremented value)
    IF p_max_verification_attempts > 0 AND v_nonce.verification_attempts > p_max_verification_attempts THEN
        -- Automatically revoke the token
        UPDATE public.nonces
        SET revoked        = TRUE,
            revoked_reason = 'Maximum verification attempts exceeded'
        WHERE id = v_nonce.id;

        RETURN jsonb_build_object(
                'valid', false,
                'message', 'Token revoked due to too many verification attempts',
                'max_attempts_exceeded', true
               );
    END IF;

    -- Check scopes if required
    IF p_required_scopes IS NOT NULL AND array_length(p_required_scopes, 1) > 0 THEN
        -- Fix scope validation to properly check if token scopes contain all required scopes
        -- Using array containment check: array1 @> array2 (array1 contains array2)
        IF NOT (v_nonce.scopes @> p_required_scopes) THEN
            RETURN jsonb_build_object(
                    'valid', false,
                    'message', 'Token does not have required permissions',
                    'token_scopes', v_nonce.scopes,
                    'required_scopes', p_required_scopes
                   );
        END IF;
    END IF;

    -- Mark nonce as used
    UPDATE public.nonces
    SET used_at = NOW()
    WHERE id = v_nonce.id;

    -- Return success with metadata
    RETURN jsonb_build_object(
            'valid', true,
            'user_id', v_nonce.user_id,
            'metadata', v_nonce.metadata,
            'scopes', v_nonce.scopes,
            'purpose', v_nonce.purpose
           );
END;
$$;


ALTER FUNCTION "public"."verify_nonce"("p_token" "text", "p_purpose" "text", "p_user_id" "uuid", "p_required_scopes" "text"[], "p_max_verification_attempts" integer, "p_ip" "inet", "p_user_agent" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."verify_nonce"("p_token" "text", "p_purpose" "text", "p_user_id" "uuid", "p_required_scopes" "text"[], "p_max_verification_attempts" integer, "p_ip" "inet", "p_user_agent" "text") IS 'Verifies a one-time token, checks scopes, and marks it as used';



CREATE TABLE IF NOT EXISTS "public"."accounts_memberships" (
    "user_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "account_role" character varying(50) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."accounts_memberships" OWNER TO "postgres";


COMMENT ON TABLE "public"."accounts_memberships" IS 'The memberships for an account';



COMMENT ON COLUMN "public"."accounts_memberships"."account_id" IS 'The account the membership is for';



COMMENT ON COLUMN "public"."accounts_memberships"."account_role" IS 'The role for the membership';



CREATE TABLE IF NOT EXISTS "public"."ai_cost_configuration" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "model" "text" NOT NULL,
    "input_cost_per_1k_tokens" numeric(10,6) NOT NULL,
    "output_cost_per_1k_tokens" numeric(10,6) NOT NULL,
    "markup_percentage" numeric(5,2) DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "effective_from" timestamp with time zone DEFAULT "now"(),
    "effective_to" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_cost_configuration" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_credit_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "team_id" "uuid",
    "allocation_id" "uuid",
    "amount" numeric(10,4) NOT NULL,
    "transaction_type" "text" NOT NULL,
    "reference_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "description" "text",
    CONSTRAINT "ai_credit_transactions_check" CHECK ((("user_id" IS NOT NULL) OR ("team_id" IS NOT NULL)))
);


ALTER TABLE "public"."ai_credit_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_request_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "team_id" "uuid",
    "request_id" "text",
    "request_timestamp" timestamp with time zone DEFAULT "now"(),
    "provider" "text" NOT NULL,
    "model" "text" NOT NULL,
    "prompt_tokens" integer DEFAULT 0 NOT NULL,
    "completion_tokens" integer DEFAULT 0 NOT NULL,
    "total_tokens" integer DEFAULT 0 NOT NULL,
    "cost" numeric(10,6) DEFAULT 0 NOT NULL,
    "feature" "text",
    "session_id" "text",
    "status" "text" DEFAULT 'completed'::"text",
    "error" "text",
    "portkey_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_request_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_usage_allocations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "team_id" "uuid",
    "credits_allocated" numeric(10,4) DEFAULT 0 NOT NULL,
    "credits_used" numeric(10,4) DEFAULT 0 NOT NULL,
    "allocation_type" "text" NOT NULL,
    "reset_frequency" "text",
    "next_reset_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_usage_allocations_check" CHECK ((("user_id" IS NOT NULL) OR ("team_id" IS NOT NULL))),
    CONSTRAINT "ai_usage_allocations_credits_allocated_check" CHECK (("credits_allocated" >= (0)::numeric)),
    CONSTRAINT "ai_usage_allocations_credits_used_check" CHECK (("credits_used" >= (0)::numeric))
);


ALTER TABLE "public"."ai_usage_allocations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_usage_limits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "team_id" "uuid",
    "limit_type" "text" NOT NULL,
    "time_period" "text" NOT NULL,
    "max_value" numeric(10,4) NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_usage_limits_check" CHECK ((("user_id" IS NOT NULL) OR ("team_id" IS NOT NULL)))
);


ALTER TABLE "public"."ai_usage_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."billing_customers" (
    "account_id" "uuid" NOT NULL,
    "id" integer NOT NULL,
    "email" "text",
    "provider" "public"."billing_provider" NOT NULL,
    "customer_id" "text" NOT NULL
);


ALTER TABLE "public"."billing_customers" OWNER TO "postgres";


COMMENT ON TABLE "public"."billing_customers" IS 'The billing customers for an account';



COMMENT ON COLUMN "public"."billing_customers"."account_id" IS 'The account the billing customer is for';



COMMENT ON COLUMN "public"."billing_customers"."email" IS 'The email of the billing customer';



COMMENT ON COLUMN "public"."billing_customers"."provider" IS 'The provider of the billing customer';



COMMENT ON COLUMN "public"."billing_customers"."customer_id" IS 'The customer ID for the billing customer';



CREATE SEQUENCE IF NOT EXISTS "public"."billing_customers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."billing_customers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."billing_customers_id_seq" OWNED BY "public"."billing_customers"."id";



CREATE TABLE IF NOT EXISTS "public"."building_blocks_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" character varying NOT NULL,
    "audience" "text",
    "presentation_type" character varying,
    "question_type" character varying,
    "situation" "text",
    "complication" "text",
    "answer" "text",
    "outline" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "storyboard" "jsonb"
);


ALTER TABLE "public"."building_blocks_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."certificates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "course_id" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."certificates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."config" (
    "enable_team_accounts" boolean DEFAULT true NOT NULL,
    "enable_account_billing" boolean DEFAULT true NOT NULL,
    "enable_team_account_billing" boolean DEFAULT true NOT NULL,
    "billing_provider" "public"."billing_provider" DEFAULT 'stripe'::"public"."billing_provider" NOT NULL
);


ALTER TABLE "public"."config" OWNER TO "postgres";


COMMENT ON TABLE "public"."config" IS 'Configuration for the Supabase MakerKit.';



COMMENT ON COLUMN "public"."config"."enable_team_accounts" IS 'Enable team accounts';



COMMENT ON COLUMN "public"."config"."enable_account_billing" IS 'Enable billing for individual accounts';



COMMENT ON COLUMN "public"."config"."enable_team_account_billing" IS 'Enable billing for team accounts';



COMMENT ON COLUMN "public"."config"."billing_provider" IS 'The billing provider to use';



CREATE TABLE IF NOT EXISTS "public"."course_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "course_id" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "last_accessed_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "completion_percentage" numeric DEFAULT 0,
    "current_lesson_id" "text",
    "certificate_generated" boolean DEFAULT false
);


ALTER TABLE "public"."course_progress" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."invitations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."invitations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."invitations_id_seq" OWNED BY "public"."invitations"."id";



CREATE TABLE IF NOT EXISTS "public"."lesson_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "course_id" "text" NOT NULL,
    "lesson_id" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "completion_percentage" numeric DEFAULT 0
);


ALTER TABLE "public"."lesson_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maintenance_log" (
    "id" bigint NOT NULL,
    "operation" character varying(100) NOT NULL,
    "status" character varying(20) DEFAULT 'success'::character varying NOT NULL,
    "message" "text",
    "duration_ms" numeric,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."maintenance_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."maintenance_log" IS 'Log table for tracking database maintenance operations and their performance.';



CREATE SEQUENCE IF NOT EXISTS "public"."maintenance_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."maintenance_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."maintenance_log_id_seq" OWNED BY "public"."maintenance_log"."id";



CREATE TABLE IF NOT EXISTS "public"."nonces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_token" "text" NOT NULL,
    "nonce" "text" NOT NULL,
    "user_id" "uuid",
    "purpose" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "used_at" timestamp with time zone,
    "revoked" boolean DEFAULT false NOT NULL,
    "revoked_reason" "text",
    "verification_attempts" integer DEFAULT 0 NOT NULL,
    "last_verification_at" timestamp with time zone,
    "last_verification_ip" "inet",
    "last_verification_user_agent" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "scopes" "text"[] DEFAULT '{}'::"text"[]
);


ALTER TABLE "public"."nonces" OWNER TO "postgres";


COMMENT ON TABLE "public"."nonces" IS 'Table for storing one-time tokens with enhanced security and audit features';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" bigint NOT NULL,
    "account_id" "uuid" NOT NULL,
    "type" "public"."notification_type" DEFAULT 'info'::"public"."notification_type" NOT NULL,
    "body" character varying(5000) NOT NULL,
    "link" character varying(255),
    "channel" "public"."notification_channel" DEFAULT 'in_app'::"public"."notification_channel" NOT NULL,
    "dismissed" boolean DEFAULT false NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '1 mon'::interval),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'The notifications for an account';



COMMENT ON COLUMN "public"."notifications"."account_id" IS 'The account the notification is for (null for system messages)';



COMMENT ON COLUMN "public"."notifications"."type" IS 'The type of the notification';



COMMENT ON COLUMN "public"."notifications"."body" IS 'The body of the notification';



COMMENT ON COLUMN "public"."notifications"."link" IS 'The link for the notification';



COMMENT ON COLUMN "public"."notifications"."channel" IS 'The channel for the notification';



COMMENT ON COLUMN "public"."notifications"."dismissed" IS 'Whether the notification has been dismissed';



COMMENT ON COLUMN "public"."notifications"."expires_at" IS 'The expiry date for the notification';



COMMENT ON COLUMN "public"."notifications"."created_at" IS 'The creation date for the notification';



ALTER TABLE "public"."notifications" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."notifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."onboarding" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "full_name" "text",
    "first_name" "text",
    "last_name" "text",
    "primary_goal" "text",
    "secondary_goals" "jsonb",
    "work_role" "text",
    "work_industry" "text",
    "personal_project" "text",
    "school_level" "text",
    "school_major" "text",
    "theme_preference" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "onboarding_primary_goal_check" CHECK (("primary_goal" = ANY (ARRAY['work'::"text", 'personal'::"text", 'school'::"text"]))),
    CONSTRAINT "onboarding_theme_preference_check" CHECK (("theme_preference" = ANY (ARRAY['dark'::"text", 'light'::"text"])))
);


ALTER TABLE "public"."onboarding" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "text" NOT NULL,
    "order_id" "text" NOT NULL,
    "product_id" "text" NOT NULL,
    "variant_id" "text" NOT NULL,
    "price_amount" numeric,
    "quantity" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."order_items" IS 'The items in an order';



COMMENT ON COLUMN "public"."order_items"."order_id" IS 'The order the item is for';



COMMENT ON COLUMN "public"."order_items"."product_id" IS 'The product ID for the item';



COMMENT ON COLUMN "public"."order_items"."variant_id" IS 'The variant ID for the item';



COMMENT ON COLUMN "public"."order_items"."price_amount" IS 'The price amount for the item';



COMMENT ON COLUMN "public"."order_items"."quantity" IS 'The quantity of the item';



COMMENT ON COLUMN "public"."order_items"."created_at" IS 'The creation date of the item';



COMMENT ON COLUMN "public"."order_items"."updated_at" IS 'The last update date of the item';



CREATE TABLE IF NOT EXISTS "public"."quiz_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "course_id" "text" NOT NULL,
    "lesson_id" "text" NOT NULL,
    "quiz_id" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "score" numeric,
    "passed" boolean,
    "answers" "jsonb"
);


ALTER TABLE "public"."quiz_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "id" bigint NOT NULL,
    "role" character varying(50) NOT NULL,
    "permission" "public"."app_permissions" NOT NULL
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


COMMENT ON TABLE "public"."role_permissions" IS 'The permissions for a role';



COMMENT ON COLUMN "public"."role_permissions"."role" IS 'The role the permission is for';



COMMENT ON COLUMN "public"."role_permissions"."permission" IS 'The permission for the role';



ALTER TABLE "public"."role_permissions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."role_permissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."roles" (
    "name" character varying(50) NOT NULL,
    "hierarchy_level" integer NOT NULL,
    CONSTRAINT "roles_hierarchy_level_check" CHECK (("hierarchy_level" > 0))
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_items" (
    "id" character varying(255) NOT NULL,
    "subscription_id" "text" NOT NULL,
    "product_id" character varying(255) NOT NULL,
    "variant_id" character varying(255) NOT NULL,
    "type" "public"."subscription_item_type" NOT NULL,
    "price_amount" numeric,
    "quantity" integer DEFAULT 1 NOT NULL,
    "interval" character varying(255) NOT NULL,
    "interval_count" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "subscription_items_interval_count_check" CHECK (("interval_count" > 0))
);


ALTER TABLE "public"."subscription_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."subscription_items" IS 'The items in a subscription';



COMMENT ON COLUMN "public"."subscription_items"."subscription_id" IS 'The subscription the item is for';



COMMENT ON COLUMN "public"."subscription_items"."product_id" IS 'The product ID for the item';



COMMENT ON COLUMN "public"."subscription_items"."variant_id" IS 'The variant ID for the item';



COMMENT ON COLUMN "public"."subscription_items"."price_amount" IS 'The price amount for the item';



COMMENT ON COLUMN "public"."subscription_items"."quantity" IS 'The quantity of the item';



COMMENT ON COLUMN "public"."subscription_items"."interval" IS 'The interval for the item';



COMMENT ON COLUMN "public"."subscription_items"."interval_count" IS 'The interval count for the item';



COMMENT ON COLUMN "public"."subscription_items"."created_at" IS 'The creation date of the item';



COMMENT ON COLUMN "public"."subscription_items"."updated_at" IS 'The last update date of the item';



CREATE TABLE IF NOT EXISTS "public"."subtasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "is_completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subtasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."survey_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "survey_id" "text" NOT NULL,
    "current_question_index" integer DEFAULT 0,
    "total_questions" integer NOT NULL,
    "progress_percentage" numeric DEFAULT 0,
    "last_answered_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."survey_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."survey_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "survey_id" "text" NOT NULL,
    "responses" "jsonb" DEFAULT '[]'::"jsonb",
    "category_scores" "jsonb" DEFAULT '{}'::"jsonb",
    "highest_scoring_category" "text",
    "lowest_scoring_category" "text",
    "completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."survey_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "public"."task_status" DEFAULT 'do'::"public"."task_status" NOT NULL,
    "priority" "public"."task_priority" DEFAULT 'medium'::"public"."task_priority" NOT NULL,
    "image_url" "text",
    "account_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."testimonials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_name" character varying(255) NOT NULL,
    "customer_company_name" character varying(255),
    "customer_avatar_url" character varying(255),
    "content" character varying(5000) NOT NULL,
    "link" character varying(2048),
    "video_url" character varying(2048),
    "source" character varying(255) DEFAULT 'manual'::character varying NOT NULL,
    "rating" integer NOT NULL,
    "status" "public"."testimonial_status" DEFAULT 'pending'::"public"."testimonial_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "testimonials_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "valid_link" CHECK ((("link")::"text" ~ '^https?://.*$'::"text")),
    CONSTRAINT "valid_video_url" CHECK ((("video_url")::"text" ~ '^https?://.*$'::"text"))
);


ALTER TABLE "public"."testimonials" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."timezone_cache" AS
 SELECT "name",
    "abbrev",
    "utc_offset",
    "is_dst"
   FROM "pg_timezone_names"
  WHERE (("name" !~~ 'posix/%'::"text") AND ("name" !~~ 'right/%'::"text") AND ("name" !~~ 'Etc/GMT%'::"text"))
  ORDER BY "name"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."timezone_cache" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."timezone_cache" IS 'Cached timezone data to avoid expensive pg_timezone_names filesystem scans. Refresh daily or weekly.';



CREATE OR REPLACE VIEW "public"."timezone_performance_monitor" AS
 SELECT 'pg_timezone_names'::"text" AS "query_type",
    NULL::bigint AS "total_calls",
    NULL::numeric AS "avg_duration_ms",
    NULL::numeric AS "total_duration_ms",
    ( SELECT "count"(*) AS "count"
           FROM "public"."timezone_cache") AS "cached_timezones",
    ( SELECT "count"(*) AS "count"
           FROM "pg_timezone_names") AS "total_timezones",
    "now"() AS "last_checked";


ALTER VIEW "public"."timezone_performance_monitor" OWNER TO "postgres";


COMMENT ON VIEW "public"."timezone_performance_monitor" IS 'Monitor timezone cache status. Note: pg_stat_statements performance metrics not available in managed Supabase.';



CREATE OR REPLACE VIEW "public"."user_account_workspace" WITH ("security_invoker"='true') AS
 SELECT "id",
    "name",
    "picture_url",
    ( SELECT "subscriptions"."status"
           FROM "public"."subscriptions"
          WHERE ("subscriptions"."account_id" = "accounts"."id")
         LIMIT 1) AS "subscription_status"
   FROM "public"."accounts"
  WHERE (("primary_owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("is_personal_account" = true))
 LIMIT 1;


ALTER VIEW "public"."user_account_workspace" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_accounts" WITH ("security_invoker"='true') AS
 SELECT "account"."id",
    "account"."name",
    "account"."picture_url",
    "account"."slug",
    "membership"."account_role" AS "role"
   FROM ("public"."accounts" "account"
     JOIN "public"."accounts_memberships" "membership" ON (("account"."id" = "membership"."account_id")))
  WHERE (("membership"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("account"."is_personal_account" = false) AND ("account"."id" IN ( SELECT "accounts_memberships"."account_id"
           FROM "public"."accounts_memberships"
          WHERE ("accounts_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));


ALTER VIEW "public"."user_accounts" OWNER TO "postgres";


ALTER TABLE ONLY "public"."billing_customers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."billing_customers_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."invitations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."invitations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."maintenance_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."maintenance_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."accounts_memberships"
    ADD CONSTRAINT "accounts_memberships_pkey" PRIMARY KEY ("user_id", "account_id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."ai_cost_configuration"
    ADD CONSTRAINT "ai_cost_configuration_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_cost_configuration"
    ADD CONSTRAINT "ai_cost_configuration_provider_model_effective_from_key" UNIQUE ("provider", "model", "effective_from");



ALTER TABLE ONLY "public"."ai_credit_transactions"
    ADD CONSTRAINT "ai_credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_request_logs"
    ADD CONSTRAINT "ai_request_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_usage_allocations"
    ADD CONSTRAINT "ai_usage_allocations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_usage_limits"
    ADD CONSTRAINT "ai_usage_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_customers"
    ADD CONSTRAINT "billing_customers_account_id_customer_id_provider_key" UNIQUE ("account_id", "customer_id", "provider");



ALTER TABLE ONLY "public"."billing_customers"
    ADD CONSTRAINT "billing_customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."building_blocks_submissions"
    ADD CONSTRAINT "building_blocks_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_progress"
    ADD CONSTRAINT "course_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_progress"
    ADD CONSTRAINT "course_progress_user_id_course_id_key" UNIQUE ("user_id", "course_id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_email_account_id_key" UNIQUE ("email", "account_id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_invite_token_key" UNIQUE ("invite_token");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_user_id_lesson_id_key" UNIQUE ("user_id", "lesson_id");



ALTER TABLE ONLY "public"."maintenance_log"
    ADD CONSTRAINT "maintenance_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nonces"
    ADD CONSTRAINT "nonces_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding"
    ADD CONSTRAINT "onboarding_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding"
    ADD CONSTRAINT "onboarding_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_product_id_variant_id_key" UNIQUE ("order_id", "product_id", "variant_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_user_id_quiz_id_started_at_key" UNIQUE ("user_id", "quiz_id", "started_at");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_permission_key" UNIQUE ("role", "permission");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_hierarchy_level_key" UNIQUE ("hierarchy_level");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("name");



ALTER TABLE ONLY "public"."subscription_items"
    ADD CONSTRAINT "subscription_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_items"
    ADD CONSTRAINT "subscription_items_subscription_id_product_id_variant_id_key" UNIQUE ("subscription_id", "product_id", "variant_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subtasks"
    ADD CONSTRAINT "subtasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."survey_progress"
    ADD CONSTRAINT "survey_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."survey_progress"
    ADD CONSTRAINT "survey_progress_user_id_survey_id_key" UNIQUE ("user_id", "survey_id");



ALTER TABLE ONLY "public"."survey_responses"
    ADD CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."survey_responses"
    ADD CONSTRAINT "survey_responses_user_id_survey_id_key" UNIQUE ("user_id", "survey_id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."testimonials"
    ADD CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_accounts_memberships_account_id_user_id_rls" ON "public"."accounts_memberships" USING "btree" ("account_id", "user_id");



CREATE INDEX "idx_accounts_primary_owner_user_id_rls" ON "public"."accounts" USING "btree" ("primary_owner_user_id") WHERE ("primary_owner_user_id" IS NOT NULL);



CREATE INDEX "idx_ai_credit_transactions_team_id_rls" ON "public"."ai_credit_transactions" USING "btree" ("team_id");



CREATE INDEX "idx_ai_credit_transactions_user_id_rls" ON "public"."ai_credit_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_ai_usage_allocations_team_id_rls" ON "public"."ai_usage_allocations" USING "btree" ("team_id");



CREATE INDEX "idx_ai_usage_allocations_user_id_rls" ON "public"."ai_usage_allocations" USING "btree" ("user_id");



CREATE INDEX "idx_ai_usage_limits_team_id_rls" ON "public"."ai_usage_limits" USING "btree" ("team_id");



CREATE INDEX "idx_ai_usage_limits_user_id_rls" ON "public"."ai_usage_limits" USING "btree" ("user_id");



CREATE INDEX "idx_allocations_active" ON "public"."ai_usage_allocations" USING "btree" ("is_active");



CREATE INDEX "idx_allocations_team_id" ON "public"."ai_usage_allocations" USING "btree" ("team_id") WHERE ("team_id" IS NOT NULL);



CREATE INDEX "idx_allocations_user_id" ON "public"."ai_usage_allocations" USING "btree" ("user_id") WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_building_blocks_submissions_user_id_rls" ON "public"."building_blocks_submissions" USING "btree" ("user_id");



CREATE INDEX "idx_certificates_user_id_rls" ON "public"."certificates" USING "btree" ("user_id");



CREATE INDEX "idx_course_progress_user_id_rls" ON "public"."course_progress" USING "btree" ("user_id");



CREATE INDEX "idx_lesson_progress_user_id_rls" ON "public"."lesson_progress" USING "btree" ("user_id");



CREATE INDEX "idx_maintenance_log_operation_created" ON "public"."maintenance_log" USING "btree" ("operation", "created_at" DESC);



CREATE INDEX "idx_nonces_status" ON "public"."nonces" USING "btree" ("client_token", "user_id", "purpose", "expires_at") WHERE (("used_at" IS NULL) AND ("revoked" = false));



CREATE INDEX "idx_nonces_verify_lookup" ON "public"."nonces" USING "btree" ("purpose", "expires_at" DESC, "user_id") WHERE (("used_at" IS NULL) AND ("revoked" = false));



CREATE INDEX "idx_notifications_account_dismissed" ON "public"."notifications" USING "btree" ("account_id", "dismissed", "expires_at");



CREATE INDEX "idx_onboarding_user_id_rls" ON "public"."onboarding" USING "btree" ("user_id");



CREATE INDEX "idx_quiz_attempts_user_id_rls" ON "public"."quiz_attempts" USING "btree" ("user_id");



CREATE INDEX "idx_request_logs_cost_timestamp" ON "public"."ai_request_logs" USING "btree" ("cost", "request_timestamp");



CREATE INDEX "idx_request_logs_feature" ON "public"."ai_request_logs" USING "btree" ("feature");



CREATE INDEX "idx_request_logs_provider_model" ON "public"."ai_request_logs" USING "btree" ("provider", "model");



CREATE INDEX "idx_request_logs_provider_model_tokens" ON "public"."ai_request_logs" USING "btree" ("provider", "model", "total_tokens");



CREATE INDEX "idx_request_logs_team_id" ON "public"."ai_request_logs" USING "btree" ("team_id");



CREATE INDEX "idx_request_logs_timestamp" ON "public"."ai_request_logs" USING "btree" ("request_timestamp");



CREATE INDEX "idx_request_logs_user_id" ON "public"."ai_request_logs" USING "btree" ("user_id");



CREATE INDEX "idx_subtasks_task_id" ON "public"."subtasks" USING "btree" ("task_id");



CREATE INDEX "idx_survey_progress_survey_id" ON "public"."survey_progress" USING "btree" ("survey_id");



CREATE INDEX "idx_survey_progress_user_id" ON "public"."survey_progress" USING "btree" ("user_id");



CREATE INDEX "idx_survey_responses_survey_id" ON "public"."survey_responses" USING "btree" ("survey_id");



CREATE INDEX "idx_survey_responses_user_id" ON "public"."survey_responses" USING "btree" ("user_id");



CREATE INDEX "idx_tasks_account_id" ON "public"."tasks" USING "btree" ("account_id");



CREATE INDEX "idx_tasks_status" ON "public"."tasks" USING "btree" ("status");



CREATE INDEX "idx_testimonials_source" ON "public"."testimonials" USING "btree" ("rating");



CREATE INDEX "idx_testimonials_status" ON "public"."testimonials" USING "btree" ("status");



CREATE INDEX "idx_timezone_cache_abbrev" ON "public"."timezone_cache" USING "btree" ("abbrev");



CREATE UNIQUE INDEX "idx_timezone_cache_name" ON "public"."timezone_cache" USING "btree" ("name");



CREATE INDEX "idx_transactions_allocation_id" ON "public"."ai_credit_transactions" USING "btree" ("allocation_id");



CREATE INDEX "idx_transactions_created_at" ON "public"."ai_credit_transactions" USING "btree" ("created_at");



CREATE INDEX "idx_transactions_team_id" ON "public"."ai_credit_transactions" USING "btree" ("team_id") WHERE ("team_id" IS NOT NULL);



CREATE INDEX "idx_transactions_type" ON "public"."ai_credit_transactions" USING "btree" ("transaction_type");



CREATE INDEX "idx_transactions_user_id" ON "public"."ai_credit_transactions" USING "btree" ("user_id") WHERE ("user_id" IS NOT NULL);



CREATE INDEX "ix_accounts_is_personal_account" ON "public"."accounts" USING "btree" ("is_personal_account");



CREATE INDEX "ix_accounts_memberships_account_id" ON "public"."accounts_memberships" USING "btree" ("account_id");



CREATE INDEX "ix_accounts_memberships_account_role" ON "public"."accounts_memberships" USING "btree" ("account_role");



CREATE INDEX "ix_accounts_memberships_user_id" ON "public"."accounts_memberships" USING "btree" ("user_id");



CREATE INDEX "ix_accounts_primary_owner_user_id" ON "public"."accounts" USING "btree" ("primary_owner_user_id");



CREATE INDEX "ix_billing_customers_account_id" ON "public"."billing_customers" USING "btree" ("account_id");



CREATE INDEX "ix_invitations_account_id" ON "public"."invitations" USING "btree" ("account_id");



CREATE INDEX "ix_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "ix_orders_account_id" ON "public"."orders" USING "btree" ("account_id");



CREATE INDEX "ix_role_permissions_role" ON "public"."role_permissions" USING "btree" ("role");



CREATE INDEX "ix_subscription_items_subscription_id" ON "public"."subscription_items" USING "btree" ("subscription_id");



CREATE INDEX "ix_subscriptions_account_id" ON "public"."subscriptions" USING "btree" ("account_id");



CREATE UNIQUE INDEX "unique_personal_account" ON "public"."accounts" USING "btree" ("primary_owner_user_id") WHERE ("is_personal_account" = true);



CREATE OR REPLACE TRIGGER "accounts_memberships_set_timestamps" BEFORE INSERT OR UPDATE ON "public"."accounts_memberships" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamps"();



CREATE OR REPLACE TRIGGER "accounts_memberships_set_user_tracking" BEFORE INSERT OR UPDATE ON "public"."accounts_memberships" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_user_tracking"();



CREATE OR REPLACE TRIGGER "accounts_set_timestamps" BEFORE INSERT OR UPDATE ON "public"."accounts" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamps"();



CREATE OR REPLACE TRIGGER "accounts_set_user_tracking" BEFORE INSERT OR UPDATE ON "public"."accounts" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_user_tracking"();



CREATE OR REPLACE TRIGGER "accounts_teardown" AFTER DELETE ON "public"."accounts" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('http://host.docker.internal:3000/api/db/webhook', 'POST', '{"Content-Type":"application/json", "X-Supabase-Event-Signature":"WEBHOOKSECRET"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "add_current_user_to_new_account" AFTER INSERT ON "public"."accounts" FOR EACH ROW WHEN (("new"."is_personal_account" = false)) EXECUTE FUNCTION "kit"."add_current_user_to_new_account"();



CREATE OR REPLACE TRIGGER "handle_subtasks_updated_at" BEFORE UPDATE ON "public"."subtasks" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_tasks_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "invitations_insert" AFTER INSERT ON "public"."invitations" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('http://host.docker.internal:3000/api/db/webhook', 'POST', '{"Content-Type":"application/json", "X-Supabase-Event-Signature":"WEBHOOKSECRET"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "invitations_set_timestamps" BEFORE INSERT OR UPDATE ON "public"."invitations" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamps"();



CREATE OR REPLACE TRIGGER "only_team_accounts_check" BEFORE INSERT OR UPDATE ON "public"."invitations" FOR EACH ROW EXECUTE FUNCTION "kit"."check_team_account"();



CREATE OR REPLACE TRIGGER "order_items_set_timestamps" BEFORE INSERT OR UPDATE ON "public"."order_items" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamps"();



CREATE OR REPLACE TRIGGER "orders_set_timestamps" BEFORE INSERT OR UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamps"();



CREATE OR REPLACE TRIGGER "prevent_account_owner_membership_delete_check" BEFORE DELETE ON "public"."accounts_memberships" FOR EACH ROW EXECUTE FUNCTION "kit"."prevent_account_owner_membership_delete"();



CREATE OR REPLACE TRIGGER "prevent_memberships_update_check" BEFORE UPDATE ON "public"."accounts_memberships" FOR EACH ROW EXECUTE FUNCTION "kit"."prevent_memberships_update"();



CREATE OR REPLACE TRIGGER "protect_account_fields" BEFORE UPDATE ON "public"."accounts" FOR EACH ROW EXECUTE FUNCTION "kit"."protect_account_fields"();



CREATE OR REPLACE TRIGGER "set_ai_allocation_reset_time" BEFORE INSERT ON "public"."ai_usage_allocations" FOR EACH ROW WHEN (("new"."reset_frequency" IS NOT NULL)) EXECUTE FUNCTION "public"."set_next_reset_time"();



CREATE OR REPLACE TRIGGER "set_slug_from_account_name" BEFORE INSERT ON "public"."accounts" FOR EACH ROW WHEN ((("new"."name" IS NOT NULL) AND ("new"."slug" IS NULL) AND ("new"."is_personal_account" = false))) EXECUTE FUNCTION "kit"."set_slug_from_account_name"();



CREATE OR REPLACE TRIGGER "subscription_items_set_timestamps" BEFORE INSERT OR UPDATE ON "public"."subscription_items" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamps"();



CREATE OR REPLACE TRIGGER "subscriptions_delete" AFTER DELETE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('http://host.docker.internal:3000/api/db/webhook', 'POST', '{"Content-Type":"application/json", "X-Supabase-Event-Signature":"WEBHOOKSECRET"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "subscriptions_set_timestamps" BEFORE INSERT OR UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamps"();



CREATE OR REPLACE TRIGGER "update_notification_dismissed_status" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "kit"."update_notification_dismissed_status"();



CREATE OR REPLACE TRIGGER "update_slug_from_account_name" BEFORE UPDATE ON "public"."accounts" FOR EACH ROW WHEN ((("new"."name" IS NOT NULL) AND (("new"."name")::"text" <> ("old"."name")::"text") AND ("new"."is_personal_account" = false))) EXECUTE FUNCTION "kit"."set_slug_from_account_name"();



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."accounts_memberships"
    ADD CONSTRAINT "accounts_memberships_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."accounts_memberships"
    ADD CONSTRAINT "accounts_memberships_account_role_fkey" FOREIGN KEY ("account_role") REFERENCES "public"."roles"("name");



ALTER TABLE ONLY "public"."accounts_memberships"
    ADD CONSTRAINT "accounts_memberships_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."accounts_memberships"
    ADD CONSTRAINT "accounts_memberships_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."accounts_memberships"
    ADD CONSTRAINT "accounts_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_primary_owner_user_id_fkey" FOREIGN KEY ("primary_owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_credit_transactions"
    ADD CONSTRAINT "ai_credit_transactions_allocation_id_fkey" FOREIGN KEY ("allocation_id") REFERENCES "public"."ai_usage_allocations"("id");



ALTER TABLE ONLY "public"."ai_credit_transactions"
    ADD CONSTRAINT "ai_credit_transactions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."accounts"("id");



ALTER TABLE ONLY "public"."ai_credit_transactions"
    ADD CONSTRAINT "ai_credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_request_logs"
    ADD CONSTRAINT "ai_request_logs_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_request_logs"
    ADD CONSTRAINT "ai_request_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_usage_allocations"
    ADD CONSTRAINT "ai_usage_allocations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."accounts"("id");



ALTER TABLE ONLY "public"."ai_usage_allocations"
    ADD CONSTRAINT "ai_usage_allocations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_usage_limits"
    ADD CONSTRAINT "ai_usage_limits_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."accounts"("id");



ALTER TABLE ONLY "public"."ai_usage_limits"
    ADD CONSTRAINT "ai_usage_limits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."billing_customers"
    ADD CONSTRAINT "billing_customers_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."building_blocks_submissions"
    ADD CONSTRAINT "building_blocks_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_progress"
    ADD CONSTRAINT "course_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_role_fkey" FOREIGN KEY ("role") REFERENCES "public"."roles"("name");



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nonces"
    ADD CONSTRAINT "nonces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."onboarding"
    ADD CONSTRAINT "onboarding_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_billing_customer_id_fkey" FOREIGN KEY ("billing_customer_id") REFERENCES "public"."billing_customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_fkey" FOREIGN KEY ("role") REFERENCES "public"."roles"("name");



ALTER TABLE ONLY "public"."subscription_items"
    ADD CONSTRAINT "subscription_items_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_billing_customer_id_fkey" FOREIGN KEY ("billing_customer_id") REFERENCES "public"."billing_customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subtasks"
    ADD CONSTRAINT "subtasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."survey_progress"
    ADD CONSTRAINT "survey_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."survey_responses"
    ADD CONSTRAINT "survey_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can read approved testimonials" ON "public"."testimonials" FOR SELECT TO "anon", "authenticated" USING (("status" = 'approved'::"public"."testimonial_status"));



CREATE POLICY "Authenticated users can insert certificates" ON "public"."certificates" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Service role can do all operations on ai_cost_configuration" ON "public"."ai_cost_configuration" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can do all operations on ai_credit_transactions" ON "public"."ai_credit_transactions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can do all operations on ai_request_logs" ON "public"."ai_request_logs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can do all operations on ai_usage_allocations" ON "public"."ai_usage_allocations" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can do all operations on ai_usage_limits" ON "public"."ai_usage_limits" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can create their own building blocks submissions" ON "public"."building_blocks_submissions" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can create their own course progress" ON "public"."course_progress" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can create their own lesson progress" ON "public"."lesson_progress" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can create their own quiz attempts" ON "public"."quiz_attempts" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own building blocks submissions" ON "public"."building_blocks_submissions" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage subtasks of their tasks" ON "public"."subtasks" USING ((EXISTS ( SELECT 1
   FROM "public"."tasks"
  WHERE (("tasks"."id" = "subtasks"."task_id") AND ("tasks"."account_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."tasks"
  WHERE (("tasks"."id" = "subtasks"."task_id") AND ("tasks"."account_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can manage their own tasks" ON "public"."tasks" USING (("account_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("account_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can read their own nonces" ON "public"."nonces" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update their own building blocks submissions" ON "public"."building_blocks_submissions" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own course progress" ON "public"."course_progress" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own lesson progress" ON "public"."lesson_progress" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own quiz attempts" ON "public"."quiz_attempts" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own building blocks submissions" ON "public"."building_blocks_submissions" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own certificates" ON "public"."certificates" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own course progress" ON "public"."course_progress" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own lesson progress" ON "public"."lesson_progress" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own quiz attempts" ON "public"."quiz_attempts" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."accounts_memberships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "accounts_memberships_delete" ON "public"."accounts_memberships" FOR DELETE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."can_action_account_member"("account_id", "user_id")));



CREATE POLICY "accounts_memberships_select_policy" ON "public"."accounts_memberships" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR "public"."is_team_member"("account_id", "user_id") OR "public"."is_super_admin"()));



CREATE POLICY "accounts_select_policy" ON "public"."accounts" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "primary_owner_user_id") OR "public"."has_role_on_account"("id") OR "public"."is_account_team_member"("id") OR "public"."is_super_admin"()));



CREATE POLICY "accounts_self_update" ON "public"."accounts" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "primary_owner_user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "primary_owner_user_id"));



ALTER TABLE "public"."ai_cost_configuration" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_cost_configuration_delete_policy" ON "public"."ai_cost_configuration" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."accounts_memberships"
  WHERE (("accounts_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (("accounts_memberships"."account_role")::"text" = 'owner'::"text")))));



CREATE POLICY "ai_cost_configuration_insert_policy" ON "public"."ai_cost_configuration" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."accounts_memberships"
  WHERE (("accounts_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (("accounts_memberships"."account_role")::"text" = 'owner'::"text")))));



CREATE POLICY "ai_cost_configuration_select_policy" ON "public"."ai_cost_configuration" FOR SELECT USING (true);



CREATE POLICY "ai_cost_configuration_update_policy" ON "public"."ai_cost_configuration" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."accounts_memberships"
  WHERE (("accounts_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (("accounts_memberships"."account_role")::"text" = 'owner'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."accounts_memberships"
  WHERE (("accounts_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (("accounts_memberships"."account_role")::"text" = 'owner'::"text")))));



ALTER TABLE "public"."ai_credit_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_credit_transactions_select_policy" ON "public"."ai_credit_transactions" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (("team_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."accounts_memberships"
  WHERE (("accounts_memberships"."account_id" = "ai_credit_transactions"."team_id") AND ("accounts_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) OR (EXISTS ( SELECT 1
   FROM "public"."accounts_memberships"
  WHERE (("accounts_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (("accounts_memberships"."account_role")::"text" = 'owner'::"text"))))));



ALTER TABLE "public"."ai_request_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_request_logs_insert_policy" ON "public"."ai_request_logs" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."accounts_memberships"
  WHERE (("accounts_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (("accounts_memberships"."account_role")::"text" = 'owner'::"text"))))));



CREATE POLICY "ai_request_logs_select_policy" ON "public"."ai_request_logs" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."accounts_memberships"
  WHERE (("accounts_memberships"."account_id" = "ai_request_logs"."team_id") AND ("accounts_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) OR (EXISTS ( SELECT 1
   FROM "public"."accounts_memberships"
  WHERE (("accounts_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (("accounts_memberships"."account_role")::"text" = 'owner'::"text"))))));



ALTER TABLE "public"."ai_usage_allocations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_usage_allocations_select_policy" ON "public"."ai_usage_allocations" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (("team_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."accounts_memberships"
  WHERE (("accounts_memberships"."account_id" = "ai_usage_allocations"."team_id") AND ("accounts_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) OR (EXISTS ( SELECT 1
   FROM "public"."accounts_memberships"
  WHERE (("accounts_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (("accounts_memberships"."account_role")::"text" = 'owner'::"text"))))));



ALTER TABLE "public"."ai_usage_limits" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_usage_limits_select_policy" ON "public"."ai_usage_limits" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (("team_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."accounts_memberships"
  WHERE (("accounts_memberships"."account_id" = "ai_usage_limits"."team_id") AND ("accounts_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) OR (EXISTS ( SELECT 1
   FROM "public"."accounts_memberships"
  WHERE (("accounts_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (("accounts_memberships"."account_role")::"text" = 'owner'::"text"))))));



ALTER TABLE "public"."billing_customers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "billing_customers_read_self" ON "public"."billing_customers" FOR SELECT TO "authenticated" USING ((("account_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."has_role_on_account"("account_id")));



ALTER TABLE "public"."building_blocks_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."certificates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."course_progress" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "create_org_account" ON "public"."accounts" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_set"('enable_team_accounts'::"text") AND ("is_personal_account" = false)));



CREATE POLICY "insert_onboarding" ON "public"."onboarding" FOR INSERT WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invitations_create_self" ON "public"."invitations" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_set"('enable_team_accounts'::"text") AND "public"."has_permission"(( SELECT "auth"."uid"() AS "uid"), "account_id", 'invites.manage'::"public"."app_permissions") AND ("public"."has_more_elevated_role"(( SELECT "auth"."uid"() AS "uid"), "account_id", "role") OR "public"."has_same_role_hierarchy_level"(( SELECT "auth"."uid"() AS "uid"), "account_id", "role"))));



CREATE POLICY "invitations_delete" ON "public"."invitations" FOR DELETE TO "authenticated" USING (("public"."has_role_on_account"("account_id") AND "public"."has_permission"(( SELECT "auth"."uid"() AS "uid"), "account_id", 'invites.manage'::"public"."app_permissions")));



CREATE POLICY "invitations_select_policy" ON "public"."invitations" FOR SELECT TO "authenticated" USING ((("public"."is_set"('enable_team_accounts'::"text") AND "public"."has_permission"(( SELECT "auth"."uid"() AS "uid"), "account_id", 'invites.manage'::"public"."app_permissions")) OR "public"."is_super_admin"()));



CREATE POLICY "invitations_update" ON "public"."invitations" FOR UPDATE TO "authenticated" USING (("public"."has_permission"(( SELECT "auth"."uid"() AS "uid"), "account_id", 'invites.manage'::"public"."app_permissions") AND "public"."has_more_elevated_role"(( SELECT "auth"."uid"() AS "uid"), "account_id", "role"))) WITH CHECK (("public"."has_permission"(( SELECT "auth"."uid"() AS "uid"), "account_id", 'invites.manage'::"public"."app_permissions") AND "public"."has_more_elevated_role"(( SELECT "auth"."uid"() AS "uid"), "account_id", "role")));



ALTER TABLE "public"."lesson_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nonces" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_read_self" ON "public"."notifications" FOR SELECT TO "authenticated" USING ((("account_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."has_role_on_account"("account_id")));



CREATE POLICY "notifications_update_self" ON "public"."notifications" FOR UPDATE TO "authenticated" USING ((("account_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."has_role_on_account"("account_id")));



ALTER TABLE "public"."onboarding" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "order_items_select_policy" ON "public"."order_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_items"."order_id") AND (("orders"."account_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."has_role_on_account"("orders"."account_id") OR "public"."is_super_admin"())))));



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orders_select_policy" ON "public"."orders" FOR SELECT TO "authenticated" USING (((("account_id" = ( SELECT "auth"."uid"() AS "uid")) AND "public"."is_set"('enable_account_billing'::"text")) OR ("public"."has_role_on_account"("account_id") AND "public"."is_set"('enable_team_account_billing'::"text")) OR "public"."is_super_admin"()));



CREATE POLICY "public config can be read by authenticated users" ON "public"."config" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."quiz_attempts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "read_onboarding" ON "public"."onboarding" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "restrict_mfa_accounts" ON "public"."accounts" AS RESTRICTIVE TO "authenticated" USING ("public"."is_mfa_compliant"());



CREATE POLICY "restrict_mfa_accounts_memberships" ON "public"."accounts_memberships" AS RESTRICTIVE TO "authenticated" USING ("public"."is_mfa_compliant"());



CREATE POLICY "restrict_mfa_invitations" ON "public"."invitations" AS RESTRICTIVE TO "authenticated" USING ("public"."is_mfa_compliant"());



CREATE POLICY "restrict_mfa_notifications" ON "public"."notifications" AS RESTRICTIVE TO "authenticated" USING ("public"."is_mfa_compliant"());



CREATE POLICY "restrict_mfa_order_items" ON "public"."order_items" AS RESTRICTIVE TO "authenticated" USING ("public"."is_mfa_compliant"());



CREATE POLICY "restrict_mfa_orders" ON "public"."orders" AS RESTRICTIVE TO "authenticated" USING ("public"."is_mfa_compliant"());



CREATE POLICY "restrict_mfa_role_permissions" ON "public"."role_permissions" AS RESTRICTIVE TO "authenticated" USING ("public"."is_mfa_compliant"());



CREATE POLICY "restrict_mfa_subscription_items" ON "public"."subscription_items" AS RESTRICTIVE TO "authenticated" USING ("public"."is_mfa_compliant"());



CREATE POLICY "restrict_mfa_subscriptions" ON "public"."subscriptions" AS RESTRICTIVE TO "authenticated" USING ("public"."is_mfa_compliant"());



ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "role_permissions_select_policy" ON "public"."role_permissions" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "roles_read" ON "public"."roles" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."subscription_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscription_items_select_policy" ON "public"."subscription_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."subscriptions"
  WHERE (("subscriptions"."id" = "subscription_items"."subscription_id") AND (("subscriptions"."account_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."has_role_on_account"("subscriptions"."account_id") OR "public"."is_super_admin"())))));



ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscriptions_select_policy" ON "public"."subscriptions" FOR SELECT TO "authenticated" USING ((("public"."has_role_on_account"("account_id") AND "public"."is_set"('enable_team_account_billing'::"text")) OR (("account_id" = ( SELECT "auth"."uid"() AS "uid")) AND "public"."is_set"('enable_account_billing'::"text")) OR "public"."is_super_admin"()));



ALTER TABLE "public"."subtasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."survey_progress" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "survey_progress_insert_policy" ON "public"."survey_progress" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR "public"."is_super_admin"()));



CREATE POLICY "survey_progress_select_policy" ON "public"."survey_progress" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR "public"."is_super_admin"()));



CREATE POLICY "survey_progress_update_policy" ON "public"."survey_progress" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR "public"."is_super_admin"())) WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR "public"."is_super_admin"()));



ALTER TABLE "public"."survey_responses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "survey_responses_insert_policy" ON "public"."survey_responses" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR "public"."is_super_admin"()));



CREATE POLICY "survey_responses_select_policy" ON "public"."survey_responses" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR "public"."is_super_admin"()));



CREATE POLICY "survey_responses_update_policy" ON "public"."survey_responses" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR "public"."is_super_admin"())) WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR "public"."is_super_admin"()));



ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "team_accounts_delete_policy" ON "public"."accounts" FOR DELETE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "primary_owner_user_id") AND ("is_personal_account" = false)));



ALTER TABLE "public"."testimonials" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_onboarding" ON "public"."onboarding" FOR UPDATE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";






GRANT USAGE ON SCHEMA "kit" TO "supabase_auth_admin";






REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";
GRANT USAGE ON SCHEMA "public" TO "anon";



















































































































































SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
























REVOKE ALL ON FUNCTION "kit"."add_current_user_to_new_account"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "kit"."check_team_account"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "kit"."cleanup_expired_nonces"("p_older_than_days" integer, "p_include_used" boolean, "p_include_revoked" boolean) FROM PUBLIC;



REVOKE ALL ON FUNCTION "kit"."get_storage_filename_as_uuid"("name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "kit"."get_storage_filename_as_uuid"("name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "kit"."get_storage_filename_as_uuid"("name" "text") TO "service_role";



REVOKE ALL ON FUNCTION "kit"."handle_update_user_email"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "kit"."prevent_account_owner_membership_delete"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "kit"."prevent_memberships_update"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "kit"."protect_account_fields"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "kit"."set_slug_from_account_name"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "kit"."setup_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "kit"."setup_new_user"() TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "kit"."slugify"("value" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "kit"."slugify"("value" "text") TO "service_role";
GRANT ALL ON FUNCTION "kit"."slugify"("value" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "kit"."update_notification_dismissed_status"() FROM PUBLIC;









REVOKE ALL ON FUNCTION "payload"."collection_has_download"("collection_id" "text", "collection_type" "text", "download_id" "text") FROM PUBLIC;



REVOKE ALL ON FUNCTION "payload"."ensure_downloads_id_column"("table_name" "text") FROM PUBLIC;



REVOKE ALL ON FUNCTION "payload"."ensure_downloads_id_column_exists"("table_name" "text") FROM PUBLIC;



REVOKE ALL ON FUNCTION "payload"."ensure_relationship_columns"("table_name" "text") FROM PUBLIC;



REVOKE ALL ON FUNCTION "payload"."fix_dynamic_table"("table_name" "text") FROM PUBLIC;



REVOKE ALL ON FUNCTION "payload"."get_downloads_for_collection"("collection_id" "text", "collection_type" "text") FROM PUBLIC;



REVOKE ALL ON FUNCTION "payload"."get_relationship_data"("table_name" "text", "id" "text", "fallback_column" "text") FROM PUBLIC;



REVOKE ALL ON FUNCTION "payload"."safe_uuid_conversion"("text_value" "text") FROM PUBLIC;












REVOKE ALL ON FUNCTION "public"."accept_invitation"("token" "text", "user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."accept_invitation"("token" "text", "user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."accept_invitation"("token" "text", "user_id" "uuid") TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."add_default_ai_allocations_for_existing_users"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."add_default_ai_allocations_for_existing_users"() TO "service_role";
GRANT ALL ON FUNCTION "public"."add_default_ai_allocations_for_existing_users"() TO "supabase_auth_admin";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."invitations" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."invitations" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."invitations" TO "service_role";



REVOKE ALL ON FUNCTION "public"."add_invitations_to_account"("account_slug" "text", "invitations" "public"."invitation"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."add_invitations_to_account"("account_slug" "text", "invitations" "public"."invitation"[]) TO "service_role";
GRANT ALL ON FUNCTION "public"."add_invitations_to_account"("account_slug" "text", "invitations" "public"."invitation"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_invitations_to_account"("account_slug" "text", "invitations" "public"."invitation"[]) TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."calculate_ai_cost"("p_provider" "text", "p_model" "text", "p_prompt_tokens" integer, "p_completion_tokens" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."calculate_ai_cost"("p_provider" "text", "p_model" "text", "p_prompt_tokens" integer, "p_completion_tokens" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."calculate_ai_cost"("p_provider" "text", "p_model" "text", "p_prompt_tokens" integer, "p_completion_tokens" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_ai_cost"("p_provider" "text", "p_model" "text", "p_prompt_tokens" integer, "p_completion_tokens" integer) TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."can_action_account_member"("target_team_account_id" "uuid", "target_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_action_account_member"("target_team_account_id" "uuid", "target_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."can_action_account_member"("target_team_account_id" "uuid", "target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_action_account_member"("target_team_account_id" "uuid", "target_user_id" "uuid") TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."check_ai_usage_limits"("p_entity_type" "text", "p_entity_id" "uuid", "p_cost" numeric, "p_tokens" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_ai_usage_limits"("p_entity_type" "text", "p_entity_id" "uuid", "p_cost" numeric, "p_tokens" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."check_ai_usage_limits"("p_entity_type" "text", "p_entity_id" "uuid", "p_cost" numeric, "p_tokens" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_ai_usage_limits"("p_entity_type" "text", "p_entity_id" "uuid", "p_cost" numeric, "p_tokens" integer) TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."check_is_aal2"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_is_aal2"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_default_ai_allocation"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_default_ai_allocation"() TO "service_role";
GRANT ALL ON FUNCTION "public"."create_default_ai_allocation"() TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."create_invitation"("account_id" "uuid", "email" "text", "role" character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_invitation"("account_id" "uuid", "email" "text", "role" character varying) TO "service_role";
GRANT ALL ON FUNCTION "public"."create_invitation"("account_id" "uuid", "email" "text", "role" character varying) TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."create_nonce"("p_user_id" "uuid", "p_purpose" "text", "p_expires_in_seconds" integer, "p_metadata" "jsonb", "p_scopes" "text"[], "p_revoke_previous" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_nonce"("p_user_id" "uuid", "p_purpose" "text", "p_expires_in_seconds" integer, "p_metadata" "jsonb", "p_scopes" "text"[], "p_revoke_previous" boolean) TO "service_role";
GRANT ALL ON FUNCTION "public"."create_nonce"("p_user_id" "uuid", "p_purpose" "text", "p_expires_in_seconds" integer, "p_metadata" "jsonb", "p_scopes" "text"[], "p_revoke_previous" boolean) TO "supabase_auth_admin";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."accounts" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."accounts" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."accounts" TO "service_role";
GRANT SELECT,INSERT ON TABLE "public"."accounts" TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."create_team_account"("account_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_team_account"("account_name" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."create_team_account"("account_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_team_account"("account_name" "text") TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."deduct_ai_credits"("p_entity_type" "text", "p_entity_id" "uuid", "p_amount" numeric, "p_feature" "text", "p_request_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."deduct_ai_credits"("p_entity_type" "text", "p_entity_id" "uuid", "p_amount" numeric, "p_feature" "text", "p_request_id" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."deduct_ai_credits"("p_entity_type" "text", "p_entity_id" "uuid", "p_amount" numeric, "p_feature" "text", "p_request_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_ai_credits"("p_entity_type" "text", "p_entity_id" "uuid", "p_amount" numeric, "p_feature" "text", "p_request_id" "text") TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."get_account_invitations"("account_slug" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_account_invitations"("account_slug" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_account_invitations"("account_slug" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_account_invitations"("account_slug" "text") TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."get_account_members"("account_slug" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_account_members"("account_slug" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_account_members"("account_slug" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_account_members"("account_slug" "text") TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."get_config"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_config"() TO "service_role";
GRANT ALL ON FUNCTION "public"."get_config"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_config"() TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."get_is_super_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_is_super_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_nonce_status"("p_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_nonce_status"("p_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_nonce_status"("p_id" "uuid") TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."get_upper_system_role"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_upper_system_role"() TO "service_role";
GRANT ALL ON FUNCTION "public"."get_upper_system_role"() TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."handle_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."has_active_subscription"("target_account_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_active_subscription"("target_account_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."has_active_subscription"("target_account_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_active_subscription"("target_account_id" "uuid") TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."has_more_elevated_role"("target_user_id" "uuid", "target_account_id" "uuid", "role_name" character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_more_elevated_role"("target_user_id" "uuid", "target_account_id" "uuid", "role_name" character varying) TO "service_role";
GRANT ALL ON FUNCTION "public"."has_more_elevated_role"("target_user_id" "uuid", "target_account_id" "uuid", "role_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_more_elevated_role"("target_user_id" "uuid", "target_account_id" "uuid", "role_name" character varying) TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."has_permission"("user_id" "uuid", "account_id" "uuid", "permission_name" "public"."app_permissions") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_permission"("user_id" "uuid", "account_id" "uuid", "permission_name" "public"."app_permissions") TO "service_role";
GRANT ALL ON FUNCTION "public"."has_permission"("user_id" "uuid", "account_id" "uuid", "permission_name" "public"."app_permissions") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_permission"("user_id" "uuid", "account_id" "uuid", "permission_name" "public"."app_permissions") TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."has_role_on_account"("account_id" "uuid", "account_role" character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_role_on_account"("account_id" "uuid", "account_role" character varying) TO "service_role";
GRANT ALL ON FUNCTION "public"."has_role_on_account"("account_id" "uuid", "account_role" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role_on_account"("account_id" "uuid", "account_role" character varying) TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."has_same_role_hierarchy_level"("target_user_id" "uuid", "target_account_id" "uuid", "role_name" character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_same_role_hierarchy_level"("target_user_id" "uuid", "target_account_id" "uuid", "role_name" character varying) TO "service_role";
GRANT ALL ON FUNCTION "public"."has_same_role_hierarchy_level"("target_user_id" "uuid", "target_account_id" "uuid", "role_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_same_role_hierarchy_level"("target_user_id" "uuid", "target_account_id" "uuid", "role_name" character varying) TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."insert_certificate"("p_user_id" "uuid", "p_course_id" "text", "p_file_path" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."insert_certificate"("p_user_id" "uuid", "p_course_id" "text", "p_file_path" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."insert_certificate"("p_user_id" "uuid", "p_course_id" "text", "p_file_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_certificate"("p_user_id" "uuid", "p_course_id" "text", "p_file_path" "text") TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."is_aal2"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_aal2"() TO "service_role";
GRANT ALL ON FUNCTION "public"."is_aal2"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_aal2"() TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."is_account_owner"("account_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_account_owner"("account_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."is_account_owner"("account_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_account_owner"("account_id" "uuid") TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."is_account_team_member"("target_account_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_account_team_member"("target_account_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."is_account_team_member"("target_account_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_account_team_member"("target_account_id" "uuid") TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."is_mfa_compliant"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_mfa_compliant"() TO "service_role";
GRANT ALL ON FUNCTION "public"."is_mfa_compliant"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_mfa_compliant"() TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."is_set"("field_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_set"("field_name" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."is_set"("field_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_set"("field_name" "text") TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."is_super_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "service_role";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."is_team_member"("account_id" "uuid", "user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_team_member"("account_id" "uuid", "user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."is_team_member"("account_id" "uuid", "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_team_member"("account_id" "uuid", "user_id" "uuid") TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."refresh_timezone_cache"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."refresh_timezone_cache"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."reset_ai_allocations"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reset_ai_allocations"() TO "service_role";
GRANT ALL ON FUNCTION "public"."reset_ai_allocations"() TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."revoke_nonce"("p_id" "uuid", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."revoke_nonce"("p_id" "uuid", "p_reason" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."revoke_nonce"("p_id" "uuid", "p_reason" "text") TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."set_next_reset_time"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_next_reset_time"() TO "service_role";
GRANT ALL ON FUNCTION "public"."set_next_reset_time"() TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."team_account_workspace"("account_slug" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."team_account_workspace"("account_slug" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."team_account_workspace"("account_slug" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."team_account_workspace"("account_slug" "text") TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."transfer_team_account_ownership"("target_account_id" "uuid", "new_owner_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."transfer_team_account_ownership"("target_account_id" "uuid", "new_owner_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."transfer_team_account_ownership"("target_account_id" "uuid", "new_owner_id" "uuid") TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."trigger_set_timestamps"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."trigger_set_timestamps"() TO "service_role";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamps"() TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."trigger_set_user_tracking"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."trigger_set_user_tracking"() TO "service_role";
GRANT ALL ON FUNCTION "public"."trigger_set_user_tracking"() TO "supabase_auth_admin";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."orders" TO "anon";
GRANT SELECT ON TABLE "public"."orders" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."orders" TO "service_role";



REVOKE ALL ON FUNCTION "public"."upsert_order"("target_account_id" "uuid", "target_customer_id" character varying, "target_order_id" "text", "status" "public"."payment_status", "billing_provider" "public"."billing_provider", "total_amount" numeric, "currency" character varying, "line_items" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."upsert_order"("target_account_id" "uuid", "target_customer_id" character varying, "target_order_id" "text", "status" "public"."payment_status", "billing_provider" "public"."billing_provider", "total_amount" numeric, "currency" character varying, "line_items" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."upsert_order"("target_account_id" "uuid", "target_customer_id" character varying, "target_order_id" "text", "status" "public"."payment_status", "billing_provider" "public"."billing_provider", "total_amount" numeric, "currency" character varying, "line_items" "jsonb") TO "supabase_auth_admin";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."subscriptions" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."subscriptions" TO "service_role";
GRANT SELECT ON TABLE "public"."subscriptions" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."upsert_subscription"("target_account_id" "uuid", "target_customer_id" character varying, "target_subscription_id" "text", "active" boolean, "status" "public"."subscription_status", "billing_provider" "public"."billing_provider", "cancel_at_period_end" boolean, "currency" character varying, "period_starts_at" timestamp with time zone, "period_ends_at" timestamp with time zone, "line_items" "jsonb", "trial_starts_at" timestamp with time zone, "trial_ends_at" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."upsert_subscription"("target_account_id" "uuid", "target_customer_id" character varying, "target_subscription_id" "text", "active" boolean, "status" "public"."subscription_status", "billing_provider" "public"."billing_provider", "cancel_at_period_end" boolean, "currency" character varying, "period_starts_at" timestamp with time zone, "period_ends_at" timestamp with time zone, "line_items" "jsonb", "trial_starts_at" timestamp with time zone, "trial_ends_at" timestamp with time zone) TO "service_role";
GRANT ALL ON FUNCTION "public"."upsert_subscription"("target_account_id" "uuid", "target_customer_id" character varying, "target_subscription_id" "text", "active" boolean, "status" "public"."subscription_status", "billing_provider" "public"."billing_provider", "cancel_at_period_end" boolean, "currency" character varying, "period_starts_at" timestamp with time zone, "period_ends_at" timestamp with time zone, "line_items" "jsonb", "trial_starts_at" timestamp with time zone, "trial_ends_at" timestamp with time zone) TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."verify_nonce"("p_token" "text", "p_purpose" "text", "p_user_id" "uuid", "p_required_scopes" "text"[], "p_max_verification_attempts" integer, "p_ip" "inet", "p_user_agent" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."verify_nonce"("p_token" "text", "p_purpose" "text", "p_user_id" "uuid", "p_required_scopes" "text"[], "p_max_verification_attempts" integer, "p_ip" "inet", "p_user_agent" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."verify_nonce"("p_token" "text", "p_purpose" "text", "p_user_id" "uuid", "p_required_scopes" "text"[], "p_max_verification_attempts" integer, "p_ip" "inet", "p_user_agent" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_nonce"("p_token" "text", "p_purpose" "text", "p_user_id" "uuid", "p_required_scopes" "text"[], "p_max_verification_attempts" integer, "p_ip" "inet", "p_user_agent" "text") TO "supabase_auth_admin";






























GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."accounts_memberships" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."accounts_memberships" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."accounts_memberships" TO "service_role";
GRANT SELECT,INSERT ON TABLE "public"."accounts_memberships" TO "supabase_auth_admin";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_cost_configuration" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_cost_configuration" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_cost_configuration" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_credit_transactions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_credit_transactions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_credit_transactions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_request_logs" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_request_logs" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_request_logs" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_usage_allocations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_usage_allocations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_usage_allocations" TO "service_role";
GRANT SELECT,INSERT ON TABLE "public"."ai_usage_allocations" TO "supabase_auth_admin";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_usage_limits" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_usage_limits" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_usage_limits" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."billing_customers" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."billing_customers" TO "service_role";
GRANT SELECT ON TABLE "public"."billing_customers" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."billing_customers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."billing_customers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."billing_customers_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."building_blocks_submissions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."building_blocks_submissions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."building_blocks_submissions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."certificates" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."certificates" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."certificates" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."config" TO "anon";
GRANT SELECT ON TABLE "public"."config" TO "authenticated";
GRANT SELECT ON TABLE "public"."config" TO "service_role";
GRANT SELECT ON TABLE "public"."config" TO "supabase_auth_admin";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."course_progress" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."course_progress" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."course_progress" TO "service_role";



GRANT ALL ON SEQUENCE "public"."invitations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."invitations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."invitations_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lesson_progress" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lesson_progress" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lesson_progress" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."maintenance_log" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."maintenance_log" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."maintenance_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."maintenance_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."maintenance_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."maintenance_log_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."nonces" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."nonces" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."nonces" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notifications" TO "anon";
GRANT SELECT,UPDATE ON TABLE "public"."notifications" TO "authenticated";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."onboarding" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."onboarding" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."onboarding" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."order_items" TO "anon";
GRANT SELECT ON TABLE "public"."order_items" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."order_items" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."quiz_attempts" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."quiz_attempts" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."quiz_attempts" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."role_permissions" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."role_permissions" TO "service_role";
GRANT SELECT ON TABLE "public"."role_permissions" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."role_permissions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."role_permissions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."role_permissions_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."roles" TO "anon";
GRANT SELECT ON TABLE "public"."roles" TO "authenticated";
GRANT SELECT ON TABLE "public"."roles" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."subscription_items" TO "anon";
GRANT SELECT ON TABLE "public"."subscription_items" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."subscription_items" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."subtasks" TO "anon";
GRANT ALL ON TABLE "public"."subtasks" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."subtasks" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."survey_progress" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."survey_progress" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."survey_progress" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."survey_responses" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."survey_responses" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."survey_responses" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."tasks" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."testimonials" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."testimonials" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."testimonials" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."timezone_cache" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."timezone_cache" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."timezone_cache" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."timezone_performance_monitor" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."timezone_performance_monitor" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."timezone_performance_monitor" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_account_workspace" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_account_workspace" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_account_workspace" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_accounts" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_accounts" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_accounts" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" REVOKE ALL ON FUNCTIONS FROM PUBLIC;




























