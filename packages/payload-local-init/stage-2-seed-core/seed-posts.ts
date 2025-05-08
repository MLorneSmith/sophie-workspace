// seed-posts.ts
// Script for Stage 2: Core Content Seeding - Posts
import fs from 'fs';
import { glob } from 'glob';
import yaml from 'js-yaml';
import path from 'path';
import type { Payload } from 'payload';
import { getPayload } from 'payload';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Import Payload config
import config from '../../../apps/payload/src/payload.config';

// Placeholder for Markdown to Lexical conversion utility
// import { markdownToLexical } from '../utils/markdown-to-lexical';

console.log('Current working directory:', process.cwd());

// Define the path to the raw posts files relative to the package directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const postsRawPath = path.resolve(
  __dirname,
  '../data/raw/posts', // Corrected path
);

console.log('Resolved postsRawPath:', postsRawPath);

console.log('Starting Stage 2: Seed Posts...');

async function seedPosts() {
  let payload: Payload | null = null;

  try {
    // Get a local copy of Payload
    console.log('Initializing Payload...');
    payload = await getPayload({ config });
    console.log('Payload initialized.');

    // Find all post files with .mdoc extension (recursive glob)
    const postFiles = glob.sync(
      postsRawPath.replace(/\\/g, '/') + '/**/*.mdoc',
      { nodir: true },
    ); // Changed glob pattern to be recursive

    console.log('Files found by glob:', postFiles);
    console.log(`Found ${postFiles.length} post files.`);

    if (postFiles.length === 0) {
      console.warn(
        `Warning: No post files found in ${postsRawPath}. Skipping seeding.`,
      );
      process.exit(0); // Exit cleanly if no files are found
    }

    for (const filePath of postFiles) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const parts = fileContent.split('---');

      if (parts.length < 3) {
        console.error(
          `Error: File "${filePath}" does not have valid frontmatter.`,
        );
        continue; // Skip this file
      }

      const frontmatter = parts[1];
      const markdownContent = parts.slice(2).join('---').trim(); // Join remaining parts in case of '---' in content

      let postData: any; // Declare postData outside the try block

      try {
        postData = yaml.load(frontmatter) as any;

        // Check if post already exists by slug
        const existingPost = await payload.find({
          collection: 'posts', // Correct collection slug
          where: {
            slug: {
              equals: postData.slug,
            },
          },
        });

        if (existingPost.docs.length === 0) {
          // Post does not exist, create it

          // Placeholder: Transform Markdown to Lexical JSON
          // const lexicalContent = markdownToLexical(markdownContent);
          // For now, use a placeholder
          const lexicalContent = {
            // Basic Lexical structure placeholder
            root: {
              children: [
                {
                  children: [
                    {
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: `Raw content from ${postData.slug}.mdoc needs conversion.`,
                      type: 'text',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  type: 'paragraph',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'root',
              version: 1,
            },
          };

          // Handle image relationship: Look up media item by filename and use its ID
          let mediaItemId = null; // Declare mediaItemId here with broader scope
          if (postData.image) {
            const imageName = path.basename(postData.image); // Extract filename from path
            const mediaItems = await payload.find({
              collection: 'media',
              where: {
                filename: {
                  equals: imageName,
                },
              },
            });
            if (mediaItems.docs.length > 0) {
              mediaItemId = mediaItems.docs[0]?.id ?? null; // Assign to the broader scoped variable, use nullish coalescing
            } else {
              console.warn(
                `Warning: Media item not found for image path: ${postData.image}. image_id will be null.`,
              );
            }
          }

          const postPayloadData: any = {
            id: postData.id || uuidv4(), // Use ID from frontmatter if available
            title: postData.title,
            slug: postData.slug,
            // author: postData.author, // Handle author relationship later if needed
            published_at: postData.publishedDate // Use published_at field name
              ? new Date(postData.publishedDate)
              : new Date(),
            status: postData.status || 'draft',
            content: lexicalContent, // Use transformed Lexical content
            image_id: mediaItemId, // Use the UUID of the media item
            description: postData.description,
            // Transform tags array of strings to array of objects
            tags: postData.tags
              ? postData.tags.map((tag: string) => ({ tag }))
              : [],
            // Transform categories array of strings to array of objects (if needed later)
            // categories: postData.categories ? postData.categories.map((category: string) => ({ category })) : [],
          };

          if (
            postData.status === 'published' &&
            !postPayloadData.publishedDate
          ) {
            postPayloadData.publishedDate = new Date(); // Ensure publishedDate is set if status is published
          }

          console.log(
            'Creating Post with data:',
            JSON.stringify(
              { ...postPayloadData, content: '[Markdown Content]' },
              null,
              2,
            ), // Avoid logging full content
          );

          await payload.create({
            collection: 'posts', // Correct collection slug
            data: postPayloadData,
          });
          console.log(`Created Post: ${postData.title} (${postData.slug})`);
        } else {
          console.log(
            `Post already exists, skipping creation: ${postData.title} (${postData.slug})`,
          );
          // Optionally, update the existing post if needed
          // await payload.update({
          //   collection: 'posts',
          //   id: existingPost.docs[0].id,
          //   data: {
          //     title: postData.title,
          //     slug: postData.slug,
          //     author: postData.author,
          //     publishedDate: postData.publishedDate ? new Date(postData.publishedDate) : existingPost.docs[0].publishedDate,
          //     status: postData.status || 'draft',
          //     content: markdownContent,
          //     image: postData.image,
          //     categories: postData.categories,
          //     tags: postData.tags,
          //     description: postData.description,
          //   },
          // });
          // console.log(`Updated existing Post: ${postData.title} (${postData.slug})`);
        }
      } catch (error: any) {
        console.error(
          `Error processing Post "${postData?.title || filePath}":`, // Use title if available, otherwise path
          error.message,
        );
        // Continue with other posts
      }
    }

    console.log('Posts seeding completed.');
    process.exit(0); // Exit cleanly on success
  } catch (error: any) {
    console.error('Error during Seed Posts process:', error.message);
    process.exit(1); // Exit with a non-zero code on failure
  } finally {
    if (payload) {
      console.log('Seed Posts script finished.');
    }
  }
}

seedPosts();
