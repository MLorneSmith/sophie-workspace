Payload and ID Types
Payload CMS is designed to work with both UUID and TEXT types for IDs, but there are important considerations:

Internal Representation: Payload internally works with IDs primarily as strings (TEXT). When it generates queries, it typically passes string values which PostgreSQL needs to cast to UUID for comparison with UUID columns.

Schema Definition: Your schema can still define fields as UUID type in the database - what we're addressing is the comparison operation in queries, not the storage type.

Hybrid Approach: A more balanced solution would be:

Keep UUID columns as UUID in the database for storage efficiency
Create helper functions/views that handle the type casting when comparisons are needed
Cast string values to UUID for inserts/updates (rather than UUID columns to TEXT)