import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration to convert todo fields from text to richText
 *
 * This migration addresses the following:
 * 1. Converting the todo fields to richText format for proper display of formatted content
 * 2. It initializes the basic structure needed for Lexical editor content
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running migration to convert todo fields to richText format')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // Get all existing todo field values and convert them to richText format
    const result = await db.execute(sql`
      SELECT 
        id, 
        todo, 
        todo_watch_content, 
        todo_read_content, 
        todo_course_project 
      FROM 
        payload.course_lessons 
      WHERE 
        todo IS NOT NULL 
        OR todo_watch_content IS NOT NULL 
        OR todo_read_content IS NOT NULL 
        OR todo_course_project IS NOT NULL
    `)

    // Convert result to array for iteration
    const rows = result.rows || []

    // Process each row and update with richText format
    for (const row of rows) {
      // Create basic Lexical structure for each field if it exists
      if (row.todo) {
        const lexicalContent = createLexicalContent(String(row.todo))
        await db.execute(sql`
          UPDATE payload.course_lessons 
          SET todo = ${lexicalContent}
          WHERE id = ${row.id}
        `)
      }

      if (row.todo_watch_content) {
        const lexicalContent = createLexicalContent(String(row.todo_watch_content))
        await db.execute(sql`
          UPDATE payload.course_lessons 
          SET todo_watch_content = ${lexicalContent}
          WHERE id = ${row.id}
        `)
      }

      if (row.todo_read_content) {
        const lexicalContent = createLexicalContent(String(row.todo_read_content))
        await db.execute(sql`
          UPDATE payload.course_lessons 
          SET todo_read_content = ${lexicalContent}
          WHERE id = ${row.id}
        `)
      }

      if (row.todo_course_project) {
        const lexicalContent = createLexicalContent(String(row.todo_course_project))
        await db.execute(sql`
          UPDATE payload.course_lessons 
          SET todo_course_project = ${lexicalContent}
          WHERE id = ${row.id}
        `)
      }
    }

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Successfully converted todo fields to richText format')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error converting todo fields to richText format:', error)
    throw error
  }
}

/**
 * Helper function to create a basic Lexical editor content structure
 * from a plain text string.
 */
function createLexicalContent(text: string): string {
  // Split by newlines to create proper paragraphs
  const paragraphs = text.split(/\r?\n/).filter((line) => line.trim().length > 0)

  // Create children array of paragraphs
  const children = paragraphs.map((paragraph) => ({
    children: [
      {
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text: paragraph,
        type: 'text',
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'paragraph',
  }))

  // Create the root structure
  const root = {
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }

  return JSON.stringify(root)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('Rolling back conversion of todo fields to richText format')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // Get all existing richText todo field values
    const result = await db.execute(sql`
      SELECT 
        id, 
        todo, 
        todo_watch_content, 
        todo_read_content, 
        todo_course_project 
      FROM 
        payload.course_lessons 
      WHERE 
        todo IS NOT NULL 
        OR todo_watch_content IS NOT NULL 
        OR todo_read_content IS NOT NULL 
        OR todo_course_project IS NOT NULL
    `)

    // Convert result to array for iteration
    const rows = result.rows || []

    // Process each row and extract plain text from richText format
    for (const row of rows) {
      if (row.todo) {
        try {
          const plainText = extractPlainTextFromLexical(String(row.todo))
          await db.execute(sql`
            UPDATE payload.course_lessons 
            SET todo = ${plainText}
            WHERE id = ${row.id}
          `)
        } catch (e) {
          // Skip if not valid JSON
        }
      }

      if (row.todo_watch_content) {
        try {
          const plainText = extractPlainTextFromLexical(String(row.todo_watch_content))
          await db.execute(sql`
            UPDATE payload.course_lessons 
            SET todo_watch_content = ${plainText}
            WHERE id = ${row.id}
          `)
        } catch (e) {
          // Skip if not valid JSON
        }
      }

      if (row.todo_read_content) {
        try {
          const plainText = extractPlainTextFromLexical(String(row.todo_read_content))
          await db.execute(sql`
            UPDATE payload.course_lessons 
            SET todo_read_content = ${plainText}
            WHERE id = ${row.id}
          `)
        } catch (e) {
          // Skip if not valid JSON
        }
      }

      if (row.todo_course_project) {
        try {
          const plainText = extractPlainTextFromLexical(String(row.todo_course_project))
          await db.execute(sql`
            UPDATE payload.course_lessons 
            SET todo_course_project = ${plainText}
            WHERE id = ${row.id}
          `)
        } catch (e) {
          // Skip if not valid JSON
        }
      }
    }

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Successfully rolled back todo fields from richText to plain text')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error rolling back todo fields from richText format:', error)
    throw error
  }
}

/**
 * Helper function to extract plain text from Lexical JSON structure
 */
function extractPlainTextFromLexical(lexicalJson: string): string {
  try {
    const content = JSON.parse(lexicalJson)
    // Extract text from each paragraph
    if (content?.root?.children) {
      return content.root.children
        .map((para: any) => {
          if (para.children) {
            return para.children
              .filter((child: any) => child.type === 'text')
              .map((child: any) => child.text)
              .join('')
          }
          return ''
        })
        .join('\n')
    }
    return ''
  } catch (e) {
    return lexicalJson // Return original if not valid JSON
  }
}
