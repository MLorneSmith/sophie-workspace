-- Schema: Multi-tenant RAG with account-scoped retrieval
-- Description: RPC function for filtered vector similarity search
-- Issue: #2232 - Multi-tenant RAG with account-scoped retrieval
--
-- This schema creates a PostgreSQL function for performing vector similarity
-- search with metadata filtering. The function supports:
-- - Account-based tenant isolation
-- - User-based filtering
-- - Content type filtering
-- - Special handling for globally accessible playbook content
--
-- NOTE: This function queries the embeddings table created by @mastra/pg.
-- The table name is derived from the index name "slideheroes-embeddings".
-- If the table structure differs, adjust the query accordingly.

BEGIN;

-- Create the filtered vector search function
-- Uses JSONB operators for metadata filtering and pgvector for similarity search

CREATE OR REPLACE FUNCTION public.search_embeddings_filtered(
	-- Query embedding vector
	query_embedding vector(1536),
	-- Optional account ID filter (for tenant isolation)
	filter_account_id uuid,
	-- Optional user ID filter
	filter_user_id uuid,
	-- Optional content type filter
	filter_content_types text[],
	-- Number of results to return
	top_k int default 5
)
RETURNS TABLE (
	id text,
	similarity float,
	metadata jsonb,
	text text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
	-- Defense-in-depth: verify user has access to the requested account
	-- This runs as SECURITY DEFINER so it can query account_user regardless of caller role
	IF filter_account_id IS NOT NULL AND filter_user_id IS NOT NULL THEN
		IF NOT EXISTS (
			SELECT 1 FROM public.account_user au
			WHERE au.account_id = filter_account_id
			AND au.user_id = filter_user_id
		) AND NOT EXISTS (
			SELECT 1 FROM public.accounts a
			WHERE a.id = filter_account_id
			AND a.primary_owner_user_id = filter_user_id
		) THEN
			-- User has no access to account: return empty results (fail-closed)
			RETURN;
		END IF;
	END IF;

	-- Return filtered results based on metadata
	-- Handle NULL filters to return all results when filter is not specified
	-- Special handling for global content: playbooks are accessible to all users

	RETURN QUERY
	SELECT
		e.id,
		(e.embedding <=> search_embeddings_filtered.query_embedding) AS similarity,
		e.metadata,
		e.metadata->>'text' AS text
	FROM (
		SELECT
			id,
			embedding,
			metadata
		FROM "slideheroes-embeddings"
		-- Note: Table name may need adjustment based on actual @mastra/pg table creation
		-- Common patterns: "slideheroes-embeddings", "slideheroes_embeddings", "embeddings"
	) e
	WHERE
		-- Apply account ID filter (fail-closed: require explicit match unless playbook)
		(
			e.metadata->>'contentType' = 'playbook'
			OR (
				filter_account_id IS NOT NULL
				AND e.metadata->>'accountId' = filter_account_id::text
			)
		)
		-- Apply user ID filter only to personal content types
		AND (
			filter_user_id IS NULL
			OR e.metadata->>'contentType' NOT IN ('user-upload', 'deck-history')
			OR e.metadata->>'userId' = filter_user_id::text
		)
		-- Apply content type filter (skip if NULL or empty)
		AND (
			filter_content_types IS NULL
			OR array_length(filter_content_types, 1) IS NULL
			OR e.metadata->>'contentType' = ANY(filter_content_types)
		)
	ORDER BY e.embedding <=> search_embeddings_filtered.query_embedding
	LIMIT top_k;
END;
$$;

-- Grant execute permissions to authenticated and service_role roles
GRANT EXECUTE ON FUNCTION public.search_embeddings_filtered(vector(1536), uuid, uuid, text[], int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_embeddings_filtered(vector(1536), uuid, uuid, text[], int) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.search_embeddings_filtered(vector(1536), uuid, uuid, text[], int) IS
'Performs vector similarity search with metadata filtering for multi-tenant RAG.
Supports filtering by accountId, userId, and contentType.
Playbook content is globally accessible regardless of account.';

COMMIT;
