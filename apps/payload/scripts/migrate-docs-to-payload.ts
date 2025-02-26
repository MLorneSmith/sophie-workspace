import fs from 'fs'
import matter from 'gray-matter'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

import { getPayloadClient } from '../src/client/payloadClient'

// Function to convert Markdown content to a Lexical editor compatible format
function convertMarkdownToLexical(markdown: string) {
  // Split the markdown into paragraphs
  const paragraphs = markdown.split(/\n\n+/)

  // Create a Lexical editor compatible object
  return {
    root: {
      children: paragraphs.map((paragraph) => {
        // Check if this is a heading
        const headingMatch = paragraph.match(/^(#{1,6})\s+(.+)$/)
        if (headingMatch) {
          const level = headingMatch[1].length
          const text = headingMatch[2]

          return {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text,
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'heading',
            version: 1,
            tag: `h${level}`,
          }
        }

        // Regular paragraph
        return {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: paragraph,
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        }
      }),
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

async function migrateDocsToPayload() {
  // Get the Payload client
  const payload = await getPayloadClient()

  // Path to the documentation files
  const docsDir = path.join(process.cwd(), '..', 'web', 'content', 'documentation')
  console.log(`Documentation directory: ${docsDir}`)

  // Function to recursively read all .mdoc files
  const readMdocFiles = (dir: string, parentPath = ''): string[] => {
    console.log(`Reading directory: ${dir}`)
    const files: string[] = []
    const items = fs.readdirSync(dir)
    console.log(`Found ${items.length} items in directory`)

    for (const item of items) {
      const itemPath = path.join(dir, item)
      const stat = fs.statSync(itemPath)

      if (stat.isDirectory()) {
        console.log(`Found directory: ${item}`)
        files.push(...readMdocFiles(itemPath, path.join(parentPath, item)))
      } else if (item.endsWith('.mdoc')) {
        console.log(`Found .mdoc file: ${item}`)
        files.push(path.join(parentPath, item))
      } else {
        console.log(`Skipping file: ${item} (not a .mdoc file)`)
      }
    }

    return files
  }

  // Get all .mdoc files
  const mdocFiles = readMdocFiles(docsDir)
  console.log(`Found ${mdocFiles.length} documentation files to migrate.`)

  // Migrate each file to Payload
  for (const file of mdocFiles) {
    const filePath = path.join(docsDir, file)
    const content = fs.readFileSync(filePath, 'utf8')
    const { data, content: mdContent } = matter(content)

    // Generate a slug from the file path
    const slug = file
      .replace(/\.mdoc$/, '')
      .replace(/\\/g, '/')
      .replace(/^\//, '')

    try {
      // Create a document in the documentation collection
      await payload.create({
        collection: 'documentation' as any, // Type assertion to fix TypeScript error
        data: {
          title: data.title || path.basename(file, '.mdoc'),
          slug,
          description: data.description || '',
          // Convert Markdown content to Lexical format
          content: convertMarkdownToLexical(mdContent),
          publishedAt: data.publishedAt
            ? new Date(data.publishedAt).toISOString()
            : new Date().toISOString(),
          status: data.status || 'published',
          order: data.order || 0,
          categories: data.categories
            ? data.categories.map((category: string) => ({ category }))
            : [],
          tags: data.tags ? data.tags.map((tag: string) => ({ tag })) : [],
          // Handle parent relationship if needed
        },
      })

      console.log(`Migrated: ${file}`)
    } catch (error) {
      console.error(`Error migrating ${file}:`, error)
    }
  }

  console.log('Migration complete!')
}

// Run the migration
migrateDocsToPayload().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
