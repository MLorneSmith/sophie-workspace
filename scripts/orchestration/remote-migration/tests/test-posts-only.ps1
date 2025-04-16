# test-posts-only.ps1
#
# Test script to run only the posts migration
# This allows for targeted testing of the posts migration process

# Import the parent script
$parentScript = Join-Path -Path $PSScriptRoot -ChildPath "..\migrate-content-progressive.ps1"

# Display banner
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "         POSTS MIGRATION TEST                       " -ForegroundColor Cyan 
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "This script will run only the posts migration"
Write-Host "from the progressive migration script."
Write-Host "This is useful for testing the posts migration process."
Write-Host "====================================================" -ForegroundColor Cyan

# Create a custom table array with only posts-related tables
$postsRelatedTables = @(
    "posts",
    "posts_rels",
    "posts__downloads",
    "posts_categories",
    "posts_tags"
)

Write-Host "Will migrate the following tables: $($postsRelatedTables -join ', ')" -ForegroundColor Yellow

# Run with specific parameters to skip unnecessary migrations
& $parentScript -SkipCore -SkipDocumentation -SkipCourses -SkipQuizzes -SkipSurveys
