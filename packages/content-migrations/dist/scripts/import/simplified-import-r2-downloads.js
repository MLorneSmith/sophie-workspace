/**
 * Simplified Import Downloads Script
 *
 * This script generates SQL statements to insert downloads with predefined UUIDs
 * from the download-mappings.ts file, ensuring consistent IDs across migrations.
 */
import fs from 'fs';
import path from 'path';
import { DOWNLOAD_ID_MAP } from '../../data/mappings/download-mappings.js';
// Map of MIME types based on file extensions
const getMimeType = (filename) => {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
        '.pdf': 'application/pdf',
        '.zip': 'application/zip',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
    };
    return mimeTypes[ext] || 'application/octet-stream';
};
// Function to create a title from a filename
const getTitleFromFilename = (filename) => {
    // Remove extension and replace dashes/underscores with spaces
    return path
        .basename(filename, path.extname(filename))
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
};
// Function to determine file type based on MIME type
const getFileType = (mimeType) => {
    if (mimeType.includes('pdf'))
        return 'reference';
    if (mimeType.includes('presentation'))
        return 'pptx_template';
    if (mimeType.includes('spreadsheet'))
        return 'worksheet';
    if (mimeType.includes('image'))
        return 'example';
    return 'other';
};
// Download map structure with keys that match the DOWNLOAD_ID_MAP
const downloadMap = {
    'slide-templates': {
        filename: 'SlideHeroes Presentation Template.zip',
        url: 'https://downloads.slideheroes.com/SlideHeroes Presentation Template.zip',
        description: 'SlideHeroes Presentation Template',
    },
    'swipe-file': {
        filename: 'SlideHeroes Swipe File.zip',
        url: 'https://downloads.slideheroes.com/SlideHeroes Swipe File.zip',
        description: 'SlideHeroes Swipe File',
    },
    'our-process-slides': {
        filename: '201 Our Process.pdf',
        url: 'https://downloads.slideheroes.com/201 Our Process.pdf',
        description: 'Our Process Slides',
    },
    'the-who-slides': {
        filename: '202 The Who.pdf',
        url: 'https://downloads.slideheroes.com/202 The Who.pdf',
        description: 'The Who Slides',
    },
    'introduction-slides': {
        filename: '203 The Why - Introductions.pdf',
        url: 'https://downloads.slideheroes.com/203 The Why - Introductions.pdf',
        description: 'The Why - Introductions Slides',
    },
    'next-steps-slides': {
        filename: '204 The Why - Next Steps.pdf',
        url: 'https://downloads.slideheroes.com/204 The Why - Next Steps.pdf',
        description: 'The Why - Next Steps Slides',
    },
    'idea-generation-slides': {
        filename: '205 Idea Generation.pdf',
        url: 'https://downloads.slideheroes.com/205 Idea Generation.pdf',
        description: 'Idea Generation Slides',
    },
    'what-is-structure-slides': {
        filename: '206 What is Structure.pdf',
        url: 'https://downloads.slideheroes.com/206 What is Structure.pdf',
        description: 'What is Structure Slides',
    },
    'using-stories-slides': {
        filename: '207 Using Stories.pdf',
        url: 'https://downloads.slideheroes.com/207 Using Stories.pdf',
        description: 'Using Stories Slides',
    },
    'storyboards-presentations-slides': {
        filename: '208 Storyboards in Presentations.pdf',
        url: 'https://downloads.slideheroes.com/208 Storyboards in Presentations.pdf',
        description: 'Storyboards in Presentations Slides',
    },
    'visual-perception-slides': {
        filename: '209 Visual Perception.pdf',
        url: 'https://downloads.slideheroes.com/209 Visual Perception.pdf',
        description: 'Visual Perception Slides',
    },
    'fundamental-elements-slides': {
        filename: '210 Fundamental Elements.pdf',
        url: 'https://downloads.slideheroes.com/210 Fundamental Elements.pdf',
        description: 'Fundamental Elements of Design Slides',
    },
    'gestalt-principles-slides': {
        filename: '211 Gestalt Principles.pdf',
        url: 'https://downloads.slideheroes.com/211 Gestalt Principles.pdf',
        description: 'Gestalt Principles Slides',
    },
    'slide-composition-slides': {
        filename: '212 Slide Composition.pdf',
        url: 'https://downloads.slideheroes.com/212 Slide Composition.pdf',
        description: 'Slide Composition Slides',
    },
    'tables-vs-graphs-slides': {
        filename: '213 Tables vs Graphs.pdf',
        url: 'https://downloads.slideheroes.com/213 Tables vs Graphs.pdf',
        description: 'Tables vs Graphs Slides',
    },
    'standard-graphs-slides': {
        filename: '214 Standard Graphs.pdf',
        url: 'https://downloads.slideheroes.com/214 Standard Graphs.pdf',
        description: 'Standard Graphs Slides',
    },
    'fact-based-persuasion-slides': {
        filename: '215 Fact-based Persuasion.pdf',
        url: 'https://downloads.slideheroes.com/215 Fact-based Persuasion.pdf',
        description: 'Fact-based Persuasion Slides',
    },
};
// This function will generate SQL statements to insert downloads
// using consistent IDs from the DOWNLOAD_ID_MAP
export async function generateInsertSQL() {
    let sqlStatements = `-- SQL statements for inserting downloads with consistent IDs\n`;
    sqlStatements += `-- Generated on ${new Date().toISOString()}\n\n`;
    // Process downloads based on DOWNLOAD_ID_MAP
    for (const [key, id] of Object.entries(DOWNLOAD_ID_MAP)) {
        const downloadInfo = downloadMap[key];
        if (!downloadInfo) {
            console.warn(`Warning: No download info found for key ${key}, using defaults`);
            continue;
        }
        const { filename, url, description } = downloadInfo;
        const mimeType = getMimeType(filename);
        const title = description || getTitleFromFilename(filename);
        const type = getFileType(mimeType);
        sqlStatements += `-- Insert record for ${key} with UUID ${id}\n`;
        sqlStatements += `INSERT INTO payload.downloads (
      id, title, description, type, filename, url, "mimeType", created_at, updated_at
    ) VALUES (
      '${id}', 
      '${title.replace(/'/g, "''")}',
      '${(description || '').replace(/'/g, "''")}',
      '${type}',
      '${filename.replace(/'/g, "''")}',
      '${url.replace(/'/g, "''")}',
      '${mimeType}',
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      title = '${title.replace(/'/g, "''")}',
      description = '${(description || '').replace(/'/g, "''")}',
      type = '${type}',
      filename = '${filename.replace(/'/g, "''")}',
      url = '${url.replace(/'/g, "''")}',
      "mimeType" = '${mimeType}',
      updated_at = NOW();
    \n\n`;
    }
    return sqlStatements;
}
// Run the script to generate SQL and write to file
export async function runImport() {
    try {
        console.log('Starting to generate SQL statements for downloads import with consistent IDs');
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
        }
        else {
            console.log(`Directory already exists`);
        }
        // Write SQL to file with explicit path
        const outputFile = path.join(outputDir, 'import-downloads-consistent.sql');
        console.log(`Writing SQL to file: ${outputFile}`);
        // Write the file synchronously to ensure it completes
        fs.writeFileSync(outputFile, sql, 'utf8');
        // Verify the file was written
        if (fs.existsSync(outputFile)) {
            const fileSize = fs.statSync(outputFile).size;
            console.log(`File was successfully written. Size: ${fileSize} bytes`);
        }
        else {
            console.log(`Warning: File does not exist after writing`);
        }
        console.log(`SQL file generated: ${outputFile}`);
        // Print summary of what we're importing
        console.log(`\nSummary of downloads to import:`);
        console.log(`- ${Object.keys(DOWNLOAD_ID_MAP).length} total downloads with consistent IDs\n`);
        // Show a message about how to use the SQL
        console.log('-------------------------------------------------');
        console.log('HOW TO USE THESE SQL STATEMENTS:');
        console.log(`1. The SQL has been saved to: ${outputFile}`);
        console.log('2. Run them in your database using psql or another SQL client');
        console.log('3. The downloads will appear in the Payload CMS admin interface');
        console.log('-------------------------------------------------\n');
        return Promise.resolve();
    }
    catch (error) {
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
if (require.main === module) {
    runImport()
        .then(() => {
        console.log('Successfully completed import operation');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Failed to complete import operation:', error);
        process.exit(1);
    });
}
