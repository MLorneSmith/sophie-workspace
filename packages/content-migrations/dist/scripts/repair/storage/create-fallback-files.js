/**
 * Creates the necessary fallback files for S3 storage fix
 *
 * This script manually creates the placeholder files needed by the middleware
 */
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
// Create the fallback directory using ESM compatible path
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fallbackDir = path.resolve(__dirname, '../../../../src/data/fallbacks');
if (!fs.existsSync(fallbackDir)) {
    fs.mkdirSync(fallbackDir, { recursive: true });
    console.log(`Created fallback directory: ${fallbackDir}`);
}
// Create PDF placeholder
const pdfPlaceholder = path.join(fallbackDir, 'download-placeholder.pdf');
if (!fs.existsSync(pdfPlaceholder)) {
    // Create a minimal valid PDF
    const minimalPdf = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n';
    fs.writeFileSync(pdfPlaceholder, minimalPdf);
    console.log(`Created PDF placeholder: ${pdfPlaceholder}`);
}
// Create thumbnail placeholder (minimal WebP)
const thumbnailPlaceholder = path.join(fallbackDir, 'thumbnail-placeholder.webp');
if (!fs.existsSync(thumbnailPlaceholder) ||
    fs.statSync(thumbnailPlaceholder).size === 0) {
    // Create a tiny transparent 1x1 pixel PNG instead - easier to handle than WebP
    // This is a minimal valid 1x1 transparent PNG
    const minimalPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    fs.writeFileSync(thumbnailPlaceholder, minimalPng);
    console.log(`Created placeholder image: ${thumbnailPlaceholder}`);
}
console.log('Fallback files created successfully!');
