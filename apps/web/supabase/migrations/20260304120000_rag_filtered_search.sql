-- Migration: Add filtered vector search RPC function for multi-tenant RAG
-- Description: Creates public.search_embeddings_filtered() function for account-scoped retrieval
-- Issue: #2232 - Multi-tenant RAG with account-scoped retrieval
--
-- This migration adds a PostgreSQL RPC function that performs vector similarity
-- search with metadata filtering, enabling:
-- - Account-based tenant isolation
-- - User-based filtering
-- - Content type filtering
-- - Global access for playbook content

BEGIN;

-- Create the filtered vector search function
CREATE OR REPLACE FUNCTION public.search_embeddings_filtered(
	-- Query embedding vector (dimension depends on embedding model)
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
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
	-- Return filtered results based on metadata
	-- Handle NULL filters to return all results when filter is not specified
	-- Special handling for global content: playbooks are accessible to all users

	RETURN QUERY
	SELECT
		e.id,
		(e.embedding <=> search_embeddings_filtered.query_embedding) AS similarity,
		e.metadata,
		(e.metadata->>'text')::text AS text
	FROM "slideheroes-embeddings" e
	WHERE
		-- Apply account ID filter (skip if NULL)
		(
			filter_account_id IS NULL
			OR e.metadata->>'accountId' = filter_account_id::text
			-- Global content (playbooks) is accessible regardless of account
			OR e.metadata->>'contentType' = 'playbook'
		)
		-- Apply user ID filter (skip if NULL)
		AND (
			filter_user_id IS NULL
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
GRANT EXECUTE ON FUNCTION public.search_embeddings_filtered TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_embeddings_filtered TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.search_embeddings_filtered IS
'Performs vector similarity search with metadata filtering for multi-tenant RAG.
Supports filtering by accountId, userId, and contentType.
Playbook content is globally accessible regardless of account.
Parameters:
  - query_embedding: The vector to search for similarities
  - filter_account_id: UUID of account to filter by (optional)
  - filter_user_id: UUID of user to filter by (optional)
  - filter_content_types: Array of content types to filter (optional)
  - top_k: Number of results to return (default 5)
Returns: Table with id, similarity, metadata, and text columns.';

COMMIT;
