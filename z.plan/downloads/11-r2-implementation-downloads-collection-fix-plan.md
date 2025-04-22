# Downloads Collection R2 Implementation Fix Plan

## 1. Current Issues Analysis

### Database vs. R2 Storage Mismatch

- **Database Records**: The database contains placeholder filenames (e.g., `slide-templates.placeholder`) and example URLs (`https://downloads.example.com/slide-templates`)
- **R2 Storage**: The actual files exist in R2 with real names like "201 Our Process.pdf", "SlideHeroes Golden Rules.pdf"
- **Result**: Downloads in Payload admin show placeholders instead of actual R2 files

### Configuration Issues

- The S3 storage plugin is configured, but the Downloads collection isn't properly connecting to the R2 files
- The afterRead hook attempts to map URLs but isn't working correctly
- File URLs are being set with placeholder values instead of real R2 URLs

## 2. Root Causes

1. **Filename Mismatch**: The filenames in the database don't match the actual files in R2
2. **URL Generation**: The URL generation logic in the `afterRead` hook isn't properly using the R2 domain
3. **S3 Plugin Configuration**: While the S3 plugin is configured for Downloads, it's not generating proper URLs
4. **Missing Relationship**: No mechanism to associate the database records with the correct R2 files

## 3. Current Implementation Review

### Current S3 Plugin Configuration

```javascript
s3Storage({
  collections: {
    media: {
      disableLocalStorage: true,
      generateFileURL: ({ filename }: { filename: string }) =>
        `https://images.slideheroes.com/${filename}`,
    },
    downloads: {
      disableLocalStorage: true,
      generateFileURL: ({ filename }: { filename: string }) =>
        `https://downloads.slideheroes.com/${filename}`,
      // Standard S3 configuration without imageSizes property
      // The thumbnail fix will be handled by the migration script
    },
  },
  // Other configuration
})
```

### Current Downloads Collection afterRead Hook

```javascript
hooks: {
  // Enhanced afterRead hook with improved R2 URL handling
  afterRead: [
    async ({ doc }) => {
      // Basic file type detection
      const isZipFile = doc.filename?.endsWith('.zip') || doc.mimeType === 'application/zip'
      const isPdfFile = doc.filename?.endsWith('.pdf') || doc.mimeType === 'application/pdf'

      // Check if file exists and is not a placeholder
      const isPlaceholder = doc.filename?.includes('.placeholder') || !doc.filename
      const fileExists = !isPlaceholder

      // Properly format the R2 URL if it exists but needs transformation
      if (fileExists && doc.filename && (!doc.url || doc.url.includes('placeholder'))) {
        // Format a proper R2 URL using the custom domain
        doc.url = `https://downloads.slideheroes.com/${encodeURIComponent(doc.filename)}`
        console.log(`Generated R2 URL for ${doc.id}: ${doc.url}`)
      }

      // Handle special pre-existing downloads with hardcoded URLs
      if (doc.id === '9e12f8b7-5c32-4a89-b8f0-6d7c9e20a2e1' && !doc.url) {
        doc.url = 'https://downloads.slideheroes.com/SlideHeroes%20Presentation%20Template.zip'
        console.log(`Applied special URL for presentation template: ${doc.url}`)
      }

      if (doc.id === 'a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6' && !doc.url) {
        doc.url = 'https://downloads.slideheroes.com/SlideHeroes%20Swipe%20File.zip'
        console.log(`Applied special URL for swipe file: ${doc.url}`)
      }

      // Add diagnostic information for debugging
      console.log(
        `Processing download ${doc.id}: ${doc.filename}, URL: ${doc.url}, Exists: ${fileExists}`,
      )

      return {
        ...doc,
        _fileType: isZipFile ? 'zip' : isPdfFile ? 'pdf' : 'other',
        fileStatus: fileExists ? 'Available' : 'Missing',
        // Add a more descriptive field to help debugging
        _debug: {
          isPlaceholder,
          fileExists,
          originalUrl: doc.url,
        },
      }
    },
  ],
}
```

## 4. Proposed Solution

The solution consists of three main parts:

### Part 1: Update S3 Plugin Configuration

Refine the S3 storage plugin configuration in `payload.config.ts` to ensure proper URL generation:

```javascript
s3Storage({
  collections: {
    media: {
      disableLocalStorage: true,
      generateFileURL: ({ filename }) =>
        `https://images.slideheroes.com/${filename}`,
    },
    downloads: {
      disableLocalStorage: true,
      generateFileURL: ({ filename }) =>
        `https://downloads.slideheroes.com/${encodeURIComponent(filename)}`,
    },
  },
  bucket: process.env.R2_BUCKET || '',
  config: {
    endpoint: process.env.R2_ENDPOINT || '',
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
    region: process.env.R2_REGION || 'auto',
    forcePathStyle: true,
  },
});
```

### Part 2: Enhance the Downloads Collection afterRead Hook

Improve the `afterRead` hook to better handle R2 file URLs and diagnostics:

```javascript
hooks: {
  afterRead: [
    async ({ doc }) => {
      // Only proceed if we have a filename
      if (!doc.filename) return doc;

      // Remove .placeholder extension if present
      const cleanFilename = doc.filename.replace('.placeholder', '');

      // Map filenames to actual R2 file names based on patterns
      let actualFilename;

      // Use a mapping dictionary for special cases
      const filenameMap = {
        'slide-templates': 'SlideHeroes Presentation Template.zip',
        'swipe-file': 'SlideHeroes Swipe File.zip',
        'our-process-slides': '201 Our Process.pdf',
        'the-who-slides': '202 The Who.pdf',
        'introduction-slides': '203 The Why - Introductions.pdf',
        'next-steps-slides': '204 The Why - Next Steps.pdf',
        'idea-generation-slides': '301 Idea Generation.pdf',
        'what-is-structure-slides': '302 What is Structure.pdf',
        'using-stories-slides': '401 Using Stories.pdf',
        'storyboards-presentations-slides':
          '403 Storyboards in Presentations.pdf',
        'visual-perception-slides': '501 Visual Perception.pdf',
        'detail-fundamental-elements-slides':
          '503 Detail Fundamental Elements.pdf',
        'gestalt-principles-slides':
          '504 Gestalt Principles of Visual Perception.pdf',
        'slide-composition-slides': '505 Slide Composition.pdf',
        'fact-based-persuasion-slides':
          '601 Fact-based Persuasion Overview.pdf',
        'tables-v-graphs-slides': '602 Tables v Graphs.pdf',
        'standard-graphs-slides': '604 Standard Graphs.pdf',
        'specialist-graphs-slides': '605 Specialist Graphs.pdf',
        'preparation-practice-slides': '701 Preparation and Practice.pdf',
        'performance-slides': '702 Performance.pdf',
        'audience-map': 'Audience Map.pdf',
        'golden-rules': 'SlideHeroes Golden Rules.pdf',
      };

      // Check if we have a direct mapping
      if (filenameMap[cleanFilename]) {
        actualFilename = filenameMap[cleanFilename];
      } else {
        // Use the cleaned filename and add extension if missing
        actualFilename =
          cleanFilename.endsWith('.pdf') || cleanFilename.endsWith('.zip')
            ? cleanFilename
            : `${cleanFilename}.pdf`;
      }

      // Handle placeholder files by constructing a proper URL
      if (
        doc.filename.includes('.placeholder') ||
        doc.url?.includes('example.com')
      ) {
        // Generate the R2 URL with encoded filename
        const r2Url = `https://downloads.slideheroes.com/${encodeURIComponent(actualFilename)}`;

        console.log(
          `Mapped placeholder ${doc.filename} to R2 file: ${actualFilename}`,
        );
        console.log(`Generated R2 URL: ${r2Url}`);

        // Update the document with the real URL
        return {
          ...doc,
          url: r2Url,
          _actualFilename: actualFilename, // Store for debugging
          _fileType: actualFilename.endsWith('.zip')
            ? 'zip'
            : actualFilename.endsWith('.pdf')
              ? 'pdf'
              : 'other',
          fileStatus: 'Available',
          _debug: {
            isPlaceholder: true,
            mapped: true,
            originalFilename: doc.filename,
            mappedFilename: actualFilename,
            originalUrl: doc.url,
            newUrl: r2Url,
          },
        };
      }

      // Basic file type detection for non-placeholder files
      const isZipFile =
        doc.filename?.endsWith('.zip') || doc.mimeType === 'application/zip';
      const isPdfFile =
        doc.filename?.endsWith('.pdf') || doc.mimeType === 'application/pdf';

      // Handle normal files (not placeholders)
      return {
        ...doc,
        _fileType: isZipFile ? 'zip' : isPdfFile ? 'pdf' : 'other',
        fileStatus: 'Available',
      };
    },
  ];
}
```

### Part 3: Database Migration Script

Create a migration script to update existing database records with correct filenames and URLs:

```typescript
// packages/content-migrations/src/scripts/repair/fix-download-r2-mappings.ts
import { Client } from 'pg';

// Create a mapping between IDs in the database and actual R2 filenames
const downloadMappings = {
  '9e12f8b7-5c32-4a89-b8f0-6d7c9e20a2e1': {
    filename: 'SlideHeroes Presentation Template.zip',
    url: 'https://downloads.slideheroes.com/SlideHeroes%20Presentation%20Template.zip',
    title: 'SlideHeroes Presentation Template',
  },
  'a1b2c3d4-5e6f-4f8b-9e0a-c1d2e3f4a5b6': {
    filename: 'SlideHeroes Swipe File.zip',
    url: 'https://downloads.slideheroes.com/SlideHeroes%20Swipe%20File.zip',
    title: 'SlideHeroes Swipe File',
  },
  'd7e389a2-5f10-4b8c-9a21-3e78f9c61d28': {
    filename: '201 Our Process.pdf',
    url: 'https://downloads.slideheroes.com/201%20Our%20Process.pdf',
    title: 'Our Process Slides',
  },
  'e8f21b37-6c94-4d5a-b3a0-1f7a8d29e456': {
    filename: '202 The Who.pdf',
    url: 'https://downloads.slideheroes.com/202%20The%20Who.pdf',
    title: 'The Who Slides',
  },
  'a5c7d9e8-3b21-4f67-9d85-2e7a41c0b593': {
    filename: '203 The Why - Introductions.pdf',
    url: 'https://downloads.slideheroes.com/203%20The%20Why%20-%20Introductions.pdf',
    title: 'Introduction Slides',
  },
  'b7c94e2d-1a63-4d85-b9f7-e21c8d9a6f04': {
    filename: '204 The Why - Next Steps.pdf',
    url: 'https://downloads.slideheroes.com/204%20The%20Why%20-%20Next%20Steps.pdf',
    title: 'Next Steps Slides',
  },
  'c8e5f931-2b74-4e96-a8c0-f32d7b0a5e18': {
    filename: '301 Idea Generation.pdf',
    url: 'https://downloads.slideheroes.com/301%20Idea%20Generation.pdf',
    title: 'Idea Generation Slides',
  },
  'd9f6a042-3c85-5fa7-b9d1-143e8c1b6f29': {
    filename: '302 What is Structure.pdf',
    url: 'https://downloads.slideheroes.com/302%20What%20is%20Structure.pdf',
    title: 'What Is Structure Slides',
  },
  'e017b153-4d96-6fb8-c0e2-354f9d2c7130': {
    filename: '401 Using Stories.pdf',
    url: 'https://downloads.slideheroes.com/401%20Using%20Stories.pdf',
    title: 'Using Stories Slides',
  },
  'f158c264-5e07-71c9-d1f3-165e0e3d8541': {
    filename: '403 Storyboards in Presentations.pdf',
    url: 'https://downloads.slideheroes.com/403%20Storyboards%20in%20Presentations.pdf',
    title: 'Storyboards Presentations Slides',
  },
  // Add additional mappings for the rest of the downloads
};

export async function fixDownloadR2Mappings(): Promise<void> {
  console.log('Fixing download R2 mappings...');

  const client = new Client({
    connectionString:
      process.env.DATABASE_URI ||
      'postgresql://postgres:postgres@localhost:54322/postgres',
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    // Update each download record with the correct filename and URL
    for (const [id, data] of Object.entries(downloadMappings)) {
      try {
        await client.query(
          `
          UPDATE payload.downloads
          SET filename = $1, url = $2, title = $3
          WHERE id = $4 AND (filename LIKE '%.placeholder' OR url LIKE '%example.com%')
        `,
          [data.filename, data.url, data.title, id],
        );

        console.log(`Updated download ${id} with filename: ${data.filename}`);
      } catch (error) {
        console.error(`Error updating download ${id}:`, error);
        // Continue with other records even if one fails
      }
    }

    await client.query('COMMIT');
    console.log('Successfully updated download R2 mappings');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing download R2 mappings:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the function if called directly
if (require.main === module) {
  fixDownloadR2Mappings()
    .then(() => console.log('Complete'))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
```

## 5. Implementation Steps

1. **Update payload.config.ts**

   - Refine the S3 storage configuration for the Downloads collection
   - Ensure proper URL encoding in the generateFileURL function
   - Verify environment variables are correctly referenced

2. **Update Downloads.ts**

   - Enhance the afterRead hook with mapping logic
   - Improve error handling and diagnostics
   - Add proper URL generation for placeholder files

3. **Create Migration Script**

   - Add the fix-download-r2-mappings.ts script to update existing database records
   - Insert the script into the content migration flow in loading.ps1:
     ```powershell
     # Add this line in the Fix-Relationships function
     Log-Message "Fixing download R2 mappings..." "Yellow"
     Exec-Command -command "pnpm exec tsx src/scripts/repair/fix-download-r2-mappings.ts" -description "Fixing download R2 mappings" -continueOnError
     ```

4. **Testing**
   - Reset and run migrations to verify the script works
   - Check database records after migration to verify URLs are updated
   - View downloads in Payload admin panel to verify proper display
   - Test download functionality in lesson pages
   - Monitor console logs for any errors

## 6. Benefits of This Approach

1. **Non-Intrusive**: Doesn't drastically change the existing infrastructure
2. **Dual Strategy**: Uses both runtime mapping (hook) and persistent fixes (migration)
3. **Resilient**: Handles edge cases and provides fallbacks
4. **Backward Compatible**: Works with existing content relationships
5. **Maintainable**: Clear mapping structure for future updates

## 7. Potential Challenges

1. **Content Migration Complexity**: The content migration system is intricate and any changes must be carefully integrated
2. **Existing Relationships**: Need to ensure we don't break existing lesson-download relationships
3. **Database vs. Runtime**: Need to ensure consistency between database records and runtime behavior
4. **Error Handling**: Must gracefully handle cases where mapped files don't exist in R2

## 8. Future Considerations

1. **Upload Process**: Long-term, consider updating the upload process to use consistent filenames
2. **Direct R2 Integration**: Explore direct R2 API integration for more specific functionality
3. **Content Validation**: Add periodic validation to ensure downloads remain accessible
4. **Admin UI Enhancement**: Add custom admin UI components to better display download status and file information
