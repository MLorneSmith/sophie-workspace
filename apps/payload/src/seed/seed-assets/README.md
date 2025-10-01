# Seed Assets

This directory contains test assets used during database seeding operations.

## Directory Structure

- `media/` - Test images, videos, and media files for the Media collection

## Important Notes

- **These are test placeholders only** - Small files designed for development/testing
- **Not production assets** - Real media should be uploaded through the admin UI
- **Git-tracked** - Kept small (<10KB each) to avoid bloating the repository
- **R2 Upload** - During seeding, these files are uploaded to Cloudflare R2 test bucket

## Maintenance

- Keep files small (<10KB each) to minimize repository size
- Use simple placeholder images (solid colors, gradients, or generated patterns)
- Do not add large media files (videos, high-res images, etc.)
- Clean up unused assets periodically

## Generating Placeholder Images

You can generate tiny placeholder images using ImageMagick:

```bash
# 1x1 pixel placeholder (smallest possible)
convert -size 1x1 xc:blue hero-image.jpg

# 100x100 placeholder with text
convert -size 100x100 xc:lightblue -pointsize 20 -gravity center \
  -draw "text 0,0 'Test'" placeholder.png
```

Or use online tools:

- <https://placeholder.com/>
- <https://dummyimage.com/>
