-- Enable pgvector for Mastra semantic memory and RAG embeddings.
-- PgVector will create and manage its internal vector index tables on first use.

create extension if not exists vector with schema extensions;
