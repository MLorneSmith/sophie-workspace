# Download Assets

This directory contains test download files used during database seeding operations.

## Directory Structure

- Place download files here (PDFs, templates, documents, etc.)
- Files will be uploaded to Cloudflare R2 during seeding

## Important Notes

- **Test files for development/testing** - Keep files reasonably sized
- **Uploaded to R2** - During seeding, files are uploaded to the R2 downloads bucket
- **Git-tracked** - Avoid very large files to prevent repository bloat
- **MIME types supported**: PDFs, Office docs, images, videos, archives, and more (see Downloads.ts)

## Current Files

Place your download files from R2 here. Examples:

- `marketing-template.pdf`
- `sales-deck-template.pptx`
- `guide.pdf`
- etc.

## Instructions

1. Download files from your R2 downloads bucket
2. Place them in this directory
3. Update `download-references.json` with matching `filePath` values
4. Run seeding - files will be uploaded to R2 automatically

## File Naming

Use descriptive, URL-friendly names:

- ✅ `marketing-template.pdf`
- ✅ `sales-presentation-guide.pptx`
- ❌ `Template (1) FINAL v2.pdf`
