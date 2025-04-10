/**
 * Import Downloads from R2 Bucket
 *
 * This script connects to the R2 bucket and imports all files from the "downloads" directory,
 * creating corresponding records in the Payload CMS Downloads collection.
 */
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Map of MIME types based on file extensions
const getMimeType = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.pptx':
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.docx':
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx':
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

// Function to create a title from a filename
const getTitleFromFilename = (filename: string): string => {
  // Remove extension and replace dashes/underscores with spaces
  return path
    .basename(filename, path.extname(filename))
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
};

// Function to determine file type based on MIME type
const getFileType = (mimeType: string): string => {
  if (mimeType.includes('pdf')) return 'reference';
  if (mimeType.includes('presentation')) return 'pptx_template';
  if (mimeType.includes('spreadsheet')) return 'worksheet';
  if (mimeType.includes('image')) return 'example';
  return 'other';
};

// Hard-coded download data - we'll use this instead of trying to parse the YAML file
// This avoids the YAML parsing issues and reduces dependencies
const knownDownloads = [
  {
    filename: '201 Our Process.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/201%20Our%20Process.pdf',
    description: 'Our Process Slides',
  },
  {
    filename: '202 The Who.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/202%20The%20Who.pdf',
    description: 'The Who Slides',
  },
  {
    filename: '203 The Why Introductions.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/203%20The%20Why%20-%20Introductions.pdf',
    description: 'The Why - Introductions Slides',
  },
  {
    filename: '204 The Why Next Steps.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/204%20The%20Why%20-%20Next%20Steps.pdf',
    description: 'The Why - Next Steps Slides',
  },
  {
    filename: '205 Idea Generation.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/205%20Idea%20Generation.pdf',
    description: 'Idea Generation Slides',
  },
  {
    filename: '206 What is Structure.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/206%20What%20is%20Structure.pdf',
    description: 'What is Structure Slides',
  },
  {
    filename: '207 Using Stories.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/207%20Using%20Stories.pdf',
    description: 'Using Stories Slides',
  },
  {
    filename: '208 Storyboards in Presentations.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/208%20Storyboards%20in%20Presentations.pdf',
    description: 'Storyboards in Presentations Slides',
  },
  {
    filename: '209 Visual Perception and Communication.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/209%20Visual%20Perception.pdf',
    description: 'Visual Perception and Communication Slides',
  },
  {
    filename: '210 Fundamental Elements of Design.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/210%20Fundamental%20Elements.pdf',
    description: 'Fundamental Elements of Design Slides',
  },
  {
    filename: '211 Gestalt Principles.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/504%20Gestalt%20Principles%20of%20Visual%20Perception.pdf',
    description: 'Gestalt Principles Slides',
  },
  {
    filename: '212 Slide Composition.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/212%20Slide%20Composition.pdf',
    description: 'Slide Composition Slides',
  },
  {
    filename: '213 Tables vs Graphs.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/213%20Tables%20vs%20Graphs.pdf',
    description: 'Tables vs Graphs Slides',
  },
  {
    filename: '214 Standard Graphs.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/214%20Standard%20Graphs.pdf',
    description: 'Standard Graphs Slides',
  },
  {
    filename: '215 Fact-based Persuasion.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/601%20Fact-based%20Persuasion%20Overview.pdf',
    description: 'Fact-based Persuasion Slides',
  },
];

// Additional resource files
const additionalFiles = [
  {
    filename: 'SlideHeroes Presentation Template.zip',
    title: 'SlideHeroes Presentation Template',
    type: 'pptx_template',
    url: 'https://downloads.slideheroes.com/SlideHeroes%20Presentation%20Template.zip',
  },
  {
    filename: 'SlideHeroes Swipe File.zip',
    title: 'SlideHeroes Swipe File',
    type: 'reference',
    url: 'https://downloads.slideheroes.com/SlideHeroes%20Swipe%20File.zip',
  },
];

// This function will generate SQL statements to insert downloads
// This avoids database connection issues by providing SQL we can run directly
export async function generateInsertSQL(): Promise<string> {
  let sqlStatements = `-- SQL statements for inserting downloads\n`;
  sqlStatements += `-- Run these statements directly against your database\n\n`;

  // Process known downloads from lessons
  for (const download of knownDownloads) {
    const uuid = uuidv4();
    const mimeType = getMimeType(download.filename);
    const title =
      download.description || getTitleFromFilename(download.filename);
    const type = getFileType(mimeType);

    sqlStatements += `-- Insert record for ${download.filename}\n`;
    sqlStatements += `INSERT INTO payload.downloads (
      id, filename, url, title, type, mime_type, "mimeType", filesize, "fileSize", 
      width, height, focal_x, focal_y, "focalX", "focalY", 
      thumbnail_url, "thumbnailURL", "thumbnail_u_r_l", "thumbnailUrl",
      
      -- Size variant columns for thumbnail
      sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height, 
      sizes_thumbnail_mime_type, sizes_thumbnail_file_size, sizes_thumbnail_filesize,
      "sizes_thumbnail_mimeType", "sizes_thumbnail_fileSize", sizes_thumbnail_u_r_l,
      sizes_thumbnail_filename,
      
      -- Size variant columns for medium
      sizes_medium_url, sizes_medium_width, sizes_medium_height, 
      sizes_medium_mime_type, sizes_medium_file_size, sizes_medium_filesize,
      "sizes_medium_mimeType", "sizes_medium_fileSize", sizes_medium_u_r_l,
      sizes_medium_filename,
      
      -- Size variant columns for large
      sizes_large_url, sizes_large_width, sizes_large_height, 
      sizes_large_mime_type, sizes_large_file_size, sizes_large_filesize,
      "sizes_large_mimeType", "sizes_large_fileSize", sizes_large_u_r_l,
      sizes_large_filename,
      
      created_at, updated_at
    ) VALUES (
      '${uuid}', 
      '${download.filename}',
      '${download.url}',
      '${title}',
      '${type}',
      '${mimeType}',
      '${mimeType}',
      0,
      0,
      0,
      0,
      50,
      50,
      50,
      50,
      NULL,
      NULL,
      NULL,
      NULL,
      
      -- Thumbnail variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- thumbnail filename
      
      -- Medium variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- medium filename
      
      -- Large variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- large filename
      
      NOW(),
      NOW()
    );\n\n`;
  }

  // Process additional files
  for (const file of additionalFiles) {
    const uuid = uuidv4();
    const mimeType = getMimeType(file.filename);
    const title = file.title || getTitleFromFilename(file.filename);
    const type = file.type || getFileType(mimeType);

    sqlStatements += `-- Insert record for ${file.filename}\n`;
    sqlStatements += `INSERT INTO payload.downloads (
      id, filename, url, title, type, mime_type, "mimeType", 
      thumbnail_url, "thumbnailURL", "thumbnail_u_r_l", "thumbnailUrl",
      
      -- Size variant columns for thumbnail
      sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height, 
      sizes_thumbnail_mime_type, sizes_thumbnail_file_size, sizes_thumbnail_filesize,
      "sizes_thumbnail_mimeType", "sizes_thumbnail_fileSize", sizes_thumbnail_u_r_l,
      sizes_thumbnail_filename,
      
      -- Size variant columns for medium
      sizes_medium_url, sizes_medium_width, sizes_medium_height, 
      sizes_medium_mime_type, sizes_medium_file_size, sizes_medium_filesize,
      "sizes_medium_mimeType", "sizes_medium_fileSize", sizes_medium_u_r_l,
      sizes_medium_filename,
      
      -- Size variant columns for large
      sizes_large_url, sizes_large_width, sizes_large_height, 
      sizes_large_mime_type, sizes_large_file_size, sizes_large_filesize,
      "sizes_large_mimeType", "sizes_large_fileSize", sizes_large_u_r_l,
      sizes_large_filename,
      
      created_at, updated_at
    ) VALUES (
      '${uuid}', 
      '${file.filename}',
      '${file.url}',
      '${title}',
      '${type}',
      '${mimeType}',
      '${mimeType}',
      NULL,
      NULL,
      NULL,
      NULL,
      
      -- Thumbnail variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- thumbnail filename
      
      -- Medium variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- medium filename
      
      -- Large variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- large filename
      
      NOW(),
      NOW()
    );\n\n`;
  }

  return sqlStatements;
}

// Run the script to generate SQL and write to file
export async function runImport(): Promise<void> {
  try {
    console.log('Starting to generate SQL statements for downloads import');

    // Generate SQL statements
    const sql = await generateInsertSQL();
    console.log(`Generated ${sql.split('\n').length} lines of SQL`);

    // Get current working directory for debugging
    const cwd = process.cwd();
    console.log(`Current working directory: ${cwd}`);

    // Create the output directory with explicit path
    const outputDir = path.resolve(cwd, 'sql-output');
    console.log(`Creating output directory: ${outputDir}`);

    if (!fs.existsSync(outputDir)) {
      console.log(`Directory doesn't exist, creating it...`);
      fs.mkdirSync(outputDir, { recursive: true });
    } else {
      console.log(`Directory already exists`);
    }

    // Write SQL to file with explicit path
    const outputFile = path.join(outputDir, 'import-downloads.sql');
    console.log(`Writing SQL to file: ${outputFile}`);

    // Write the file synchronously to ensure it completes
    fs.writeFileSync(outputFile, sql, 'utf8');

    // Verify the file was written
    if (fs.existsSync(outputFile)) {
      const fileSize = fs.statSync(outputFile).size;
      console.log(`File was successfully written. Size: ${fileSize} bytes`);
    } else {
      console.log(`Warning: File does not exist after writing`);
    }

    console.log(`SQL file generated: ${outputFile}`);

    // Print summary of what we're importing
    console.log(`\nSummary of downloads to import:`);
    console.log(`- ${knownDownloads.length} lesson PDFs`);
    console.log(`- ${additionalFiles.length} additional resource files\n`);

    // Show a message about how to use the SQL
    console.log('-------------------------------------------------');
    console.log('HOW TO USE THESE SQL STATEMENTS:');
    console.log(`1. The SQL has been saved to: ${outputFile}`);
    console.log(
      '2. Run them in your database using psql or another SQL client',
    );
    console.log(
      '3. The downloads will appear in the Payload CMS admin interface',
    );
    console.log('-------------------------------------------------\n');

    return Promise.resolve();
  } catch (error) {
    console.error('Error generating SQL statements:', error);
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}`);
      console.error(`Error message: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
    }
    return Promise.reject(error);
  }
}

// Make this work in CommonJS
runImport()
  .then(() => {
    console.log('Successfully completed import operation');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to complete import operation:', error);
    process.exit(1);
  });
