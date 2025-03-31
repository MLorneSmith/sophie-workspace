# PowerShell script to reset the database and run all migrations

Write-Host "Resetting Supabase database and running Web app migrations..." -ForegroundColor Cyan
cd apps/web
pnpm run supabase:reset
supabase migration up
cd ../..

Write-Host "Running Payload migrations..." -ForegroundColor Cyan
cd apps/payload

# Create a new migration file that includes all our migrations
Write-Host "  1. Creating enum types..." -ForegroundColor Yellow
pnpm payload migrate --file=src/migrations/20250328_154000_create_enum_types.ts

Write-Host "  2. Updating existing tables to UUID..." -ForegroundColor Yellow
pnpm payload migrate --file=src/migrations/20250328_155000_update_existing_tables_to_uuid.ts

Write-Host "  3. Creating collection tables..." -ForegroundColor Yellow
pnpm payload migrate --file=src/migrations/20250328_160000_create_collection_tables.ts

Write-Host "  4. Adding array relationship tables..." -ForegroundColor Yellow
pnpm payload migrate --file=src/migrations/20250328_170000_add_array_relationship_tables.ts

Write-Host "  5. Adding missing fields..." -ForegroundColor Yellow
pnpm payload migrate --file=src/migrations/20250328_175000_add_missing_fields.ts

Write-Host "  6. Adding more array relationship tables..." -ForegroundColor Yellow
pnpm payload migrate --file=src/migrations/20250328_180000_add_more_array_relationship_tables.ts

Write-Host "  7. Adding documentation relationship tables..." -ForegroundColor Yellow
pnpm payload migrate --file=src/migrations/20250328_185000_add_documentation_relationship_tables.ts

Write-Host "  8. Renaming parent_id columns..." -ForegroundColor Yellow
pnpm payload migrate --file=src/migrations/20250328_190000_rename_parent_id_columns.ts

Write-Host "  9. Fixing field names..." -ForegroundColor Yellow
pnpm payload migrate --file=src/migrations/20250328_195000_fix_field_names.ts

Write-Host "  10. Adding column mapping views..." -ForegroundColor Yellow
pnpm payload migrate --file=src/migrations/20250328_200000_add_column_mapping_views.ts

Write-Host "  11. Adding order columns..." -ForegroundColor Yellow
pnpm payload migrate --file=src/migrations/20250328_205000_add_order_columns.ts

Write-Host "  12. Adding relationship order columns..." -ForegroundColor Yellow
pnpm payload migrate --file=src/migrations/20250328_210000_add_relationship_order_columns.ts

Write-Host "  13. Adding documentation breadcrumbs table..." -ForegroundColor Yellow
pnpm payload migrate --file=src/migrations/20250328_215000_add_documentation_breadcrumbs.ts

Write-Host "  14. Adding missing posts fields..." -ForegroundColor Yellow
pnpm payload migrate --file=src/migrations/20250328_220000_add_missing_posts_fields.ts

Write-Host "  15. Adding survey questions text column..." -ForegroundColor Yellow
pnpm payload migrate --file=src/migrations/20250328_225000_add_survey_questions_text_column.ts

Write-Host "  16. Fixing users parent_id column..." -ForegroundColor Yellow
pnpm payload migrate --file=src/migrations/20250328_230000_fix_users_parent_id.ts

cd ..

Write-Host "All migrations completed!" -ForegroundColor Green
Write-Host "You need to create a user account on first login to the Payload CMS admin panel." -ForegroundColor Green
