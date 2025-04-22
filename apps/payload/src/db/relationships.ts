/**
 * Relationship helper functions for Payload CMS
 *
 * These functions help maintain relationships between collections
 * by providing fallback strategies to recover missing relationship data.
 */

import { Payload } from 'payload'
import pg from 'pg'
const { Client } = pg

/**
 * Find the course ID for a quiz using multiple strategies
 *
 * This tries several approaches to find a course ID:
 * 1. Check relationship table entry
 * 2. Check direct field in quiz table
 * 3. Find a lesson that references this quiz and use its course
 * 4. Default to main course as last resort
 *
 * @param payload - Payload instance
 * @param quizId - ID of the quiz
 * @returns Course ID or null if none found
 */
export async function findCourseForQuiz(payload: Payload, quizId: string): Promise<string | null> {
  try {
    // For direct database access, we need to use a pg client
    // Create a PostgreSQL client using the same connection string as Payload
    const client = new Client({
      connectionString:
        process.env.DATABASE_URI || 'postgresql://postgres:postgres@localhost:54322/postgres',
    })

    await client.connect()

    try {
      // First check relationship table
      const result = await client.query(
        `
        SELECT courses_id 
        FROM payload.course_quizzes_rels 
        WHERE _parent_id = $1 AND field = 'course_id'
        LIMIT 1
        `,
        [quizId],
      )

      if (result.rows?.length > 0) {
        return result.rows[0].courses_id
      }

      // Check course_id_id column as fallback
      const directResult = await client.query(
        `
        SELECT course_id_id 
        FROM payload.course_quizzes 
        WHERE id = $1 AND course_id_id IS NOT NULL
        LIMIT 1
        `,
        [quizId],
      )

      if (directResult.rows?.length > 0) {
        return directResult.rows[0].course_id_id
      }

      // Final fallback - check if any lesson references this quiz
      const lessonResult = await client.query(
        `
        SELECT course_id_id 
        FROM payload.course_lessons 
        WHERE quiz_id_id = $1 AND course_id_id IS NOT NULL
        LIMIT 1
        `,
        [quizId],
      )

      if (lessonResult.rows?.length > 0) {
        return lessonResult.rows[0].course_id_id
      }
    } finally {
      // Always close the client
      await client.end()
    }

    // Default to main course if we have to
    const mainCourse = await payload.find({
      collection: 'courses',
      where: {
        slug: { equals: 'decks-for-decision-makers' },
      },
    })

    if (mainCourse.docs?.length > 0) {
      return mainCourse.docs[0].id
    }

    return null
  } catch (error) {
    console.error('Error finding course for quiz:', error)
    return null
  }
}
